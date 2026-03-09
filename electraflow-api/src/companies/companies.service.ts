import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompaniesService {
    private readonly logger = new Logger(CompaniesService.name);

    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
    ) {}

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
        // If marking as primary, unmark others
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
}
