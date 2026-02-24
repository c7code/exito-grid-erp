import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClientSegment {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  CONDOMINIUM = 'condominium',
  PUBLIC = 'public',
}

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum ClientClassification {
  A = 'A',
  B = 'B',
  C = 'C',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ unique: true, nullable: true })
  document: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({
    type: 'enum',
    enum: ClientSegment,
    default: ClientSegment.RESIDENTIAL,
  })
  segment: ClientSegment;

  @Column({
    type: 'enum',
    enum: ClientType,
    default: ClientType.COMPANY,
  })
  type: ClientType;

  @Column({
    type: 'enum',
    enum: ClientClassification,
    default: ClientClassification.C,
  })
  classification: ClientClassification;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  concessionaria: string;

  @Column({ nullable: true })
  consumptionKwh: number;

  @Column({ nullable: true })
  installedPower: number;

  @Column({ nullable: true })
  voltage: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  ltv: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ default: true })
  hasPortalAccess: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastContactAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
