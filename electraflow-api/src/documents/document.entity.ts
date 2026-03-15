import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Work } from '../works/work.entity';

export enum DocumentType {
  PROJECT = 'project',
  REPORT = 'report',
  ART = 'art',
  MEMORIAL = 'memorial',
  PHOTO = 'photo',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  CERTIFICATE = 'certificate',
  PROTOCOL = 'protocol',
  NORM = 'norm',
  POP = 'pop',
  SUPPLIER_CATALOG = 'supplier_catalog',
  OTHER = 'other',
}

export enum DocumentPurpose {
  NORMA_TECNICA = 'norma_tecnica',           // Norma técnica (ABNT, concessionária)
  POP = 'pop',                               // Procedimento Operacional Padrão
  CATALOGO_FORNECEDOR = 'catalogo_fornecedor',// Catálogo/lista de material de fornecedor
  MANUAL = 'manual',                         // Manual de equipamento
  PROJETO_TIPO = 'projeto_tipo',             // Projeto tipo / padrão
  TABELA_PRECO = 'tabela_preco',             // Tabela de preços
  BOOK_ESTRUTURAS = 'book_estruturas',       // Book de estruturas da concessionária
  DOCUMENTACAO_OBRA = 'documentacao_obra',   // Documentação de obra
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('document_folders')
export class DocumentFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => DocumentFolder, folder => folder.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: DocumentFolder;

  @OneToMany(() => DocumentFolder, folder => folder.parent)
  children: DocumentFolder[];

  @OneToMany(() => Document, doc => doc.folder)
  documents: Document[];

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  fileName: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work, work => work.documents, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  folderId: string;

  @ManyToOne(() => DocumentFolder, folder => folder.documents, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folderId' })
  folder: DocumentFolder;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  proposalId: string;

  @Column({ nullable: true })
  contractId: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previousVersionId: string;

  @Column({ nullable: true })
  uploadedById: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  taskId: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  originalName: string; // compatibility with system/erp (mapped to fileName)

  @Column({ nullable: true })
  filePath: string; // compatibility with system/erp (mapped to url)

  @Column({ type: 'text', nullable: true })
  description: string;

  // ═══════════════════════════════════════════════════════════════
  // CAMPOS PARA IA
  // ═══════════════════════════════════════════════════════════════

  @Column({ nullable: true })
  purpose: string;                  // Finalidade: 'norma_tecnica' | 'pop' | 'catalogo_fornecedor' | 'manual' | etc.

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];                   // Tags livres: ["neoenergia", "BT", "CE4", "poste_9m"]

  @Column({ type: 'text', nullable: true })
  extractedText: string;            // Texto extraído do PDF (para futura IA)

  @Column({ default: false })
  textExtracted: boolean;           // Flag: texto já foi extraído

  @Column({ nullable: true })
  sourceOrganization: string;       // Origem: "ABNT", "Neoenergia", "CEMIG", nome do fornecedor

  // ── Audit Trail ──
  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
