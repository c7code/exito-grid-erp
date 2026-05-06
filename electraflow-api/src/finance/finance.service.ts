import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, TransactionCategory } from './payment.entity';
import { WorkCost } from './work-cost.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { PaymentReceipt } from './payment-receipt.entity';
import { PurchaseOrder, PurchaseOrderItem } from './purchase-order.entity';
import { PaymentInstallment, InstallmentStatus } from './payment-installment.entity';
import { Debt, DebtPayment } from './debt.entity';
import { BankStatement, BankStatementEntry, MatchStatus, StatementStatus } from './bank-statement.entity';
import { BankAccount } from './finance-config.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(WorkCost)
    private workCostRepository: Repository<WorkCost>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(PaymentReceipt)
    private receiptRepo: Repository<PaymentReceipt>,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PaymentInstallment)
    private installmentRepo: Repository<PaymentInstallment>,
    @InjectRepository(Debt)
    private debtRepo: Repository<Debt>,
    @InjectRepository(DebtPayment)
    private debtPaymentRepo: Repository<DebtPayment>,
    @InjectRepository(BankStatement)
    private statementRepo: Repository<BankStatement>,
    @InjectRepository(BankStatementEntry)
    private statementEntryRepo: Repository<BankStatementEntry>,
    @InjectRepository(BankAccount)
    private bankAccountRepo: Repository<BankAccount>,
    private dataSource: DataSource,
  ) {
    this.ensureTables();
  }

  private async ensureTables() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS payment_receipts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "receiptNumber" VARCHAR UNIQUE NOT NULL,
          "proposalId" UUID, "clientId" UUID, description TEXT,
          "totalProposalValue" DECIMAL(15,2) DEFAULT 0,
          percentage DECIMAL(5,2) DEFAULT 100,
          amount DECIMAL(15,2) NOT NULL,
          "paymentMethod" VARCHAR, "paidAt" TIMESTAMP,
          notes TEXT, status VARCHAR DEFAULT 'issued',
          "proposalNumber" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "orderNumber" VARCHAR UNIQUE NOT NULL,
          "proposalId" UUID, "supplierId" UUID, "clientId" UUID,
          type VARCHAR DEFAULT 'company_billing',
          status VARCHAR DEFAULT 'draft',
          "totalValue" DECIMAL(15,2) DEFAULT 0,
          "paymentTerms" TEXT, "internalNotes" TEXT,
          "internalMargin" DECIMAL(5,2) DEFAULT 0,
          "deliveryDate" TIMESTAMP, "deliveryAddress" TEXT, notes TEXT,
          "proposalNumber" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "purchaseOrderId" UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
          description VARCHAR NOT NULL,
          quantity DECIMAL(15,4) DEFAULT 1, unit VARCHAR DEFAULT 'un',
          "unitPrice" DECIMAL(15,2) DEFAULT 0, "totalPrice" DECIMAL(15,2) DEFAULT 0,
          "internalCost" DECIMAL(15,2), notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      // Add new columns if table already exists
      await this.dataSource.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "contractNumber" TEXT`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "workName" TEXT`).catch(() => {});

      // ═══ Measurements tables ═══
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS measurements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "workId" UUID NOT NULL,
          number INTEGER NOT NULL DEFAULT 1,
          status VARCHAR DEFAULT 'draft',
          description VARCHAR,
          "startDate" TIMESTAMP, "endDate" TIMESTAMP,
          "contractValue" DECIMAL(15,2) DEFAULT 0,
          "directBillingTotal" DECIMAL(15,2) DEFAULT 0,
          "baseValue" DECIMAL(15,2) DEFAULT 0,
          "executedPercentage" DECIMAL(5,2) DEFAULT 0,
          "accumulatedPercentage" DECIMAL(5,2) DEFAULT 0,
          "directBillingItems" TEXT,
          "totalAmount" DECIMAL(15,2) DEFAULT 0,
          "retentionAmount" DECIMAL(15,2) DEFAULT 0,
          "taxAmount" DECIMAL(15,2) DEFAULT 0,
          "netAmount" DECIMAL(15,2) DEFAULT 0,
          notes TEXT,
          "proposalId" UUID, "contractId" UUID,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `).catch(() => {});
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS measurement_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "measurementId" UUID REFERENCES measurements(id) ON DELETE CASCADE,
          "taskId" UUID,
          "previousProgress" DECIMAL(5,2) DEFAULT 0,
          "currentProgress" DECIMAL(5,2) DEFAULT 0,
          "weightPercentage" DECIMAL(5,2) DEFAULT 0,
          "calculatedValue" DECIMAL(15,2) DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `).catch(() => {});

      // ═══ Measurement columns migration ═══
      const measCols = [
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "contractValue" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "directBillingTotal" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "baseValue" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "executedPercentage" DECIMAL(5,2) DEFAULT 0`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "accumulatedPercentage" DECIMAL(5,2) DEFAULT 0`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "directBillingItems" TEXT`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS stages TEXT`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "proposalId" UUID`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS "contractId" UUID`,
        `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS description VARCHAR`,
      ];
      for (const sql of measCols) { await this.dataSource.query(sql).catch(() => {}); }

      // ═══ Signature columns ═══
      const sigCols = [
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureImageUrl" VARCHAR`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureSignerName" VARCHAR`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureSignerRole" VARCHAR`,
        `ALTER TABLE clients ADD COLUMN IF NOT EXISTS "signatureImageUrl" VARCHAR`,
      ];
      for (const sql of sigCols) { await this.dataSource.query(sql).catch(() => {}); }

      // ═══ Payment boleto/PIX columns ═══
      const payBolCols = [
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoUrl" TEXT`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoFileName" VARCHAR`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "pixQrCode" TEXT`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "pixQrCodeImage" TEXT`,
      ];
      for (const sql of payBolCols) { await this.dataSource.query(sql).catch(() => {}); }

      // ═══ Payment Installments table ═══
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS payment_installments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "paymentId" UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          "installmentNumber" INT DEFAULT 1,
          "totalInstallments" INT DEFAULT 1,
          description VARCHAR,
          amount DECIMAL(15,2) NOT NULL,
          "paidAmount" DECIMAL(15,2) DEFAULT 0,
          "dueDate" TIMESTAMP NOT NULL,
          "paidAt" TIMESTAMP,
          status VARCHAR DEFAULT 'pending',
          "paymentMethod" VARCHAR,
          "transactionId" VARCHAR,
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP
        )
      `).catch(() => {});

      // Self-heal columns
      const instCols = [
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "transactionId" VARCHAR`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "receiptFile" VARCHAR`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "receiptFileName" VARCHAR`,
        `ALTER TABLE payment_installments ADD COLUMN IF NOT EXISTS "notes" TEXT`,
      ];
      for (const sql of instCols) { await this.dataSource.query(sql).catch(() => {}); }

      // ═══ Payment: add proposalId + proposalNumber columns ═══
      const payExtraCols = [
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "proposalId" UUID`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "proposalNumber" VARCHAR`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "measurementId" UUID`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "isAnticipated" BOOLEAN DEFAULT false`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "anticipatedDate" TIMESTAMP`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "anticipationDiscount" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "inssBasePercentage" DECIMAL(5,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "inssRate" DECIMAL(5,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "inssAmount" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "inssGpsNumber" VARCHAR`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "simplesRate" DECIMAL(5,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "simplesAmount" DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "simplesStatus" VARCHAR DEFAULT 'none'`,
        `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "simplesCompetence" VARCHAR`,
      ];
      for (const sql of payExtraCols) { await this.dataSource.query(sql).catch(() => {}); }

      // ═══ Debts table ═══
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS debts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description TEXT NOT NULL, creditor VARCHAR,
          type VARCHAR DEFAULT 'other', nature VARCHAR DEFAULT 'neutral', status VARCHAR DEFAULT 'active',
          "originalAmount" DECIMAL(15,2) NOT NULL, "currentBalance" DECIMAL(15,2) DEFAULT 0, "totalPaid" DECIMAL(15,2) DEFAULT 0,
          "interestRate" DECIMAL(6,3) DEFAULT 0, "interestPeriod" VARCHAR DEFAULT 'monthly', "interestType" VARCHAR DEFAULT 'fixed',
          "startDate" TIMESTAMP, "endDate" TIMESTAMP,
          "totalInstallments" INT DEFAULT 0, "paidInstallments" INT DEFAULT 0,
          "monthlyPayment" DECIMAL(15,2) DEFAULT 0, "nextDueDate" TIMESTAMP,
          "guaranteeType" VARCHAR, "guaranteeDescription" TEXT,
          "bankAccountId" UUID, "contractNumber" VARCHAR, notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `).catch(() => {});
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS debt_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "debtId" UUID NOT NULL, amount DECIMAL(15,2) NOT NULL,
          "principalAmount" DECIMAL(15,2) DEFAULT 0, "interestAmount" DECIMAL(15,2) DEFAULT 0,
          "paidAt" TIMESTAMP, method VARCHAR, reference VARCHAR, notes TEXT,
          "installmentNumber" INT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `).catch(() => {});

      // ═══ Bank Statements table ═══
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS bank_statements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "bankAccountId" UUID NOT NULL, "referenceMonth" VARCHAR NOT NULL,
          "fileName" VARCHAR, "totalCredits" DECIMAL(15,2) DEFAULT 0, "totalDebits" DECIMAL(15,2) DEFAULT 0,
          "openingBalance" DECIMAL(15,2) DEFAULT 0, "closingBalance" DECIMAL(15,2) DEFAULT 0,
          "totalEntries" INT DEFAULT 0, "matchedEntries" INT DEFAULT 0,
          status VARCHAR DEFAULT 'pending', notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
        )
      `).catch(() => {});
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS bank_statement_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "statementId" UUID NOT NULL, date DATE NOT NULL,
          description TEXT NOT NULL, amount DECIMAL(15,2) NOT NULL,
          "entryType" VARCHAR DEFAULT 'credit',
          "matchedPaymentId" UUID, "matchStatus" VARCHAR DEFAULT 'unmatched',
          "matchDifference" DECIMAL(15,2) DEFAULT 0,
          notes TEXT, category VARCHAR,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `).catch(() => {});
    } catch (e) { console.warn('Finance tables migration:', e?.message); }
  }

  /**
   * Consolidate DAS for a set of payments:
   * - paymentIds: which payments to include
   * - dasAmount: actual DAS value paid
   * - competence: month (YYYY-MM)
   * - status: 'provisioned' | 'realized'
   * Distributes dasAmount proportionally by gross amount across selected payments.
   */
  async consolidateDAS(paymentIds: string[], dasAmount: number, competence: string, status: string = 'realized'): Promise<any> {
    if (!paymentIds.length) return { updated: 0 };
    const payments = await this.paymentRepository.findByIds(paymentIds);
    const totalGross = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    if (totalGross <= 0) return { updated: 0 };
    const effectiveRate = (dasAmount / totalGross) * 100;
    for (const p of payments) {
      const gross = Number(p.amount || 0);
      const proportional = totalGross > 0 ? (gross / totalGross) * dasAmount : 0;
      await this.paymentRepository.update(p.id, {
        simplesRate: Number(effectiveRate.toFixed(4)),
        simplesAmount: Number(proportional.toFixed(2)),
        simplesStatus: status,
        simplesCompetence: competence,
      } as any);
    }
    return { updated: payments.length, effectiveRate: Number(effectiveRate.toFixed(4)), totalGross, dasAmount };
  }

  // ═══ PAYMENTS ═══════════════════════════════════════════════════════════

  async findAll(status?: PaymentStatus, workId?: string): Promise<Payment[]> {
    const where: any = {};
    if (status) where.status = status;
    if (workId) where.workId = workId;
    return this.paymentRepository.find({
      where,
      relations: ['work', 'work.client', 'supplier', 'employee', 'installments'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['work', 'supplier', 'employee', 'installments'],
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  private sanitizePaymentData(data: Partial<Payment>): Partial<Payment> {
    const d: any = { ...data };
    // UUID fields: empty string or 'none' → null
    for (const f of ['workId', 'clientId', 'supplierId', 'measurementId', 'employeeId']) {
      if (!d[f] || d[f] === 'none') d[f] = null;
    }
    // Date fields: empty string → null
    for (const f of ['dueDate', 'billingDate', 'scheduledPaymentDate', 'paidAt']) {
      if (d[f] === '' || d[f] === undefined) d[f] = null;
    }
    return d;
  }

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const clean = this.sanitizePaymentData(paymentData);
    const payment = this.paymentRepository.create(clean);
    return this.paymentRepository.save(payment);
  }

  async update(id: string, paymentData: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    const clean = this.sanitizePaymentData(paymentData);
    Object.assign(payment, clean);
    return this.paymentRepository.save(payment);
  }

  async registerPayment(id: string, amount: number, method: string, transactionId?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    const newPaid = Number(payment.paidAmount || 0) + amount;
    // Calculate net amount after all deductions (ISS, CSLL, PIS, IRRF, ICMS, INSS, retention, anticipation)
    const gross = Number(payment.amount) || 0;
    const totalDeductions =
      (Number(payment.taxISSAmount) || 0) +
      (Number(payment.taxCSLLAmount) || 0) +
      (Number(payment.taxPISCOFINSAmount) || 0) +
      (Number(payment.taxIRRFAmount) || 0) +
      (Number(payment.taxICMSAmount) || 0) +
      (Number(payment.taxWithholding) || 0) +
      (Number(payment.inssAmount) || 0) +
      (Number(payment.anticipationDiscount) || 0);
    // If there are deductions, use net amount as the "full" target; otherwise use gross
    const targetAmount = totalDeductions > 0 ? (gross - totalDeductions) : gross;
    // Use direct update to avoid cascade issues with installments relation
    await this.paymentRepository.update(id, {
      paidAmount: newPaid,
      status: newPaid >= targetAmount ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
      paidAt: new Date(),
      paymentMethod: method as any,
      ...(transactionId ? { transactionId } : {}),
    });
    return this.findOne(id);
  }

  async getSummary(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [pendingIncome, overdueIncome, pendingExpense, receivedMonth, paidMonth] = await Promise.all([
      this.paymentRepository.createQueryBuilder('p').where('p.type = :type', { type: PaymentType.INCOME }).andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] }).select('SUM(p.amount - p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p').where('p.type = :type', { type: PaymentType.INCOME }).andWhere('p.status = :status', { status: PaymentStatus.OVERDUE }).select('SUM(p.amount - p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p').where('p.type = :type', { type: PaymentType.EXPENSE }).andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] }).select('SUM(p.amount - p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p').where('p.status = :status', { status: PaymentStatus.PAID }).andWhere('p.type = :type', { type: PaymentType.INCOME }).andWhere('p.paidAt >= :start', { start: startOfMonth }).select('SUM(p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p').where('p.status = :status', { status: PaymentStatus.PAID }).andWhere('p.type = :type', { type: PaymentType.EXPENSE }).andWhere('p.paidAt >= :start', { start: startOfMonth }).select('SUM(p.paidAmount)', 'total').getRawOne(),
    ]);
    return {
      toReceive: Number(pendingIncome?.total || 0),
      overdue: Number(overdueIncome?.total || 0),
      toPay: Number(pendingExpense?.total || 0),
      receivedThisMonth: Number(receivedMonth?.total || 0),
      paidThisMonth: Number(paidMonth?.total || 0),
      balance: Number(receivedMonth?.total || 0) - Number(paidMonth?.total || 0),
      currentBalance: 0,
      projectedProfit: Number(pendingIncome?.total || 0) - Number(pendingExpense?.total || 0),
    };
  }

  async getDREReport(startDate: Date, endDate: Date): Promise<any> {
    const transactions = await this.paymentRepository.find({
      where: { paidAt: Between(startDate, endDate), status: PaymentStatus.PAID },
      order: { category: 'ASC' },
    });

    // ── Categorize all transactions ──
    const income: Record<string, number> = {};
    const expense: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    // ── Individual tax totals from income records ──
    let taxISS = 0, taxPISCOFINS = 0, taxIRRF = 0, taxCSLL = 0, taxICMS = 0, taxWithholding = 0;

    transactions.forEach(t => {
      const category = t.category || TransactionCategory.OTHER;
      const amount = Number(t.paidAmount || 0);
      if (t.type === PaymentType.INCOME) {
        income[category] = (income[category] || 0) + amount;
        totalIncome += amount;
        // Accumulate tax details from income records
        taxISS += Number(t.taxISSAmount || 0);
        taxPISCOFINS += Number(t.taxPISCOFINSAmount || 0);
        taxIRRF += Number(t.taxIRRFAmount || 0);
        taxCSLL += Number(t.taxCSLLAmount || 0);
        taxICMS += Number(t.taxICMSAmount || 0);
        taxWithholding += Number(t.taxWithholding || 0);
      } else {
        expense[category] = (expense[category] || 0) + amount;
        totalExpense += amount;
      }
    });

    // ── Deductions (taxes from income) ──
    const totalDeductions = taxISS + taxPISCOFINS + taxIRRF + taxCSLL + taxICMS + taxWithholding;
    // Also include expense-category taxes
    const expenseTaxes = Number(expense[TransactionCategory.TAX] || 0);

    // ── Net Revenue ──
    const netRevenue = totalIncome - totalDeductions;

    // ── Cost of Services (CPV): materials, labor, equipment ──
    const cpvMaterials = Number(expense[TransactionCategory.MATERIALS] || 0);
    const cpvLabor = Number(expense[TransactionCategory.LABOR] || 0);
    const cpvEquipment = Number(expense[TransactionCategory.EQUIPMENT] || 0);
    const totalCPV = cpvMaterials + cpvLabor + cpvEquipment;

    // ── Gross Profit ──
    const grossProfit = netRevenue - totalCPV;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    // ── Operational Expenses (not CPV, not taxes) ──
    const opexOffice = Number(expense[TransactionCategory.OFFICE] || 0);
    const opexUtilities = Number(expense[TransactionCategory.UTILITIES] || 0);
    const opexMarketing = Number(expense[TransactionCategory.MARKETING] || 0);
    const opexProject = Number(expense[TransactionCategory.PROJECT] || 0);
    const opexOther = Number(expense[TransactionCategory.OTHER] || 0);
    const totalOpex = opexOffice + opexUtilities + opexMarketing + opexProject + opexOther;

    // ── EBITDA ──
    const ebitda = grossProfit - totalOpex;
    const ebitdaMargin = totalIncome > 0 ? (ebitda / totalIncome) * 100 : 0;

    // ── Net Profit ──
    const netProfit = ebitda - expenseTaxes;
    const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // ── Transaction count ──
    const incomeCount = transactions.filter(t => t.type === PaymentType.INCOME).length;
    const expenseCount = transactions.filter(t => t.type === PaymentType.EXPENSE).length;
    const ticketMedio = incomeCount > 0 ? totalIncome / incomeCount : 0;

    return {
      // Legacy compatibility
      income, expense, totalIncome, totalExpense,
      revenue: totalIncome,
      taxes: totalDeductions + expenseTaxes,
      netRevenue,
      netProfit,
      netResult: netProfit,

      // ── Professional DRE Structure ──
      dre: {
        receitaBruta: totalIncome,
        deducoes: {
          iss: taxISS,
          pisCofins: taxPISCOFINS,
          irrf: taxIRRF,
          csll: taxCSLL,
          icms: taxICMS,
          retencaoContratual: taxWithholding,
          total: totalDeductions,
        },
        receitaLiquida: netRevenue,
        cpv: {
          materiais: cpvMaterials,
          maoDeObra: cpvLabor,
          equipamentos: cpvEquipment,
          total: totalCPV,
        },
        lucroBruto: grossProfit,
        margemBruta: grossMargin,
        despesasOperacionais: {
          administrativas: opexOffice,
          utilidades: opexUtilities,
          marketing: opexMarketing,
          projetos: opexProject,
          outras: opexOther,
          total: totalOpex,
        },
        ebitda,
        margemEbitda: ebitdaMargin,
        impostosSobreLucro: expenseTaxes,
        lucroLiquido: netProfit,
        margemLiquida: netMargin,
      },

      // ── Metrics ──
      metrics: {
        ticketMedio,
        totalLancamentos: incomeCount + expenseCount,
        lancamentosReceita: incomeCount,
        lancamentosDespesa: expenseCount,
      },
    };
  }

  // ── Extended Summary with Period Comparison ──
  async getSummaryExtended(startDate: Date, endDate: Date): Promise<any> {
    const currentSummary = await this.getSummary();

    // Calculate previous period (same duration, shifted back)
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - durationMs);
    const prevEnd = new Date(startDate.getTime());

    // Current period totals
    const [currentIncome, currentExpense] = await Promise.all([
      this.paymentRepository.createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.INCOME })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start: startDate, end: endDate })
        .select('SUM(p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.EXPENSE })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start: startDate, end: endDate })
        .select('SUM(p.paidAmount)', 'total').getRawOne(),
    ]);

    // Previous period totals
    const [prevIncome, prevExpense] = await Promise.all([
      this.paymentRepository.createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.INCOME })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start: prevStart, end: prevEnd })
        .select('SUM(p.paidAmount)', 'total').getRawOne(),
      this.paymentRepository.createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.EXPENSE })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start: prevStart, end: prevEnd })
        .select('SUM(p.paidAmount)', 'total').getRawOne(),
    ]);

    const curInc = Number(currentIncome?.total || 0);
    const curExp = Number(currentExpense?.total || 0);
    const prvInc = Number(prevIncome?.total || 0);
    const prvExp = Number(prevExpense?.total || 0);

    // Overdue count
    const overdueCount = await this.paymentRepository.createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.OVERDUE })
      .getCount();

    const totalPending = await this.paymentRepository.createQueryBuilder('p')
      .where('p.type = :type', { type: PaymentType.INCOME })
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] })
      .getCount();

    const inadimplencia = totalPending > 0 ? (overdueCount / totalPending) * 100 : 0;

    return {
      ...currentSummary,
      period: {
        currentIncome: curInc,
        currentExpense: curExp,
        currentProfit: curInc - curExp,
        previousIncome: prvInc,
        previousExpense: prvExp,
        previousProfit: prvInc - prvExp,
        incomeVariation: prvInc > 0 ? ((curInc - prvInc) / prvInc) * 100 : 0,
        expenseVariation: prvExp > 0 ? ((curExp - prvExp) / prvExp) * 100 : 0,
        profitVariation: (prvInc - prvExp) !== 0 ? (((curInc - curExp) - (prvInc - prvExp)) / Math.abs(prvInc - prvExp)) * 100 : 0,
      },
      inadimplencia,
      overdueCount,
    };
  }

  // ── Monthly Evolution (last N months) ──
  async getMonthlyEvolution(months = 6): Promise<any[]> {
    const now = new Date();
    const result: any[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [incomeRow, expenseRow] = await Promise.all([
        this.paymentRepository.createQueryBuilder('p')
          .where('p.type = :type', { type: PaymentType.INCOME })
          .andWhere('p.status = :status', { status: PaymentStatus.PAID })
          .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start, end })
          .select('SUM(p.paidAmount)', 'total')
          .addSelect('COUNT(*)', 'count')
          .getRawOne(),
        this.paymentRepository.createQueryBuilder('p')
          .where('p.type = :type', { type: PaymentType.EXPENSE })
          .andWhere('p.status = :status', { status: PaymentStatus.PAID })
          .andWhere('p.paidAt >= :start AND p.paidAt <= :end', { start, end })
          .select('SUM(p.paidAmount)', 'total')
          .addSelect('COUNT(*)', 'count')
          .getRawOne(),
      ]);

      const inc = Number(incomeRow?.total || 0);
      const exp = Number(expenseRow?.total || 0);

      result.push({
        month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        monthFull: start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        receitas: inc,
        despesas: exp,
        lucro: inc - exp,
        receitaCount: Number(incomeRow?.count || 0),
        despesaCount: Number(expenseRow?.count || 0),
      });
    }

    return result;
  }

  async remove(id: string): Promise<void> { await this.paymentRepository.softDelete(id); }

  async attachInvoice(id: string, filename: string, originalName: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.invoiceFile = filename;
    payment.invoiceFileName = originalName;
    return this.paymentRepository.save(payment);
  }

  // ═══ WORK COSTS ══════════════════════════════════════════════════════════

  async findAllWorkCosts(workId?: string): Promise<WorkCost[]> {
    const where: any = {};
    if (workId) where.workId = workId;
    return this.workCostRepository.find({ where, relations: ['work', 'supplier', 'employee', 'payment'], order: { date: 'DESC', createdAt: 'DESC' } });
  }

  async findOneWorkCost(id: string): Promise<WorkCost> {
    const cost = await this.workCostRepository.findOne({ where: { id }, relations: ['work', 'supplier', 'employee'] });
    if (!cost) throw new NotFoundException('Custo não encontrado');
    return cost;
  }

  /** Map work-cost categories → finance transaction categories */
  private mapCostCategoryToTransaction(cat: string): TransactionCategory {
    const map: Record<string, TransactionCategory> = {
      material: TransactionCategory.MATERIALS,
      labor: TransactionCategory.LABOR,
      equipment: TransactionCategory.EQUIPMENT,
      tax: TransactionCategory.TAX,
      subcontract: TransactionCategory.OTHER,
      transport: TransactionCategory.OTHER,
      rental: TransactionCategory.OTHER,
      ppe: TransactionCategory.MATERIALS,
      food: TransactionCategory.OTHER,
      lodging: TransactionCategory.OTHER,
      other: TransactionCategory.OTHER,
    };
    return map[cat] || TransactionCategory.OTHER;
  }

  async createWorkCost(data: Partial<WorkCost>): Promise<WorkCost> {
    // 1. Create the work cost
    const cost = this.workCostRepository.create(data);
    const saved = await this.workCostRepository.save(cost);

    // 2. Auto-create a linked Payment (expense) in the finance module
    try {
      const payment = this.paymentRepository.create({
        workId: saved.workId,
        type: PaymentType.EXPENSE,
        category: this.mapCostCategoryToTransaction(saved.category || 'other'),
        description: `[Custo Obra] ${saved.description}`,
        amount: Number(saved.totalPrice) || 0,
        status: PaymentStatus.PENDING,
        dueDate: saved.date || new Date(),
        invoiceNumber: saved.invoiceNumber || null,
        supplierId: saved.supplierId || null,
        employeeId: saved.employeeId || null,
        notes: saved.notes || null,
      });
      const savedPayment = await this.paymentRepository.save(payment);

      // 3. Link the payment back to the work cost
      saved.paymentId = savedPayment.id;
      await this.workCostRepository.save(saved);
    } catch (err) {
      // Don't fail cost creation if payment auto-link fails
      console.warn('[WorkCost→Payment] Auto-link failed:', err?.message);
    }

    return saved;
  }

  async updateWorkCost(id: string, data: Partial<WorkCost>): Promise<WorkCost> {
    const cost = await this.findOneWorkCost(id);
    Object.assign(cost, data);
    const saved = await this.workCostRepository.save(cost);

    // Sync the linked Payment if it exists
    if (saved.paymentId) {
      try {
        const payment = await this.paymentRepository.findOne({ where: { id: saved.paymentId } });
        if (payment) {
          payment.description = `[Custo Obra] ${saved.description}`;
          payment.amount = Number(saved.totalPrice) || 0;
          payment.category = this.mapCostCategoryToTransaction(saved.category || 'other');
          payment.dueDate = saved.date || payment.dueDate;
          payment.invoiceNumber = saved.invoiceNumber || payment.invoiceNumber;
          payment.supplierId = saved.supplierId || payment.supplierId;
          payment.employeeId = saved.employeeId || payment.employeeId;
          payment.notes = saved.notes || payment.notes;
          await this.paymentRepository.save(payment);
        }
      } catch (err) {
        console.warn('[WorkCost→Payment] Sync update failed:', err?.message);
      }
    }

    return saved;
  }

  async removeWorkCost(id: string): Promise<void> {
    // Also soft-delete the linked payment
    const cost = await this.workCostRepository.findOne({ where: { id } });
    if (cost?.paymentId) {
      try {
        await this.paymentRepository.softDelete(cost.paymentId);
      } catch (err) {
        console.warn('[WorkCost→Payment] Sync delete failed:', err?.message);
      }
    }
    await this.workCostRepository.softDelete(id);
  }

  // ═══ PAYMENT SCHEDULES ═══════════════════════════════════════════════════

  async findAllPaymentSchedules(workId?: string): Promise<PaymentSchedule[]> {
    const where: any = {};
    if (workId) where.workId = workId;
    return this.paymentScheduleRepository.find({ where, relations: ['work', 'supplier', 'employee', 'payment'], order: { dueDate: 'ASC' } });
  }

  async findOnePaymentSchedule(id: string): Promise<PaymentSchedule> {
    const s = await this.paymentScheduleRepository.findOne({ where: { id }, relations: ['work', 'supplier', 'employee'] });
    if (!s) throw new NotFoundException('Programação não encontrada');
    return s;
  }

  async createPaymentSchedule(data: Partial<PaymentSchedule>): Promise<PaymentSchedule> { return this.paymentScheduleRepository.save(this.paymentScheduleRepository.create(data)); }
  async updatePaymentSchedule(id: string, data: Partial<PaymentSchedule>): Promise<PaymentSchedule> { const s = await this.findOnePaymentSchedule(id); Object.assign(s, data); return this.paymentScheduleRepository.save(s); }
  async removePaymentSchedule(id: string): Promise<void> { await this.paymentScheduleRepository.softDelete(id); }

  // ═══ PAYMENT RECEIPTS (RECIBOS) ══════════════════════════════════════════

  private async generateReceiptNumber(): Promise<string> {
    const [{ cnt }] = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM payment_receipts`);
    let num = Number(cnt) + 1;
    let number = `REC-${String(num).padStart(4, '0')}`;
    while (true) {
      const exists = await this.dataSource.query(`SELECT id FROM payment_receipts WHERE "receiptNumber" = $1 LIMIT 1`, [number]);
      if (exists.length === 0) break;
      num++;
      number = `REC-${String(num).padStart(4, '0')}`;
    }
    return number;
  }

  async findAllReceipts(proposalId?: string): Promise<PaymentReceipt[]> {
    const where: any = {};
    if (proposalId) where.proposalId = proposalId;
    return this.receiptRepo.find({ where, relations: ['client'], order: { createdAt: 'DESC' } });
  }

  async findOneReceipt(id: string): Promise<PaymentReceipt> {
    const r = await this.receiptRepo.findOne({ where: { id }, relations: ['client'] });
    if (!r) throw new NotFoundException('Recibo não encontrado');
    return r;
  }

  async createReceipt(data: Partial<PaymentReceipt>): Promise<PaymentReceipt> {
    const receiptNumber = await this.generateReceiptNumber();
    return this.receiptRepo.save(this.receiptRepo.create({ ...data, receiptNumber }));
  }

  async updateReceipt(id: string, data: Partial<PaymentReceipt>): Promise<PaymentReceipt> {
    const r = await this.findOneReceipt(id);
    Object.assign(r, data);
    return this.receiptRepo.save(r);
  }

  async removeReceipt(id: string): Promise<void> { await this.receiptRepo.softDelete(id); }

  // ═══ PURCHASE ORDERS (PEDIDOS DE COMPRA) ══════════════════════════════════

  private async generatePONumber(): Promise<string> {
    const [{ cnt }] = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM purchase_orders`);
    let num = Number(cnt) + 1;
    let number = `PC-${String(num).padStart(4, '0')}`;
    while (true) {
      const exists = await this.dataSource.query(`SELECT id FROM purchase_orders WHERE "orderNumber" = $1 LIMIT 1`, [number]);
      if (exists.length === 0) break;
      num++;
      number = `PC-${String(num).padStart(4, '0')}`;
    }
    return number;
  }

  async findAllPurchaseOrders(proposalId?: string, supplierId?: string): Promise<PurchaseOrder[]> {
    const where: any = {};
    if (proposalId) where.proposalId = proposalId;
    if (supplierId) where.supplierId = supplierId;
    return this.poRepo.find({ where, relations: ['supplier', 'client', 'items'], order: { createdAt: 'DESC' } });
  }

  async findOnePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({ where: { id }, relations: ['supplier', 'client', 'items'] });
    if (!po) throw new NotFoundException('Pedido de compra não encontrado');
    return po;
  }

  async createPurchaseOrder(data: any): Promise<PurchaseOrder> {
    const orderNumber = await this.generatePONumber();
    const { items, ...poData } = data;
    // Sanitize empty strings to null for UUID fields
    if (!poData.supplierId) poData.supplierId = null;
    if (!poData.clientId) poData.clientId = null;
    if (!poData.proposalId) poData.proposalId = null;
    if (poData.deliveryDate === '') poData.deliveryDate = null;
    const po = this.poRepo.create({ ...poData, orderNumber });
    const saved = await this.poRepo.save(po) as unknown as PurchaseOrder;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.description) continue; // skip empty items
        await this.poItemRepo.save(this.poItemRepo.create({ ...item, purchaseOrderId: saved.id }));
      }
    }
    return this.findOnePurchaseOrder(saved.id);
  }

  async updatePurchaseOrder(id: string, data: any): Promise<PurchaseOrder> {
    const po = await this.findOnePurchaseOrder(id);
    const { items, ...poData } = data;
    // Sanitize empty strings to null for UUID fields
    if (!poData.supplierId) poData.supplierId = null;
    if (!poData.clientId) poData.clientId = null;
    if (!poData.proposalId) poData.proposalId = null;
    if (poData.deliveryDate === '') poData.deliveryDate = null;
    Object.assign(po, poData);
    await this.poRepo.save(po);
    if (items && Array.isArray(items)) {
      await this.poItemRepo.delete({ purchaseOrderId: id });
      for (const item of items) {
        if (!item.description) continue; // skip empty items
        await this.poItemRepo.save(this.poItemRepo.create({ ...item, purchaseOrderId: id }));
      }
    }
    return this.findOnePurchaseOrder(id);
  }

  async removePurchaseOrder(id: string): Promise<void> { await this.poRepo.softDelete(id); }

  // ═══ PAYMENT INSTALLMENTS (PARCELAS) ═══════════════════════════════════════

  async getInstallments(paymentId: string): Promise<PaymentInstallment[]> {
    return this.installmentRepo.find({
      where: { paymentId },
      order: { installmentNumber: 'ASC' },
    });
  }

  async generateInstallments(
    paymentId: string,
    installments: Array<{ percentage: number; dueDate: string; description?: string }>,
  ): Promise<PaymentInstallment[]> {
    const payment = await this.findOne(paymentId);
    const totalAmount = Number(payment.amount);

    // Remove existing installments if regenerating
    await this.installmentRepo.delete({ paymentId });

    const totalInstallments = installments.length;
    const created: PaymentInstallment[] = [];

    for (let i = 0; i < installments.length; i++) {
      const inst = installments[i];
      const amount = parseFloat(((totalAmount * inst.percentage) / 100).toFixed(2));

      const installment = this.installmentRepo.create({
        paymentId,
        installmentNumber: i + 1,
        totalInstallments,
        description: inst.description || `Parcela ${i + 1}/${totalInstallments}`,
        amount,
        paidAmount: 0,
        dueDate: new Date(inst.dueDate),
        status: InstallmentStatus.PENDING,
      });
      created.push(await this.installmentRepo.save(installment));
    }

    return created;
  }

  async payInstallment(
    installmentId: string,
    amount: number,
    method: string,
    transactionId?: string,
  ): Promise<PaymentInstallment> {
    const installment = await this.installmentRepo.findOne({
      where: { id: installmentId },
      relations: ['payment'],
    });
    if (!installment) throw new NotFoundException('Parcela não encontrada');

    installment.paidAmount = Number(installment.paidAmount) + amount;
    if (installment.paidAmount >= Number(installment.amount)) {
      installment.status = InstallmentStatus.PAID;
    }
    installment.paidAt = new Date();
    installment.paymentMethod = method;
    if (transactionId) installment.transactionId = transactionId;
    const saved = await this.installmentRepo.save(installment);

    // Sync parent Payment status
    await this.syncPaymentFromInstallments(installment.paymentId);

    return saved;
  }

  async cancelInstallment(installmentId: string): Promise<void> {
    const installment = await this.installmentRepo.findOne({ where: { id: installmentId } });
    if (!installment) throw new NotFoundException('Parcela não encontrada');
    installment.status = InstallmentStatus.CANCELLED;
    await this.installmentRepo.save(installment);
    await this.syncPaymentFromInstallments(installment.paymentId);
  }

  async attachInstallmentReceipt(installmentId: string, filename: string, originalName: string): Promise<PaymentInstallment> {
    const inst = await this.installmentRepo.findOne({ where: { id: installmentId } });
    if (!inst) throw new NotFoundException('Parcela não encontrada');
    await this.installmentRepo.update(installmentId, { receiptFile: filename, receiptFileName: originalName });
    return this.installmentRepo.findOne({ where: { id: installmentId } });
  }

  async getInstallmentById(id: string): Promise<PaymentInstallment> {
    return this.installmentRepo.findOne({ where: { id } });
  }

  /** Sync parent Payment paidAmount + status from its installments */
  private async syncPaymentFromInstallments(paymentId: string): Promise<void> {
    const installments = await this.installmentRepo.find({ where: { paymentId } });
    if (installments.length === 0) return;

    const totalPaid = installments.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
    const activeInstallments = installments.filter(i => i.status !== InstallmentStatus.CANCELLED);
    const allPaid = activeInstallments.length > 0 && activeInstallments.every(i => i.status === InstallmentStatus.PAID);
    const somePaid = activeInstallments.some(i => i.status === InstallmentStatus.PAID);

    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) return;

    let newStatus = PaymentStatus.PENDING;
    if (allPaid) {
      newStatus = PaymentStatus.PAID;
    } else if (somePaid || totalPaid > 0) {
      newStatus = PaymentStatus.PARTIAL;
    }

    // Use update() to avoid cascade issues with installments relation
    await this.paymentRepository.update(paymentId, {
      paidAmount: totalPaid,
      status: newStatus,
      ...(allPaid ? { paidAt: new Date() } : {}),
    });
  }

  // ═══ CREATE FROM PROPOSAL / WORK ═══════════════════════════════════════════

  async createPaymentFromProposal(data: {
    proposalId: string;
    proposalNumber: string;
    clientId: string;
    description: string;
    totalAmount: number;
    workId?: string;
    installments: Array<{ percentage: number; dueDate: string; description?: string }>;
  }): Promise<Payment> {
    // Sanitize
    const clientId = data.clientId || null;
    const workId = data.workId || null;

    // Create parent payment
    const payment = Object.assign(new Payment(), {
      type: PaymentType.INCOME,
      description: data.description || `Proposta ${data.proposalNumber}`,
      amount: data.totalAmount,
      paidAmount: 0,
      status: PaymentStatus.PENDING,
      dueDate: data.installments.length > 0 ? new Date(data.installments[0].dueDate) : new Date(),
      clientId,
      workId,
      category: TransactionCategory.PROJECT,
    });

    // Save proposalId + proposalNumber via raw query since column may not be in entity yet
    const saved = await this.paymentRepository.save(payment);
    try {
      await this.dataSource.query(
        `UPDATE payments SET "proposalId" = $1, "proposalNumber" = $2 WHERE id = $3`,
        [data.proposalId, data.proposalNumber, saved.id],
      );
    } catch (err) {
      console.warn('Could not set proposalId/Number:', err?.message);
    }

    // Generate installments
    if (data.installments.length > 0) {
      await this.generateInstallments(saved.id, data.installments);
    }

    return this.findOne(saved.id);
  }

  async createPaymentFromWork(data: {
    workId: string;
    description: string;
    totalAmount: number;
    clientId?: string;
    installments: Array<{ percentage: number; dueDate: string; description?: string }>;
  }): Promise<Payment> {
    const payment = Object.assign(new Payment(), {
      type: PaymentType.INCOME,
      description: data.description,
      amount: data.totalAmount,
      paidAmount: 0,
      status: PaymentStatus.PENDING,
      dueDate: data.installments.length > 0 ? new Date(data.installments[0].dueDate) : new Date(),
      workId: data.workId,
      clientId: data.clientId || null,
      category: TransactionCategory.PROJECT,
    });
    const saved = await this.paymentRepository.save(payment);

    if (data.installments.length > 0) {
      await this.generateInstallments(saved.id, data.installments);
    }

    return this.findOne(saved.id);
  }

  // ═══ CHECK EXISTING PROPOSAL PAYMENT ═══
  async checkProposalPayment(proposalId: string): Promise<{ exists: boolean; payments: any[]; totalAmount: number; paidAmount: number }> {
    try {
      const rows = await this.dataSource.query(
        `SELECT id, description, amount, "paidAmount", status, "dueDate" FROM payments WHERE "proposalId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
        [proposalId],
      );
      const totalAmount = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const paidAmount = rows.reduce((s: number, r: any) => s + Number(r.paidAmount || 0), 0);
      return { exists: rows.length > 0, payments: rows, totalAmount, paidAmount };
    } catch {
      return { exists: false, payments: [], totalAmount: 0, paidAmount: 0 };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBTS — CRUD + Summary
  // ═══════════════════════════════════════════════════════════════════════════

  async getDebts(): Promise<Debt[]> {
    return this.debtRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createDebt(data: Partial<Debt>): Promise<Debt> {
    const debt = this.debtRepo.create(data);
    if (!debt.currentBalance) debt.currentBalance = Number(debt.originalAmount) || 0;
    return this.debtRepo.save(debt);
  }

  async updateDebt(id: string, data: Partial<Debt>): Promise<Debt> {
    await this.debtRepo.update(id, data as any);
    return this.debtRepo.findOneByOrFail({ id });
  }

  async deleteDebt(id: string): Promise<void> {
    await this.debtRepo.softDelete(id);
  }

  async addDebtPayment(debtId: string, data: Partial<DebtPayment>): Promise<DebtPayment> {
    const debt = await this.debtRepo.findOneByOrFail({ id: debtId });
    const payment = this.debtPaymentRepo.create({ ...data, debtId });
    const saved = await this.debtPaymentRepo.save(payment);
    // Update debt balance
    debt.totalPaid = Number(debt.totalPaid || 0) + Number(saved.amount || 0);
    debt.currentBalance = Number(debt.originalAmount || 0) - Number(debt.totalPaid || 0);
    debt.paidInstallments = (debt.paidInstallments || 0) + 1;
    if (debt.currentBalance <= 0) { debt.currentBalance = 0; debt.status = 'paid_off' as any; }
    await this.debtRepo.save(debt);
    return saved;
  }

  async getDebtPayments(debtId: string): Promise<DebtPayment[]> {
    return this.debtPaymentRepo.find({ where: { debtId }, order: { createdAt: 'DESC' } });
  }

  async getDebtSummary(): Promise<any> {
    const debts = await this.debtRepo.find({ where: { status: 'active' as any } });
    const totalOriginal = debts.reduce((s, d) => s + Number(d.originalAmount || 0), 0);
    const totalBalance = debts.reduce((s, d) => s + Number(d.currentBalance || 0), 0);
    const totalMonthly = debts.reduce((s, d) => s + Number(d.monthlyPayment || 0), 0);
    const totalPaid = debts.reduce((s, d) => s + Number(d.totalPaid || 0), 0);
    const byType: Record<string, { count: number; balance: number; monthly: number }> = {};
    const byNature: Record<string, { count: number; balance: number }> = {};
    debts.forEach(d => {
      const t = d.type || 'other';
      if (!byType[t]) byType[t] = { count: 0, balance: 0, monthly: 0 };
      byType[t].count++; byType[t].balance += Number(d.currentBalance || 0); byType[t].monthly += Number(d.monthlyPayment || 0);
      const n = d.nature || 'neutral';
      if (!byNature[n]) byNature[n] = { count: 0, balance: 0 };
      byNature[n].count++; byNature[n].balance += Number(d.currentBalance || 0);
    });
    return { totalDebts: debts.length, totalOriginal, totalBalance, totalPaid, totalMonthly, byType, byNature };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BANK RECONCILIATION
  // ═══════════════════════════════════════════════════════════════════════════

  async getStatements(bankAccountId?: string): Promise<BankStatement[]> {
    const where: any = {};
    if (bankAccountId) where.bankAccountId = bankAccountId;
    return this.statementRepo.find({ where, order: { referenceMonth: 'DESC' } });
  }

  async createStatement(data: { bankAccountId: string; referenceMonth: string; entries: Array<{ date: string; description: string; amount: number; entryType: string }>; openingBalance?: number; closingBalance?: number }): Promise<BankStatement> {
    const stmt = this.statementRepo.create({
      bankAccountId: data.bankAccountId,
      referenceMonth: data.referenceMonth,
      openingBalance: data.openingBalance || 0,
      closingBalance: data.closingBalance || 0,
      totalEntries: data.entries.length,
      status: StatementStatus.PENDING,
    });
    const saved = await this.statementRepo.save(stmt);
    let totalCredits = 0, totalDebits = 0;
    for (const e of data.entries) {
      const amt = Number(e.amount);
      if (e.entryType === 'credit' || amt > 0) totalCredits += Math.abs(amt);
      else totalDebits += Math.abs(amt);
      await this.statementEntryRepo.save(this.statementEntryRepo.create({
        statementId: saved.id, date: new Date(e.date), description: e.description,
        amount: amt, entryType: e.entryType || (amt >= 0 ? 'credit' : 'debit'),
        matchStatus: MatchStatus.UNMATCHED,
      }));
    }
    saved.totalCredits = totalCredits;
    saved.totalDebits = totalDebits;
    return this.statementRepo.save(saved);
  }

  async getStatementEntries(statementId: string): Promise<BankStatementEntry[]> {
    return this.statementEntryRepo.find({ where: { statementId }, order: { date: 'ASC' } });
  }

  async autoMatchStatement(statementId: string): Promise<{ matched: number; total: number }> {
    const entries = await this.statementEntryRepo.find({ where: { statementId, matchStatus: MatchStatus.UNMATCHED } });
    const payments = await this.paymentRepository.find({ where: { status: PaymentStatus.PAID } });
    let matched = 0;
    for (const entry of entries) {
      const amt = Math.abs(Number(entry.amount));
      // Try exact amount match within ±3 days
      const entryDate = new Date(entry.date).getTime();
      const candidate = payments.find(p => {
        const pAmt = Number(p.paidAmount || p.amount || 0);
        const pDate = p.paidAt ? new Date(p.paidAt).getTime() : 0;
        return Math.abs(pAmt - amt) < 0.01 && Math.abs(pDate - entryDate) < 3 * 86400000;
      });
      if (candidate) {
        entry.matchedPaymentId = candidate.id;
        entry.matchStatus = MatchStatus.MATCHED;
        entry.matchDifference = 0;
        await this.statementEntryRepo.save(entry);
        matched++;
      }
    }
    // Update statement matched count
    const stmt = await this.statementRepo.findOneByOrFail({ id: statementId });
    const allEntries = await this.statementEntryRepo.find({ where: { statementId } });
    stmt.matchedEntries = allEntries.filter(e => e.matchStatus === MatchStatus.MATCHED).length;
    if (stmt.matchedEntries === stmt.totalEntries) stmt.status = StatementStatus.RECONCILED;
    else if (stmt.matchedEntries > 0) stmt.status = StatementStatus.PARTIAL;
    await this.statementRepo.save(stmt);
    return { matched, total: entries.length };
  }

  async manualMatchEntry(entryId: string, paymentId: string): Promise<BankStatementEntry> {
    const entry = await this.statementEntryRepo.findOneByOrFail({ id: entryId });
    entry.matchedPaymentId = paymentId;
    entry.matchStatus = MatchStatus.MATCHED;
    const payment = await this.paymentRepository.findOneBy({ id: paymentId });
    if (payment) entry.matchDifference = Math.abs(Number(entry.amount)) - Number(payment.paidAmount || payment.amount || 0);
    await this.statementEntryRepo.save(entry);
    // Update statement
    const allEntries = await this.statementEntryRepo.find({ where: { statementId: entry.statementId } });
    const stmt = await this.statementRepo.findOneByOrFail({ id: entry.statementId });
    stmt.matchedEntries = allEntries.filter(e => e.matchStatus === MatchStatus.MATCHED).length;
    if (stmt.matchedEntries === stmt.totalEntries) stmt.status = StatementStatus.RECONCILED;
    else if (stmt.matchedEntries > 0) stmt.status = StatementStatus.PARTIAL;
    await this.statementRepo.save(stmt);
    return entry;
  }

  async unmatchEntry(entryId: string): Promise<BankStatementEntry> {
    const entry = await this.statementEntryRepo.findOneByOrFail({ id: entryId });
    entry.matchedPaymentId = null as any;
    entry.matchStatus = MatchStatus.UNMATCHED;
    entry.matchDifference = 0;
    return this.statementEntryRepo.save(entry);
  }

  async deleteStatement(id: string): Promise<void> {
    await this.statementRepo.softDelete(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CFO DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getCFODashboard(): Promise<any> {
    const now = new Date();
    const [bankAccounts, debts, allPayments] = await Promise.all([
      this.bankAccountRepo.find({ where: { isActive: true } }),
      this.debtRepo.find({ where: { status: 'active' as any } }),
      this.paymentRepository.find({ relations: ['client'] }),
    ]);

    // ── Cash Position ──
    const totalCash = bankAccounts.reduce((s, a) => s + Number(a.currentBalance || 0), 0);

    // ── Receivables Aging ──
    const receivables = allPayments.filter(p => p.type === PaymentType.INCOME && [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE].includes(p.status));
    const aging = [{ range: '0-30', amount: 0, count: 0 }, { range: '31-60', amount: 0, count: 0 }, { range: '61-90', amount: 0, count: 0 }, { range: '90+', amount: 0, count: 0 }];
    receivables.forEach(p => {
      const due = p.dueDate ? new Date(p.dueDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      const remaining = Number(p.amount || 0) - Number(p.paidAmount || 0);
      const bucket = daysOverdue <= 30 ? 0 : daysOverdue <= 60 ? 1 : daysOverdue <= 90 ? 2 : 3;
      aging[bucket].amount += remaining;
      aging[bucket].count++;
    });
    const totalReceivable = receivables.reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const overdueReceivable = receivables.filter(p => p.status === PaymentStatus.OVERDUE).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);

    // ── Payables ──
    const payables = allPayments.filter(p => p.type === PaymentType.EXPENSE && [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE].includes(p.status));
    const totalPayable = payables.reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const overduePayable = payables.filter(p => p.status === PaymentStatus.OVERDUE).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const next7Days = payables.filter(p => { const d = p.dueDate ? new Date(p.dueDate) : null; return d && d.getTime() - now.getTime() <= 7 * 86400000 && d >= now; }).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
    const next30Days = payables.filter(p => { const d = p.dueDate ? new Date(p.dueDate) : null; return d && d.getTime() - now.getTime() <= 30 * 86400000 && d >= now; }).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);

    // ── Debt ──
    const totalDebtBalance = debts.reduce((s, d) => s + Number(d.currentBalance || 0), 0);
    const totalDebtMonthly = debts.reduce((s, d) => s + Number(d.monthlyPayment || 0), 0);

    // ── Cash Flow Projection ──
    const project = (days: number) => {
      const cutoff = new Date(now.getTime() + days * 86400000);
      const inflow = receivables.filter(p => { const d = p.dueDate ? new Date(p.dueDate) : null; return d && d <= cutoff; }).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
      const outflow = payables.filter(p => { const d = p.dueDate ? new Date(p.dueDate) : null; return d && d <= cutoff; }).reduce((s, p) => s + Number(p.amount || 0) - Number(p.paidAmount || 0), 0);
      return totalCash + inflow - outflow - totalDebtMonthly * (days / 30);
    };

    // ── Tax Burden ──
    const incomePayments = allPayments.filter(p => p.type === PaymentType.INCOME);
    const totalISS = incomePayments.reduce((s, p) => s + Number((p as any).taxISSAmount || 0), 0);
    const totalINSS = incomePayments.reduce((s, p) => s + Number((p as any).inssAmount || 0), 0);
    const totalDAS = incomePayments.reduce((s, p) => s + Number((p as any).simplesAmount || 0), 0);
    const totalGrossIncome = incomePayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // ── KPIs ──
    const paidIncome = allPayments.filter(p => p.type === PaymentType.INCOME && p.status === PaymentStatus.PAID);
    const paidExpense = allPayments.filter(p => p.type === PaymentType.EXPENSE && p.status === PaymentStatus.PAID);
    const totalPaidIncome = paidIncome.reduce((s, p) => s + Number(p.paidAmount || 0), 0);
    const totalPaidExpense = paidExpense.reduce((s, p) => s + Number(p.paidAmount || 0), 0);

    // DSO: avg days to collect
    const dsoPayments = paidIncome.filter(p => p.dueDate && p.paidAt);
    const dso = dsoPayments.length > 0 ? dsoPayments.reduce((s, p) => s + Math.max(0, (new Date(p.paidAt!).getTime() - new Date(p.dueDate!).getTime()) / 86400000), 0) / dsoPayments.length : 0;
    // DPO: avg days to pay
    const dpoPayments = paidExpense.filter(p => p.dueDate && p.paidAt);
    const dpo = dpoPayments.length > 0 ? dpoPayments.reduce((s, p) => s + Math.max(0, (new Date(p.paidAt!).getTime() - new Date(p.dueDate!).getTime()) / 86400000), 0) / dpoPayments.length : 0;

    // Burn rate (avg monthly expense last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const recentExpenses = paidExpense.filter(p => p.paidAt && new Date(p.paidAt) >= sixMonthsAgo);
    const burnRate = recentExpenses.reduce((s, p) => s + Number(p.paidAmount || 0), 0) / 6;

    return {
      cashPosition: {
        bankBalances: bankAccounts.map(a => ({ id: a.id, name: a.name, bankName: a.bankName, balance: Number(a.currentBalance || 0) })),
        totalCash,
        availableCash: totalCash - totalDebtMonthly,
      },
      receivables: { current: totalReceivable - overdueReceivable, overdue: overdueReceivable, total: totalReceivable, aging },
      payables: { current: totalPayable - overduePayable, overdue: overduePayable, total: totalPayable, nextWeek: next7Days, next30Days },
      debt: { totalBalance: totalDebtBalance, monthlyPayment: totalDebtMonthly, activeCount: debts.length, debtToRevenueRatio: totalGrossIncome > 0 ? totalDebtBalance / totalGrossIncome : 0 },
      cashFlow: { projected30: project(30), projected60: project(60), projected90: project(90), burnRate },
      taxBurden: { totalDAS, totalISS, totalINSS, totalTax: totalDAS + totalISS + totalINSS, effectiveRate: totalGrossIncome > 0 ? ((totalDAS + totalISS + totalINSS) / totalGrossIncome * 100) : 0 },
      kpis: {
        liquidityRatio: totalPayable > 0 ? (totalCash + totalReceivable) / totalPayable : 999,
        dso: Math.round(dso),
        dpo: Math.round(dpo),
        cashConversionCycle: Math.round(dso - dpo),
        operatingMargin: totalPaidIncome > 0 ? ((totalPaidIncome - totalPaidExpense) / totalPaidIncome * 100) : 0,
        burnRate,
      },
    };
  }
}
