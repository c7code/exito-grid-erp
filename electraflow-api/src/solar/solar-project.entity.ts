import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Client } from '../clients/client.entity';
import { Proposal } from '../proposals/proposal.entity';

export enum SolarProjectStatus {
    DRAFT = 'draft',
    DIMENSIONED = 'dimensioned',
    PROPOSAL_GENERATED = 'proposal_generated',
    SENT = 'sent',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export enum ConnectionType {
    MONOPHASIC = 'monophasic',
    BIPHASIC = 'biphasic',
    TRIPHASIC = 'triphasic',
}

export enum InstallationType {
    ROOF = 'roof',
    GROUND = 'ground',
}

@Entity('solar_projects')
export class SolarProject {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ nullable: true })
    title: string;

    // ═══ CLIENTE ═══════════════════════════════════════════════════════════
    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    // ═══ EMPRESA ═════════════════════════════════════════════════════════
    @Column({ nullable: true })
    companyId: string;

    // ═══ DIAGNÓSTICO ENERGÉTICO ══════════════════════════════════════════
    @Column({ type: 'varchar', default: 'BT' })
    billingCategory: string;           // BT (Baixa Tensão) ou MT (Média Tensão)

    @Column({ type: 'boolean', default: false })
    detailedAnalysis: boolean;         // Análise detalhada da conta

    @Column({ type: 'simple-json', nullable: true })
    monthlyConsumptions: {
        month: string;       // "Jan", "Fev", "Mar"...
        kwh: number;         // Consumo total do mês
        peakKwh?: number;    // MT: consumo ponta
        offPeakKwh?: number; // MT: consumo fora ponta
        billValue?: number;  // Valor da conta no mês
    }[];

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    consumptionKwh: number;            // Consumo médio (calculado ou manual)

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    avgBillValue: number;

    @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
    tariff: number;                    // Tarifa única (BT) ou média ponderada (MT)

    @Column({ type: 'varchar', default: ConnectionType.BIPHASIC })
    connectionType: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    contractedDemand: number;

    @Column({ nullable: true })
    meterType: string;

    @Column({ nullable: true })
    concessionaria: string;

    // ═══ MÉDIA TENSÃO — PONTA / FORA PONTA ═══════════════════════════════
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    consumptionPeakKwh: number;        // Consumo horário ponta (kWh)

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    consumptionOffPeakKwh: number;     // Consumo horário fora ponta (kWh)

    @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
    tariffPeak: number;                // Tarifa ponta (R$/kWh)

    @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
    tariffOffPeak: number;             // Tarifa fora ponta (R$/kWh)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    demandPeakKw: number;              // Demanda ponta (kW)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    demandOffPeakKw: number;           // Demanda fora ponta (kW)

    @Column({ nullable: true })
    tariffModality: string;            // Verde, Azul, Convencional

    // ═══ DADOS DO IMÓVEL ═════════════════════════════════════════════════
    @Column({ type: 'varchar', default: InstallationType.ROOF })
    installationType: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    availableArea: number;

    @Column({ nullable: true })
    roofOrientation: string;

    @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
    roofInclination: number;

    @Column({ type: 'boolean', default: false })
    hasShadows: boolean;

    @Column({ nullable: true })
    propertyCep: string;

    @Column({ nullable: true })
    propertyAddress: string;

    @Column({ nullable: true })
    propertyNeighborhood: string;

    @Column({ nullable: true })
    propertyCity: string;

    @Column({ nullable: true })
    propertyState: string;

    // ═══ DIMENSIONAMENTO (calculado) ═════════════════════════════════════
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    systemPowerKwp: number;

    @Column({ type: 'int', nullable: true })
    moduleCount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    modulePowerWp: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    inverterPowerKw: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    monthlyGenerationKwh: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    annualGenerationKwh: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    compensationPercent: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    hspValue: number;

    // ═══ EQUIPAMENTOS (JSON) ═════════════════════════════════════════════
    @Column({ type: 'simple-json', nullable: true })
    equipment: {
        catalogItemId?: string;
        type: string;       // module, inverter, structure, stringbox, cable, protection, other
        description: string;
        brand?: string;
        model?: string;
        warranty?: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];

    // ═══ KITS COMERCIAIS (Estratégia Isca — Previsivelmente Irracional) ══
    @Column({ type: 'boolean', default: false })
    commercialStrategyEnabled: boolean;

    @Column({ type: 'simple-json', nullable: true })
    commercialKits: {
        name: string;              // "Kit Básico", "Kit Padrão", "Kit Premium"
        isRecommended: boolean;    // ← o kit "alvo" que você quer vender
        showGuaranteeValues: boolean; // mostrar valores das garantias (value stack)
        equipment: {
            type: string;
            description: string;
            brand: string;
            model: string;
            quantity: number;
            unitPrice: number;
            total: number;
        }[];
        guarantees: {
            text: string;          // "Garantia de 18 meses na instalação"
            included: boolean;     // ✅ ou ❌
            value: number;         // Valor individual (R$) — Hormozi value stack
        }[];
        laborCost: number;
        installationCost: number;
        otherCosts: number;
        margin: number;
        totalPrice: number;        // preço final ao cliente
    }[];

    // ═══ FINANCEIRO (calculado) ══════════════════════════════════════════
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalInvestment: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    monthlySavings: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    annualSavings: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    savings25Years: number;

    @Column({ type: 'decimal', precision: 6, scale: 1, nullable: true })
    paybackMonths: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    roiPercent: number;

    @Column({ type: 'simple-json', nullable: true })
    cashFlow: { year: number; savings: number; accumulated: number; balance: number }[];

    // ═══ PROPOSTA ════════════════════════════════════════════════════════
    @Column({ nullable: true })
    proposalId: string;

    @ManyToOne(() => Proposal, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'proposalId' })
    proposal: Proposal;

    // ═══ STATUS ══════════════════════════════════════════════════════════
    @Column({ type: 'varchar', default: SolarProjectStatus.DRAFT })
    status: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // ═══ CUSTOS ADICIONAIS ══════════════════════════════════════════════
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    laborCost: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    installationCost: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    logisticsCost: number;          // Frete / logística

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    insuranceCost: number;          // Seguro de carga e obras

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    engineeringCost: number;        // Projeto elétrico e engenharia

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    documentationCost: number;      // Homologação, ART, documentos

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    otherCosts: number;

    // ═══ CONDIÇÕES DE PAGAMENTO (flexível) ═══════════════════════════════
    @Column({ type: 'simple-json', nullable: true })
    paymentConditions: {
        method: string;             // 'avista' | 'parcelado' | 'financiamento' | 'entrada_parcelas'
        downPayment: number;        // Valor da entrada (R$)
        downPaymentPercent: number; // % de entrada
        installments: number;       // Número de parcelas
        installmentValue: number;   // Valor de cada parcela
        interestRate: number;       // Taxa de juros mensal (%)
        interestType: string;       // 'sem_juros' | 'embutido' | 'sobre_saldo'
        cardBrand: string;          // Bandeira do cartão (opcional)
        financingBank: string;      // Banco financiador (opcional)
        financingLine: string;      // Linha de crédito (ex: CDC Solar, BNDES)
        pixDiscount: number;        // Desconto para PIX (%)
        notes: string;              // Observações adicionais
    };

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    margin: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    pricePerWp: number;             // R$/Wp — calculado automaticamente

    // ═══ PARÂMETROS AJUSTÁVEIS ═══════════════════════════════════════════
    @Column({ type: 'decimal', precision: 6, scale: 2, default: 6 })
    annualEnergyIncrease: number;  // % aumento anual da energia

    @Column({ type: 'decimal', precision: 6, scale: 2, default: 0.5 })
    annualDegradation: number;     // % degradação anual dos painéis

    // ── Audit Trail ──
    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdByUser: User;

    // ═══ TIMESTAMPS ═════════════════════════════════════════════════════
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
