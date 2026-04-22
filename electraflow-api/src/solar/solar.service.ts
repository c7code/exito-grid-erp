import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarProject, SolarProjectStatus } from './solar-project.entity';
import { Client } from '../clients/client.entity';
import { CatalogItem } from '../catalog/catalog.entity';
import { Proposal, ProposalItem, ProposalStatus } from '../proposals/proposal.entity';

// ═══ HSP (Horas de Sol Pleno) por estado — média anual ═══
const HSP_BY_STATE: Record<string, number> = {
    AC: 4.5, AL: 5.2, AP: 4.8, AM: 4.3, BA: 5.5, CE: 5.8, DF: 5.2,
    ES: 4.9, GO: 5.3, MA: 5.0, MT: 5.1, MS: 5.2, MG: 5.1, PA: 4.6,
    PB: 5.7, PR: 4.6, PE: 5.5, PI: 5.8, RJ: 4.8, RN: 5.9, RS: 4.5,
    RO: 4.6, RR: 4.7, SC: 4.3, SP: 4.7, SE: 5.4, TO: 5.2,
};
const DEFAULT_HSP = 5.0;
const SYSTEM_EFFICIENCY = 0.80;
const DEFAULT_MODULE_POWER_WP = 550;

@Injectable()
export class SolarService {
    private readonly logger = new Logger(SolarService.name);

