import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Document, DocumentFolder, DocumentType, FolderCategory } from './document.entity';

@Injectable()
export class DocumentsService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentFolder)
    private folderRepository: Repository<DocumentFolder>,
    @InjectRepository(FolderCategory)
    private categoryRepository: Repository<FolderCategory>,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {
    try {
      // ══════════════════════════════════════════════════════════════════════
      // Migração automática — colunas e tabelas (seguro com IF NOT EXISTS)
      // ══════════════════════════════════════════════════════════════════════

      // 1. Tabela de categorias de pasta
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS document_folder_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR UNIQUE NOT NULL,
          color VARCHAR,
          icon VARCHAR,
          "sortOrder" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT now()
        );
      `);

      // 2. Colunas extras em document_folders
      await this.dataSource.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_folders' AND column_name='clientId') THEN
            ALTER TABLE document_folders ADD COLUMN "clientId" UUID;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_folders' AND column_name='category') THEN
            ALTER TABLE document_folders ADD COLUMN category VARCHAR;
          END IF;
        END $$;
      `);

      // 3. Corrigir tipos de colunas em documents que estão como VARCHAR mas deveriam ser UUID
      //    (clientId, proposalId, contractId — necessário para FK constraints)
      await this.dataSource.query(`
        DO $$ BEGIN
          -- clientId: varchar → uuid
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='documents' AND column_name='clientId' AND udt_name != 'uuid'
          ) THEN
            -- Dropar FK constraints que referenciam essa coluna (se existirem)
            IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_document_client' AND table_name='documents') THEN
              ALTER TABLE documents DROP CONSTRAINT "FK_document_client";
            END IF;
            -- Converter coluna (valores existentes que não sejam UUID válidos ficam NULL)
            ALTER TABLE documents ALTER COLUMN "clientId" TYPE UUID USING "clientId"::uuid;
            RAISE NOTICE 'documents.clientId convertido para UUID';
          END IF;

          -- proposalId: varchar → uuid (se necessário)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='documents' AND column_name='proposalId' AND udt_name != 'uuid'
          ) THEN
            ALTER TABLE documents ALTER COLUMN "proposalId" TYPE UUID USING CASE WHEN "proposalId" ~ '^[0-9a-f]{8}-' THEN "proposalId"::uuid ELSE NULL END;
            RAISE NOTICE 'documents.proposalId convertido para UUID';
          END IF;

          -- contractId: varchar → uuid (se necessário)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='documents' AND column_name='contractId' AND udt_name != 'uuid'
          ) THEN
            ALTER TABLE documents ALTER COLUMN "contractId" TYPE UUID USING CASE WHEN "contractId" ~ '^[0-9a-f]{8}-' THEN "contractId"::uuid ELSE NULL END;
            RAISE NOTICE 'documents.contractId convertido para UUID';
          END IF;
        END $$;
      `);

      // 4. FK constraints (agora com tipos compatíveis)
      await this.dataSource.query(`
        DO $$ BEGIN
          -- FK document_folders.clientId → clients
          IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_folder_client') THEN
            ALTER TABLE document_folders ADD CONSTRAINT "FK_folder_client" FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL;
          END IF;

          -- FK documents.clientId → clients
          IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_document_client') THEN
            ALTER TABLE documents ADD CONSTRAINT "FK_document_client" FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);

      this.logger.log('✅ Migração de documentos concluída com sucesso');
    } catch (error) {
      this.logger.warn(`⚠️ Migração de documentos (não-crítico): ${error.message}`);
    }
  }

  // ========== DOCUMENTOS ==========

  async findAll(filters?: {
    workId?: string;
    type?: DocumentType;
    folderId?: string;
    proposalId?: string;
    contractId?: string;
    clientId?: string;
  }): Promise<Document[]> {
    const where: any = {};
    if (filters?.workId) where.workId = filters.workId;
    if (filters?.type) where.type = filters.type;
    if (filters?.folderId) where.folderId = filters.folderId;
    if (filters?.proposalId) where.proposalId = filters.proposalId;
    if (filters?.contractId) where.contractId = filters.contractId;
    if (filters?.clientId) where.clientId = filters.clientId;
    return this.documentRepository.find({
      where,
      relations: ['work', 'folder'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByWork(workId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { workId },
      relations: ['folder'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['work', 'folder'],
    });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado');
    }
    return doc;
  }

  async create(docData: Partial<Document>): Promise<Document> {
    const doc = this.documentRepository.create(docData);
    const saved = await this.documentRepository.save(doc);
    return this.findOne(saved.id);
  }

  async update(id: string, docData: Partial<Document>): Promise<Document> {
    const doc = await this.findOne(id);
    Object.assign(doc, docData);
    const saved = await this.documentRepository.save(doc);
    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    await this.documentRepository.softRemove(doc);
  }

  // ========== PASTAS ==========

  async findFolders(workId?: string, clientId?: string): Promise<DocumentFolder[]> {
    const where: any = {};
    if (workId) where.workId = workId;
    if (clientId) where.clientId = clientId;
    return this.folderRepository.find({
      where,
      relations: ['children', 'documents', 'client'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findRootFolders(workId?: string, clientId?: string): Promise<DocumentFolder[]> {
    const where: any = { parentId: IsNull() };
    if (workId) where.workId = workId;
    if (clientId) where.clientId = clientId;
    return this.folderRepository.find({
      where,
      relations: ['children', 'children.children', 'documents', 'client'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findFolder(id: string): Promise<DocumentFolder> {
    const folder = await this.folderRepository.findOne({
      where: { id },
      relations: ['children', 'documents', 'parent', 'client'],
    });
    if (!folder) {
      throw new NotFoundException('Pasta não encontrada');
    }
    return folder;
  }

  async createFolder(data: Partial<DocumentFolder>): Promise<DocumentFolder> {
    const folder = this.folderRepository.create(data);
    const saved = await this.folderRepository.save(folder);
    return this.findFolder(saved.id);
  }

  async updateFolder(id: string, data: Partial<DocumentFolder>): Promise<DocumentFolder> {
    const folder = await this.findFolder(id);
    Object.assign(folder, data);
    const saved = await this.folderRepository.save(folder);
    return this.findFolder(saved.id);
  }

  async removeFolder(id: string): Promise<void> {
    const folder = await this.findFolder(id);
    await this.folderRepository.softRemove(folder);
  }

  // ========== CATEGORIAS DE PASTA ==========

  async findCategories(): Promise<FolderCategory[]> {
    return this.categoryRepository.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async createCategory(data: Partial<FolderCategory>): Promise<FolderCategory> {
    const cat = this.categoryRepository.create(data);
    return this.categoryRepository.save(cat);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }
}
