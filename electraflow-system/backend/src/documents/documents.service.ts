import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType, DocumentStatus } from './document.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDocumentDto {
  name: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  size: number;
  type?: DocumentType;
  description?: string;
  workId?: string;
  taskId?: string;
  uploadedById: string;
  folderId?: string;
}

export interface UpdateDocumentDto {
  name?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
}

@Injectable()
export class DocumentsService {
  private uploadDir = './uploads';

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({
      relations: ['work', 'task', 'uploadedBy'],
      where: { isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['work', 'task', 'uploadedBy'],
    });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado');
    }
    return doc;
  }

  async findByWork(workId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { work: { id: workId }, isArchived: false },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTask(taskId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { task: { id: taskId }, isArchived: false },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: DocumentType): Promise<Document[]> {
    return this.documentRepository.find({
      where: { type, isArchived: false },
      relations: ['work', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByFolder(folderId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { folderId, isArchived: false },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async saveFile(file: Express.Multer.File, subfolder?: string): Promise<string> {
    const folder = subfolder ? path.join(this.uploadDir, subfolder) : this.uploadDir;
    
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(folder, filename);
    
    fs.writeFileSync(filepath, file.buffer);
    
    return subfolder ? path.join(subfolder, filename) : filename;
  }

  async create(createDto: CreateDocumentDto): Promise<Document> {
    const doc = this.documentRepository.create({
      ...createDto,
      status: DocumentStatus.PENDING,
    });
    return this.documentRepository.save(doc);
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    data: {
      workId?: string;
      taskId?: string;
      uploadedById: string;
      type?: DocumentType;
      folderId?: string;
    },
  ): Promise<Document[]> {
    const documents: Document[] = [];

    for (const file of files) {
      const subfolder = data.workId ? `works/${data.workId}` : 'general';
      const filePath = await this.saveFile(file, subfolder);

      const doc = await this.create({
        name: file.originalname,
        originalName: file.originalname,
        filePath,
        mimeType: file.mimetype,
        size: file.size,
        type: data.type || DocumentType.OTHER,
        workId: data.workId,
        taskId: data.taskId,
        uploadedById: data.uploadedById,
        folderId: data.folderId,
      });

      documents.push(doc);
    }

    return documents;
  }

  async update(id: string, updateDto: UpdateDocumentDto): Promise<Document> {
    const doc = await this.findById(id);
    await this.documentRepository.update(id, updateDto);
    return this.findById(id);
  }

  async approve(id: string): Promise<Document> {
    return this.update(id, { status: DocumentStatus.APPROVED });
  }

  async reject(id: string): Promise<Document> {
    return this.update(id, { status: DocumentStatus.REJECTED });
  }

  async archive(id: string): Promise<Document> {
    const doc = await this.findById(id);
    await this.documentRepository.update(id, { isArchived: true });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const doc = await this.findById(id);
    
    const filepath = path.join(this.uploadDir, doc.filePath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await this.documentRepository.remove(doc);
  }

  async getFileStream(id: string): Promise<{ stream: fs.ReadStream; doc: Document }> {
    const doc = await this.findById(id);
    const filepath = path.join(this.uploadDir, doc.filePath);
    
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo não encontrado no disco');
    }

    return {
      stream: fs.createReadStream(filepath),
      doc,
    };
  }

  async getStats() {
    const byType = await this.documentRepository
      .createQueryBuilder('doc')
      .select('doc.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('doc.isArchived = false')
      .groupBy('doc.type')
      .getRawMany();

    const total = await this.documentRepository.count({ where: { isArchived: false } });
    const totalSize = await this.documentRepository
      .createQueryBuilder('doc')
      .select('SUM(doc.size)', 'total')
      .where('doc.isArchived = false')
      .getRawOne();

    return {
      total,
      totalSize: totalSize?.total || 0,
      byType,
    };
  }
}
