import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SimulationSession, SimulationSessionStatus } from './simulation-session.entity';

@Injectable()
export class SimulationsService implements OnModuleInit {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    @InjectRepository(SimulationSession)
    private sessionRepository: Repository<SimulationSession>,
    private dataSource: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // Schema bootstrap (padrão do projeto — sem migrations formais)
  // ═══════════════════════════════════════════════════════════════════
  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS simulation_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "proposalId" UUID DEFAULT NULL,
          "clientId" UUID DEFAULT NULL,
          "createdById" UUID DEFAULT NULL,
          label VARCHAR DEFAULT NULL,
          "serviceDescription" TEXT DEFAULT NULL,
          "inputData" TEXT DEFAULT NULL,
          "resultData" TEXT DEFAULT NULL,
          "selectedConditionId" VARCHAR DEFAULT NULL,
          "detectedProfile" VARCHAR DEFAULT NULL,
          "basePrice" numeric(15,2) DEFAULT NULL,
          "selectedTotal" numeric(15,2) DEFAULT NULL,
          "selectedMargin" numeric(5,2) DEFAULT NULL,
          "totalConditions" INT DEFAULT 0,
          "viableConditions" INT DEFAULT 0,
          "blockedConditions" INT DEFAULT 0,
          status VARCHAR DEFAULT 'draft',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP DEFAULT NULL
        )
      `);
      this.logger.log('Table simulation_sessions ensured');
    } catch (err) {
      this.logger.warn('Could not create simulation_sessions: ' + err?.message);
    }

    // ── Ensure columns adicionadas após a criação inicial ──
    const columnsToEnsure = [
      { col: 'clientId', type: 'UUID DEFAULT NULL' },
      { col: 'serviceDescription', type: 'TEXT DEFAULT NULL' },
      { col: 'selectedTotal', type: 'numeric(15,2) DEFAULT NULL' },
      { col: 'selectedMargin', type: 'numeric(5,2) DEFAULT NULL' },
    ];
    for (const { col, type } of columnsToEnsure) {
      try {
        await this.dataSource.query(
          `ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS "${col}" ${type}`,
        );
      } catch (err) {
        this.logger.warn(`Could not add column ${col} on simulation_sessions: ${err?.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // READ
  // ═══════════════════════════════════════════════════════════════════

  async findAll(filters?: { status?: string; createdById?: string }): Promise<SimulationSession[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.createdById) where.createdById = filters.createdById;

    return this.sessionRepository.find({
      where,
      relations: ['proposal', 'client', 'createdByUser'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<SimulationSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['proposal', 'client', 'createdByUser'],
    });
    if (!session) {
      throw new NotFoundException('Sessão de simulação não encontrada');
    }
    return session;
  }

  async findByProposal(proposalId: string): Promise<SimulationSession[]> {
    return this.sessionRepository.find({
      where: { proposalId },
      relations: ['createdByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════

  async create(data: Partial<SimulationSession>): Promise<SimulationSession> {
    const safeFields: Record<string, any> = {};
    const knownFields = [
      'proposalId', 'clientId', 'createdById', 'label', 'serviceDescription',
      'inputData', 'resultData', 'selectedConditionId', 'detectedProfile',
      'basePrice', 'selectedTotal', 'selectedMargin',
      'totalConditions', 'viableConditions', 'blockedConditions', 'status',
    ];
    for (const key of knownFields) {
      if (key in data) {
        safeFields[key] = (data as any)[key];
      }
    }

    const session = this.sessionRepository.create(safeFields as Partial<SimulationSession>);
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`✅ Simulation session created: ${saved.id} (status: ${saved.status}, label: ${saved.label || 'sem label'})`);
    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════

  async update(id: string, data: Partial<SimulationSession>): Promise<SimulationSession> {
    const session = await this.findOne(id);

    // Strip campos imutáveis
    const { id: _id, createdAt: _ca, updatedAt: _ua, deletedAt: _da,
      proposal: _p, client: _cl, createdByUser: _u, ...safeData } = data as any;

    Object.assign(session, safeData);
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Simulation session updated: ${saved.id}`);
    return saved;
  }

  /** Atualizar apenas a condição selecionada (operação leve) */
  async updateSelection(
    id: string,
    data: { selectedConditionId: string; selectedTotal?: number; selectedMargin?: number },
  ): Promise<SimulationSession> {
    const session = await this.findOne(id);
    session.selectedConditionId = data.selectedConditionId;
    if (data.selectedTotal !== undefined) session.selectedTotal = data.selectedTotal;
    if (data.selectedMargin !== undefined) session.selectedMargin = data.selectedMargin;
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Simulation session ${saved.id}: selection updated to ${data.selectedConditionId}`);
    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════
  // LINK / ARCHIVE / DELETE
  // ═══════════════════════════════════════════════════════════════════

  async linkToProposal(id: string, proposalId: string): Promise<SimulationSession> {
    const session = await this.findOne(id);
    session.proposalId = proposalId;
    session.status = SimulationSessionStatus.LINKED;
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Simulation session ${saved.id} linked to proposal ${proposalId}`);
    return saved;
  }

  async archive(id: string): Promise<SimulationSession> {
    const session = await this.findOne(id);
    session.status = SimulationSessionStatus.ARCHIVED;
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Simulation session ${saved.id} archived`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionRepository.softRemove(session);
    this.logger.log(`Simulation session ${id} soft-deleted`);
  }
}
