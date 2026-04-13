import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Client } from '../clients/client.entity';

// ═══════════════════════════════════════════════════════════════
// PLANO DE ACESSO SOLAR — Template de plano
// ═══════════════════════════════════════════════════════════════

@Entity('solar_plans')
export class SolarPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;                              // "Plano Solar 24x", "Plano Solar 48x"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;                            // active | inactive

  // ═══ CONFIGURAÇÃO DO SISTEMA SOLAR ═══
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minPowerKwp: number;                       // Potência mínima (kWp)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maxPowerKwp: number;                       // Potência máxima (kWp)

  // ═══ CONFIGURAÇÃO FINANCEIRA ═══
  @Column({ type: 'int', default: 48 })
  totalInstallments: number;                 // Total de parcelas

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  enrollmentFeePercent: number;              // % taxa de adesão (não-reembolsável)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  contemplationThresholdPercent: number;     // % mínimo pago para contemplar

  @Column({ type: 'int', default: 0 })
  contemplationMinMonths: number;            // Meses mínimos antes de contemplar (0 = sem mínimo)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  cancellationFeePercent: number;            // % multa por cancelamento sobre valor pago

  @Column({ type: 'int', default: 7 })
  gracePeriodDays: number;                   // Dias para arrependimento (CDC = 7)

  @Column({ type: 'varchar', default: 'IGPM' })
  adjustmentIndex: string;                   // Índice de reajuste anual

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  safetyMarginPercent: number;               // Margem de segurança sobre custo

  @Column({ type: 'int', default: 90 })
  defaultDaysToCancel: number;               // Dias de inadimplência para cancelar

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => SolarPlanSubscription, s => s.plan)
  subscriptions: SolarPlanSubscription[];
}

// ═══════════════════════════════════════════════════════════════
// ADESÃO DO CLIENTE — Contrato individual
// ═══════════════════════════════════════════════════════════════

export enum SubscriptionStatus {
  AWAITING = 'awaiting',             // Aguardando pagamento da taxa de adesão
  ACTIVE = 'active',                 // Pagando parcelas → ainda não contemplado
  CONTEMPLATED = 'contemplated',     // Atingiu gatilho → aguardando dimensionamento
  INSTALLING = 'installing',         // Sistema sendo instalado
  COMPLETED = 'completed',           // Instalado + pagando restante
  SETTLED = 'settled',               // Quitado 100%
  CANCELLED = 'cancelled',          // Cancelado (desistência)
  DEFAULTING = 'defaulting',        // Inadimplente
}

@Entity('solar_plan_subscriptions')
export class SolarPlanSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;                              // PAS-0001, PAS-0002...

  @Column()
  planId: string;

  @ManyToOne(() => SolarPlan, p => p.subscriptions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planId' })
  plan: SolarPlan;

  @Column()
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'varchar', default: SubscriptionStatus.AWAITING })
  status: string;

  // ═══ VALORES FINANCEIROS ═══
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;                        // Valor total do plano (equipamento + mão de obra + margem)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  enrollmentFee: number;                     // Taxa de adesão (R$)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyPayment: number;                    // Valor da parcela mensal

  @Column({ type: 'int', default: 48 })
  totalInstallments: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;                        // Total já pago (incluindo taxa de adesão)

  @Column({ type: 'int', default: 0 })
  paidInstallments: number;                  // Parcelas pagas

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  contemplationThreshold: number;            // % para contemplar (copiado do plano)

  // ═══ CONTA DE LUZ ATUAL (PROVA DE CAPACIDADE) ═══
  /** Valor médio mensal da conta de luz do cliente — "Se você paga isso de luz, pode pagar o plano" */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentMonthlyBill: number;

  /** Consumo médio mensal (kWh) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentConsumptionKwh: number;

  /** Concessionária de energia */
  @Column({ nullable: true })
  utilityCompany: string;

  /** Economia mensal que o parcela gera vs. conta de luz: currentBill - monthlyPayment */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlySavingsFromDay1: number;

  // ═══ SISTEMA SOLAR ═══
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  systemPowerKwp: number;                    // Potência do sistema

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedMonthlySavings: number;           // Economia mensal estimada pós-instalação

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  equipmentCost: number;                     // Custo dos equipamentos

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  installationCost: number;                  // Custo da instalação

  // ═══ ENDEREÇO DE INSTALAÇÃO ═══
  @Column({ nullable: true })
  propertyAddress: string;

  @Column({ nullable: true })
  propertyCity: string;

  @Column({ nullable: true })
  propertyState: string;

  @Column({ nullable: true })
  propertyCep: string;

  // ═══ DATAS DE MARCO ═══
  @Column({ nullable: true })
  enrollmentPaidAt: Date;                    // Data que pagou taxa de adesão

  @Column({ nullable: true })
  contemplatedAt: Date;                      // Data contemplado

  @Column({ nullable: true })
  installationStartedAt: Date;

  @Column({ nullable: true })
  installedAt: Date;                         // Data sistema instalado

  @Column({ nullable: true })
  settledAt: Date;                           // Data quitado

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  // ═══ VÍNCULOS ═══
  @Column({ nullable: true })
  solarProjectId: string;                    // Vínculo com projeto solar (quando contemplado)

  @Column({ nullable: true })
  proposalId: string;                        // Vínculo com proposta gerada

  @Column({ nullable: true })
  contractId: string;                        // Vínculo com contrato

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => SolarPlanInstallment, i => i.subscription)
  installments: SolarPlanInstallment[];
}

// ═══════════════════════════════════════════════════════════════
// PARCELAS INDIVIDUAIS
// ═══════════════════════════════════════════════════════════════

@Entity('solar_plan_installments')
export class SolarPlanInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => SolarPlanSubscription, s => s.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: SolarPlanSubscription;

  @Column({ type: 'int' })
  installmentNumber: number;                 // 0 = taxa de adesão, 1..N = parcelas

  @Column({ type: 'varchar', default: 'monthly' })
  type: string;                              // enrollment_fee | monthly | anticipation

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column()
  dueDate: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;                            // pending | paid | overdue | cancelled

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ nullable: true })
  paymentMethod: string;                     // pix | boleto | bank_transfer | cash

  @Column({ type: 'text', nullable: true })
  boletoUrl: string;

  @Column({ type: 'text', nullable: true })
  pixQrCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  lateFee: number;                           // Multa por atraso

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  interestAmount: number;                    // Juros por atraso

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
