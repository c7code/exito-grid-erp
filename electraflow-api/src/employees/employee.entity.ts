import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { EmployeeDocument } from './employee-document.entity';
import { Work } from '../works/work.entity';

export enum EmployeeRole {
    ADMINISTRATIVE = 'administrative',
    OPERATIONAL = 'operational',
    ENGINEERING = 'engineering',
}

export enum EmployeeStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum EmploymentType {
    CLT = 'clt',
    CONTRACT = 'contract',       // empreiteiro
    OUTSOURCED = 'outsourced',   // terceirizado pontual
}

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: EmployeeRole,
        default: EmployeeRole.OPERATIONAL,
    })
    role: EmployeeRole;

    @Column({ nullable: true })
    specialty: string;

    @Column({
        type: 'enum',
        enum: EmployeeStatus,
        default: EmployeeStatus.ACTIVE,
    })
    status: EmployeeStatus;

    @Column({
        type: 'enum',
        enum: EmploymentType,
        default: EmploymentType.CLT,
    })
    employmentType: EmploymentType;

    @Column({ nullable: true })
    workId: string;

    @ManyToOne(() => Work, { nullable: true })
    @JoinColumn({ name: 'workId' })
    work: Work;

    @Column({ nullable: true })
    hiredAt: Date;

    @Column({ nullable: true })
    cpf: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    city: string;

    @OneToMany('EmployeeDocument', 'employee')
    documents: EmployeeDocument[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
