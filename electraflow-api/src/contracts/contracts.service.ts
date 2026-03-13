import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractAddendum, ContractStatus } from './contract.entity';

@Injectable()
export class ContractsService {
    constructor(
        @InjectRepository(Contract)
        private contractRepo: Repository<Contract>,
        @InjectRepository(ContractAddendum)
        private addendumRepo: Repository<ContractAddendum>,
    ) { }

    async findAll(filters?: { status?: string; workId?: string; clientId?: string }) {
        const query = this.contractRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.work', 'work')
            .leftJoinAndSelect('c.client', 'client')
            .leftJoinAndSelect('c.proposal', 'proposal')
            .leftJoinAndSelect('c.addendums', 'addendums')
            .leftJoinAndSelect('c.createdByUser', 'createdByUser')
            .where('c.deletedAt IS NULL')
            .orderBy('c.createdAt', 'DESC');

        if (filters?.status) query.andWhere('c.status = :status', { status: filters.status });
        if (filters?.workId) query.andWhere('c.workId = :workId', { workId: filters.workId });
        if (filters?.clientId) query.andWhere('c.clientId = :clientId', { clientId: filters.clientId });

        return query.getMany();
    }

    async findOne(id: string) {
        const contract = await this.contractRepo.findOne({
            where: { id },
            relations: ['work', 'client', 'proposal', 'addendums'],
        });
        if (!contract) throw new NotFoundException('Contrato não encontrado');
        return contract;
    }

    private async generateNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.contractRepo.count();
        return `CT-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    async create(data: Partial<Contract>) {
        if (!data.contractNumber) {
            data.contractNumber = await this.generateNumber();
        }
        // Set finalValue = originalValue initially
        if (data.originalValue && !data.finalValue) {
            data.finalValue = data.originalValue;
        }
        const contract = this.contractRepo.create(data);
        const saved = await this.contractRepo.save(contract);
        return this.findOne(saved.id);
    }

    async update(id: string, data: Partial<Contract>) {
        const contract = await this.findOne(id);
        Object.assign(contract, data);
        // Recalculate finalValue
        if (data.originalValue !== undefined || data.addendumValue !== undefined) {
            contract.finalValue = Number(contract.originalValue || 0) + Number(contract.addendumValue || 0);
        }
        return this.contractRepo.save(contract);
    }

    async remove(id: string) {
        const contract = await this.findOne(id);
        return this.contractRepo.softRemove(contract);
    }

    // ── Addendums ──────────────────────────────────────────────────────
    async createAddendum(contractId: string, data: Partial<ContractAddendum>) {
        const contract = await this.findOne(contractId);

        const addendum = this.addendumRepo.create({ ...data, contractId });
        const saved = await this.addendumRepo.save(addendum);

        // Update contract values
        contract.addendumValue = Number(contract.addendumValue || 0) + Number(data.valueChange || 0);
        contract.finalValue = Number(contract.originalValue || 0) + Number(contract.addendumValue);
        contract.version = (contract.version || 1) + 1;
        if (data.newEndDate) {
            contract.endDate = data.newEndDate;
        }
        await this.contractRepo.save(contract);

        return saved;
    }

    async removeAddendum(addendumId: string) {
        const addendum = await this.addendumRepo.findOneBy({ id: addendumId });
        if (!addendum) throw new NotFoundException('Aditivo não encontrado');

        // Reverse the value change
        const contract = await this.findOne(addendum.contractId);
        contract.addendumValue = Number(contract.addendumValue || 0) - Number(addendum.valueChange || 0);
        contract.finalValue = Number(contract.originalValue || 0) + Number(contract.addendumValue);
        await this.contractRepo.save(contract);

        return this.addendumRepo.softRemove(addendum);
    }

    async getStats() {
        const all = await this.contractRepo.find({ where: { deletedAt: null as any } });
        return {
            total: all.length,
            active: all.filter(c => c.status === 'active').length,
            draft: all.filter(c => c.status === 'draft').length,
            expired: all.filter(c => c.status === 'expired').length,
            totalValue: all.reduce((sum, c) => sum + Number(c.finalValue || 0), 0),
            totalAddendums: all.reduce((sum, c) => sum + Number(c.addendumValue || 0), 0),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // Assinatura Digital de Contrato
    // ═══════════════════════════════════════════════════════════════

    async generateSignatureLink(id: string): Promise<{ token: string; url: string; expiresAt: Date }> {
        const contract = await this.findOne(id);

        const token = require('crypto').randomUUID() + '-' + Date.now().toString(36);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

        contract.signatureToken = token;
        contract.signatureTokenExpiresAt = expiresAt;
        contract.signatureVerificationCode = verificationCode;

        // Activate draft contracts when sending for signature
        if (contract.status === ContractStatus.DRAFT) {
            contract.status = ContractStatus.ACTIVE;
        }

        await this.contractRepo.save(contract);

        const url = `/assinar-contrato/${token}`;
        return { token, url, expiresAt };
    }

    async getContractByToken(token: string): Promise<Contract> {
        const contract = await this.contractRepo.findOne({
            where: { signatureToken: token },
            relations: ['work', 'client', 'proposal', 'addendums'],
        });

        if (!contract) {
            throw new NotFoundException('Contrato não encontrado ou link inválido');
        }

        if (contract.signatureTokenExpiresAt && new Date() > contract.signatureTokenExpiresAt) {
            throw new BadRequestException('Link de assinatura expirado');
        }

        if (contract.signedAt) {
            throw new BadRequestException('Este contrato já foi assinado');
        }

        return contract;
    }

    async signContract(
        token: string,
        data: { name: string; document: string; ip?: string; userAgent?: string },
    ): Promise<{ contract: Contract; verificationCode: string }> {
        const contract = await this.contractRepo.findOne({
            where: { signatureToken: token },
            relations: ['work', 'client', 'proposal'],
        });

        if (!contract) throw new NotFoundException('Contrato não encontrado');

        if (contract.signatureTokenExpiresAt && new Date() > contract.signatureTokenExpiresAt) {
            throw new BadRequestException('Link de assinatura expirado');
        }

        if (contract.signedAt) {
            throw new BadRequestException('Este contrato já foi assinado');
        }

        contract.signedAt = new Date();
        contract.signedByName = data.name;
        contract.signedByDocument = data.document;
        contract.signedByIP = data.ip || 'unknown';
        contract.signedByUserAgent = data.userAgent || 'unknown';

        await this.contractRepo.save(contract);

        return { contract, verificationCode: contract.signatureVerificationCode };
    }

    async getSignatureStatus(id: string) {
        const contract = await this.findOne(id);
        return {
            isSigned: !!contract.signedAt,
            signedAt: contract.signedAt,
            signedByName: contract.signedByName,
            signedByDocument: contract.signedByDocument,
            signedByIP: contract.signedByIP,
            verificationCode: contract.signatureVerificationCode,
            status: contract.status,
        };
    }
}
