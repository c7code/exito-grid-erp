import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Equipment, EquipmentRental, EquipmentMaintenance, EquipmentDailyLog, EquipmentService as EquipmentServiceEntity, EquipmentChecklist } from './equipment.entity';

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
    ];

    for (const sql of tables) {
      try { await this.dataSource.query(sql); } catch (e) {
        this.logger.warn('Table creation: ' + e?.message);
      }
    }

    // Ensure new columns on existing tables
    const cols = [
      { table: 'equipment', col: 'operatorIds', type: 'TEXT' },
      { table: 'equipment_rentals', col: 'checklistDepartureId', type: 'UUID' },
      { table: 'equipment_rentals', col: 'checklistReturnId', type: 'UUID' },
    ];
    for (const { table, col, type } of cols) {
      try {
        await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      } catch (e) { this.logger.warn(`Col ${col}: ${e?.message}`); }
    }

    this.logger.log('Equipment module tables/columns ensured');
  }

  // ═══ EQUIPMENT CRUD ══════════════════════════════════════════
  async getAll(): Promise<Equipment[]> {
    return this.equipRepo.find({ order: { code: 'ASC' }, relations: ['rentals'] });
  }

  async getById(id: string): Promise<Equipment> {
    const eq = await this.equipRepo.findOne({ where: { id }, relations: ['rentals', 'maintenances'] });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    return eq;
  }

  async create(data: Partial<Equipment>): Promise<Equipment> {
    const count = await this.equipRepo.count();
    const code = `EQ-${String(count + 1).padStart(4, '0')}`;
    return this.equipRepo.save(this.equipRepo.create({ ...data, code }));
  }

  async update(id: string, data: Partial<Equipment>): Promise<Equipment> {
    await this.equipRepo.update(id, data);
    return this.getById(id);
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
    const count = await this.rentalRepo.count();
    const code = `LOC-${String(count + 1).padStart(4, '0')}`;
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
    const totalValue = Number(data.dailyRate || 0) * Math.max(Number(data.hoursWorked || 0) / 8, 1);
    const log = this.dailyRepo.create({ ...data, totalValue });
    const saved = await this.dailyRepo.save(log);
    // Update equipment hours
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
    const count = await this.serviceRepo.count();
    const code = `SRV-${String(count + 1).padStart(4, '0')}`;
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
}
