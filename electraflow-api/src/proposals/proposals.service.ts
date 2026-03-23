import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, DataSource } from 'typeorm';
import { Proposal, ProposalItem, ProposalStatus } from './proposal.entity';
import { ProposalRevision } from './proposal-revision.entity';
import { Work } from '../works/work.entity';
import { Notification } from '../notifications/notification.entity';

@Injectable()
export class ProposalsService implements OnModuleInit {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(ProposalItem)
    private itemRepository: Repository<ProposalItem>,
    @InjectRepository(ProposalRevision)
    private revisionRepository: Repository<ProposalRevision>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {
    // ═══ Ensure proposal_revisions table exists ═══
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS proposal_revisions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "proposalId" UUID NOT NULL,
          "revisionNumber" INT DEFAULT 1,
          "snapshotData" TEXT,
          "changeDescription" VARCHAR,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP
        )
      `);
      this.logger.log('Table proposal_revisions ensured');
    } catch (err) {
      this.logger.warn('Could not create proposal_revisions: ' + err?.message);
    }

    // ═══ Safe column migration ═══
    const columnsToEnsure = [
      // proposals: signature
      { col: 'signatureToken', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'signatureTokenExpiresAt', type: 'TIMESTAMP DEFAULT NULL', table: 'proposals' },
      { col: 'signedAt', type: 'TIMESTAMP DEFAULT NULL', table: 'proposals' },
      { col: 'signedByName', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'signedByDocument', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'signedByIP', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'signedByUserAgent', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'signatureVerificationCode', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      // proposals: revision & audit
      { col: 'revisionNumber', type: 'INT DEFAULT 1', table: 'proposals' },
      { col: 'createdById', type: 'UUID DEFAULT NULL', table: 'proposals' },
      { col: 'updatedById', type: 'UUID DEFAULT NULL', table: 'proposals' },
      // proposals: item visibility
      { col: 'itemVisibilityMode', type: "VARCHAR DEFAULT 'detailed'", table: 'proposals' },
      { col: 'materialSummaryText', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'serviceSummaryText', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'summaryTotalLabel', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      // proposals: contract
      { col: 'workDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'workAddress', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'materialFornecimento', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'materialFaturamento', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'serviceDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'paymentBank', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'paymentDueCondition', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'workDeadlineDays', type: 'INT DEFAULT NULL', table: 'proposals' },
      { col: 'contractorObligations', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'clientObligations', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'generalProvisions', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'activityType', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'workDeadlineType', type: "VARCHAR DEFAULT 'calendar_days'", table: 'proposals' },
      { col: 'workDeadlineText', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'objectiveType', type: 'VARCHAR DEFAULT NULL', table: 'proposals' },
      { col: 'objectiveText', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'thirdPartyDeadlines', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'simulationData', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      // proposals: costs
      { col: 'logisticsCostValue', type: 'numeric(15,2) DEFAULT NULL', table: 'proposals' },
      { col: 'logisticsCostMode', type: "VARCHAR DEFAULT 'visible'", table: 'proposals' },
      { col: 'logisticsCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'logisticsCostApplyTo', type: "VARCHAR DEFAULT 'material'", table: 'proposals' },
      { col: 'logisticsCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'logisticsCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'logisticsCostDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'adminCostValue', type: 'numeric(15,2) DEFAULT NULL', table: 'proposals' },
      { col: 'adminCostMode', type: "VARCHAR DEFAULT 'visible'", table: 'proposals' },
      { col: 'adminCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'adminCostApplyTo', type: "VARCHAR DEFAULT 'material'", table: 'proposals' },
      { col: 'adminCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'adminCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'adminCostDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'brokerageCostValue', type: 'numeric(15,2) DEFAULT NULL', table: 'proposals' },
      { col: 'brokerageCostMode', type: "VARCHAR DEFAULT 'visible'", table: 'proposals' },
      { col: 'brokerageCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'brokerageCostApplyTo', type: "VARCHAR DEFAULT 'material'", table: 'proposals' },
      { col: 'brokerageCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'brokerageCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'brokerageCostDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'insuranceCostValue', type: 'numeric(15,2) DEFAULT NULL', table: 'proposals' },
      { col: 'insuranceCostMode', type: "VARCHAR DEFAULT 'visible'", table: 'proposals' },
      { col: 'insuranceCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'insuranceCostApplyTo', type: "VARCHAR DEFAULT 'material'", table: 'proposals' },
      { col: 'insuranceCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'insuranceCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'insuranceCostDescription', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      { col: 'complianceText', type: 'TEXT DEFAULT NULL', table: 'proposals' },
      // proposal_items
      { col: 'overridePrice', type: 'numeric(15,2) DEFAULT NULL', table: 'proposal_items' },
      { col: 'isBundleParent', type: 'BOOLEAN DEFAULT false', table: 'proposal_items' },
      { col: 'parentId', type: 'UUID DEFAULT NULL', table: 'proposal_items' },
      { col: 'showDetailedPrices', type: 'BOOLEAN DEFAULT true', table: 'proposal_items' },
      { col: 'isSuggested', type: 'BOOLEAN DEFAULT false', table: 'proposal_items' },
      { col: 'suggestedByRule', type: 'VARCHAR DEFAULT NULL', table: 'proposal_items' },
      { col: 'sortOrder', type: 'INT DEFAULT 0', table: 'proposal_items' },
      { col: 'notes', type: 'TEXT DEFAULT NULL', table: 'proposal_items' },
      { col: 'unit', type: 'VARCHAR DEFAULT NULL', table: 'proposal_items' },
      { col: 'deletedAt', type: 'TIMESTAMP DEFAULT NULL', table: 'proposal_items' },
    ];
    for (const { col, type, table } of columnsToEnsure) {
      try {
        await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      } catch (err) {
        this.logger.warn(`Could not add column ${col} on ${table}: ${err?.message}`);
      }
    }
    this.logger.log('Proposal columns migration completed');

    // Convert quantity from INTEGER to DECIMAL (fixes "invalid input syntax for type integer: 3.333")
    try {
      await this.dataSource.query(`ALTER TABLE proposal_items ALTER COLUMN quantity TYPE numeric(15,4) USING quantity::numeric`);
      this.logger.log('proposal_items.quantity converted to decimal');
    } catch (err) {
      // Already converted or other non-critical error
      this.logger.warn('quantity column conversion: ' + err?.message);
    }
  }

  async findAll(status?: ProposalStatus): Promise<Proposal[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.proposalRepository.find({
      where,
      relations: ['client', 'opportunity', 'opportunity.client', 'items', 'createdByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithDeleted(): Promise<Proposal[]> {
    return this.proposalRepository.find({
      withDeleted: true,
      relations: ['client', 'opportunity', 'opportunity.client', 'items', 'createdByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['client', 'opportunity', 'items'],
    });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    return proposal;
  }

  async diagnoseSchema() {
    const proposalCols = await this.dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'proposals' ORDER BY ordinal_position
    `);
    const itemCols = await this.dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'proposal_items' ORDER BY ordinal_position
    `);
    return {
      proposals_columns: proposalCols.map((c: any) => c.column_name),
      proposal_items_columns: itemCols.map((c: any) => c.column_name),
    };
  }

  private async generateProposalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}-`;

    // MUST include soft-deleted proposals to avoid duplicate key on unique proposalNumber
    const lastProposal = await this.proposalRepository
      .createQueryBuilder('p')
      .withDeleted()
      .where('p.proposalNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.proposalNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastProposal) {
      const lastNumber = parseInt(lastProposal.proposalNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  async create(proposalData: Partial<Proposal>, items: Partial<ProposalItem>[]): Promise<Proposal> {
    // Step 1: Strip only known safe fields to avoid unknown column errors
    const safeFields: Record<string, any> = {};
    const knownFields = [
      'title', 'clientId', 'opportunityId', 'status', 'subtotal', 'discount', 'total',
      'validUntil', 'scope', 'deadline', 'paymentConditions', 'obligations', 'notes',
      'rejectionReason', 'workDescription', 'workAddress', 'materialFornecimento',
      'materialFaturamento', 'serviceDescription', 'paymentBank', 'paymentDueCondition',
      'workDeadlineDays', 'workDeadlineType', 'workDeadlineText', 'objectiveType', 'objectiveText', 'thirdPartyDeadlines',
      'contractorObligations', 'clientObligations', 'generalProvisions',
      'activityType', 'itemVisibilityMode', 'materialSummaryText', 'serviceSummaryText',
      'summaryTotalLabel', 'logisticsCostValue', 'logisticsCostMode', 'logisticsCostPercent',
      'logisticsCostApplyTo', 'logisticsCostEmbedMaterialPct', 'logisticsCostEmbedServicePct',
      'logisticsCostDescription', 'adminCostValue', 'adminCostMode', 'adminCostPercent',
      'adminCostApplyTo', 'adminCostEmbedMaterialPct', 'adminCostEmbedServicePct',
      'adminCostDescription', 'brokerageCostValue', 'brokerageCostMode', 'brokerageCostPercent',
      'brokerageCostApplyTo', 'brokerageCostEmbedMaterialPct', 'brokerageCostEmbedServicePct',
      'brokerageCostDescription', 'insuranceCostValue', 'insuranceCostMode', 'insuranceCostPercent',
      'insuranceCostApplyTo', 'insuranceCostEmbedMaterialPct', 'insuranceCostEmbedServicePct',
      'insuranceCostDescription', 'complianceText', 'simulationData', 'createdById', 'updatedById',
      'revisionNumber',
    ];
    for (const key of knownFields) {
      if (key in proposalData) {
        safeFields[key] = (proposalData as any)[key];
      }
    }

    this.logger.log(`CREATE PROPOSAL — Step 1: Safe fields extracted: ${Object.keys(safeFields).join(', ')}`);

    const proposal = this.proposalRepository.create(safeFields as Partial<Proposal>);
    proposal.proposalNumber = await this.generateProposalNumber();
    proposal.revisionNumber = 1;

    // Calculate totals from items
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 1);
        return sum + itemTotal;
      }, 0);
      proposal.subtotal = subtotal;
      proposal.total = subtotal - Number(proposal.discount || 0);
    }

    this.logger.log(`CREATE PROPOSAL — Step 2: Saving proposal (number: ${proposal.proposalNumber})`);

    let saved: Proposal;
    try {
      saved = await this.proposalRepository.save(proposal);
    } catch (saveErr: any) {
      this.logger.error(`CREATE PROPOSAL SAVE FAILED: ${saveErr?.message}`);
      this.logger.error(`CREATE PROPOSAL DETAIL: ${saveErr?.detail || saveErr?.driverError?.detail}`);
      throw new BadRequestException('Erro ao salvar proposta: ' + (saveErr?.message || 'DB error'));
    }

    this.logger.log(`CREATE PROPOSAL — Step 3: Saving ${items?.length || 0} items for proposal ${saved.id}`);

    try {
      await this.saveProposalItems(saved.id, items);
    } catch (itemErr: any) {
      this.logger.error(`CREATE PROPOSAL ITEMS FAILED: ${itemErr?.message}`);
      this.logger.error(`CREATE PROPOSAL ITEMS DETAIL: ${itemErr?.detail || itemErr?.driverError?.detail}`);
      throw new BadRequestException('Erro ao salvar itens: ' + (itemErr?.message || 'DB error'));
    }

    this.logger.log(`CREATE PROPOSAL — Step 4: Done! Returning proposal ${saved.id}`);
    return this.findOne(saved.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // Snapshot helper — captura o estado atual para revisão
  // ═══════════════════════════════════════════════════════════════
  private createSnapshot(proposal: Proposal): string {
    const snapshot = {
      title: proposal.title,
      clientId: proposal.clientId,
      opportunityId: proposal.opportunityId,
      status: proposal.status,
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      total: proposal.total,
      validUntil: proposal.validUntil,
      scope: proposal.scope,
      deadline: proposal.deadline,
      paymentConditions: proposal.paymentConditions,
      obligations: proposal.obligations,
      notes: proposal.notes,
      workDescription: proposal.workDescription,
      workAddress: proposal.workAddress,
      workDeadlineDays: proposal.workDeadlineDays,
      workDeadlineType: proposal.workDeadlineType,
      workDeadlineText: proposal.workDeadlineText,
      objectiveType: proposal.objectiveType,
      objectiveText: proposal.objectiveText,
      thirdPartyDeadlines: proposal.thirdPartyDeadlines,
      paymentBank: proposal.paymentBank,
      activityType: proposal.activityType,
      contractorObligations: proposal.contractorObligations,
      clientObligations: proposal.clientObligations,
      generalProvisions: proposal.generalProvisions,
      serviceDescription: proposal.serviceDescription,
      materialFornecimento: proposal.materialFornecimento,
      paymentDueCondition: proposal.paymentDueCondition,
      itemVisibilityMode: proposal.itemVisibilityMode,
      materialSummaryText: proposal.materialSummaryText,
      serviceSummaryText: proposal.serviceSummaryText,
      summaryTotalLabel: proposal.summaryTotalLabel,
      logisticsCostValue: proposal.logisticsCostValue,
      logisticsCostMode: proposal.logisticsCostMode,
      adminCostValue: proposal.adminCostValue,
      adminCostMode: proposal.adminCostMode,
      brokerageCostValue: proposal.brokerageCostValue,
      brokerageCostMode: proposal.brokerageCostMode,
      insuranceCostValue: proposal.insuranceCostValue,
      insuranceCostMode: proposal.insuranceCostMode,
      complianceText: proposal.complianceText,
      items: (proposal.items || []).map(item => ({
        description: item.description,
        serviceType: item.serviceType,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
        unit: item.unit,
        isBundleParent: item.isBundleParent,
        parentId: item.parentId,
        showDetailedPrices: item.showDetailedPrices,
        overridePrice: item.overridePrice,
        notes: item.notes,
      })),
    };
    return JSON.stringify(snapshot);
  }

  async update(id: string, proposalData: Partial<Proposal>): Promise<Proposal> {
    const proposal = await this.findOne(id);

    // ── Salvar snapshot da versão atual como revisão ──
    try {
      const revision = this.revisionRepository.create({
        proposalId: id,
        revisionNumber: proposal.revisionNumber || 1,
        snapshotData: this.createSnapshot(proposal),
      });
      await this.revisionRepository.save(revision);
    } catch (revErr) {
      this.logger.warn('Could not save revision snapshot: ' + revErr?.message);
    }

    // ── Incrementar número de revisão ──
    const newRevisionNumber = (proposal.revisionNumber || 1) + 1;

    // ── Aplicar alterações ──
    // Remover campos que não devem ser sobrescritos
    const { id: _id, proposalNumber: _pn, createdAt: _ca, updatedAt: _ua, deletedAt: _da, revisionNumber: _rn, items: _items, client: _cl, opportunity: _op, revisions: _rev, fiscalInvoices: _fi, ...safeData } = proposalData as any;

    Object.assign(proposal, safeData);
    proposal.revisionNumber = newRevisionNumber;

    try {
      return await this.proposalRepository.save(proposal);
    } catch (saveErr: any) {
      // If save fails due to unknown column, log and retry with safe fields only
      this.logger.error('Error saving proposal: ' + saveErr?.message);
      throw saveErr;
    }
  }

  async updateItems(id: string, items: Partial<ProposalItem>[]): Promise<Proposal> {
    // ── HARD DELETE itens antigos (evita conflito de UUID com soft-deleted) ──
    await this.itemRepository
      .createQueryBuilder()
      .delete()
      .from(ProposalItem)
      .where('"proposalId" = :id', { id })
      .execute();

    // ── Salvar novos itens ──
    await this.saveProposalItems(id, items);

    // ── Recalcular totais usando query direta (evita cascade sobrescrever itens) ──
    const freshProposal = await this.findOne(id);
    const subtotal = freshProposal.items.reduce((sum, item) => sum + Number(item.total), 0);
    const total = subtotal - Number(freshProposal.discount || 0);

    await this.proposalRepository
      .createQueryBuilder()
      .update(Proposal)
      .set({ subtotal, total })
      .where('id = :id', { id })
      .execute();

    return this.findOne(id);
  }

  async send(id: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.SENT;
    proposal.sentAt = new Date();
    return this.proposalRepository.save(proposal);
  }

  async accept(id: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.ACCEPTED;
    proposal.acceptedAt = new Date();
    const saved = await this.proposalRepository.save(proposal);

    // ── AUTO-TRIGGER: Create Work from accepted proposal ──────────
    try {
      const activityTypeMap: Record<string, string> = {
        extensao_rede: 'network_work', energia_solar: 'solar',
        instalacao_eletrica: 'residential', projeto_eletrico: 'project_bt',
        manutencao: 'maintenance', laudo: 'report', spda: 'spda',
        aterramento: 'grounding', pde: 'pde_bt',
      };

      const year = new Date().getFullYear();
      const count = await this.workRepository.count();
      const code = `OB-${year}-${String(count + 1).padStart(3, '0')}`;

      const deadlineDate = proposal.workDeadlineDays
        ? new Date(Date.now() + proposal.workDeadlineDays * 86400000)
        : null;

      const work = this.workRepository.create({
        code,
        title: proposal.workDescription || proposal.title || `Obra - ${proposal.proposalNumber}`,
        type: (activityTypeMap[proposal.activityType] || 'residential') as any,
        status: 'pending' as any,
        clientId: proposal.clientId || undefined,
        opportunityId: proposal.opportunityId || undefined,
        totalValue: Number(proposal.total) || 0,
        address: proposal.workAddress || undefined,
        description: proposal.scope || proposal.notes || undefined,
        expectedEndDate: deadlineDate,
        deadline: deadlineDate,
        currentStage: 'project' as any,
      });
      await this.workRepository.save(work);

      // Notify admins about auto-created work
      try {
        await this.notificationRepository.save(
          this.notificationRepository.create({
            title: '🚀 Obra Criada Automaticamente',
            message: `Proposta ${proposal.proposalNumber} aceita → Obra ${code} criada (R$ ${Number(proposal.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
            type: 'auto_work_created',
            category: 'works',
          }),
        );
      } catch { /* notification is non-critical */ }
    } catch (err) {
      // Log but don't fail the accept operation
      console.error('[AutoTrigger] Failed to auto-create work from proposal:', err?.message);
    }

    return saved;
  }

  async reject(id: string, reason?: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.REJECTED;
    if (reason) {
      proposal.rejectionReason = reason;
    }
    return this.proposalRepository.save(proposal);
  }

  async remove(id: string): Promise<void> {
    const proposal = await this.findOne(id);
    await this.proposalRepository.softRemove(proposal);
  }

  async permanentDelete(id: string): Promise<void> {
    // Hard delete — remove definitivamente do banco
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    // Remover revisões primeiro
    await this.revisionRepository.delete({ proposalId: id });
    // Remover itens
    await this.itemRepository
      .createQueryBuilder()
      .delete()
      .from(ProposalItem)
      .where('proposalId = :id', { id })
      .execute();
    // Remover proposta
    await this.proposalRepository.remove(proposal);
  }

  // ═══════════════════════════════════════════════════════════════
  // Sistema de Revisões
  // ═══════════════════════════════════════════════════════════════

  async getRevisions(proposalId: string): Promise<ProposalRevision[]> {
    return this.revisionRepository.find({
      where: { proposalId },
      order: { revisionNumber: 'DESC' },
    });
  }

  async softDeleteRevision(proposalId: string, revisionId: string): Promise<void> {
    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId, proposalId },
    });
    if (!revision) {
      throw new NotFoundException('Revisão não encontrada');
    }
    await this.revisionRepository.softRemove(revision);
  }

  async restoreRevision(proposalId: string, revisionId: string): Promise<Proposal> {
    const proposal = await this.findOne(proposalId);
    const revision = await this.revisionRepository.findOne({ where: { id: revisionId, proposalId } });
    if (!revision) {
      throw new NotFoundException('Revisão não encontrada');
    }

    // 1. Salvar a versão ATUAL como nova revisão (para não perder)
    const currentSnapshot = this.createSnapshot(proposal);
    const currentRevision = this.revisionRepository.create({
      proposalId,
      revisionNumber: proposal.revisionNumber || 1,
      snapshotData: currentSnapshot,
      changeDescription: `Substituída pela restauração da Rev. ${revision.revisionNumber}`,
    });
    await this.revisionRepository.save(currentRevision);

    // 2. Restaurar dados do snapshot
    let snapshot: any;
    try { snapshot = JSON.parse(revision.snapshotData); } catch {
      throw new BadRequestException('Snapshot da revisão está corrompido');
    }

    // 3. Aplicar campos da proposta
    const fieldsToRestore = [
      'title', 'clientId', 'opportunityId', 'subtotal', 'discount', 'total',
      'validUntil', 'scope', 'deadline', 'paymentConditions', 'obligations', 'notes',
      'workDescription', 'workAddress', 'workDeadlineDays', 'workDeadlineType', 'workDeadlineText',
      'objectiveType', 'objectiveText', 'thirdPartyDeadlines', 'paymentBank', 'activityType',
      'contractorObligations', 'clientObligations', 'generalProvisions',
      'serviceDescription', 'materialFornecimento', 'paymentDueCondition',
      'itemVisibilityMode', 'materialSummaryText', 'serviceSummaryText', 'summaryTotalLabel',
      'logisticsCostValue', 'logisticsCostMode', 'adminCostValue', 'adminCostMode',
      'brokerageCostValue', 'brokerageCostMode', 'insuranceCostValue', 'insuranceCostMode',
      'complianceText',
    ];
    for (const field of fieldsToRestore) {
      if (snapshot[field] !== undefined) {
        (proposal as any)[field] = snapshot[field];
      }
    }
    proposal.revisionNumber = (proposal.revisionNumber || 1) + 1;
    await this.proposalRepository.save(proposal);

    // 4. Restaurar itens: deletar atuais e recriar do snapshot
    if (snapshot.items && Array.isArray(snapshot.items)) {
      await this.itemRepository
        .createQueryBuilder()
        .delete()
        .from(ProposalItem)
        .where('proposalId = :id', { id: proposalId })
        .execute();

      await this.saveProposalItems(proposalId, snapshot.items.map((item: any) => ({
        description: item.description,
        serviceType: item.serviceType,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        unit: item.unit,
        isBundleParent: item.isBundleParent,
        parentId: item.parentId,
        showDetailedPrices: item.showDetailedPrices,
        overridePrice: item.overridePrice,
        notes: item.notes,
      })));
    }

    return this.findOne(proposalId);
  }

  private async saveProposalItems(proposalId: string, items: Partial<ProposalItem>[]) {
    if (!items || items.length === 0) return;

    this.logger.log(`saveProposalItems: ${items.length} items for proposal ${proposalId}`);

    // Strip to known DB columns only (prevents unknown field errors)
    const stripItem = (item: any) => ({
      description: item.description || '',
      serviceType: item.serviceType || null,
      unitPrice: Number(item.unitPrice || 0),
      quantity: Number(item.quantity || 1),
      unit: item.unit || 'UN',
      isBundleParent: item.isBundleParent || false,
      showDetailedPrices: item.showDetailedPrices !== undefined ? item.showDetailedPrices : true,
      overridePrice: item.overridePrice != null && Number(item.overridePrice) > 0 ? Number(item.overridePrice) : null,
      isSuggested: item.isSuggested || false,
      suggestedByRule: item.suggestedByRule || null,
      notes: item.notes || null,
    });

    const idMapping = new Map<string, string>();
    const parents = items.filter(it => it.isBundleParent);
    const children = items.filter(it => it.parentId && !it.isBundleParent);
    const regularItems = items.filter(it => !it.isBundleParent && !it.parentId);

    this.logger.log(`saveProposalItems: ${parents.length} parents, ${children.length} children, ${regularItems.length} regular`);

    // 1. Regular items
    if (regularItems.length > 0) {
      try {
        const pItems = regularItems.map(item => this.itemRepository.create({
          ...stripItem(item),
          proposalId,
          total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
        }));
        await this.itemRepository.save(pItems);
        this.logger.log(`saveProposalItems: ${regularItems.length} regular items saved`);
      } catch (err: any) {
        this.logger.error(`saveProposalItems REGULAR ITEMS ERROR: ${err?.message}`);
        throw err;
      }
    }

    // 2. Parents — save one by one to get new UUIDs for mapping
    for (const parent of parents) {
      try {
        const frontendId = (parent as any).id;
        const parentQty = Math.max(Number(parent.quantity) || 1, 1);
        const childrenOfParent = children.filter(c => c.parentId === frontendId);
        const childrenSum = childrenOfParent.reduce((sum, c) => {
          return sum + Number(c.unitPrice || 0) * Number(c.quantity || 1);
        }, 0);
        const parentTotal = parent.overridePrice != null && Number(parent.overridePrice) > 0
          ? Number(parent.overridePrice) * parentQty
          : childrenSum * parentQty;

        const p = this.itemRepository.create({
          ...stripItem(parent),
          proposalId,
          total: parentTotal,
        });
        const savedParent = await this.itemRepository.save(p);
        if (frontendId) idMapping.set(frontendId, savedParent.id);
        this.logger.log(`saveProposalItems: parent "${parent.description}" saved (${frontendId} → ${savedParent.id})`);
      } catch (err: any) {
        this.logger.error(`saveProposalItems PARENT ERROR "${parent.description}": ${err?.message}`);
        throw err;
      }
    }

    // 3. Children — map parentId to new DB UUID
    if (children.length > 0) {
      try {
        const cItems = children.map(item => {
          const realParentId = idMapping.get(item.parentId);
          if (!realParentId) {
            this.logger.warn(`saveProposalItems: child "${item.description}" has unmapped parentId "${item.parentId}" — setting to null`);
          }
          return this.itemRepository.create({
            ...stripItem(item),
            proposalId,
            parentId: realParentId || null, // ALWAYS use mapped ID, never the old one (FK would fail)
            total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
          });
        });
        await this.itemRepository.save(cItems);
        this.logger.log(`saveProposalItems: ${children.length} children saved`);
      } catch (err: any) {
        this.logger.error(`saveProposalItems CHILDREN ERROR: ${err?.message}`);
        throw err;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Assinatura Digital
  // ═══════════════════════════════════════════════════════════════

  async generateSignatureLink(id: string): Promise<{ token: string; url: string; expiresAt: Date }> {
    const proposal = await this.findOne(id);

    // Gerar token único
    const token = require('crypto').randomUUID() + '-' + Date.now().toString(36);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias de validade

    // Gerar código de verificação (6 dígitos)
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    proposal.signatureToken = token;
    proposal.signatureTokenExpiresAt = expiresAt;
    proposal.signatureVerificationCode = verificationCode;

    // Marcar como enviada se ainda estiver draft
    if (proposal.status === ProposalStatus.DRAFT) {
      proposal.status = ProposalStatus.SENT;
      proposal.sentAt = new Date();
    }

    await this.proposalRepository.save(proposal);

    // URL pública (será resolvida pelo frontend)
    const url = `/assinar/${token}`;

    return { token, url, expiresAt };
  }

  async getProposalByToken(token: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { signatureToken: token },
      relations: ['client', 'items'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada ou link inválido');
    }

    if (proposal.signatureTokenExpiresAt && new Date() > proposal.signatureTokenExpiresAt) {
      throw new BadRequestException('Link de assinatura expirado');
    }

    if (proposal.signedAt) {
      throw new BadRequestException('Esta proposta já foi assinada');
    }

    // Marcar como visualizada
    if (proposal.status === ProposalStatus.SENT) {
      proposal.status = ProposalStatus.VIEWED;
      proposal.viewedAt = new Date();
      await this.proposalRepository.save(proposal);
    }

    return proposal;
  }

  async signProposal(
    token: string,
    data: { name: string; document: string; ip?: string; userAgent?: string },
  ): Promise<{ proposal: Proposal; verificationCode: string }> {
    const proposal = await this.proposalRepository.findOne({
      where: { signatureToken: token },
      relations: ['client', 'items'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.signatureTokenExpiresAt && new Date() > proposal.signatureTokenExpiresAt) {
      throw new BadRequestException('Link de assinatura expirado');
    }

    if (proposal.signedAt) {
      throw new BadRequestException('Esta proposta já foi assinada');
    }

    proposal.signedAt = new Date();
    proposal.signedByName = data.name;
    proposal.signedByDocument = data.document;
    proposal.signedByIP = data.ip || 'unknown';
    proposal.signedByUserAgent = data.userAgent || 'unknown';
    proposal.status = ProposalStatus.ACCEPTED;
    proposal.acceptedAt = new Date();

    await this.proposalRepository.save(proposal);

    return { proposal, verificationCode: proposal.signatureVerificationCode };
  }

  async getSignatureStatus(id: string) {
    const proposal = await this.findOne(id);
    return {
      isSigned: !!proposal.signedAt,
      signedAt: proposal.signedAt,
      signedByName: proposal.signedByName,
      signedByDocument: proposal.signedByDocument,
      signedByIP: proposal.signedByIP,
      verificationCode: proposal.signatureVerificationCode,
      status: proposal.status,
    };
  }
}
