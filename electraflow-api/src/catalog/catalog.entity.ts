import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

export enum CatalogType {
    MATERIAL = 'material',
    SERVICE = 'service',
}

@Entity('catalog_categories')
export class CatalogCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: CatalogType })
    type: CatalogType;

    @Column({ nullable: true })
    parentId: string;

    @ManyToOne(() => CatalogCategory, (category) => category.children, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent: CatalogCategory;

    @OneToMany(() => CatalogCategory, (category) => category.parent)
    children: CatalogCategory[];

    @OneToMany(() => CatalogItem, (item) => item.category)
    items: CatalogItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('catalog_items')
export class CatalogItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitPrice: number;

    @Column({ nullable: true })
    unit: string; // e.g., 'm', 'kg', 'h', 'un'

    @Column()
    categoryId: string;

    @ManyToOne(() => CatalogCategory, (category) => category.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: CatalogCategory;

    @Column({ type: 'enum', enum: CatalogType })
    type: CatalogType;

    // ═══════════════════════════════════════════════════════════════
    // DETALHES DO PRODUTO
    // ═══════════════════════════════════════════════════════════════

    @Column({ nullable: true })
    sku: string;                           // Código interno / SKU

    @Column({ nullable: true })
    barcode: string;                       // Código de barras / EAN

    @Column({ default: true })
    isActive: boolean;                     // Produto ativo

    @Column({ default: true })
    isSoldSeparately: boolean;             // Vendido separadamente

    @Column({ default: false })
    isPos: boolean;                        // Comercializável no PDV

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    commission: number;                    // Comissão (%)

    @Column({ nullable: true })
    brand: string;                         // Marca

    @Column({ nullable: true })
    model: string;                         // Modelo

    // ═══════════════════════════════════════════════════════════════
    // DIMENSÕES / PESO
    // ═══════════════════════════════════════════════════════════════

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    weight: number;                        // Peso (kg)

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    width: number;                         // Largura (m)

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    height: number;                        // Altura (m)

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    length: number;                        // Comprimento (m)

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    grossWeight: number;                   // Peso bruto

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    netWeight: number;                     // Peso líquido

    // ═══════════════════════════════════════════════════════════════
    // DADOS FISCAIS
    // ═══════════════════════════════════════════════════════════════

    @Column({ nullable: true })
    ncm: string;                           // NCM (8 dígitos)

    @Column({ nullable: true })
    cest: string;                          // CEST (7 dígitos)

    @Column({ nullable: true })
    cfopInterno: string;                   // CFOP interno (ex: 5102)

    @Column({ nullable: true })
    cfopInterestadual: string;             // CFOP interestadual (ex: 6102)

    @Column({ type: 'int', default: 0 })
    origem: number;                        // Origem 0-8 (tabela SEFAZ)

    @Column({ nullable: true })
    codigoBeneficio: string;               // Código benefício fiscal

    @Column({ nullable: true, default: 'nao_usar' })
    produtoEspecifico: string;             // 'nao_usar' | tipo

    @Column({ nullable: true })
    numeroFci: string;                     // Número FCI

    // ═══════════════════════════════════════════════════════════════
    // ESTOQUE
    // ═══════════════════════════════════════════════════════════════

    @Column({ default: false })
    trackStock: boolean;                   // Controlar estoque

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    currentStock: number;                  // Estoque atual

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    minStock: number;                      // Estoque mínimo (alerta)

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    maxStock: number;                      // Estoque máximo

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    reservedStock: number;                 // Reservado (propostas aprovadas)

    @Column({ nullable: true })
    stockLocation: string;                 // Localização (galpão, prateleira)

    // ═══════════════════════════════════════════════════════════════
    // VALORES EXTRAS
    // ═══════════════════════════════════════════════════════════════

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    costPrice: number;                     // Preço de custo

    @Column({ type: 'jsonb', nullable: true })
    extraFields: Record<string, string>[]; // Campos extras dinâmicos

    // ═══════════════════════════════════════════════════════════════
    // RELACIONAMENTOS
    // ═══════════════════════════════════════════════════════════════

    @OneToMany('ProductSupplier', 'catalogItem')
    productSuppliers: any[];

    @OneToMany('StockMovement', 'catalogItem')
    stockMovements: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
