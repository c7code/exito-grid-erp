import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { StructureTemplate, StructureTemplateItem } from './structure-template.entity';

@Injectable()
export class StructureTemplatesService implements OnModuleInit {
    private readonly logger = new Logger(StructureTemplatesService.name);

    constructor(
        @InjectRepository(StructureTemplate)
        private templateRepo: Repository<StructureTemplate>,
        @InjectRepository(StructureTemplateItem)
        private itemRepo: Repository<StructureTemplateItem>,
        private dataSource: DataSource,
    ) { }

    async onModuleInit() {
        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS structure_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR NOT NULL,
                    name VARCHAR NOT NULL,
                    concessionaria VARCHAR,
                    "normCode" VARCHAR,
                    "tensionLevel" VARCHAR,
                    category VARCHAR,
                    description TEXT,
                    "diagramUrl" VARCHAR,
                    tags TEXT,
                    "isActive" BOOLEAN DEFAULT true,
                    "markupPercent" NUMERIC(5,2) DEFAULT 0,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    "deletedAt" TIMESTAMP
                )
            `);
            this.logger.log('Table structure_templates ensured');
        } catch (err) {
            this.logger.warn('Could not create structure_templates: ' + err?.message);
        }

        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS structure_template_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "templateId" UUID NOT NULL,
                    "catalogItemId" UUID,
                    description VARCHAR NOT NULL,
                    quantity NUMERIC(10,3) DEFAULT 1,
                    unit VARCHAR DEFAULT 'UN',
                    "isOptional" BOOLEAN DEFAULT false,
                    "unitPrice" NUMERIC(15,2) DEFAULT 0,
                    "sortOrder" INT DEFAULT 0,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.log('Table structure_template_items ensured');
        } catch (err) {
            this.logger.warn('Could not create structure_template_items: ' + err?.message);
        }

        // Self-heal: add columns that may be missing if the table was created before they were added
        const safeAddColumn = async (table: string, column: string, definition: string) => {
            try {
                await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${column}" ${definition}`);
            } catch (err) {
                this.logger.warn(`Could not add column ${column} to ${table}: ${err?.message}`);
            }
        };

        await safeAddColumn('structure_template_items', 'unitPrice', 'NUMERIC(15,2) DEFAULT 0');
        await safeAddColumn('structure_templates', 'markupPercent', 'NUMERIC(5,2) DEFAULT 0');
    }

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATES
    // ═══════════════════════════════════════════════════════════════

    async findAll(filters?: {
        concessionaria?: string;
        tensionLevel?: string;
        category?: string;
        search?: string;
    }) {
        const qb = this.templateRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.items', 'item')
            .leftJoinAndSelect('item.catalogItem', 'catalog')
            .where('t.deletedAt IS NULL');

        if (filters?.concessionaria) {
            qb.andWhere('t.concessionaria = :conc', { conc: filters.concessionaria });
        }
        if (filters?.tensionLevel) {
            qb.andWhere('t.tensionLevel = :tl', { tl: filters.tensionLevel });
        }
        if (filters?.category) {
            qb.andWhere('t.category = :cat', { cat: filters.category });
        }
        if (filters?.search) {
            qb.andWhere('(t.code ILIKE :s OR t.name ILIKE :s)', { s: `%${filters.search}%` });
        }

        qb.orderBy('t.code', 'ASC');
        return qb.getMany();
    }

    async findOne(id: string) {
        const template = await this.templateRepo.findOne({
            where: { id },
            relations: ['items', 'items.catalogItem'],
        });
        if (!template) throw new NotFoundException('Template não encontrado');
        return template;
    }

    async create(data: Partial<StructureTemplate>) {
        const template = this.templateRepo.create(data);
        return this.templateRepo.save(template);
    }

    async update(id: string, data: Partial<StructureTemplate>) {
        const template = await this.findOne(id);
        Object.assign(template, data);

        // If items are provided, handle them
        if (data.items) {
            // Remove existing items
            await this.itemRepo.delete({ templateId: id });
            // Create new items
            template.items = data.items.map(item =>
                this.itemRepo.create({ ...item, templateId: id })
            );
        }

        return this.templateRepo.save(template);
    }

    async remove(id: string) {
        await this.findOne(id); // Validates existence
        await this.templateRepo.softDelete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // ITEMS
    // ═══════════════════════════════════════════════════════════════

    async addItem(templateId: string, data: Partial<StructureTemplateItem>) {
        await this.findOne(templateId); // Validates template exists
        const item = this.itemRepo.create({ ...data, templateId });
        return this.itemRepo.save(item);
    }

    async updateItem(itemId: string, data: Partial<StructureTemplateItem>) {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');
        Object.assign(item, data);
        return this.itemRepo.save(item);
    }

    async removeItem(itemId: string) {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item não encontrado');
        await this.itemRepo.remove(item);
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════

    async getTemplateSummary(id: string) {
        const template = await this.findOne(id);
        let totalCost = 0;
        let uncatalogedCount = 0;

        for (const item of template.items) {
            const price = Number(item.unitPrice || 0) > 0
                ? Number(item.unitPrice)
                : Number(item.catalogItem?.costPrice || 0);
            totalCost += price * Number(item.quantity);
            if (!item.catalogItemId && Number(item.unitPrice || 0) === 0) {
                uncatalogedCount++;
            }
        }

        const markupPercent = Number(template.markupPercent || 0);
        const totalWithMarkup = totalCost * (1 + markupPercent / 100);

        return {
            template,
            totalItems: template.items.length,
            totalCost,
            markupPercent,
            totalWithMarkup,
            uncatalogedCount,
        };
    }

    async getTemplateForProposal(id: string) {
        const template = await this.findOne(id);
        const markupMultiplier = 1 + Number(template.markupPercent || 0) / 100;

        const proposalItems = template.items
            .filter(item => !item.isOptional)
            .map(item => {
                const basePrice = Number(item.unitPrice || 0) > 0
                    ? Number(item.unitPrice)
                    : Number(item.catalogItem?.unitPrice || item.catalogItem?.costPrice || 0);

                // Apply markup on each item's unit price
                const price = parseFloat((basePrice * markupMultiplier).toFixed(2));

                return {
                    description: item.description,
                    serviceType: 'material',
                    unitPrice: price,
                    quantity: Number(item.quantity),
                    unit: item.unit || 'UN',
                };
            });

        const totalValue = proposalItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity, 0
        );

        return {
            templateCode: template.code,
            templateName: template.name,
            markupPercent: Number(template.markupPercent || 0),
            items: proposalItems,
            totalValue,
        };
    }
}
