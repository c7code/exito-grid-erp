import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';

// ============================================================
// SINAPI COMPOSITION — Composição de serviço SINAPI
// ============================================================

@Entity('sinapi_compositions')
@Index(['code'], { unique: true })
export class SinapiComposition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;                      // Código composição: "87529"

    @Column({ type: 'text' })
    description: string;               // Descrição oficial

    @Column()
    unit: string;                      // UN, M, M2, M3

    @Column({ nullable: true })
    classCode: string;                 // Classe/família

    @Column({ nullable: true })
    className: string;                 // Nome da classe

    @Column({ default: 'composition' })
    type: string;                      // 'composition' | 'composition_family'

    @Column({ default: true })
    isActive: boolean;

    @OneToMany('SinapiCompositionItem', 'composition')
    items: any[];

    @OneToMany('SinapiCompositionPrice', 'composition')
    prices: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
