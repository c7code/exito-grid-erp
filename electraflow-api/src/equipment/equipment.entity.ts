import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Client } from '../clients/client.entity';

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT — Cadastro de Equipamentos
// ══════════════════════════════════════════════════════════════════
@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'mobile' })
  type: string; // 'mobile' | 'stationary'

  @Column({ type: 'varchar', default: 'munck' })
  category: string; // 'munck' | 'generator' | 'excavator' | 'crane' | 'truck' | 'other'

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  plate: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  chassisNumber: string;

  @Column({ type: 'varchar', default: 'available' })
  status: string; // 'available' | 'rented' | 'maintenance' | 'inactive'

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyRate: number;

  @Column({ nullable: true })
  currentOperatorId: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  lastMaintenanceDate: Date;

  @Column({ nullable: true })
  nextMaintenanceDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0 })
  totalHoursUsed: number;

  @Column({ default: 0 })
  totalRentals: number;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => EquipmentRental, r => r.equipment)
  rentals: EquipmentRental[];

  @OneToMany(() => EquipmentMaintenance, m => m.equipment)
  maintenances: EquipmentMaintenance[];
}

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT RENTAL — Locações
// ══════════════════════════════════════════════════════════════════
@Entity('equipment_rentals')
export class EquipmentRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment, e => e.rentals)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  operatorId: string; // FK Employee (nullable = sem operador)

  @Column({ nullable: true })
  operatorName: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: string; // 'draft' | 'quoted' | 'confirmed' | 'active' | 'completed' | 'cancelled'

  @Column({ type: 'varchar', default: 'with_operator' })
  rentalType: string; // 'with_operator' | 'without_operator'

  @Column({ type: 'varchar', default: 'daily' })
  billingType: string; // 'hourly' | 'daily' | 'monthly' | 'fixed'

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  actualEndDate: Date;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryCity: string;

  @Column({ nullable: true })
  deliveryState: string;

  @Column({ nullable: true })
  proposalId: string;

  @Column({ nullable: true })
  contractId: string;

  @Column({ nullable: true })
  serviceOrderId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT MAINTENANCE — Manutenções
// ══════════════════════════════════════════════════════════════════
@Entity('equipment_maintenance')
export class EquipmentMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment, e => e.maintenances)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ type: 'varchar', default: 'preventive' })
  type: string; // 'preventive' | 'corrective' | 'inspection'

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cost: number;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ nullable: true })
  performedAt: Date;

  @Column({ nullable: true })
  nextDueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  nextDueHours: number;

  @Column({ type: 'varchar', default: 'scheduled' })
  status: string; // 'scheduled' | 'in_progress' | 'completed'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
