import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CatalogItem } from '../catalog/catalog.entity';

// ============================================================
// STRUCTURE TEMPLATE — Templates de estrutura (CE4, B1, N1...)
// ============================================================

@Entity('structure_templates')
export class StructureTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;                      // "CE4", "B1", "N1"

    @Column()
    name: string;                      // "Estrutura CE4 - Rede BT Monofásica"

    @Column({ nullable: true })
    concessionaria: string;            // "neoenergia", "cemig", "enel"

    @Column({ nullable: true })
    normCode: string;                  // "NTD-001", "NDU-001"

    @Column({ nullable: true })
    tensionLevel: string;              // "BT", "MT", "AT"

    @Column({ nullable: true })
    category: string;                  // "extensao_rede", "subestacao", "padrao_entrada"

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    diagramUrl: string;                // URL da imagem do diagrama

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];                    // Tags livres: ["monofasico", "poste_9m", "rural"]

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => StructureTemplateItem, (item) => item.template, {
        cascade: true,
        eager: true,
    })
    items: StructureTemplateItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

// ============================================================
// STRUCTURE TEMPLATE ITEM — Item de material da estrutura
// ============================================================

@Entity('structure_template_items')
export class StructureTemplateItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    templateId: string;

    @ManyToOne(() => StructureTemplate, (t) => t.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'templateId' })
    template: StructureTemplate;

    @Column({ nullable: true })
    catalogItemId: string;             // Vínculo com CatalogItem (pode ser null se ainda não cadastrado)

    @ManyToOne(() => CatalogItem, { nullable: true, eager: true })
    @JoinColumn({ name: 'catalogItemId' })
    catalogItem: CatalogItem;

    @Column()
    description: string;               // Descrição do material (fallback se não tem no catálogo)

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
    quantity: number;

    @Column({ default: 'UN' })
    unit: string;

    @Column({ default: false })
    isOptional: boolean;               // Material opcional na estrutura

    @Column({ type: 'int', default: 0 })
    sortOrder: number;                 // Ordem de exibição

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
