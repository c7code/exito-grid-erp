import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;                       // Razão social

    @Column({ nullable: true })
    tradeName: string;                  // Nome fantasia

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    stateRegistration: string;          // Inscrição estadual

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    website: string;

    // Endereço
    @Column({ nullable: true })
    cep: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    neighborhood: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    // Identidade visual
    @Column({ nullable: true })
    logoUrl: string;                    // Path/URL do logo

    @Column({ nullable: true })
    primaryColor: string;               // Cor principal (hex)

    @Column({ nullable: true })
    secondaryColor: string;             // Cor secundária (hex)

    @Column({ nullable: true })
    accentColor: string;                // Cor de destaque (hex)

    // Tipo
    @Column({ type: 'boolean', default: true })
    isPrimary: boolean;                 // Empresa matriz

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
