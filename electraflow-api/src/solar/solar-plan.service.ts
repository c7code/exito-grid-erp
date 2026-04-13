import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SolarPlan, SolarPlanSubscription, SolarPlanInstallment, SubscriptionStatus } from './solar-plan.entity';

@Injectable()
export class SolarPlanService {
  constructor(
    @InjectRepository(SolarPlan) private planRepo: Repository<SolarPlan>,
    @InjectRepository(SolarPlanSubscription) private subRepo: Repository<SolarPlanSubscription>,
    @InjectRepository(SolarPlanInstallment) private installmentRepo: Repository<SolarPlanInstallment>,
    private dataSource: DataSource,
  ) {
    this.ensureTables();
  }

  // ═══ AUTO-CREATE TABLES ═══════════════════════════════════════════════════

  private async ensureTables() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS solar_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL, description TEXT,
          status VARCHAR DEFAULT 'active',
          "minPowerKwp" DECIMAL(10,2) DEFAULT 0, "maxPowerKwp" DECIMAL(10,2) DEFAULT 0,
          "totalInstallments" INT DEFAULT 48,
          "enrollmentFeePercent" DECIMAL(5,2) DEFAULT 10,
          "contemplationThresholdPercent" DECIMAL(5,2) DEFAULT 50,
          "contemplationMinMonths" INT DEFAULT 0,
          "cancellationFeePercent" DECIMAL(5,2) DEFAULT 20,
          "gracePeriodDays" INT DEFAULT 7,
          "adjustmentIndex" VARCHAR DEFAULT 'IGPM',
          "safetyMarginPercent" DECIMAL(5,2) DEFAULT 15,
          "defaultDaysToCancel" INT DEFAULT 90,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS solar_plan_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR UNIQUE NOT NULL,
          "planId" UUID REFERENCES solar_plans(id) ON DELETE SET NULL,
          "clientId" UUID,
          status VARCHAR DEFAULT 'awaiting',
          "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "enrollmentFee" DECIMAL(15,2) DEFAULT 0,
          "monthlyPayment" DECIMAL(15,2) DEFAULT 0,
          "totalInstallments" INT DEFAULT 48,
          "paidAmount" DECIMAL(15,2) DEFAULT 0,
          "paidInstallments" INT DEFAULT 0,
          "contemplationThreshold" DECIMAL(5,2) DEFAULT 50,
          "currentMonthlyBill" DECIMAL(15,2) DEFAULT 0,
          "currentConsumptionKwh" DECIMAL(12,2) DEFAULT 0,
          "utilityCompany" VARCHAR,
          "monthlySavingsFromDay1" DECIMAL(15,2) DEFAULT 0,
          "systemPowerKwp" DECIMAL(10,2) DEFAULT 0,
          "estimatedMonthlySavings" DECIMAL(15,2) DEFAULT 0,
          "equipmentCost" DECIMAL(15,2) DEFAULT 0,
          "installationCost" DECIMAL(15,2) DEFAULT 0,
          "propertyAddress" VARCHAR, "propertyCity" VARCHAR, "propertyState" VARCHAR, "propertyCep" VARCHAR,
          "enrollmentPaidAt" TIMESTAMP, "contemplatedAt" TIMESTAMP, "installationStartedAt" TIMESTAMP,
          "installedAt" TIMESTAMP, "settledAt" TIMESTAMP, "cancelledAt" TIMESTAMP,
          "cancellationReason" TEXT,
          "solarProjectId" UUID, "proposalId" UUID, "contractId" UUID,
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS solar_plan_installments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "subscriptionId" UUID NOT NULL REFERENCES solar_plan_subscriptions(id) ON DELETE CASCADE,
          "installmentNumber" INT NOT NULL,
          type VARCHAR DEFAULT 'monthly',
          amount DECIMAL(15,2) NOT NULL,
          "dueDate" TIMESTAMP NOT NULL,
          status VARCHAR DEFAULT 'pending',
          "paidAt" TIMESTAMP, "paidAmount" DECIMAL(15,2) DEFAULT 0,
          "paymentMethod" VARCHAR,
          "boletoUrl" TEXT, "pixQrCode" TEXT,
          "lateFee" DECIMAL(15,2) DEFAULT 0, "interestAmount" DECIMAL(15,2) DEFAULT 0,
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `);
    } catch (e) { console.warn('Solar Plans migration:', e?.message); }
  }

  // ═══ PLANS CRUD ═══════════════════════════════════════════════════════════

  async findAllPlans(): Promise<SolarPlan[]> {
    return this.planRepo.find({ order: { totalInstallments: 'ASC' } });
  }

  async findOnePlan(id: string): Promise<SolarPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async createPlan(data: Partial<SolarPlan>): Promise<SolarPlan> {
    return this.planRepo.save(this.planRepo.create(data));
  }

  async updatePlan(id: string, data: Partial<SolarPlan>): Promise<SolarPlan> {
    const plan = await this.findOnePlan(id);
    Object.assign(plan, data);
    return this.planRepo.save(plan);
  }

  async removePlan(id: string): Promise<void> { await this.planRepo.softDelete(id); }

  // ═══ SUBSCRIPTIONS (ADESÕES) ═════════════════════════════════════════════

  private async generateCode(): Promise<string> {
    const [{ cnt }] = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM solar_plan_subscriptions`);
    let num = Number(cnt) + 1;
    let code = `PAS-${String(num).padStart(4, '0')}`;
    while (true) {
      const exists = await this.dataSource.query(`SELECT id FROM solar_plan_subscriptions WHERE code = $1 LIMIT 1`, [code]);
      if (exists.length === 0) break;
      num++; code = `PAS-${String(num).padStart(4, '0')}`;
    }
    return code;
  }

  async findAllSubscriptions(status?: string): Promise<SolarPlanSubscription[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.subRepo.find({ where, relations: ['plan', 'client'], order: { createdAt: 'DESC' } });
  }

  async findOneSubscription(id: string): Promise<SolarPlanSubscription> {
    const sub = await this.subRepo.findOne({ where: { id }, relations: ['plan', 'client', 'installments'] });
    if (!sub) throw new NotFoundException('Adesão não encontrada');
    return sub;
  }

  /**
   * CRIAR ADESÃO — O motor financeiro do plano
   *
   * Modelo: "Sua conta de luz é sua aprovação"
   * - Captura a conta de luz atual do cliente
   * - Calcula a parcela para ser MENOR que a conta de luz
   * - Gera todas as parcelas (taxa adesão + mensalidades)
   * - Cliente já "economiza" desde o dia 1
   */
  async createSubscription(data: {
    planId: string; clientId: string;
    totalValue: number; systemPowerKwp?: number;
    currentMonthlyBill?: number; currentConsumptionKwh?: number;
    utilityCompany?: string;
    equipmentCost?: number; installationCost?: number;
    propertyAddress?: string; propertyCity?: string; propertyState?: string; propertyCep?: string;
    notes?: string;
  }): Promise<SolarPlanSubscription> {
    const plan = await this.findOnePlan(data.planId);

    const totalValue = Number(data.totalValue);
    const enrollmentFee = Math.round(totalValue * Number(plan.enrollmentFeePercent) / 100 * 100) / 100;
    const remainingAfterFee = totalValue - enrollmentFee;
    const monthlyPayment = Math.round(remainingAfterFee / plan.totalInstallments * 100) / 100;
    const currentBill = Number(data.currentMonthlyBill || 0);
    const savingsDay1 = currentBill > 0 ? currentBill - monthlyPayment : 0;

    const code = await this.generateCode();

    const sub = this.subRepo.create({
      code,
      planId: data.planId,
      clientId: data.clientId,
      status: SubscriptionStatus.AWAITING,
      totalValue,
      enrollmentFee,
      monthlyPayment,
      totalInstallments: plan.totalInstallments,
      contemplationThreshold: Number(plan.contemplationThresholdPercent),
      currentMonthlyBill: currentBill,
      currentConsumptionKwh: Number(data.currentConsumptionKwh || 0),
      utilityCompany: data.utilityCompany || null,
      monthlySavingsFromDay1: savingsDay1,
      systemPowerKwp: Number(data.systemPowerKwp || 0),
      estimatedMonthlySavings: currentBill, // Após instalação, economia = toda a conta de luz
      equipmentCost: Number(data.equipmentCost || 0),
      installationCost: Number(data.installationCost || 0),
      propertyAddress: data.propertyAddress,
      propertyCity: data.propertyCity,
      propertyState: data.propertyState,
      propertyCep: data.propertyCep,
      notes: data.notes,
    });

    const saved = await this.subRepo.save(sub);

    // ── Gerar parcelas: [0] = taxa de adesão, [1..N] = mensalidades ──
    const today = new Date();
    const installments: Partial<SolarPlanInstallment>[] = [];

    // Parcela 0 — Taxa de adesão (vencimento imediato, 15 dias)
    installments.push({
      subscriptionId: saved.id,
      installmentNumber: 0,
      type: 'enrollment_fee',
      amount: enrollmentFee,
      dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      status: 'pending',
    });

    // Parcelas 1..N — Mensalidades (a partir do mês seguinte)
    for (let i = 1; i <= plan.totalInstallments; i++) {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i, 10); // Dia 10 de cada mês
      installments.push({
        subscriptionId: saved.id,
        installmentNumber: i,
        type: 'monthly',
        amount: monthlyPayment,
        dueDate,
        status: 'pending',
      });
    }

    await this.installmentRepo.save(installments as SolarPlanInstallment[]);

    return this.findOneSubscription(saved.id);
  }

  async updateSubscription(id: string, data: Partial<SolarPlanSubscription>): Promise<SolarPlanSubscription> {
    const sub = await this.findOneSubscription(id);
    // Don't allow editing critical financial fields directly
    const { totalValue, enrollmentFee, monthlyPayment, paidAmount, paidInstallments, ...safeData } = data as any;
    Object.assign(sub, safeData);
    await this.subRepo.save(sub);
    return this.findOneSubscription(id);
  }

  // ═══ REGISTRAR PAGAMENTO DE PARCELA ═══════════════════════════════════════

  async payInstallment(installmentId: string, paymentData: {
    paidAmount: number; paymentMethod: string; boletoUrl?: string; pixQrCode?: string;
  }): Promise<SolarPlanSubscription> {
    const inst = await this.installmentRepo.findOne({ where: { id: installmentId }, relations: ['subscription'] });
    if (!inst) throw new NotFoundException('Parcela não encontrada');
    if (inst.status === 'paid') throw new BadRequestException('Parcela já paga');

    inst.paidAt = new Date();
    inst.paidAmount = Number(paymentData.paidAmount);
    inst.paymentMethod = paymentData.paymentMethod;
    inst.status = 'paid';
    if (paymentData.boletoUrl) inst.boletoUrl = paymentData.boletoUrl;
    if (paymentData.pixQrCode) inst.pixQrCode = paymentData.pixQrCode;
    await this.installmentRepo.save(inst);

    // Atualizar totalizadores da adesão
    const sub = inst.subscription;
    const allInstallments = await this.installmentRepo.find({ where: { subscriptionId: sub.id } });
    const paidInsts = allInstallments.filter(i => i.status === 'paid');

    sub.paidAmount = paidInsts.reduce((s, i) => s + Number(i.paidAmount), 0);
    sub.paidInstallments = paidInsts.filter(i => i.type !== 'enrollment_fee').length;

    // Se pagou a taxa de adesão, ativar
    if (inst.type === 'enrollment_fee' && sub.status === SubscriptionStatus.AWAITING) {
      sub.status = SubscriptionStatus.ACTIVE;
      sub.enrollmentPaidAt = new Date();
    }

    // VERIFICAR CONTEMPLAÇÃO: atingiu o gatilho?
    const percentPaid = (sub.paidAmount / Number(sub.totalValue)) * 100;
    if (sub.status === SubscriptionStatus.ACTIVE && percentPaid >= Number(sub.contemplationThreshold)) {
      sub.status = SubscriptionStatus.CONTEMPLATED;
      sub.contemplatedAt = new Date();
    }

    // Verificar quitação
    if (sub.paidAmount >= Number(sub.totalValue)) {
      sub.status = SubscriptionStatus.SETTLED;
      sub.settledAt = new Date();
    }

    await this.subRepo.save(sub);
    return this.findOneSubscription(sub.id);
  }

  // ═══ CONTEMPLAR (INICIAR INSTALAÇÃO) ═════════════════════════════════════

  async startInstallation(subId: string): Promise<SolarPlanSubscription> {
    const sub = await this.findOneSubscription(subId);
    if (sub.status !== SubscriptionStatus.CONTEMPLATED) {
      throw new BadRequestException('Adesão não está contemplada');
    }
    sub.status = SubscriptionStatus.INSTALLING;
    sub.installationStartedAt = new Date();
    return this.subRepo.save(sub);
  }

  async completeInstallation(subId: string): Promise<SolarPlanSubscription> {
    const sub = await this.findOneSubscription(subId);
    if (sub.status !== SubscriptionStatus.INSTALLING) {
      throw new BadRequestException('Adesão não está em instalação');
    }
    sub.status = SubscriptionStatus.COMPLETED;
    sub.installedAt = new Date();
    return this.subRepo.save(sub);
  }

  // ═══ CANCELAMENTO ════════════════════════════════════════════════════════

  async cancelSubscription(subId: string, reason: string): Promise<{ refundAmount: number; feeAmount: number; subscription: SolarPlanSubscription }> {
    const sub = await this.findOneSubscription(subId);
    if ([SubscriptionStatus.SETTLED, SubscriptionStatus.CANCELLED].includes(sub.status as SubscriptionStatus)) {
      throw new BadRequestException('Adesão já quitada ou cancelada');
    }

    const plan = await this.findOnePlan(sub.planId);
    const paidExcludingFee = Number(sub.paidAmount) - Number(sub.enrollmentFee);
    const cancellationFee = Math.round(paidExcludingFee * Number(plan.cancellationFeePercent) / 100 * 100) / 100;
    const refundAmount = Math.max(0, paidExcludingFee - cancellationFee);

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
    sub.cancellationReason = reason;
    await this.subRepo.save(sub);

    // Cancelar parcelas pendentes
    await this.installmentRepo.createQueryBuilder()
      .update(SolarPlanInstallment)
      .set({ status: 'cancelled' })
      .where('"subscriptionId" = :id AND status = :status', { id: subId, status: 'pending' })
      .execute();

    return { refundAmount, feeAmount: cancellationFee + Number(sub.enrollmentFee), subscription: await this.findOneSubscription(subId) };
  }

  // ═══ DASHBOARD & ANALYTICS ═══════════════════════════════════════════════

  async getDashboard(): Promise<any> {
    const all = await this.subRepo.find({ relations: ['plan'] });
    const active = all.filter(s => [SubscriptionStatus.ACTIVE, SubscriptionStatus.CONTEMPLATED, SubscriptionStatus.INSTALLING, SubscriptionStatus.COMPLETED].includes(s.status as SubscriptionStatus));
    const totalAccumulated = active.reduce((s, a) => s + Number(a.paidAmount), 0);
    const totalContracted = active.reduce((s, a) => s + Number(a.totalValue), 0);
    const pendingInstallation = all.filter(s => s.status === SubscriptionStatus.CONTEMPLATED).length;
    const defaulting = all.filter(s => s.status === SubscriptionStatus.DEFAULTING).length;
    const settled = all.filter(s => s.status === SubscriptionStatus.SETTLED).length;
    const cancelled = all.filter(s => s.status === SubscriptionStatus.CANCELLED).length;

    return {
      totalSubscriptions: all.length,
      activeSubscriptions: active.length,
      pendingInstallation,
      defaulting,
      settled,
      cancelled,
      totalAccumulated,
      totalContracted,
      collectionRate: totalContracted > 0 ? (totalAccumulated / totalContracted * 100) : 0,
      avgProgress: active.length > 0 ? active.reduce((s, a) => s + (Number(a.paidAmount) / Number(a.totalValue) * 100), 0) / active.length : 0,
    };
  }

  // ═══ SIMULADOR ═══════════════════════════════════════════════════════════

  /**
   * Simula o plano para o cliente:
   * "Sua conta = R$400. Parcela = R$350. Você já economiza R$50/mês desde o dia 1.
   *  Em 18 meses (50% pago), instalamos. Aí você economiza R$400/mês pra sempre."
   */
  simulate(params: { planId?: string; totalValue: number; currentMonthlyBill: number; installments?: number; enrollmentPercent?: number; contemplationPercent?: number }) {
    const total = Number(params.totalValue);
    const bill = Number(params.currentMonthlyBill);
    const installments = params.installments || 48;
    const enrollmentPct = params.enrollmentPercent || 10;
    const contemplationPct = params.contemplationPercent || 50;

    const enrollmentFee = Math.round(total * enrollmentPct / 100 * 100) / 100;
    const remaining = total - enrollmentFee;
    const monthlyPayment = Math.round(remaining / installments * 100) / 100;

    const savingsDay1 = bill > 0 ? bill - monthlyPayment : 0;
    const contemplationMonth = Math.ceil((total * contemplationPct / 100 - enrollmentFee) / monthlyPayment);
    const totalSavingsBeforeInstall = savingsDay1 * contemplationMonth;

    // Após instalação: cliente não paga mais conta de luz, só a parcela
    const remainingMonths = installments - contemplationMonth;
    const savingsAfterInstall = bill; // Economia = toda a conta de luz que não paga mais
    const netMonthlyAfterInstall = savingsAfterInstall - monthlyPayment; // Economia líquida
    const totalSavingsAfterInstall = netMonthlyAfterInstall * remainingMonths;

    // Após quitação: economia total = conta de luz × 12 × anos restantes (25 anos de vida útil)
    const yearsRemaining = 25 - (installments / 12);
    const lifetimeSavings = bill * 12 * yearsRemaining;

    return {
      enrollmentFee,
      monthlyPayment,
      totalValue: total,
      currentMonthlyBill: bill,
      savingsFromDay1: savingsDay1,
      savingsFromDay1Positive: savingsDay1 > 0,
      contemplationMonth,
      contemplationDate: new Date(new Date().getFullYear(), new Date().getMonth() + contemplationMonth + 1, 10).toISOString(),
      totalSavingsBeforeInstall,
      savingsAfterInstallation: savingsAfterInstall,
      netMonthlySavingsAfterInstall: netMonthlyAfterInstall,
      totalSavingsAfterInstall,
      lifetimeSavings,
      roi: total > 0 ? (lifetimeSavings / total * 100) : 0,
      paybackYears: bill > 0 ? (total / (bill * 12)).toFixed(1) : '—',
      argument: savingsDay1 > 0
        ? `Você paga R$ ${bill.toFixed(0)} de luz. No plano, paga R$ ${monthlyPayment.toFixed(0)}. Economia de R$ ${savingsDay1.toFixed(0)}/mês desde o dia 1. Em ${contemplationMonth} meses, instalamos e você economiza R$ ${bill.toFixed(0)}/mês para sempre.`
        : `Parcela de R$ ${monthlyPayment.toFixed(0)}/mês. Em ${contemplationMonth} meses instalamos e você elimina a conta de luz de R$ ${bill.toFixed(0)}/mês.`,
    };
  }

  // ═══ PARCELAS ════════════════════════════════════════════════════════════

  async getInstallments(subscriptionId: string): Promise<SolarPlanInstallment[]> {
    return this.installmentRepo.find({ where: { subscriptionId }, order: { installmentNumber: 'ASC' } });
  }

  async updateInstallment(id: string, data: Partial<SolarPlanInstallment>): Promise<SolarPlanInstallment> {
    const inst = await this.installmentRepo.findOne({ where: { id } });
    if (!inst) throw new NotFoundException('Parcela não encontrada');
    Object.assign(inst, data);
    return this.installmentRepo.save(inst);
  }

  // ═══ CLIENT PORTAL ═══════════════════════════════════════════════════════

  async getClientSubscriptions(clientId: string): Promise<SolarPlanSubscription[]> {
    return this.subRepo.find({ where: { clientId }, relations: ['plan', 'installments'], order: { createdAt: 'DESC' } });
  }
}