    constructor(
        @InjectRepository(SolarProject)
        private solarRepo: Repository<SolarProject>,
        @InjectRepository(Client)
        private clientRepo: Repository<Client>,
        @InjectRepository(CatalogItem)
        private catalogRepo: Repository<CatalogItem>,
        @InjectRepository(Proposal)
        private proposalRepo: Repository<Proposal>,
        @InjectRepository(ProposalItem)
        private proposalItemRepo: Repository<ProposalItem>,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════════════

    async findAll(): Promise<SolarProject[]> {
        return this.solarRepo.find({
            relations: ['client', 'proposal'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<SolarProject> {
        const project = await this.solarRepo.findOne({
            where: { id },
            relations: ['client', 'proposal'],
        });
        if (!project) throw new NotFoundException('Projeto solar não encontrado');
        return project;
    }

    async findByProposalId(proposalId: string): Promise<SolarProject | null> {
        return this.solarRepo.findOne({
            where: { proposalId },
            relations: ['client', 'proposal'],
        });
    }

    /**
     * Sanitize incoming data: convert empty strings to 0 for decimal fields, 
     * and to null for optional string fields. This prevents PostgreSQL errors
     * when empty strings '' are sent for numeric columns.
     */
    private sanitizeData(data: Partial<SolarProject>): Partial<SolarProject> {
        const numericFields = [
            'consumptionKwh', 'avgBillValue', 'tariff', 'contractedDemand',
            'consumptionPeakKwh', 'consumptionOffPeakKwh', 'tariffPeak', 'tariffOffPeak',
            'demandPeakKw', 'demandOffPeakKw', 'availableArea', 'roofInclination',
            'laborCost', 'installationCost', 'logisticsCost', 'insuranceCost',
            'engineeringCost', 'documentationCost', 'otherCosts', 'margin',
            'annualEnergyIncrease', 'annualDegradation',
            'systemPowerKwp', 'numberOfModules', 'modulePowerWp',
            'totalInvestment', 'pricePerWp', 'monthlySavings', 'annualSavings',
            'savings25Years', 'paybackMonths', 'roiPercent',
        ];
        const sanitized = { ...data } as any;
        for (const field of numericFields) {
            if (field in sanitized && (sanitized[field] === '' || sanitized[field] === null || sanitized[field] === undefined)) {
                sanitized[field] = 0;
            } else if (field in sanitized) {
                sanitized[field] = Number(sanitized[field]) || 0;
            }
        }
        return sanitized;
    }

    async create(data: Partial<SolarProject>): Promise<SolarProject> {
        const sanitized = this.sanitizeData(data);

        // Retry logic to handle race conditions on unique code
        for (let attempt = 0; attempt < 3; attempt++) {
            const code = await this.generateCode();
            const project = this.solarRepo.create({ ...sanitized, code });

            // Auto-fill from client
            if (data.clientId) {
                const client = await this.clientRepo.findOne({ where: { id: data.clientId } });
                if (client) {
                    project.concessionaria = project.concessionaria || client.concessionaria || '';
                    project.propertyAddress = project.propertyAddress || client.address || '';
                    project.propertyCity = project.propertyCity || client.city || '';
                    project.propertyState = project.propertyState || client.state || '';
                    if (!project.consumptionKwh && client.consumptionKwh) {
                        project.consumptionKwh = client.consumptionKwh;
                    }
                }
            }

            try {
                return await this.solarRepo.save(project);
            } catch (err: any) {
                if (err?.code === '23505' && err?.detail?.includes('code')) {
                    this.logger.warn(`Code collision on "${code}", retrying (attempt ${attempt + 1})...`);
                    continue;
                }
                throw err;
            }
        }

        // Final fallback: timestamp-based code
        const fallbackCode = `PV-${Date.now().toString(36).toUpperCase()}`;
        const project = this.solarRepo.create({ ...sanitized, code: fallbackCode });
        return this.solarRepo.save(project);
    }

    async update(id: string, data: Partial<SolarProject>): Promise<SolarProject> {
        const project = await this.findOne(id);
        const sanitized = this.sanitizeData(data);
        Object.assign(project, sanitized);
        return this.solarRepo.save(project);
    }

    async remove(id: string): Promise<void> {
        const project = await this.findOne(id);
        await this.solarRepo.softRemove(project);
    }

    // ═══════════════════════════════════════════════════════════════
    // MOTOR DE DIMENSIONAMENTO
    // ═══════════════════════════════════════════════════════════════

    async dimensionSystem(id: string): Promise<SolarProject> {
        const project = await this.findOne(id);
        const consumption = Number(project.consumptionKwh);
        if (!consumption || consumption <= 0) {
            throw new NotFoundException('Consumo mensal (kWh) deve ser informado para dimensionar');
        }

        // Get HSP from state
        const state = (project.propertyState || '').toUpperCase().trim();
        const hsp = HSP_BY_STATE[state] || DEFAULT_HSP;

        // Module power — check if user selected a module in equipment
        let modulePowerWp = DEFAULT_MODULE_POWER_WP;
        if (project.equipment && project.equipment.length > 0) {
            const moduleEq = project.equipment.find(e => e.type === 'module');
            if (moduleEq && moduleEq.description) {
                // Try to extract power from description (e.g. "550W" or "550Wp")
                const match = moduleEq.description.match(/(\d+)\s*[Ww][Pp]?/);
                if (match) modulePowerWp = Number(match[1]);
            }
        }

        // kWp = consumo_mensal / (HSP × 30 × eficiência)
        const systemPowerKwp = consumption / (hsp * 30 * SYSTEM_EFFICIENCY);

        // Quantity of modules
        const moduleCount = Math.ceil((systemPowerKwp * 1000) / modulePowerWp);

        // Actual system power (rounded up to module count)
        const actualKwp = (moduleCount * modulePowerWp) / 1000;

        // Inverter power (slightly above system kWp)
        const inverterPowerKw = Math.ceil(actualKwp * 1.1);

        // Generation estimates
        const monthlyGeneration = actualKwp * hsp * 30 * SYSTEM_EFFICIENCY;
        const annualGeneration = monthlyGeneration * 12;

        // Compensation percentage
        const compensationPercent = Math.min((monthlyGeneration / consumption) * 100, 100);

        // Update project
        project.hspValue = hsp;
        project.systemPowerKwp = Number(actualKwp.toFixed(2));
        project.moduleCount = moduleCount;
        project.modulePowerWp = modulePowerWp;
        project.inverterPowerKw = inverterPowerKw;
        project.monthlyGenerationKwh = Number(monthlyGeneration.toFixed(2));
        project.annualGenerationKwh = Number(annualGeneration.toFixed(2));
        project.compensationPercent = Number(compensationPercent.toFixed(2));

        if (project.status === SolarProjectStatus.DRAFT) {
            project.status = SolarProjectStatus.DIMENSIONED;
        }

        return this.solarRepo.save(project);
    }

    // ═══════════════════════════════════════════════════════════════
    // MOTOR FINANCEIRO
    // ═══════════════════════════════════════════════════════════════

    async calculateFinancials(id: string): Promise<SolarProject> {
        const project = await this.findOne(id);

        // Calculate total investment from equipment
        let equipmentTotal = 0;
        if (project.equipment && project.equipment.length > 0) {
            equipmentTotal = project.equipment.reduce((sum, eq) => sum + Number(eq.total || 0), 0);
        }
        const totalInvestment = equipmentTotal
            + Number(project.laborCost || 0)
            + Number(project.installationCost || 0)
            + Number(project.logisticsCost || 0)
            + Number(project.insuranceCost || 0)
            + Number(project.engineeringCost || 0)
            + Number(project.documentationCost || 0)
            + Number(project.otherCosts || 0);

        // Apply margin
        const marginMultiplier = 1 + (Number(project.margin || 0) / 100);
        const finalInvestment = totalInvestment * marginMultiplier;

        // R$/Wp — métrica chave do setor solar
        const systemWp = Number(project.systemPowerKwp || 0) * 1000;
        const pricePerWp = systemWp > 0 ? finalInvestment / systemWp : 0;

        // Monthly savings
        const monthlyGeneration = Number(project.monthlyGenerationKwh || 0);
        const tariff = Number(project.tariff || 0);
        const monthlySavings = monthlyGeneration * tariff;
        const annualSavings = monthlySavings * 12;

        // Payback (months)
        const paybackMonths = monthlySavings > 0 ? finalInvestment / monthlySavings : 0;

        // 25-year cash flow with degradation and energy increase
        const annualDegradation = Number(project.annualDegradation || 0.5) / 100;
        const annualEnergyIncrease = Number(project.annualEnergyIncrease || 6) / 100;
        const cashFlow: { year: number; savings: number; accumulated: number; balance: number }[] = [];
        let accumulated = 0;
        let totalSavings25 = 0;

        for (let year = 1; year <= 25; year++) {
            // Degradação dos painéis reduz geração
            const degradationFactor = 1 - (annualDegradation * (year - 1));
            // Aumento da tarifa de energia
            const tariffFactor = Math.pow(1 + annualEnergyIncrease, year - 1);

            const yearSavings = annualSavings * degradationFactor * tariffFactor;
            accumulated += yearSavings;
            totalSavings25 += yearSavings;

            cashFlow.push({
                year,
                savings: Number(yearSavings.toFixed(2)),
                accumulated: Number(accumulated.toFixed(2)),
                balance: Number((accumulated - finalInvestment).toFixed(2)),
            });
        }

        // ROI
        const roiPercent = finalInvestment > 0
            ? ((totalSavings25 - finalInvestment) / finalInvestment) * 100
            : 0;

        // Update project
        project.totalInvestment = Number(finalInvestment.toFixed(2));
        project.pricePerWp = Number(pricePerWp.toFixed(2));
        project.monthlySavings = Number(monthlySavings.toFixed(2));
        project.annualSavings = Number(annualSavings.toFixed(2));
        project.savings25Years = Number(totalSavings25.toFixed(2));
        project.paybackMonths = Number(paybackMonths.toFixed(1));
        project.roiPercent = Number(roiPercent.toFixed(2));
        project.cashFlow = cashFlow;

        return this.solarRepo.save(project);
    }

    // ═══════════════════════════════════════════════════════════════
    // BUSCAR EQUIPAMENTOS DO CATÁLOGO
    // ═══════════════════════════════════════════════════════════════

    async searchCatalogEquipment(query?: string): Promise<CatalogItem[]> {
        const qb = this.catalogRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.category', 'category')
            .leftJoinAndSelect('item.productSuppliers', 'ps')
            .where('item.isActive = :active', { active: true });

        if (query) {
            qb.andWhere(
                '(LOWER(item.name) LIKE :q OR LOWER(item.brand) LIKE :q OR LOWER(item.model) LIKE :q OR LOWER(item.description) LIKE :q)',
                { q: `%${query.toLowerCase()}%` },
            );
        }

        return qb.orderBy('item.name', 'ASC').take(50).getMany();
    }

    // ═══════════════════════════════════════════════════════════════
    // GERAR PROPOSTA NO MÓDULO PROPOSTAS
    // ═══════════════════════════════════════════════════════════════

    async generateProposal(id: string): Promise<SolarProject> {
        const project = await this.findOne(id);
        if (!project.clientId) {
            throw new NotFoundException('Selecione um cliente antes de gerar a proposta');
        }
        if (!project.systemPowerKwp || !project.totalInvestment) {
            throw new NotFoundException('Execute o dimensionamento e cálculo financeiro antes de gerar a proposta');
        }

        // Generate proposal number — use MAX to include soft-deleted and avoid duplicate key
        const prefix = `PROP-${new Date().getFullYear()}-`;
        const result = await this.proposalRepo
            .createQueryBuilder('p')
            .withDeleted()
            .select(`MAX(CAST(REPLACE(p.proposalNumber, :prefix, '') AS INTEGER))`, 'max_num')
            .setParameter('prefix', prefix)
            .where('p.proposalNumber LIKE :pattern', { pattern: `${prefix}%` })
            .getRawOne();
        const nextNum = (Number(result?.max_num) || 0) + 1;
        const proposalNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

        // Build title
        const client = await this.clientRepo.findOne({ where: { id: project.clientId } });
        const title = `Sistema Fotovoltaico ${Number(project.systemPowerKwp).toFixed(1)}kWp — ${client?.name || 'Cliente'}`;

        // Create proposal
        const proposal = this.proposalRepo.create({
            proposalNumber,
            title,
            clientId: project.clientId,
            status: ProposalStatus.DRAFT,
            activityType: 'energia_solar',
            subtotal: project.totalInvestment,
            total: project.totalInvestment,
            discount: 0,
            scope: `Fornecimento e instalação de sistema de energia solar fotovoltaica de ${Number(project.systemPowerKwp).toFixed(1)}kWp, com geração estimada de ${Number(project.monthlyGenerationKwh).toFixed(0)} kWh/mês.`,
            notes: `Projeto Solar: ${project.code}\nPayback: ${Number(project.paybackMonths).toFixed(1)} meses\nEconomia em 25 anos: R$ ${Number(project.savings25Years).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            workDescription: title,
            workAddress: project.propertyAddress || client?.address || '',
        });
        const savedProposal = await this.proposalRepo.save(proposal);

        // Create proposal items from equipment
        if (project.equipment && project.equipment.length > 0) {
            const items: Partial<ProposalItem>[] = project.equipment.map(eq => ({
                proposalId: savedProposal.id,
                description: `${eq.description}${eq.brand ? ` — ${eq.brand}` : ''}${eq.model ? ` ${eq.model}` : ''}`,
                unit: 'un',
                serviceType: 'material',
                unitPrice: eq.unitPrice,
                quantity: eq.quantity,
                total: eq.total,
            }));

            // Add service/cost line items
            const costItems: { desc: string; value: number; type: string }[] = [
                { desc: 'Mão de obra — Instalação do sistema fotovoltaico', value: Number(project.laborCost || 0), type: 'service' },
                { desc: 'Serviço de instalação e comissionamento', value: Number(project.installationCost || 0), type: 'service' },
                { desc: 'Logística / Frete', value: Number(project.logisticsCost || 0), type: 'service' },
                { desc: 'Seguro de carga e obras', value: Number(project.insuranceCost || 0), type: 'service' },
                { desc: 'Projeto elétrico e engenharia', value: Number(project.engineeringCost || 0), type: 'service' },
                { desc: 'Homologação, ART e documentação', value: Number(project.documentationCost || 0), type: 'service' },
                { desc: 'Outros custos', value: Number(project.otherCosts || 0), type: 'service' },
            ];

            for (const ci of costItems) {
                if (ci.value > 0) {
                    items.push({
                        proposalId: savedProposal.id,
                        description: ci.desc,
                        unit: 'sv',
                        serviceType: ci.type,
                        unitPrice: ci.value,
                        quantity: 1,
                        total: ci.value,
                    });
                }
            }

            for (const itemData of items) {
                const item = this.proposalItemRepo.create(itemData);
                await this.proposalItemRepo.save(item);
            }
        }

        // Link proposal to project
        project.proposalId = savedProposal.id;
        project.status = SolarProjectStatus.PROPOSAL_GENERATED;
        await this.solarRepo.save(project);

        this.logger.log(`Proposta solar ${proposalNumber} gerada para projeto ${project.code}`);

        return this.findOne(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    private async generateCode(): Promise<string> {
        // Find the highest existing code number, INCLUDING soft-deleted records
        const result = await this.solarRepo
            .createQueryBuilder('sp')
            .withDeleted()  // include soft-deleted so we never reuse a code
            .select("MAX(CAST(REPLACE(sp.code, 'PV-', '') AS INTEGER))", 'maxNum')
            .getRawOne();

        const nextNum = (result?.maxNum || 0) + 1;
        const code = `PV-${String(nextNum).padStart(4, '0')}`;

        // Double-check: if this code somehow exists, keep incrementing
        const exists = await this.solarRepo
            .createQueryBuilder('sp')
            .withDeleted()
            .where('sp.code = :code', { code })
            .getCount();

        if (exists > 0) {
            // Fallback: use timestamp-based unique code
            const ts = Date.now().toString(36).toUpperCase();
            return `PV-${ts}`;
        }

        return code;
    }

    getHspTable(): Record<string, number> {
        return { ...HSP_BY_STATE };
    }

    /**
     * Calcula impacto ambiental baseado na potência do sistema (kWp).
     * Referências: ANEEL, EPA, SolarEdge environmental reports.
     * 
     * - Fator de emissão Brasil: ~0.075 tCO2/MWh (SIN 2023)
     * - 1 árvore absorve ~22kg CO2/ano (EPA)
     * - 1 MWh solar economiza ~1.500L de água (vs termelétrica)
     * - 1 tCO2 ≈ 4.000 km não percorridos de carro
     */
    calculateEnvironmentalImpact(systemKwp: number, hsp: number = 4.5) {
        const annualGenerationKwh = systemKwp * hsp * 365 * 0.82; // 82% performance ratio
        const annualGenerationMwh = annualGenerationKwh / 1000;

        // CO2 (fator de emissão do SIN brasileiro)
        const co2AvoidedTonsYear = annualGenerationMwh * 0.075;
        const co2Avoided25Years = co2AvoidedTonsYear * 25;

        // Árvores equivalentes (22kg CO2/árvore/ano)
        const treesEquivalent = Math.round((co2AvoidedTonsYear * 1000) / 22);

        // Água preservada (1.500L por MWh vs termelétrica)
        const waterSavedLitersYear = annualGenerationMwh * 1500;

        // km não percorridos de carro (estimativa)
        const kmNotDriven = Math.round(co2AvoidedTonsYear * 4000);

        return {
            annualGenerationKwh: Math.round(annualGenerationKwh),
            co2AvoidedTonsYear: Number(co2AvoidedTonsYear.toFixed(2)),
            co2Avoided25Years: Number(co2Avoided25Years.toFixed(1)),
            treesEquivalent,
            waterSavedLitersYear: Math.round(waterSavedLitersYear),
            waterSaved25Years: Math.round(waterSavedLitersYear * 25),
            kmNotDriven,
        };
    }
}
