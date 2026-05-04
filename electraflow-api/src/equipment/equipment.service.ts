import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentRental, EquipmentMaintenance } from './equipment.entity';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment) private equipRepo: Repository<Equipment>,
    @InjectRepository(EquipmentRental) private rentalRepo: Repository<EquipmentRental>,
    @InjectRepository(EquipmentMaintenance) private maintRepo: Repository<EquipmentMaintenance>,
  ) {}

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
    const r = await this.rentalRepo.findOne({ where: { id }, relations: ['equipment', 'client'] });
    if (!r) throw new NotFoundException('Locação não encontrada');
    return r;
  }

  async createRental(data: Partial<EquipmentRental>): Promise<EquipmentRental> {
    const count = await this.rentalRepo.count();
    const code = `LOC-${String(count + 1).padStart(4, '0')}`;
    const rental = await this.rentalRepo.save(this.rentalRepo.create({ ...data, code }));
    // Atualizar status do equipamento
    if (data.status === 'active' || data.status === 'confirmed') {
      await this.equipRepo.update(data.equipmentId, { status: 'rented' });
    }
    // Incrementar totalRentals
    await this.equipRepo.increment({ id: data.equipmentId }, 'totalRentals', 1);
    return this.getRentalById(rental.id);
  }

  async updateRental(id: string, data: Partial<EquipmentRental>): Promise<EquipmentRental> {
    const old = await this.getRentalById(id);
    await this.rentalRepo.update(id, data);
    // Se completou ou cancelou → libera equipamento
    if ((data.status === 'completed' || data.status === 'cancelled') && old.status !== data.status) {
      const activeRentals = await this.rentalRepo.count({
        where: { equipmentId: old.equipmentId, status: 'active' },
      });
      if (activeRentals <= 1) {
        await this.equipRepo.update(old.equipmentId, { status: 'available' });
      }
    }
    // Se ativou → marca como locado
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
    // Se manutenção ativa → marca equipamento em manutenção
    if (data.status === 'in_progress') {
      await this.equipRepo.update(data.equipmentId, { status: 'maintenance' });
    }
    // Se completou → atualiza data da última manutenção
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

  // ═══ STATS ═══════════════════════════════════════════════════
  async getStats() {
    const equipment = await this.equipRepo.find();
    const rentals = await this.rentalRepo.find({ relations: ['equipment'] });
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

    const maintenanceDue = equipment.filter(e =>
      e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) <= new Date(now.getTime() + 30 * 86400000)
    ).length;

    return {
      totalEquipment: equipment.length, available, rented, inMaintenance,
      activeRentals, monthlyRevenue, totalRevenue, maintenanceDue,
    };
  }
}
