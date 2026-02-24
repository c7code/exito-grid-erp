import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Work } from '../works/work.entity';
import { User } from '../users/user.entity';

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum ClientSegment {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  CONDOMINIUM = 'condominium',
  PUBLIC = 'public',
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

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  document: string;

  @Column({
    type: 'enum',
    enum: ClientType,
    default: ClientType.COMPANY,
  })
  type: ClientType;

  @Column({
    type: 'enum',
    enum: ClientSegment,
    default: ClientSegment.RESIDENTIAL,
  })
  segment: ClientSegment;

  @Column({ nullable: true })
  companyName: string;

  @Column({
    type: 'enum',
    enum: ClientClassification,
    default: ClientClassification.C,
  })
  classification: ClientClassification;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ nullable: true })
  concessionaria: string;

  @Column({ nullable: true })
  consumptionKwh: number;

  @Column({ nullable: true })
  installedPower: number;

  @Column({ nullable: true })
  voltage: string;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  ltv: number;

  @Column({ nullable: true })
  lastContactAt: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ default: true })
  hasPortalAccess: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'accountManagerId' })
  accountManager: User;

  @OneToMany(() => Work, (work) => work.client)
  works: Work[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
