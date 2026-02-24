import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Document, DocumentFolder, DocumentType } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentFolder)
    private folderRepository: Repository<DocumentFolder>,
  ) { }

  // ========== DOCUMENTOS ==========

  async findAll(filters?: {
    workId?: string;
    type?: DocumentType;
    folderId?: string;
    proposalId?: string;
  }): Promise<Document[]> {
    const where: any = {};
    if (filters?.workId) where.workId = filters.workId;
    if (filters?.type) where.type = filters.type;
    if (filters?.folderId) where.folderId = filters.folderId;
    if (filters?.proposalId) where.proposalId = filters.proposalId;
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
    await this.documentRepository.remove(doc);
  }

  // ========== PASTAS ==========

  async findFolders(workId?: string): Promise<DocumentFolder[]> {
    const where: any = {};
    if (workId) where.workId = workId;
    return this.folderRepository.find({
      where,
      relations: ['children', 'documents'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findRootFolders(workId?: string): Promise<DocumentFolder[]> {
    const where: any = { parentId: IsNull() };
    if (workId) where.workId = workId;
    return this.folderRepository.find({
      where,
      relations: ['children', 'children.children', 'documents'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findFolder(id: string): Promise<DocumentFolder> {
    const folder = await this.folderRepository.findOne({
      where: { id },
      relations: ['children', 'documents', 'parent'],
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
    await this.folderRepository.remove(folder);
  }
}
