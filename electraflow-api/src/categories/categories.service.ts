import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SystemCategory } from './category.entity';

// ══════════════════════════════════════════════════════════════════
// SEED DATA — Categorias padrão do sistema
// ══════════════════════════════════════════════════════════════════
const SEED: Record<string, Array<{ value: string; label: string }>> = {
  document_type: [
    { value: 'contract', label: 'Contrato' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'report', label: 'Relatório' },
    { value: 'certificate', label: 'Certificado' },
    { value: 'invoice', label: 'Nota Fiscal' },
    { value: 'receipt', label: 'Recibo' },
  ],
  document_purpose: [
    { value: 'internal', label: 'Uso Interno' },
    { value: 'client', label: 'Envio ao Cliente' },
    { value: 'legal', label: 'Jurídico / Compliance' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'technical', label: 'Técnico' },
  ],
  lead_source: [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Indicação' },
    { value: 'social_media', label: 'Redes Sociais' },
    { value: 'cold_call', label: 'Prospecção Ativa' },
    { value: 'partner', label: 'Parceiro' },
    { value: 'event', label: 'Evento' },
  ],
  contract_type: [
    { value: 'prestacao_servico', label: 'Prestação de Serviço' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'locacao', label: 'Locação' },
    { value: 'fornecimento', label: 'Fornecimento' },
  ],
  employee_doc_type: [
    { value: 'rg', label: 'RG' },
    { value: 'cpf', label: 'CPF' },
    { value: 'ctps', label: 'CTPS' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'aso', label: 'ASO' },
    { value: 'nr10', label: 'NR-10' },
    { value: 'nr35', label: 'NR-35' },
  ],
  financial_category: [
    { value: 'service', label: 'Serviço' },
    { value: 'product', label: 'Produto' },
    { value: 'rental', label: 'Locação' },
    { value: 'commission', label: 'Comissão' },
    { value: 'tax', label: 'Imposto' },
  ],
  financial_origin: [
    { value: 'proposta', label: 'Proposta' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'avulso', label: 'Avulso' },
    { value: 'recorrente', label: 'Recorrente' },
  ],
  debt_type: [
    { value: 'supplier', label: 'Fornecedor' },
    { value: 'tax', label: 'Imposto' },
    { value: 'loan', label: 'Empréstimo' },
    { value: 'payroll', label: 'Folha' },
    { value: 'rent', label: 'Aluguel' },
    { value: 'utility', label: 'Utilidade' },
  ],
  property_type: [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'misto', label: 'Misto' },
    { value: 'condominio', label: 'Condomínio' },
    { value: 'predio_publico', label: 'Prédio Público' },
    { value: 'rural', label: 'Rural' },
  ],
  laudo_purpose: [
    { value: 'conformidade', label: 'Laudo de conformidade (NR-10 / NBR 5410)' },
    { value: 'seguro', label: 'Laudo para seguro' },
    { value: 'habite_se', label: 'Laudo para habite-se / AVCB' },
    { value: 'aumento_carga', label: 'Laudo para aumento de carga' },
    { value: 'financiamento', label: 'Laudo para financiamento' },
    { value: 'reforma', label: 'Reforma / modernização' },
    { value: 'manutencao', label: 'Manutenção preventiva' },
    { value: 'investigacao', label: 'Investigação de problema' },
  ],
  expense_type: [
    { value: 'material', label: 'Material' },
    { value: 'mao_obra', label: 'Mão de Obra' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'hospedagem', label: 'Hospedagem' },
    { value: 'equipamento', label: 'Equipamento' },
  ],
  service_type: [
    { value: 'instalacao', label: 'Instalação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'reparo', label: 'Reparo' },
    { value: 'inspecao', label: 'Inspeção' },
    { value: 'consultoria', label: 'Consultoria' },
    { value: 'projeto', label: 'Projeto' },
  ],
  voltage_supply: [
    { value: '127_220v_mono', label: '127/220V (Monofásico)' },
    { value: '220_380v_tri', label: '220/380V (Trifásico)' },
    { value: '13_8kv', label: '13.8kV' },
    { value: '34_5kv', label: '34.5kV' },
    { value: '69kv', label: '69kV' },
    { value: '138kv', label: '138kV' },
  ],
  tariff_modality: [
    { value: 'convencional_b', label: 'Convencional (B)' },
    { value: 'horossazonal_verde', label: 'Horossazonal Verde (A)' },
    { value: 'horossazonal_azul', label: 'Horossazonal Azul (A)' },
  ],
  approval_type: [
    { value: 'nao', label: 'Não, decide na hora' },
    { value: 'diretoria', label: 'Sim, precisa de diretoria' },
    { value: 'licitacao', label: 'Licitação / processo formal' },
  ],
};

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(SystemCategory) private catRepo: Repository<SystemCategory>,
    private dataSource: DataSource,
  ) {}

  // ═══ AUTO-MIGRATION ═════════════════════════════════════════════
  async onModuleInit() {
    // 1. Criar tabela se não existir
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS system_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "group" VARCHAR NOT NULL,
          value VARCHAR NOT NULL,
          label VARCHAR NOT NULL,
          config TEXT DEFAULT '{}',
          "order" INT DEFAULT 0,
          active BOOLEAN DEFAULT true,
          "createdBy" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      this.logger.log('✅ Tabela system_categories verificada/criada');
    } catch (e) {
      this.logger.warn('⚠️ Erro ao criar tabela system_categories: ' + e?.message);
    }

    // 2. Garantir índices
    const indexes = [
      { name: 'idx_syscat_group', col: '"group"' },
      { name: 'idx_syscat_group_value', cols: '"group", value', unique: true },
    ];
    for (const idx of indexes) {
      try {
        const unique = (idx as any).unique ? 'UNIQUE' : '';
        const cols = (idx as any).cols || (idx as any).col;
        await this.dataSource.query(
          `CREATE ${unique} INDEX IF NOT EXISTS ${idx.name} ON system_categories (${cols})`,
        );
      } catch { /* índice pode já existir */ }
    }

    // 3. Seed — popular categorias padrão (apenas se grupo estiver vazio)
    await this.runSeed();
  }

  private async runSeed() {
    for (const [group, items] of Object.entries(SEED)) {
      try {
        const count = await this.catRepo.count({ where: { group } });
        if (count > 0) continue; // grupo já possui dados

        const entities = items.map((item, idx) =>
          this.catRepo.create({
            group,
            value: item.value,
            label: item.label,
            order: idx,
            active: true,
          }),
        );
        await this.catRepo.save(entities);
        this.logger.log(`✅ Seed: ${items.length} categorias criadas para "${group}"`);
      } catch (e) {
        this.logger.warn(`⚠️ Erro ao popular seed do grupo "${group}": ${e?.message}`);
      }
    }
  }

  // ═══ QUERIES ════════════════════════════════════════════════════
  async findByGroup(group: string): Promise<SystemCategory[]> {
    return this.catRepo.find({
      where: { group, active: true },
      order: { order: 'ASC', label: 'ASC' },
    });
  }

  async findAll(): Promise<SystemCategory[]> {
    return this.catRepo.find({
      order: { group: 'ASC', order: 'ASC', label: 'ASC' },
    });
  }

  // ═══ CRUD ═══════════════════════════════════════════════════════
  async create(data: {
    group: string;
    value?: string;
    label: string;
    config?: string;
    createdBy?: string;
  }): Promise<SystemCategory> {
    const value = data.value || this.slugify(data.label);

    const entity = this.catRepo.create({
      group: data.group,
      value,
      label: data.label,
      config: data.config || '{}',
      createdBy: data.createdBy,
    });
    return this.catRepo.save(entity);
  }

  async update(
    id: string,
    data: Partial<Pick<SystemCategory, 'label' | 'config' | 'order'>>,
  ): Promise<SystemCategory> {
    const cat = await this.catRepo.findOneBy({ id });
    if (!cat) throw new NotFoundException('Categoria não encontrada');

    await this.catRepo.update(id, data);
    return this.catRepo.findOneBy({ id });
  }

  async toggleActive(id: string): Promise<SystemCategory> {
    const cat = await this.catRepo.findOneBy({ id });
    if (!cat) throw new NotFoundException('Categoria não encontrada');

    await this.catRepo.update(id, { active: !cat.active });
    return this.catRepo.findOneBy({ id });
  }

  // ═══ HELPERS ════════════════════════════════════════════════════
  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')           // espaços → underscores
      .replace(/[^a-z0-9_]/g, '');    // remove caracteres especiais
  }
}
