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

  // Operadores vinculados (array de employeeId)
  @Column({ type: 'simple-json', nullable: true })
  operatorIds: string[];

  // Especificações técnicas (JSON dinâmico por categoria)
  @Column({ type: 'simple-json', nullable: true })
  specifications: Record<string, any>;

  // Categoria customizada (se category = 'other')
  @Column({ nullable: true })
  customCategory: string;

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
  operatorId: string;

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

  @Column({ nullable: true })
  checklistDepartureId: string;

  @Column({ nullable: true })
  checklistReturnId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ─── Modalidade e Adicionais ───
  @Column({ type: 'varchar', default: 'daily' })
  billingModality: string; // 'daily' | 'monthly' | 'hourly' | 'fixed_period'

  @Column({ type: 'int', nullable: true })
  contractedPeriodDays: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 8 })
  contractedHoursPerDay: number;

  // Adicional Hora Extra
  @Column({ type: 'varchar', default: 'percent' })
  overtimeMode: string; // 'percent' | 'fixed'

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 50 })
  overtimeRate: number; // % ou valor fixo

  // Adicional Noturno
  @Column({ type: 'varchar', default: 'percent' })
  nightMode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 30 })
  nightRate: number;

  // Adicional Feriado
  @Column({ type: 'varchar', default: 'percent' })
  holidayMode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 100 })
  holidayRate: number;

  // Adicional Fim de Semana
  @Column({ type: 'varchar', default: 'percent' })
  weekendMode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 50 })
  weekendRate: number;

  // Operador
  @Column({ default: true })
  includesOperator: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  operatorCostPerDay: number;

  // Cláusulas e Responsabilidades
  @Column({ type: 'simple-json', nullable: true })
  proposalClauses: Array<{ text: string; enabled: boolean }>;

  @Column({ type: 'text', nullable: true })
  accessRestrictions: string;

  @Column({ type: 'text', nullable: true })
  clientResponsibilities: string;

  @Column({ type: 'text', nullable: true })
  measurementNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => EquipmentDailyLog, d => d.rental)
  dailyLogs: EquipmentDailyLog[];
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

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT DAILY LOG — Controle de Diárias
// ══════════════════════════════════════════════════════════════════
@Entity('equipment_daily_logs')
export class EquipmentDailyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rentalId: string;

  @ManyToOne(() => EquipmentRental, r => r.dailyLogs)
  @JoinColumn({ name: 'rentalId' })
  rental: EquipmentRental;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ nullable: true })
  operatorId: string;

  @Column({ nullable: true })
  operatorName: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  hoursWorked: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ─── Detalhamento de Horas ───
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  normalHours: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  overtimeHours: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  nightHours: number;

  @Column({ default: false })
  isHoliday: boolean;

  @Column({ default: false })
  isWeekend: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  normalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  overtimeValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  nightValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  holidayValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  weekendValue: number;

  @Column({ nullable: true })
  startTime: string; // "07:00"

  @Column({ nullable: true })
  endTime: string; // "17:00"

  @Column({ nullable: true })
  workLocation: string;

  @Column({ type: 'varchar', default: 'pending' })
  clientApproval: string; // 'pending' | 'approved' | 'disputed'

  @Column({ type: 'text', nullable: true })
  clientApprovalNote: string;

  @Column({ type: 'varchar', default: 'registered' })
  status: string; // 'registered' | 'billed' | 'cancelled'

  @Column({ nullable: true })
  billedPaymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

// ══════════════════════════════════════════════════════════════════
// EQUIPMENT SERVICE — Serviços Pontuais (Içamento, Transporte)
// ══════════════════════════════════════════════════════════════════
@Entity('equipment_services')
export class EquipmentService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  operatorId: string;

  @Column({ nullable: true })
  operatorName: string;

  @Column({ type: 'varchar', default: 'lifting' })
  serviceType: string; // 'lifting' | 'transport' | 'installation' | 'removal' | 'other'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'varchar', default: 'draft' })
  status: string; // 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'billed'

  @Column({ nullable: true })
  proposalId: string;

  @Column({ nullable: true })
  paymentId: string;

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
// EQUIPMENT CHECKLIST — Vistoria de Saída/Retorno
// ══════════════════════════════════════════════════════════════════
@Entity('equipment_checklists')
export class EquipmentChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  rentalId: string;

  @ManyToOne(() => EquipmentRental)
  @JoinColumn({ name: 'rentalId' })
  rental: EquipmentRental;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ type: 'varchar', default: 'departure' })
  type: string; // 'departure' | 'return'

  @Column({ nullable: true })
  inspectorName: string;

  @Column({ nullable: true })
  inspectedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  items: Array<{ item: string; category: string; ok: boolean; observations?: string }>;

  @Column({ type: 'text', nullable: true })
  generalNotes: string;

  @Column({ type: 'decimal', precision: 12, scale: 1, nullable: true })
  odometerReading: number;

  @Column({ nullable: true })
  fuelLevel: string; // 'empty' | '1/4' | '1/2' | '3/4' | 'full'

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'pending' | 'completed'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
