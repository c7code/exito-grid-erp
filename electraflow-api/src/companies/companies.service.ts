import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CompanyDocument } from './company-document.entity';

@Injectable()
export class CompaniesService {
    private readonly logger = new Logger(CompaniesService.name);

    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        @InjectRepository(CompanyDocument)
        private readonly compDocRepo: Repository<CompanyDocument>,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // COMPANY CRUD (existing)
    // ═══════════════════════════════════════════════════════════════

    async findAll(): Promise<Company[]> {
        return this.companyRepo.find({ order: { isPrimary: 'DESC', name: 'ASC' } });
    }

    async findOne(id: string): Promise<Company> {
        const company = await this.companyRepo.findOne({ where: { id } });
        if (!company) throw new NotFoundException('Empresa não encontrada');
        return company;
    }

    async findPrimary(): Promise<Company | null> {
        return this.companyRepo.findOne({ where: { isPrimary: true, isActive: true } });
    }

    async create(data: Partial<Company>): Promise<Company> {
        if (data.isPrimary) {
            await this.companyRepo.update({}, { isPrimary: false });
        }
        const company = this.companyRepo.create(data);
        return this.companyRepo.save(company);
    }

    async update(id: string, data: Partial<Company>): Promise<Company> {
        const company = await this.findOne(id);
        if (data.isPrimary) {
            await this.companyRepo.update({}, { isPrimary: false });
        }
        Object.assign(company, data);
        return this.companyRepo.save(company);
    }

    async remove(id: string): Promise<void> {
        const company = await this.findOne(id);
        await this.companyRepo.remove(company);
    }

    async updateLogo(id: string, logoUrl: string): Promise<Company> {
        const company = await this.findOne(id);
        company.logoUrl = logoUrl;
        return this.companyRepo.save(company);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPANY DOCUMENTS CRUD
    // ═══════════════════════════════════════════════════════════════

    async findAllDocuments(companyId?: string): Promise<CompanyDocument[]> {
        const where: any = {};
        if (companyId) where.companyId = companyId;
        return this.compDocRepo.find({
            where,
            relations: ['company'],
            order: { documentGroup: 'ASC', sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findDocument(id: string): Promise<CompanyDocument> {
        const doc = await this.compDocRepo.findOne({ where: { id }, relations: ['company'] });
        if (!doc) throw new NotFoundException('Documento não encontrado');
        return doc;
    }

    async createDocument(data: Partial<CompanyDocument>): Promise<CompanyDocument> {
        // Auto-calculate status from expiryDate
        if (data.expiryDate) {
            const expiry = new Date(data.expiryDate);
            const now = new Date();
            const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 0) data.status = 'expired';
            else if (daysDiff <= 60) data.status = 'expiring';
            else data.status = 'valid';
        } else if (data.fileUrl) {
            data.status = 'valid';
        }
        const doc = this.compDocRepo.create(data);
        const saved = await this.compDocRepo.save(doc);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateDocument(id: string, data: Partial<CompanyDocument>): Promise<CompanyDocument> {
        const doc = await this.findDocument(id);
        // Recalculate status
        const expiryDate = data.expiryDate ?? doc.expiryDate;
        if (expiryDate) {
            const expiry = new Date(expiryDate);
            const now = new Date();
            const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 0) data.status = 'expired';
            else if (daysDiff <= 60) data.status = 'expiring';
            else data.status = 'valid';
        }
        Object.assign(doc, data);
        return this.compDocRepo.save(doc);
    }

    async removeDocument(id: string): Promise<void> {
        await this.compDocRepo.softDelete(id);
    }
}
