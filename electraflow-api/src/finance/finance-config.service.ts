import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DreCategory, DreCategoryType, DreCategorySignal, BankAccount, CostCenter, ChartOfAccounts, CashRegister, PaymentMethodConfig } from './finance-config.entity';

@Injectable()
export class FinanceConfigService {
  constructor(
    @InjectRepository(DreCategory) private dreRepo: Repository<DreCategory>,
    @InjectRepository(BankAccount) private bankRepo: Repository<BankAccount>,
    @InjectRepository(CostCenter) private costCenterRepo: Repository<CostCenter>,
    @InjectRepository(ChartOfAccounts) private chartRepo: Repository<ChartOfAccounts>,
    @InjectRepository(CashRegister) private cashRegRepo: Repository<CashRegister>,
    @InjectRepository(PaymentMethodConfig) private payMethodRepo: Repository<PaymentMethodConfig>,
  ) {}

  // ═══ DRE CATEGORIES ══════════════════════════════════════════
  async getDreCategories(): Promise<DreCategory[]> {
    return this.dreRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async getDreCategoriesTree(): Promise<any[]> {
    const all = await this.getDreCategories();
    const roots = all.filter(c => !c.parentId);
    return roots.map(root => ({
      ...root,
      children: all.filter(c => c.parentId === root.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async createDreCategory(data: Partial<DreCategory>): Promise<DreCategory> {
    return this.dreRepo.save(this.dreRepo.create(data));
  }

  async updateDreCategory(id: string, data: Partial<DreCategory>): Promise<DreCategory> {
    await this.dreRepo.update(id, data);
    return this.dreRepo.findOneBy({ id });
  }

  async deleteDreCategory(id: string): Promise<void> {
    const cat = await this.dreRepo.findOneBy({ id });
    if (cat?.isSystem) throw new Error('Categoria de sistema não pode ser removida');
    await this.dreRepo.softDelete(id);
  }

  async seedDefaultDreCategories(): Promise<void> {
    const count = await this.dreRepo.count();
    if (count > 0) return;

    const T = DreCategoryType;
    const S = DreCategorySignal;
    const cats: Array<{ name: string; type: DreCategoryType; signal: DreCategorySignal; children?: Array<{ name: string; signal: DreCategorySignal; transactionCategory?: string }> }> = [
      { name: 'Receita bruta', type: T.RECEITA, signal: S.PLUS, children: [
        { name: 'Receitas de vendas', signal: S.PLUS },
      ]},
      { name: 'Deduções', type: T.DESPESA, signal: S.MINUS, children: [
        { name: 'Impostos sobre vendas', signal: S.MINUS, transactionCategory: 'tax' },
        { name: 'Comissões sobre vendas', signal: S.MINUS },
        { name: 'Devolução de vendas', signal: S.MINUS },
      ]},
      { name: 'Receita líquida', type: T.TOTALIZADOR, signal: S.EQUALS },
      { name: 'Custos operacionais', type: T.DESPESA, signal: S.MINUS, children: [
        { name: 'Custo dos produtos vendidos', signal: S.MINUS, transactionCategory: 'materials' },
      ]},
      { name: 'Despesas operacionais', type: T.DESPESA, signal: S.MINUS, children: [
        { name: 'Despesas administrativas', signal: S.MINUS, transactionCategory: 'office' },
        { name: 'Despesas operacionais', signal: S.MINUS, transactionCategory: 'project' },
        { name: 'Despesas comerciais', signal: S.MINUS, transactionCategory: 'marketing' },
      ]},
      { name: 'Lucro operacional', type: T.TOTALIZADOR, signal: S.EQUALS },
      { name: 'Receitas financeiras', type: T.RECEITA, signal: S.PLUS, children: [
        { name: 'Rendimentos financeiros', signal: S.PLUS },
        { name: 'Juros/multas recebidos', signal: S.PLUS },
        { name: 'Descontos recebidos', signal: S.PLUS },
      ]},
      { name: 'Despesas financeiras', type: T.DESPESA, signal: S.MINUS, children: [
        { name: 'Empréstimos e dívidas', signal: S.MINUS },
        { name: 'Juros/multas pagos', signal: S.MINUS },
        { name: 'Descontos concedidos', signal: S.MINUS },
        { name: 'Taxas/tarifas bancárias', signal: S.MINUS },
      ]},
      { name: 'Outras receitas', type: T.RECEITA, signal: S.PLUS, children: [
        { name: 'Outras receitas', signal: S.PLUS, transactionCategory: 'other' },
      ]},
      { name: 'Outras despesas', type: T.DESPESA, signal: S.MINUS, children: [
        { name: 'Outras despesas', signal: S.MINUS, transactionCategory: 'other' },
      ]},
      { name: 'Lucro/prejuízo', type: T.TOTALIZADOR, signal: S.EQUALS },
    ];

    let order = 0;
    for (const cat of cats) {
      const parent = await this.dreRepo.save(this.dreRepo.create({
        name: cat.name, type: cat.type, signal: cat.signal,
        sortOrder: order++, isSystem: true, isActive: true,
      }));
      if (cat.children) {
        let childOrder = 0;
        for (const child of cat.children) {
          await this.dreRepo.save(this.dreRepo.create({
            name: child.name, type: cat.type === T.TOTALIZADOR ? T.DESPESA : cat.type,
            signal: child.signal, parentId: parent.id,
            sortOrder: childOrder++, isSystem: false, isActive: true,
            transactionCategory: child.transactionCategory,
          }));
        }
      }
    }
  }

  // ═══ BANK ACCOUNTS ═══════════════════════════════════════════
  async getBankAccounts(): Promise<BankAccount[]> {
    return this.bankRepo.find({ order: { name: 'ASC' } });
  }
  async createBankAccount(data: Partial<BankAccount>): Promise<BankAccount> {
    return this.bankRepo.save(this.bankRepo.create(data));
  }
  async updateBankAccount(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
    await this.bankRepo.update(id, data);
    return this.bankRepo.findOneBy({ id });
  }
  async deleteBankAccount(id: string): Promise<void> { await this.bankRepo.softDelete(id); }

  // ═══ COST CENTERS ════════════════════════════════════════════
  async getCostCenters(): Promise<CostCenter[]> {
    return this.costCenterRepo.find({ order: { name: 'ASC' } });
  }
  async createCostCenter(data: Partial<CostCenter>): Promise<CostCenter> {
    return this.costCenterRepo.save(this.costCenterRepo.create(data));
  }
  async updateCostCenter(id: string, data: Partial<CostCenter>): Promise<CostCenter> {
    await this.costCenterRepo.update(id, data);
    return this.costCenterRepo.findOneBy({ id });
  }
  async deleteCostCenter(id: string): Promise<void> { await this.costCenterRepo.softDelete(id); }

  // ═══ CHART OF ACCOUNTS ══════════════════════════════════════
  async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    return this.chartRepo.find({ order: { code: 'ASC' } });
  }
  async createChartAccount(data: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    return this.chartRepo.save(this.chartRepo.create(data));
  }
  async updateChartAccount(id: string, data: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    await this.chartRepo.update(id, data);
    return this.chartRepo.findOneBy({ id });
  }
  async deleteChartAccount(id: string): Promise<void> { await this.chartRepo.softDelete(id); }

  // ═══ CASH REGISTERS ═════════════════════════════════════════
  async getCashRegisters(): Promise<CashRegister[]> {
    return this.cashRegRepo.find({ order: { name: 'ASC' } });
  }
  async createCashRegister(data: Partial<CashRegister>): Promise<CashRegister> {
    return this.cashRegRepo.save(this.cashRegRepo.create(data));
  }
  async updateCashRegister(id: string, data: Partial<CashRegister>): Promise<CashRegister> {
    await this.cashRegRepo.update(id, data);
    return this.cashRegRepo.findOneBy({ id });
  }
  async deleteCashRegister(id: string): Promise<void> { await this.cashRegRepo.softDelete(id); }

  // ═══ PAYMENT METHODS ════════════════════════════════════════
  async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
    return this.payMethodRepo.find({ order: { name: 'ASC' } });
  }
  async createPaymentMethod(data: Partial<PaymentMethodConfig>): Promise<PaymentMethodConfig> {
    return this.payMethodRepo.save(this.payMethodRepo.create(data));
  }
  async updatePaymentMethod(id: string, data: Partial<PaymentMethodConfig>): Promise<PaymentMethodConfig> {
    await this.payMethodRepo.update(id, data);
    return this.payMethodRepo.findOneBy({ id });
  }
  async deletePaymentMethod(id: string): Promise<void> { await this.payMethodRepo.softDelete(id); }
}
