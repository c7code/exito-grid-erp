import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Equipment, EquipmentRental, EquipmentMaintenance, EquipmentDailyLog, EquipmentService as EquipmentServiceEntity, EquipmentChecklist, EquipmentDocument, EquipmentLiftingPlan } from './equipment.entity';

@Injectable()
export class EquipmentService implements OnModuleInit {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectRepository(Equipment) private equipRepo: Repository<Equipment>,
    @InjectRepository(EquipmentRental) private rentalRepo: Repository<EquipmentRental>,
    @InjectRepository(EquipmentMaintenance) private maintRepo: Repository<EquipmentMaintenance>,
    @InjectRepository(EquipmentDailyLog) private dailyRepo: Repository<EquipmentDailyLog>,
    @InjectRepository(EquipmentServiceEntity) private serviceRepo: Repository<EquipmentServiceEntity>,
    @InjectRepository(EquipmentChecklist) private checklistRepo: Repository<EquipmentChecklist>,
    @InjectRepository(EquipmentDocument) private docRepo: Repository<EquipmentDocument>,
    @InjectRepository(EquipmentLiftingPlan) private liftingRepo: Repository<EquipmentLiftingPlan>,
    private dataSource: DataSource,
  ) {}

  // ═══ AUTO-MIGRATION ═════════════════════════════════════════════
  async onModuleInit() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS equipment_daily_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rentalId" UUID NOT NULL,
        "equipmentId" UUID NOT NULL,
        "operatorId" UUID,
        "operatorName" VARCHAR,
        date DATE NOT NULL,
        "hoursWorked" NUMERIC(6,2) DEFAULT 0,
        "dailyRate" NUMERIC(15,2) DEFAULT 0,
        "totalValue" NUMERIC(15,2) DEFAULT 0,
        description TEXT,
        status VARCHAR DEFAULT 'registered',
        "billedPaymentId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS equipment_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR UNIQUE,
        "equipmentId" UUID NOT NULL,
        "clientId" UUID,
        "operatorId" UUID,
        "operatorName" VARCHAR,
        "serviceType" VARCHAR DEFAULT 'lifting',
        description TEXT,
        address VARCHAR,
        city VARCHAR,
        state VARCHAR,
        "scheduledDate" TIMESTAMP,
        "completedDate" TIMESTAMP,
        "unitRate" NUMERIC(15,2) DEFAULT 0,
        quantity NUMERIC(10,2) DEFAULT 1,
        "totalValue" NUMERIC(15,2) DEFAULT 0,
        status VARCHAR DEFAULT 'draft',
        "proposalId" UUID,
        "paymentId" UUID,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS equipment_checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rentalId" UUID,
        "equipmentId" UUID NOT NULL,
        type VARCHAR DEFAULT 'departure',
        "inspectorName" VARCHAR,
        "inspectedAt" TIMESTAMP,
        items TEXT,
        "generalNotes" TEXT,
        "odometerReading" NUMERIC(12,1),
        "fuelLevel" VARCHAR,
        status VARCHAR DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS equipment_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "equipmentId" UUID NOT NULL,
        name VARCHAR NOT NULL,
        category VARCHAR,
        "fileUrl" TEXT,
        "fileName" VARCHAR,
        "fileType" VARCHAR,
        "fileSize" INT,
        "expiresAt" TIMESTAMP,
        notes TEXT,
        status VARCHAR DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS equipment_lifting_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR UNIQUE,
        "equipmentId" UUID NOT NULL,
        "rentalId" UUID,
        "clientId" UUID,
        title VARCHAR NOT NULL,
        description TEXT,
        "operationType" VARCHAR,
        "operationDate" TIMESTAMP,
        "operatorName" VARCHAR,
        "supervisorName" VARCHAR,
        "loadWeight" NUMERIC(12,2),
        "loadDescription" VARCHAR,
        "liftHeight" NUMERIC(8,2),
        "liftRadius" NUMERIC(8,2),
        "liftAngle" NUMERIC(8,2),
        "equipmentCapacity" NUMERIC(12,2),
        "utilizationPercent" NUMERIC(6,2),
        "groundCondition" VARCHAR,
        "accessConditions" TEXT,
        "weatherRestrictions" TEXT,
        "siteRestrictions" TEXT,
        "riskAssessment" TEXT,
        "requiredPPE" TEXT,
        "emergencyProcedure" TEXT,
        "isolationArea" TEXT,
        steps TEXT,
        status VARCHAR DEFAULT 'draft',
        "approvedBy" VARCHAR,
        "approvedAt" TIMESTAMP,
        "artNumber" TEXT,
        notes TEXT,
        address VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )`,
    ];

    for (const sql of tables) {
      try { await this.dataSource.query(sql); } catch (e) {
        this.logger.warn('Table creation: ' + e?.message);
      }
    }

    // Ensure new columns on existing tables
    const cols = [
      { table: 'equipment', col: 'operatorIds', type: 'TEXT' },
      { table: 'equipment', col: 'specifications', type: 'TEXT' },
      { table: 'equipment', col: 'customCategory', type: 'VARCHAR' },
      { table: 'equipment_rentals', col: 'checklistDepartureId', type: 'UUID' },
      { table: 'equipment_rentals', col: 'checklistReturnId', type: 'UUID' },
      // Rental: modalidade e adicionais
      { table: 'equipment_rentals', col: 'billingModality', type: 'VARCHAR DEFAULT \'daily\'' },
      { table: 'equipment_rentals', col: 'contractedPeriodDays', type: 'INT' },
      { table: 'equipment_rentals', col: 'contractedHoursPerDay', type: 'NUMERIC(6,2) DEFAULT 8' },
      { table: 'equipment_rentals', col: 'overtimeMode', type: 'VARCHAR DEFAULT \'percent\'' },
      { table: 'equipment_rentals', col: 'overtimeRate', type: 'NUMERIC(15,2) DEFAULT 50' },
      { table: 'equipment_rentals', col: 'nightMode', type: 'VARCHAR DEFAULT \'percent\'' },
      { table: 'equipment_rentals', col: 'nightRate', type: 'NUMERIC(15,2) DEFAULT 30' },
      { table: 'equipment_rentals', col: 'holidayMode', type: 'VARCHAR DEFAULT \'percent\'' },
      { table: 'equipment_rentals', col: 'holidayRate', type: 'NUMERIC(15,2) DEFAULT 100' },
      { table: 'equipment_rentals', col: 'weekendMode', type: 'VARCHAR DEFAULT \'percent\'' },
      { table: 'equipment_rentals', col: 'weekendRate', type: 'NUMERIC(15,2) DEFAULT 50' },
      { table: 'equipment_rentals', col: 'includesOperator', type: 'BOOLEAN DEFAULT true' },
      { table: 'equipment_rentals', col: 'operatorCostPerDay', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_rentals', col: 'proposalClauses', type: 'TEXT' },
      { table: 'equipment_rentals', col: 'accessRestrictions', type: 'TEXT' },
      { table: 'equipment_rentals', col: 'clientResponsibilities', type: 'TEXT' },
      { table: 'equipment_rentals', col: 'measurementNotes', type: 'TEXT' },
      // DailyLog: detalhamento de horas
      { table: 'equipment_daily_logs', col: 'normalHours', type: 'NUMERIC(6,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'overtimeHours', type: 'NUMERIC(6,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'nightHours', type: 'NUMERIC(6,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'isHoliday', type: 'BOOLEAN DEFAULT false' },
      { table: 'equipment_daily_logs', col: 'isWeekend', type: 'BOOLEAN DEFAULT false' },
      { table: 'equipment_daily_logs', col: 'normalValue', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'overtimeValue', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'nightValue', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'holidayValue', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'weekendValue', type: 'NUMERIC(15,2) DEFAULT 0' },
      { table: 'equipment_daily_logs', col: 'startTime', type: 'VARCHAR' },
      { table: 'equipment_daily_logs', col: 'endTime', type: 'VARCHAR' },
      { table: 'equipment_daily_logs', col: 'workLocation', type: 'VARCHAR' },
      { table: 'equipment_daily_logs', col: 'clientApproval', type: 'VARCHAR DEFAULT \'pending\'' },
      { table: 'equipment_daily_logs', col: 'clientApprovalNote', type: 'TEXT' },
    ];
    for (const { table, col, type } of cols) {
      try {
        await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      } catch (e) { this.logger.warn(`Col ${col}: ${e?.message}`); }
    }

    this.logger.log('Equipment module tables/columns ensured');

    // Custom options table for dynamic selects
    try {
      await this.dataSource.query(`CREATE TABLE IF NOT EXISTS equipment_custom_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "optionGroup" VARCHAR NOT NULL,
        "key" VARCHAR NOT NULL,
        label VARCHAR NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )`);
    } catch (e) { this.logger.warn('Custom options table: ' + e?.message); }
  }

  // ═══ CUSTOM OPTIONS (Dynamic selects) ══════════════════════════
  async getCustomOptions(group?: string): Promise<any[]> {
    if (group) {
      return this.dataSource.query(`SELECT * FROM equipment_custom_options WHERE "optionGroup" = $1 ORDER BY label ASC`, [group]);
    }
    return this.dataSource.query(`SELECT * FROM equipment_custom_options ORDER BY label ASC`);
  }

  async createCustomOption(data: { group: string; label: string }): Promise<any> {
    const key = data.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const result = await this.dataSource.query(
      `INSERT INTO equipment_custom_options (id, "optionGroup", "key", label) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
      [data.group, `custom_${key}`, data.label],
    );
    return result[0];
  }

  async deleteCustomOption(id: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM equipment_custom_options WHERE id = $1`, [id]);
  }

  // ═══ EQUIPMENT CRUD ══════════════════════════════════════════
  private sanitizeEquipment(data: any): Partial<Equipment> {
    // Whitelist only known entity columns to prevent TypeORM errors
    const allowedFields = [
      'name', 'description', 'type', 'category', 'customCategory',
      'brand', 'model', 'year', 'plate', 'serialNumber', 'chassisNumber',
      'status', 'hourlyRate', 'dailyRate', 'monthlyRate',
      'currentOperatorId', 'location', 'lastMaintenanceDate', 'nextMaintenanceDate',
      'totalHoursUsed', 'totalRentals', 'photos', 'operatorIds',
      'specifications', 'notes', 'isActive',
    ];
    const clean: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        clean[key] = data[key];
      }
    }
    // Ensure simple-json fields are valid objects (not undefined/null strings)
    if (clean.specifications && typeof clean.specifications === 'string') {
      try { clean.specifications = JSON.parse(clean.specifications); } catch { clean.specifications = {}; }
    }
    if (clean.operatorIds && typeof clean.operatorIds === 'string') {
      try { clean.operatorIds = JSON.parse(clean.operatorIds); } catch { clean.operatorIds = []; }
    }
    // Convert numeric fields
    if (clean.hourlyRate !== undefined) clean.hourlyRate = Number(clean.hourlyRate) || 0;
    if (clean.dailyRate !== undefined) clean.dailyRate = Number(clean.dailyRate) || 0;
    if (clean.monthlyRate !== undefined) clean.monthlyRate = Number(clean.monthlyRate) || 0;
    return clean;
  }

  /** Safe code generation using MAX from DB (includes soft-deleted records to avoid unique constraint violations) */
  private async generateUniqueCode(table: string, prefix: string): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `SELECT code FROM ${table} WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
        [`${prefix}-%`],
      );
      if (result.length > 0) {
        const lastCode = result[0].code as string; // e.g. "EQ-0005"
        const numPart = parseInt(lastCode.replace(`${prefix}-`, ''), 10);
        return `${prefix}-${String((numPart || 0) + 1).padStart(4, '0')}`;
      }
      return `${prefix}-0001`;
    } catch (e) {
      this.logger.warn(`generateUniqueCode fallback for ${prefix}: ${e?.message}`);
      // Fallback: timestamp-based
      return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    }
  }

  async getAll(): Promise<Equipment[]> {
    return this.equipRepo.find({ order: { code: 'ASC' }, relations: ['rentals'] });
  }

  async getById(id: string): Promise<Equipment> {
    const eq = await this.equipRepo.findOne({ where: { id }, relations: ['rentals', 'maintenances'] });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    return eq;
  }

  async create(data: Partial<Equipment>): Promise<Equipment> {
    try {
      const code = await this.generateUniqueCode('equipment', 'EQ');
      const clean = this.sanitizeEquipment(data);
      this.logger.log(`Creating equipment: ${JSON.stringify({ code, ...clean }).substring(0, 500)}`);
      return await this.equipRepo.save(this.equipRepo.create({ ...clean, code }));
    } catch (e) {
      this.logger.error(`Error creating equipment: ${e?.message}`, e?.stack);
      throw e;
    }
  }

  async update(id: string, data: Partial<Equipment>): Promise<Equipment> {
    try {
      const clean = this.sanitizeEquipment(data);
      await this.equipRepo.update(id, clean);
      return this.getById(id);
    } catch (e) {
      this.logger.error(`Error updating equipment ${id}: ${e?.message}`, e?.stack);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.equipRepo.softDelete(id);
  }

  // ═══ RENTAL CRUD ═════════════════════════════════════════════
  async getRentals(): Promise<EquipmentRental[]> {
    return this.rentalRepo.find({ order: { createdAt: 'DESC' }, relations: ['equipment', 'client'] });
  }

  async getRentalById(id: string): Promise<EquipmentRental> {
    const r = await this.rentalRepo.findOne({ where: { id }, relations: ['equipment', 'client', 'dailyLogs'] });
    if (!r) throw new NotFoundException('Locação não encontrada');
    return r;
  }

  async createRental(data: Partial<EquipmentRental>): Promise<EquipmentRental> {
    const code = await this.generateUniqueCode('equipment_rentals', 'LOC');
    const rental = await this.rentalRepo.save(this.rentalRepo.create({ ...data, code }));
    if (data.status === 'active' || data.status === 'confirmed') {
      await this.equipRepo.update(data.equipmentId, { status: 'rented' });
    }
    await this.equipRepo.increment({ id: data.equipmentId }, 'totalRentals', 1);
    return this.getRentalById(rental.id);
  }

  async updateRental(id: string, data: Partial<EquipmentRental>): Promise<EquipmentRental> {
    const old = await this.getRentalById(id);
    await this.rentalRepo.update(id, data);
    if ((data.status === 'completed' || data.status === 'cancelled') && old.status !== data.status) {
      const activeRentals = await this.rentalRepo.count({
        where: { equipmentId: old.equipmentId, status: 'active' },
      });
      if (activeRentals <= 1) {
        await this.equipRepo.update(old.equipmentId, { status: 'available' });
      }
    }
    if (data.status === 'active' && old.status !== 'active') {
      await this.equipRepo.update(old.equipmentId, { status: 'rented' });
    }
    return this.getRentalById(id);
  }

  async removeRental(id: string): Promise<void> {
    await this.rentalRepo.softDelete(id);
  }

  // ═══ MAINTENANCE CRUD ════════════════════════════════════════
  async getMaintenances(equipmentId?: string): Promise<EquipmentMaintenance[]> {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    return this.maintRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['equipment'] });
  }

  async createMaintenance(data: Partial<EquipmentMaintenance>): Promise<EquipmentMaintenance> {
    const maint = await this.maintRepo.save(this.maintRepo.create(data));
    if (data.status === 'in_progress') {
      await this.equipRepo.update(data.equipmentId, { status: 'maintenance' });
    }
    if (data.status === 'completed') {
      await this.equipRepo.update(data.equipmentId, {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: data.nextDueDate || null,
        status: 'available',
      });
    }
    return maint;
  }

  async updateMaintenance(id: string, data: Partial<EquipmentMaintenance>): Promise<EquipmentMaintenance> {
    const old = await this.maintRepo.findOneBy({ id });
    await this.maintRepo.update(id, data);
    if (data.status === 'completed' && old?.status !== 'completed') {
      await this.equipRepo.update(old.equipmentId, {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: data.nextDueDate || null,
        status: 'available',
      });
    }
    return this.maintRepo.findOne({ where: { id }, relations: ['equipment'] });
  }

  async removeMaintenance(id: string): Promise<void> {
    await this.maintRepo.delete(id);
  }

  // ═══ DAILY LOG CRUD ══════════════════════════════════════════
  async getDailyLogs(rentalId?: string): Promise<EquipmentDailyLog[]> {
    const where: any = {};
    if (rentalId) where.rentalId = rentalId;
    return this.dailyRepo.find({ where, order: { date: 'DESC' }, relations: ['rental', 'equipment'] });
  }

  async createDailyLog(data: Partial<EquipmentDailyLog>): Promise<EquipmentDailyLog> {
    // Auto-calculate values based on rental rates
    if (data.rentalId) {
      try {
        const rental = await this.rentalRepo.findOneBy({ id: data.rentalId });
        if (rental) {
          const baseRate = Number(data.dailyRate || rental.unitRate || 0);
          const contractedHours = Number(rental.contractedHoursPerDay || 8);
          const hourlyBase = baseRate / contractedHours;

          const normalH = Number(data.normalHours || data.hoursWorked || 0);
          const overtimeH = Number(data.overtimeHours || 0);
          const nightH = Number(data.nightHours || 0);
          const isHoliday = data.isHoliday || false;
          const isWeekend = data.isWeekend || false;

          // Normal value
          data.normalValue = normalH * hourlyBase;

          // Overtime
          if (overtimeH > 0) {
            data.overtimeValue = rental.overtimeMode === 'fixed'
              ? overtimeH * Number(rental.overtimeRate || 0)
              : overtimeH * hourlyBase * (1 + Number(rental.overtimeRate || 50) / 100);
          }

          // Night
          if (nightH > 0) {
            data.nightValue = rental.nightMode === 'fixed'
              ? nightH * Number(rental.nightRate || 0)
              : nightH * hourlyBase * (Number(rental.nightRate || 30) / 100);
          }

          // Holiday
          if (isHoliday) {
            const totalH = normalH + overtimeH;
            data.holidayValue = rental.holidayMode === 'fixed'
              ? Number(rental.holidayRate || 0)
              : totalH * hourlyBase * (Number(rental.holidayRate || 100) / 100);
          }

          // Weekend
          if (isWeekend && !isHoliday) {
            const totalH = normalH + overtimeH;
            data.weekendValue = rental.weekendMode === 'fixed'
              ? Number(rental.weekendRate || 0)
              : totalH * hourlyBase * (Number(rental.weekendRate || 50) / 100);
          }

          data.totalValue = Number(data.normalValue || 0) + Number(data.overtimeValue || 0)
            + Number(data.nightValue || 0) + Number(data.holidayValue || 0) + Number(data.weekendValue || 0);
          data.hoursWorked = normalH + overtimeH;
          data.dailyRate = baseRate;
        }
      } catch (e) { this.logger.warn('Auto-calc error: ' + e?.message); }
    }

    // Fallback: simple calculation if no rental-based calc happened
    if (!data.totalValue) {
      data.totalValue = Number(data.dailyRate || 0) * Math.max(Number(data.hoursWorked || 0) / 8, 1);
    }

    const log = this.dailyRepo.create(data);
    const saved = await this.dailyRepo.save(log);
    if (data.hoursWorked && data.equipmentId) {
      await this.equipRepo.increment({ id: data.equipmentId }, 'totalHoursUsed', Number(data.hoursWorked));
    }
    return this.dailyRepo.findOne({ where: { id: saved.id }, relations: ['rental', 'equipment'] });
  }

  async updateDailyLog(id: string, data: Partial<EquipmentDailyLog>): Promise<EquipmentDailyLog> {
    await this.dailyRepo.update(id, data);
    return this.dailyRepo.findOne({ where: { id }, relations: ['rental', 'equipment'] });
  }

  async removeDailyLog(id: string): Promise<void> {
    await this.dailyRepo.softDelete(id);
  }

  async billDailyLogs(rentalId: string): Promise<any> {
    const rental = await this.getRentalById(rentalId);
    const unbilled = await this.dailyRepo.find({
      where: { rentalId, status: 'registered' },
      relations: ['equipment'],
    });
    if (unbilled.length === 0) throw new NotFoundException('Nenhuma diária pendente de faturamento');

    const totalValue = unbilled.reduce((s, d) => s + Number(d.totalValue || 0), 0);
    const equipName = unbilled[0]?.equipment?.name || '';

    // Create payment via raw SQL (avoids importing FinanceModule)
    const paymentId = await this.dataSource.query(
      `INSERT INTO payments (id, description, amount, type, category, status, "dueDate", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'income', 'equipment', 'pending', NOW() + interval '30 days',
               $3, NOW(), NOW())
       RETURNING id`,
      [
        `Diárias ${rental.code} - ${equipName}`,
        totalValue,
        `Faturamento de ${unbilled.length} diária(s) - Locação ${rental.code}`,
      ],
    );

    const pId = paymentId[0]?.id;

    // Mark daily logs as billed
    for (const log of unbilled) {
      await this.dailyRepo.update(log.id, { status: 'billed', billedPaymentId: pId });
    }

    this.logger.log(`💰 Faturadas ${unbilled.length} diárias de ${rental.code}: R$ ${totalValue}`);
    return { paymentId: pId, totalValue, count: unbilled.length };
  }

  // ═══ MEASUREMENT REPORT (Boletim de Medição) ═════════════════
  async getMeasurementReport(rentalId: string, startDate?: string, endDate?: string) {
    const rental = await this.getRentalById(rentalId);
    const qb = this.dailyRepo.createQueryBuilder('dl')
      .where('dl.rentalId = :rentalId', { rentalId })
      .andWhere('dl.deletedAt IS NULL')
      .orderBy('dl.date', 'ASC');

    if (startDate) qb.andWhere('dl.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('dl.date <= :endDate', { endDate });

    const logs = await qb.getMany();

    const summary = {
      totalDays: logs.length,
      totalNormalHours: 0, totalOvertimeHours: 0, totalNightHours: 0,
      totalNormalValue: 0, totalOvertimeValue: 0, totalNightValue: 0,
      totalHolidayValue: 0, totalWeekendValue: 0, totalValue: 0,
      holidayDays: 0, weekendDays: 0,
    };

    for (const log of logs) {
      summary.totalNormalHours += Number(log.normalHours || 0);
      summary.totalOvertimeHours += Number(log.overtimeHours || 0);
      summary.totalNightHours += Number(log.nightHours || 0);
      summary.totalNormalValue += Number(log.normalValue || 0);
      summary.totalOvertimeValue += Number(log.overtimeValue || 0);
      summary.totalNightValue += Number(log.nightValue || 0);
      summary.totalHolidayValue += Number(log.holidayValue || 0);
      summary.totalWeekendValue += Number(log.weekendValue || 0);
      summary.totalValue += Number(log.totalValue || 0);
      if (log.isHoliday) summary.holidayDays++;
      if (log.isWeekend) summary.weekendDays++;
    }

    return {
      rental: {
        id: rental.id, code: rental.code,
        equipment: rental.equipment, client: rental.client,
        operatorName: rental.operatorName,
        billingModality: rental.billingModality,
        unitRate: rental.unitRate,
        contractedHoursPerDay: rental.contractedHoursPerDay,
        overtimeMode: rental.overtimeMode, overtimeRate: rental.overtimeRate,
        nightMode: rental.nightMode, nightRate: rental.nightRate,
        holidayMode: rental.holidayMode, holidayRate: rental.holidayRate,
        weekendMode: rental.weekendMode, weekendRate: rental.weekendRate,
        includesOperator: rental.includesOperator,
        proposalClauses: rental.proposalClauses,
        startDate: rental.startDate, endDate: rental.endDate,
      },
      period: { startDate, endDate },
      logs,
      summary,
    };
  }

  // ═══ SERVICES CRUD ═══════════════════════════════════════════
  async getServices(): Promise<EquipmentServiceEntity[]> {
    return this.serviceRepo.find({ order: { createdAt: 'DESC' }, relations: ['equipment', 'client'] });
  }

  async getServiceById(id: string): Promise<EquipmentServiceEntity> {
    const s = await this.serviceRepo.findOne({ where: { id }, relations: ['equipment', 'client'] });
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return s;
  }

  async createService(data: Partial<EquipmentServiceEntity>): Promise<EquipmentServiceEntity> {
    const code = await this.generateUniqueCode('equipment_services', 'SRV');
    const totalValue = Number(data.unitRate || 0) * Number(data.quantity || 1);
    const svc = await this.serviceRepo.save(this.serviceRepo.create({ ...data, code, totalValue }));
    return this.getServiceById(svc.id);
  }

  async updateService(id: string, data: Partial<EquipmentServiceEntity>): Promise<EquipmentServiceEntity> {
    if (data.unitRate !== undefined || data.quantity !== undefined) {
      const old = await this.getServiceById(id);
      data.totalValue = Number(data.unitRate ?? old.unitRate) * Number(data.quantity ?? old.quantity);
    }
    await this.serviceRepo.update(id, data);
    return this.getServiceById(id);
  }

  async removeService(id: string): Promise<void> {
    await this.serviceRepo.softDelete(id);
  }

  async billService(id: string): Promise<any> {
    const svc = await this.getServiceById(id);
    if (svc.status === 'billed') throw new NotFoundException('Serviço já faturado');

    const paymentId = await this.dataSource.query(
      `INSERT INTO payments (id, description, amount, type, category, status, "dueDate", "clientId", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'income', 'equipment', 'pending', NOW() + interval '30 days',
               $3, $4, NOW(), NOW())
       RETURNING id`,
      [
        `Serviço ${svc.code} - ${svc.equipment?.name || ''} - ${svc.serviceType}`,
        Number(svc.totalValue),
        svc.clientId || null,
        `Serviço pontual ${svc.code}`,
      ],
    );

    const pId = paymentId[0]?.id;
    await this.serviceRepo.update(id, { status: 'billed', paymentId: pId });

    this.logger.log(`💰 Serviço ${svc.code} faturado: R$ ${svc.totalValue}`);
    return { paymentId: pId, totalValue: svc.totalValue };
  }

  // ═══ CHECKLIST CRUD ══════════════════════════════════════════
  async getChecklists(rentalId?: string): Promise<EquipmentChecklist[]> {
    const where: any = {};
    if (rentalId) where.rentalId = rentalId;
    return this.checklistRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['equipment', 'rental'] });
  }

  async createChecklist(data: Partial<EquipmentChecklist>): Promise<EquipmentChecklist> {
    const cl = await this.checklistRepo.save(this.checklistRepo.create(data));
    // Link to rental
    if (data.rentalId && data.type) {
      const field = data.type === 'departure' ? 'checklistDepartureId' : 'checklistReturnId';
      await this.rentalRepo.update(data.rentalId, { [field]: cl.id });
    }
    return this.checklistRepo.findOne({ where: { id: cl.id }, relations: ['equipment', 'rental'] });
  }

  async updateChecklist(id: string, data: Partial<EquipmentChecklist>): Promise<EquipmentChecklist> {
    await this.checklistRepo.update(id, data);
    return this.checklistRepo.findOne({ where: { id }, relations: ['equipment', 'rental'] });
  }

  // ═══ STATS / DASHBOARD ═══════════════════════════════════════
  async getStats() {
    const equipment = await this.equipRepo.find();
    const rentals = await this.rentalRepo.find({ relations: ['equipment'] });
    const services = await this.serviceRepo.find().catch(() => []);
    const dailyLogs = await this.dailyRepo.find().catch(() => []);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const available = equipment.filter(e => e.status === 'available').length;
    const rented = equipment.filter(e => e.status === 'rented').length;
    const inMaintenance = equipment.filter(e => e.status === 'maintenance').length;

    const activeRentals = rentals.filter(r => r.status === 'active').length;
    const monthlyRevenue = rentals
      .filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear &&
          (r.status === 'active' || r.status === 'completed');
      })
      .reduce((s, r) => s + Number(r.totalValue || 0), 0);

    const totalRevenue = rentals
      .filter(r => r.status === 'active' || r.status === 'completed')
      .reduce((s, r) => s + Number(r.totalValue || 0), 0);

    const servicesRevenue = services
      .filter(s => s.status === 'completed' || s.status === 'billed')
      .reduce((s, sv) => s + Number(sv.totalValue || 0), 0);

    const dailiesRevenue = dailyLogs
      .filter(d => d.status === 'billed')
      .reduce((s, d) => s + Number(d.totalValue || 0), 0);

    const maintenanceDue = equipment.filter(e =>
      e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) <= new Date(now.getTime() + 30 * 86400000)
    ).length;

    // Occupancy rate: rented / total
    const occupancyRate = equipment.length > 0 ? Math.round((rented / equipment.length) * 100) : 0;

    // Top equipment by rentals
    const topEquipment = [...equipment]
      .sort((a, b) => b.totalRentals - a.totalRentals)
      .slice(0, 5)
      .map(e => ({ id: e.id, name: e.name, code: e.code, totalRentals: e.totalRentals, totalHoursUsed: e.totalHoursUsed }));

    // Upcoming maintenances
    const upcomingMaintenance = equipment
      .filter(e => e.nextMaintenanceDate)
      .sort((a, b) => new Date(a.nextMaintenanceDate).getTime() - new Date(b.nextMaintenanceDate).getTime())
      .slice(0, 5)
      .map(e => ({ id: e.id, name: e.name, code: e.code, nextDate: e.nextMaintenanceDate }));

    // Monthly revenue chart (last 6 months)
    const monthlyChart: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      const rentalRev = rentals
        .filter(r => {
          const rd = new Date(r.createdAt);
          return rd.getMonth() === month && rd.getFullYear() === year &&
            (r.status === 'active' || r.status === 'completed');
        })
        .reduce((s, r) => s + Number(r.totalValue || 0), 0);

      const svcRev = services
        .filter(sv => {
          const sd = new Date(sv.createdAt);
          return sd.getMonth() === month && sd.getFullYear() === year &&
            (sv.status === 'completed' || sv.status === 'billed');
        })
        .reduce((s, sv) => s + Number(sv.totalValue || 0), 0);

      monthlyChart.push({ month: monthLabel, locacao: rentalRev, servicos: svcRev, total: rentalRev + svcRev });
    }

    return {
      totalEquipment: equipment.length, available, rented, inMaintenance,
      activeRentals, monthlyRevenue, totalRevenue, maintenanceDue,
      servicesRevenue, dailiesRevenue, occupancyRate,
      topEquipment, upcomingMaintenance, monthlyChart,
      totalServices: services.length,
      pendingDailies: dailyLogs.filter(d => d.status === 'registered').length,
    };
  }

  // ═══ DOCUMENTS CRUD ═══════════════════════════════════════════
  async getDocuments(equipmentId?: string): Promise<EquipmentDocument[]> {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    return this.docRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['equipment'] });
  }

  async createDocument(data: Partial<EquipmentDocument>): Promise<EquipmentDocument> {
    return this.docRepo.save(this.docRepo.create(data));
  }

  async updateDocument(id: string, data: Partial<EquipmentDocument>): Promise<EquipmentDocument> {
    await this.docRepo.update(id, data);
    return this.docRepo.findOne({ where: { id }, relations: ['equipment'] });
  }

  async removeDocument(id: string): Promise<void> {
    await this.docRepo.softDelete(id);
  }

  // ═══ LIFTING PLANS CRUD ═══════════════════════════════════════
  async getLiftingPlans(equipmentId?: string): Promise<EquipmentLiftingPlan[]> {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    return this.liftingRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['equipment', 'client'] });
  }

  async getLiftingPlanById(id: string): Promise<EquipmentLiftingPlan> {
    const plan = await this.liftingRepo.findOne({ where: { id }, relations: ['equipment', 'client'] });
    if (!plan) throw new NotFoundException('Plano de içamento não encontrado');
    return plan;
  }

  async createLiftingPlan(data: Partial<EquipmentLiftingPlan>): Promise<EquipmentLiftingPlan> {
    const code = await this.generateUniqueCode('equipment_lifting_plans', 'PI');
    return this.liftingRepo.save(this.liftingRepo.create({ ...data, code }));
  }

  async updateLiftingPlan(id: string, data: Partial<EquipmentLiftingPlan>): Promise<EquipmentLiftingPlan> {
    const { id: _id, code, equipment, client, createdAt, updatedAt, deletedAt, ...clean } = data as any;
    await this.liftingRepo.update(id, clean);
    return this.getLiftingPlanById(id);
  }

  async removeLiftingPlan(id: string): Promise<void> {
    await this.liftingRepo.softDelete(id);
  }

  // ═══ GENERATE RENTAL PROPOSAL ═════════════════════════════════
  // Creates a full Proposal from a Rental, with category-specific clauses
  // ═══════════════════════════════════════════════════════════════
  async generateRentalProposal(rentalId: string): Promise<any> {
    const rental = await this.getRentalById(rentalId);
    if (!rental) throw new NotFoundException('Locação não encontrada');

    const equipment = rental.equipment;
    if (!equipment) throw new NotFoundException('Equipamento da locação não encontrado');

    // ── Generate proposal number ──
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}-`;
    const result = await this.dataSource.query(
      `SELECT MAX(CAST(REPLACE("proposalNumber", $1, '') AS INTEGER)) as max_num
       FROM proposals WHERE "proposalNumber" LIKE $2`,
      [prefix, `${prefix}%`],
    );
    const maxNum = Number(result?.[0]?.max_num) || 0;
    const proposalNumber = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

    // ── Category label ──
    const CAT_LABELS: Record<string, string> = {
      munck: 'Munck', crane: 'Guindaste', truck: 'Caminhão', flatbed_truck: 'Caminhão Prancha',
      excavator: 'Retroescavadeira', backhoe: 'Pá Carregadeira', generator: 'Gerador',
      compressor: 'Compressor', aerial_platform: 'Plataforma Elevatória', forklift: 'Empilhadeira',
      concrete_mixer: 'Betoneira', welding_machine: 'Máquina de Solda', drill: 'Perfuratriz/Furadeira',
      roller: 'Rolo Compactador', mini_excavator: 'Mini Escavadeira', skid_loader: 'Mini Carregadeira',
      tractor: 'Trator', trailer: 'Carreta/Reboque', container: 'Container', scaffold: 'Andaime',
      water_truck: 'Caminhão Pipa', dump_truck: 'Caminhão Caçamba', boom_truck: 'Caminhão com Lança',
    };
    const catLabel = CAT_LABELS[equipment.category] || equipment.customCategory || equipment.category || 'Equipamento';

    // ── Billing modality ──
    const BILLING_LABELS: Record<string, string> = {
      daily: 'Diária', monthly: 'Mensal', hourly: 'Por Hora', fixed_period: 'Período Fechado',
    };
    const billingLabel = BILLING_LABELS[rental.billingModality || rental.billingType] || 'Diária';

    // ── Build title ──
    const title = `Locação de ${catLabel} — ${equipment.name}`;

    // ── Build scope with equipment specs ──
    const specs = equipment.specifications || {};
    const specLines = Object.entries(specs)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `• ${k}: ${v}`)
      .join('\n');

    const scope = [
      `EQUIPAMENTO: ${equipment.name}`,
      equipment.brand ? `Marca: ${equipment.brand}` : null,
      equipment.model ? `Modelo: ${equipment.model}` : null,
      equipment.year ? `Ano: ${equipment.year}` : null,
      equipment.plate ? `Placa: ${equipment.plate}` : null,
      equipment.serialNumber ? `Nº Série: ${equipment.serialNumber}` : null,
      `Categoria: ${catLabel}`,
      '',
      specLines ? `ESPECIFICAÇÕES TÉCNICAS:\n${specLines}` : null,
      '',
      `CONDIÇÕES DA LOCAÇÃO:`,
      `• Modalidade: ${billingLabel}`,
      `• Valor Unitário: R$ ${Number(rental.unitRate || 0).toFixed(2)}`,
      `• Quantidade: ${rental.quantity || 1}`,
      rental.contractedPeriodDays ? `• Período Contratado: ${rental.contractedPeriodDays} dias` : null,
      `• Horas/Dia Contratadas: ${rental.contractedHoursPerDay || 8}h`,
      `• Tipo: ${rental.rentalType === 'with_operator' ? 'Com Operador' : 'Sem Operador'}`,
      rental.includesOperator ? `• Operador: ${rental.operatorName || 'A definir'}` : null,
      '',
      rental.deliveryAddress ? `LOCAL DE ENTREGA:\n${rental.deliveryAddress}${rental.deliveryCity ? ', ' + rental.deliveryCity : ''}${rental.deliveryState ? '/' + rental.deliveryState : ''}` : null,
    ].filter(Boolean).join('\n');

    // ── Build clauses JSON ──
    const enabledClauses = (rental.proposalClauses || [])
      .filter((c: any) => c.enabled)
      .map((c: any) => c.text);

    // ── Build rental snapshot (adicionais, operador, etc.) ──
    const rentalSnapshot = JSON.stringify({
      rentalId: rental.id,
      rentalCode: rental.code,
      equipmentId: equipment.id,
      equipmentCode: equipment.code,
      equipmentName: equipment.name,
      equipmentCategory: equipment.category,
      equipmentBrand: equipment.brand,
      equipmentModel: equipment.model,
      equipmentYear: equipment.year,
      equipmentPlate: equipment.plate,
      equipmentSerialNumber: equipment.serialNumber,
      equipmentSpecs: equipment.specifications,
      billingModality: rental.billingModality || rental.billingType,
      unitRate: rental.unitRate,
      quantity: rental.quantity,
      totalValue: rental.totalValue,
      contractedPeriodDays: rental.contractedPeriodDays,
      contractedHoursPerDay: rental.contractedHoursPerDay,
      rentalType: rental.rentalType,
      includesOperator: rental.includesOperator,
      operatorName: rental.operatorName,
      operatorCostPerDay: rental.operatorCostPerDay,
      startDate: rental.startDate,
      endDate: rental.endDate,
      deliveryAddress: rental.deliveryAddress,
      deliveryCity: rental.deliveryCity,
      deliveryState: rental.deliveryState,
      overtimeMode: rental.overtimeMode,
      overtimeRate: rental.overtimeRate,
      nightMode: rental.nightMode,
      nightRate: rental.nightRate,
      holidayMode: rental.holidayMode,
      holidayRate: rental.holidayRate,
      weekendMode: rental.weekendMode,
      weekendRate: rental.weekendRate,
      clauses: enabledClauses,
      accessRestrictions: rental.accessRestrictions,
      clientResponsibilities: rental.clientResponsibilities,
      notes: rental.notes,
    });

    // ── Contractor obligations ──
    const contractorObligations = [
      'Disponibilizar o equipamento em perfeitas condições de operação e segurança.',
      rental.includesOperator ? 'Fornecer operador habilitado e certificado para operação do equipamento.' : null,
      'Realizar manutenções preventivas e corretivas de responsabilidade da CONTRATADA.',
      'Providenciar a mobilização e desmobilização do equipamento, salvo acordo em contrário.',
      'Manter documentação técnica e legal do equipamento atualizada.',
    ].filter(Boolean).join('\n');

    // ── Client obligations (from rental form + standard) ──
    const clientObl = [
      rental.clientResponsibilities || null,
      'Garantir acesso adequado e seguro ao local de operação do equipamento.',
      'Responsabilizar-se por danos causados por mau uso, negligência ou descumprimento das orientações técnicas.',
      'Efetuar os pagamentos nas datas e condições acordadas nesta proposta.',
    ].filter(Boolean).join('\n');

    // ── Insert proposal via raw SQL (avoids circular DI with ProposalsModule) ──
    const totalValue = Number(rental.totalValue) || (Number(rental.unitRate || 0) * Number(rental.quantity || 1));
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString();
    const startStr = rental.startDate ? new Date(rental.startDate).toISOString() : null;
    const endStr = rental.endDate ? new Date(rental.endDate).toISOString() : null;
    const deadlineDays = rental.contractedPeriodDays || null;

    const insertResult = await this.dataSource.query(
      `INSERT INTO proposals (
        id, "proposalNumber", title, "clientId", status, subtotal, total, "validUntil",
        scope, "paymentConditions", "activityType", "contractorObligations", "clientObligations",
        "pricingEngineData", "workDeadlineDays", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'draft', $4, $4, $5,
        $6, $7, 'locacao_equipamento', $8, $9,
        $10, $11, $12,
        NOW(), NOW()
      ) RETURNING id`,
      [
        proposalNumber,                                        // $1
        title,                                                 // $2
        rental.clientId || null,                               // $3
        totalValue,                                            // $4
        validUntil,                                            // $5
        scope,                                                 // $6
        `Pagamento conforme acordado entre as partes.`,        // $7
        contractorObligations,                                 // $8
        clientObl,                                             // $9
        rentalSnapshot,                                        // $10
        deadlineDays,                                          // $11
        rental.notes || null,                                  // $12
      ],
    );

    const proposalId = insertResult?.[0]?.id;
    if (!proposalId) throw new Error('Falha ao criar proposta de locação');

    // ── Link rental to proposal ──
    await this.rentalRepo.update(rentalId, { proposalId });

    this.logger.log(`✅ Proposta de locação ${proposalNumber} criada para rental ${rental.code} (equip: ${equipment.name})`);

    return {
      id: proposalId,
      proposalNumber,
      title,
      total: totalValue,
      rentalCode: rental.code,
    };
  }
}
