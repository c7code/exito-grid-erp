import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';

// ═══ CONCESSIONÁRIAS (pré-definidas) ═══
export enum Concessionaria {
    CELPE = 'CELPE',
    NEOENERGIA = 'NEOENERGIA',
    CEMIG = 'CEMIG',
    ENEL = 'ENEL',
    CPFL = 'CPFL',
    ENERGISA = 'ENERGISA',
    COPEL = 'COPEL',
    LIGHT = 'LIGHT',
    EQUATORIAL = 'EQUATORIAL',
    COELBA = 'COELBA',
    COSERN = 'COSERN',
    ELEKTRO = 'ELEKTRO',
    OTHER = 'OTHER',
}

export enum NormCategory {
    INSTALLATION = 'installation',       // Normas de instalação
    MEASUREMENT = 'measurement',         // Normas de medição
    PROTECTION = 'protection',           // Normas de proteção
    CONNECTION = 'connection',           // Normas de conexão
    SOLAR = 'solar',                     // Normas específicas solar
    QUALITY = 'quality',                 // Qualidade de energia
    SAFETY = 'safety',                   // Segurança
    GENERAL = 'general',                 // Geral
}

export enum TensionLevel {
    BT = 'BT',   // Baixa Tensão
    MT = 'MT',   // Média Tensão
    AT = 'AT',   // Alta Tensão
    ALL = 'ALL', // Todas
}

// ═══ NORMA TÉCNICA (o PDF) ═══
@Entity('technical_norms')
export class TechnicalNorm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;                       // Ex: "NTD-001 — Fornecimento de Energia em BT"

    @Column({ nullable: true })
    normCode: string;                    // Ex: "NTD-001", "GED-13"

    @Column({ type: 'varchar', default: Concessionaria.CELPE })
    concessionaria: string;              // Qual concessionária

    @Column({ type: 'varchar', default: NormCategory.GENERAL })
    category: string;                    // Categoria da norma

    @Column({ type: 'varchar', default: TensionLevel.ALL })
    tensionLevel: string;                // BT, MT, AT

    @Column({ nullable: true })
    description: string;                 // Descrição breve

    // ═══ ARQUIVO PDF ═══
    @Column({ nullable: true })
    fileName: string;                    // Nome original do arquivo

    @Column({ nullable: true })
    filePath: string;                    // Caminho no disco

    @Column({ type: 'int', default: 0 })
    fileSize: number;                    // Tamanho em bytes

    @Column({ type: 'int', default: 0 })
    pageCount: number;                   // Número de páginas

    // ═══ TEXTO EXTRAÍDO ═══
    @Column({ type: 'text', nullable: true })
    extractedText: string;               // Texto completo extraído do PDF

    @Column({ type: 'boolean', default: false })
    textExtracted: boolean;              // Se o texto já foi extraído

    // ═══ TAGS ═══
    @Column({ type: 'simple-array', nullable: true })
    tags: string[];                      // Tags para busca (ex: "aterramento", "medição", "poste")

    // ═══ VERSÃO ═══
    @Column({ nullable: true })
    version: string;                     // Ex: "2023", "Rev. 5"

    @Column({ nullable: true })
    publishDate: string;                 // Data de publicação da norma

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // ═══ CHUNKS (para futura IA) ═══
    @OneToMany(() => NormChunk, chunk => chunk.norm, { cascade: true })
    chunks: NormChunk[];

    // ═══ TIMESTAMPS ═══
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

// ═══ CHUNK DE TEXTO (para busca e futura IA/RAG) ═══
@Entity('norm_chunks')
export class NormChunk {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    normId: string;

    @ManyToOne(() => TechnicalNorm, norm => norm.chunks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'normId' })
    norm: TechnicalNorm;

    @Column({ type: 'int' })
    chunkIndex: number;                  // Ordem do chunk

    @Column({ type: 'text' })
    content: string;                     // Texto do chunk (~500 palavras)

    @Column({ type: 'int', nullable: true })
    pageNumber: number;                  // Página de origem (aproximada)

    // ═══ FUTURO: embedding vector (quando tiver API key) ═══
    // @Column({ type: 'simple-json', nullable: true })
    // embedding: number[];

    @CreateDateColumn()
    createdAt: Date;
}
