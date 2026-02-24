import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import * as fs from 'fs';
import * as path from 'path';

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
      where: { isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado');
    }
    return doc;
  }

  async findByWork(workId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { workId, isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: Partial<Document>): Promise<Document> {
    const doc = this.documentRepository.create(createDto);
    return this.documentRepository.save(doc);
  }

  async delete(id: string): Promise<void> {
    const doc = await this.findById(id);
    const filepath = path.join(this.uploadDir, doc.filePath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    await this.documentRepository.remove(doc);
  }
}
