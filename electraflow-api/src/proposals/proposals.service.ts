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
    // Safe migration: add columns if they don't exist
    const columnsToEnsure = [
      { col: 'overridePrice', type: 'numeric(15,2) DEFAULT NULL', table: 'proposal_items' },
      { col: 'logisticsCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'logisticsCostApplyTo', type: "varchar DEFAULT 'material'", table: 'proposals' },
      { col: 'logisticsCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'logisticsCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'logisticsCostDescription', type: 'text DEFAULT NULL', table: 'proposals' },
      { col: 'adminCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'adminCostApplyTo', type: "varchar DEFAULT 'material'", table: 'proposals' },
      { col: 'adminCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'adminCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'adminCostDescription', type: 'text DEFAULT NULL', table: 'proposals' },
      { col: 'brokerageCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'brokerageCostApplyTo', type: "varchar DEFAULT 'material'", table: 'proposals' },
      { col: 'brokerageCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'brokerageCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'brokerageCostDescription', type: 'text DEFAULT NULL', table: 'proposals' },
      { col: 'insuranceCostPercent', type: 'numeric(5,2) DEFAULT NULL', table: 'proposals' },
      { col: 'insuranceCostApplyTo', type: "varchar DEFAULT 'material'", table: 'proposals' },
      { col: 'insuranceCostEmbedMaterialPct', type: 'numeric(5,2) DEFAULT 100', table: 'proposals' },
      { col: 'insuranceCostEmbedServicePct', type: 'numeric(5,2) DEFAULT 0', table: 'proposals' },
      { col: 'insuranceCostDescription', type: 'text DEFAULT NULL', table: 'proposals' },
      { col: 'complianceText', type: 'text DEFAULT NULL', table: 'proposals' },
      { col: 'sortOrder', type: 'int DEFAULT 0', table: 'proposal_items' },
      { col: 'notes', type: 'text DEFAULT NULL', table: 'proposal_items' },
    ];
    for (const { col, type, table } of columnsToEnsure) {
      try {
        await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      } catch (err) {
        this.logger.warn(`Could not add column ${col} on ${table}: ${err?.message}`);
      }
    }
    this.logger.log('Proposal columns migration completed');
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

  private async generateProposalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}-`;

    const lastProposal = await this.proposalRepository
      .createQueryBuilder('p')
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
    const proposal = this.proposalRepository.create(proposalData);
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

    const saved = await this.proposalRepository.save(proposal);
    await this.saveProposalItems(saved.id, items);
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
      'workDescription', 'workAddress', 'workDeadlineDays', 'paymentBank', 'activityType',
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

    const idMapping = new Map<string, string>();
    const parents = items.filter(it => it.isBundleParent);
    const children = items.filter(it => it.parentId && !it.isBundleParent);
    const regularItems = items.filter(it => !it.isBundleParent && !it.parentId);

    // 1. Regular items — sempre gerar novo UUID
    if (regularItems.length > 0) {
      const pItems = regularItems.map(item => this.itemRepository.create({
        ...item,
        id: undefined, // Forçar novo UUID
        proposalId,
        total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
      }));
      await this.itemRepository.save(pItems);
    }

    // 2. Parents — calcular total como soma dos filhos × quantidade do pai
    for (const parent of parents) {
      const frontendId = parent.id;
      const parentQty = Math.max(Number(parent.quantity) || 1, 1);
      // Calcular soma dos filhos para este pai
      const childrenOfParent = children.filter(c => c.parentId === frontendId);
      const childrenSum = childrenOfParent.reduce((sum, c) => {
        return sum + Number(c.unitPrice || 0) * Number(c.quantity || 1);
      }, 0);
      // Total do pai = soma dos filhos × quantidade do pai
      // Se overridePrice existe, usar ele × qty
      const parentTotal = parent.overridePrice != null && Number(parent.overridePrice) > 0
        ? Number(parent.overridePrice) * parentQty
        : childrenSum * parentQty;

      const p = this.itemRepository.create({
        ...parent,
        id: undefined,
        proposalId,
        total: parentTotal,
      });
      const savedParent = await this.itemRepository.save(p);
      if (frontendId) idMapping.set(frontendId, savedParent.id);
    }

    // 3. Children — sempre gerar novo UUID
    if (children.length > 0) {
      const cItems = children.map(item => {
        const realParentId = idMapping.get(item.parentId);
        return this.itemRepository.create({
          ...item,
          id: undefined,
          proposalId,
          parentId: realParentId || (item.parentId && item.parentId.startsWith('temp-') ? null : item.parentId),
          total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
        });
      });
      await this.itemRepository.save(cItems);
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
