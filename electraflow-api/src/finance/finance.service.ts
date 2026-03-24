import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, TransactionCategory } from './payment.entity';
import { WorkCost } from './work-cost.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { PaymentReceipt } from './payment-receipt.entity';
import { PurchaseOrder, PurchaseOrderItem } from './purchase-order.entity';

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
    } catch (e) { console.warn('Finance tables migration:', e?.message); }
  }

  // ═══ PAYMENTS ═══════════════════════════════════════════════════════════

  async findAll(status?: PaymentStatus, workId?: string): Promise<Payment[]> {
    const where: any = {};
    if (status) where.status = status;
    if (workId) where.workId = workId;
    return this.paymentRepository.find({
      where,
      relations: ['work', 'work.client', 'supplier', 'employee'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['work', 'supplier', 'employee'],
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async update(id: string, paymentData: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, paymentData);
    return this.paymentRepository.save(payment);
  }

  async registerPayment(id: string, amount: number, method: string, transactionId?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.paidAmount += amount;
    if (payment.paidAmount >= payment.amount) {
      payment.status = PaymentStatus.PAID;
    } else {
      payment.status = PaymentStatus.PARTIAL;
    }
    payment.paidAt = new Date();
    payment.paymentMethod = method as any;
    if (transactionId) payment.transactionId = transactionId;
    return this.paymentRepository.save(payment);
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
    const report: any = { income: {}, expense: {}, totalIncome: 0, totalExpense: 0, revenue: 0, taxes: 0, netRevenue: 0, netProfit: 0, netResult: 0 };
    transactions.forEach(t => {
      const category = t.category || TransactionCategory.OTHER;
      const amount = Number(t.paidAmount || 0);
      const typeKey = t.type === PaymentType.INCOME ? 'income' : 'expense';
      report[typeKey][category] = (report[typeKey][category] || 0) + amount;
      if (t.type === PaymentType.INCOME) { report.totalIncome += amount; report.revenue += amount; }
      else { report.totalExpense += amount; if (category === TransactionCategory.TAX) report.taxes += amount; }
    });
    report.netRevenue = report.revenue - report.taxes;
    report.netProfit = report.totalIncome - report.totalExpense;
    report.netResult = report.netProfit;
    return report;
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

  async createWorkCost(data: Partial<WorkCost>): Promise<WorkCost> { return this.workCostRepository.save(this.workCostRepository.create(data)); }
  async updateWorkCost(id: string, data: Partial<WorkCost>): Promise<WorkCost> { const c = await this.findOneWorkCost(id); Object.assign(c, data); return this.workCostRepository.save(c); }
  async removeWorkCost(id: string): Promise<void> { await this.workCostRepository.softDelete(id); }

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
}
