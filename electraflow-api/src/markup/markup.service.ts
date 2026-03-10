import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarkupConfig } from './markup.entity';

@Injectable()
export class MarkupService {
    constructor(
        @InjectRepository(MarkupConfig)
        private markupRepo: Repository<MarkupConfig>,
    ) { }

    async findAll(scope?: string) {
        const where: any = {};
        if (scope) where.scope = scope;
        return this.markupRepo.find({
            where,
            order: { priority: 'DESC', createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const config = await this.markupRepo.findOne({ where: { id } });
        if (!config) throw new NotFoundException('Configuração de markup não encontrada');
        return config;
    }

    async create(data: Partial<MarkupConfig>) {
        const config = this.markupRepo.create(data);
        return this.markupRepo.save(config);
    }

    async update(id: string, data: Partial<MarkupConfig>) {
        const config = await this.findOne(id);
        Object.assign(config, data);
        return this.markupRepo.save(config);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.markupRepo.softDelete(id);
    }

    /**
     * Resolve o markup aplicável para um dado contexto.
     * Busca a regra mais específica (maior prioridade) que se aplica.
     */
    async resolveMarkup(criteria: {
        categoryId?: string;
        activityType?: string;
        supplierType?: string;
        clientType?: string;
    }): Promise<MarkupConfig | null> {
        const qb = this.markupRepo
            .createQueryBuilder('m')
            .where('m.isActive = :active', { active: true })
            .andWhere('m.deletedAt IS NULL');

        const conditions: string[] = ["m.scope = 'global'"];

        if (criteria.categoryId) {
            conditions.push(`(m.scope = 'category' AND m.scopeValue = '${criteria.categoryId}')`);
        }
        if (criteria.activityType) {
            conditions.push(`(m.scope = 'activity_type' AND m.scopeValue = '${criteria.activityType}')`);
        }
        if (criteria.supplierType) {
            conditions.push(`(m.scope = 'supplier_type' AND m.scopeValue = '${criteria.supplierType}')`);
        }
        if (criteria.clientType) {
            conditions.push(`(m.scope = 'client_type' AND m.scopeValue = '${criteria.clientType}')`);
        }

        qb.andWhere(`(${conditions.join(' OR ')})`);
        qb.orderBy('m.priority', 'DESC');
        qb.addOrderBy('m.createdAt', 'DESC');

        return qb.getOne();
    }
}
