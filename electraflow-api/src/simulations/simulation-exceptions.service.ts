import { Injectable, NotFoundException, Logger, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SimulationException, ExceptionStatus } from './simulation-exception.entity';
import { AuditLog } from '../compliance/audit-log.entity';

@Injectable()
export class SimulationExceptionsService implements OnModuleInit {
  private readonly logger = new Logger(SimulationExceptionsService.name);

  constructor(
    @InjectRepository(SimulationException)
    private exceptionRepo: Repository<SimulationException>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // Schema bootstrap (padrão do projeto — sem migrations formais)
  // ═══════════════════════════════════════════════════════════════════
  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS simulation_exceptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "sessionId" UUID DEFAULT NULL,
          "exceptionType" VARCHAR DEFAULT 'other',
          status VARCHAR DEFAULT 'pending',
          "conditionId" VARCHAR DEFAULT NULL,
          "conditionSnapshot" TEXT DEFAULT NULL,
          "conditionLabel" VARCHAR DEFAULT NULL,
          "marginAtException" numeric(5,2) DEFAULT NULL,
          "minMarginRequired" numeric(5,2) DEFAULT NULL,
          "cashGapAmount" numeric(15,2) DEFAULT NULL,
          "riskScoreAtException" INT DEFAULT NULL,
          "requestedById" UUID DEFAULT NULL,
          justification TEXT DEFAULT NULL,
          "approvedById" UUID DEFAULT NULL,
          "approvalNote" TEXT DEFAULT NULL,
          "approvedAt" TIMESTAMP DEFAULT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      this.logger.log('Table simulation_exceptions ensured');
    } catch (err) {
      this.logger.warn('Could not create simulation_exceptions: ' + err?.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // READ
  // ═══════════════════════════════════════════════════════════════════

  async findAll(filters?: { status?: string; sessionId?: string }): Promise<SimulationException[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.sessionId) where.sessionId = filters.sessionId;

    return this.exceptionRepo.find({
      where,
      relations: ['requestedBy', 'approvedBy', 'session'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findPending(): Promise<SimulationException[]> {
    return this.findAll({ status: ExceptionStatus.PENDING });
  }

  async findOne(id: string): Promise<SimulationException> {
    const exception = await this.exceptionRepo.findOne({
      where: { id },
      relations: ['requestedBy', 'approvedBy', 'session'],
    });
    if (!exception) {
      throw new NotFoundException('Exceção de simulação não encontrada');
    }
    return exception;
  }

  async findBySession(sessionId: string): Promise<SimulationException[]> {
    return this.exceptionRepo.find({
      where: { sessionId },
      relations: ['requestedBy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CREATE (solicitar exceção)
  // ═══════════════════════════════════════════════════════════════════

  async requestException(data: {
    sessionId?: string;
    exceptionType: string;
    conditionId?: string;
    conditionSnapshot?: string;
    conditionLabel?: string;
    marginAtException?: number;
    minMarginRequired?: number;
    cashGapAmount?: number;
    riskScoreAtException?: number;
    justification: string;
    requestedById: string;
    requestedByName?: string;
  }): Promise<SimulationException> {
    const exception = this.exceptionRepo.create({
      sessionId: data.sessionId || null,
      exceptionType: data.exceptionType,
      status: ExceptionStatus.PENDING,
      conditionId: data.conditionId,
      conditionSnapshot: data.conditionSnapshot,
      conditionLabel: data.conditionLabel,
      marginAtException: data.marginAtException,
      minMarginRequired: data.minMarginRequired,
      cashGapAmount: data.cashGapAmount,
      riskScoreAtException: data.riskScoreAtException,
      justification: data.justification,
      requestedById: data.requestedById,
    });

    const saved = await this.exceptionRepo.save(exception);

    // ── Audit trail via audit_logs existente ──
    await this.logAudit({
      entityType: 'simulation_exception',
      entityId: saved.id,
      action: 'exception_requested',
      performedById: data.requestedById,
      performedByName: data.requestedByName || 'Operador',
      description: `Exceção solicitada: ${data.exceptionType} — ${data.justification?.substring(0, 100)}`,
      newValues: {
        exceptionType: data.exceptionType,
        conditionId: data.conditionId,
        conditionLabel: data.conditionLabel,
        marginAtException: data.marginAtException,
        minMarginRequired: data.minMarginRequired,
        cashGapAmount: data.cashGapAmount,
      },
    });

    this.logger.log(`✅ Exception requested: ${saved.id} (${data.exceptionType})`);
    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════
  // APPROVE / REJECT
  // ═══════════════════════════════════════════════════════════════════

  async approve(id: string, data: {
    approvedById: string;
    approvedByName?: string;
    approvalNote?: string;
  }): Promise<SimulationException> {
    const exception = await this.findOne(id);

    if (exception.status !== ExceptionStatus.PENDING) {
      throw new ForbiddenException('Exceção não está mais pendente');
    }

    // Não pode aprovar a própria exceção
    if (exception.requestedById === data.approvedById) {
      throw new ForbiddenException('Não é possível aprovar a própria exceção');
    }

    exception.status = ExceptionStatus.APPROVED;
    exception.approvedById = data.approvedById;
    exception.approvalNote = data.approvalNote || null;
    exception.approvedAt = new Date();

    const saved = await this.exceptionRepo.save(exception);

    await this.logAudit({
      entityType: 'simulation_exception',
      entityId: saved.id,
      action: 'exception_approved',
      performedById: data.approvedById,
      performedByName: data.approvedByName || 'Aprovador',
      description: `Exceção aprovada: ${exception.exceptionType}${data.approvalNote ? ' — ' + data.approvalNote.substring(0, 100) : ''}`,
      oldValues: { status: ExceptionStatus.PENDING },
      newValues: {
        status: ExceptionStatus.APPROVED,
        approvedById: data.approvedById,
        approvalNote: data.approvalNote,
        approvedAt: saved.approvedAt,
      },
    });

    this.logger.log(`✅ Exception approved: ${saved.id} by ${data.approvedById}`);
    return saved;
  }

  async reject(id: string, data: {
    approvedById: string;
    approvedByName?: string;
    approvalNote?: string;
  }): Promise<SimulationException> {
    const exception = await this.findOne(id);

    if (exception.status !== ExceptionStatus.PENDING) {
      throw new ForbiddenException('Exceção não está mais pendente');
    }

    exception.status = ExceptionStatus.REJECTED;
    exception.approvedById = data.approvedById;
    exception.approvalNote = data.approvalNote || null;
    exception.approvedAt = new Date();

    const saved = await this.exceptionRepo.save(exception);

    await this.logAudit({
      entityType: 'simulation_exception',
      entityId: saved.id,
      action: 'exception_rejected',
      performedById: data.approvedById,
      performedByName: data.approvedByName || 'Aprovador',
      description: `Exceção rejeitada: ${exception.exceptionType}${data.approvalNote ? ' — ' + data.approvalNote.substring(0, 100) : ''}`,
      oldValues: { status: ExceptionStatus.PENDING },
      newValues: { status: ExceptionStatus.REJECTED, approvalNote: data.approvalNote },
    });

    this.logger.log(`❌ Exception rejected: ${saved.id} by ${data.approvedById}`);
    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════
  // AUDIT TRAIL helper (reutiliza audit_logs)
  // ═══════════════════════════════════════════════════════════════════
  private async logAudit(data: {
    entityType: string;
    entityId: string;
    action: string;
    performedById: string;
    performedByName: string;
    description: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }) {
    try {
      const log = this.auditRepo.create({
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        performedById: data.performedById,
        performedByName: data.performedByName,
        description: data.description,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
      });
      await this.auditRepo.save(log);
    } catch (err) {
      this.logger.warn(`Audit log error (non-critical): ${err?.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // AUDIT TRAIL — consultar logs de uma exceção
  // ═══════════════════════════════════════════════════════════════════
  async getAuditTrail(exceptionId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entityType: 'simulation_exception', entityId: exceptionId },
      order: { performedAt: 'ASC' },
    });
  }
}
