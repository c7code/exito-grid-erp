import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PortalPublication } from './portal-publication.entity';

@Injectable()
export class PortalPublicationsService implements OnModuleInit {
  private readonly logger = new Logger(PortalPublicationsService.name);

  constructor(
    @InjectRepository(PortalPublication)
    private publicationRepository: Repository<PortalPublication>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // ═══ Auto-create table if not exists ═══
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS portal_publications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "clientId" UUID NOT NULL,
          "workId" UUID,
          "contentType" VARCHAR(50) NOT NULL,
          "contentId" UUID NOT NULL,
          title VARCHAR NOT NULL,
          description TEXT,
          "publishedById" UUID,
          "publishedAt" TIMESTAMP DEFAULT NOW(),
          "isActive" BOOLEAN DEFAULT true,
          metadata TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP
        )
      `);
      this.logger.log('Table portal_publications ensured');
    } catch (err) {
      this.logger.warn('Could not create portal_publications: ' + err?.message);
    }

    // ═══ Ensure portalModules column on clients ═══
    try {
      await this.dataSource.query(`
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS "portalModules" TEXT DEFAULT '["obras","propostas","documentos","solicitacoes"]'
      `);
      this.logger.log('Column clients.portalModules ensured');
    } catch (err) {
      this.logger.warn('Could not add portalModules: ' + err?.message);
    }

    // ═══ Add indexes for performance ═══
    try {
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_portal_pub_client ON portal_publications ("clientId") WHERE "deletedAt" IS NULL
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_portal_pub_content ON portal_publications ("contentType", "contentId") WHERE "deletedAt" IS NULL
      `);
      this.logger.log('Portal publication indexes ensured');
    } catch (err) {
      this.logger.warn('Index creation note: ' + err?.message);
    }
  }

  // ═══ ADMIN CRUD ═══════════════════════════════════════════════════════════

  async publish(data: {
    clientId: string;
    workId?: string;
    contentType: string;
    contentId: string;
    title: string;
    description?: string;
    publishedById?: string;
    metadata?: Record<string, any>;
  }): Promise<PortalPublication> {
    // Check if already published
    const existing = await this.publicationRepository.findOne({
      where: {
        clientId: data.clientId,
        contentType: data.contentType,
        contentId: data.contentId,
      },
    });

    if (existing) {
      // Reactivate if soft-deleted or inactive
      existing.isActive = true;
      existing.title = data.title || existing.title;
      existing.description = data.description || existing.description;
      existing.publishedAt = new Date();
      return this.publicationRepository.save(existing);
    }

    const publication = this.publicationRepository.create({
      ...data,
      publishedAt: new Date(),
      isActive: true,
    });
    return this.publicationRepository.save(publication);
  }

  async unpublish(id: string): Promise<void> {
    const pub = await this.publicationRepository.findOneBy({ id });
    if (!pub) throw new NotFoundException('Publicação não encontrada');
    pub.isActive = false;
    await this.publicationRepository.save(pub);
  }

  async remove(id: string): Promise<void> {
    const pub = await this.publicationRepository.findOneBy({ id });
    if (!pub) throw new NotFoundException('Publicação não encontrada');
    await this.publicationRepository.softRemove(pub);
  }

  async findByClient(clientId: string, contentType?: string): Promise<PortalPublication[]> {
    const where: any = { clientId, isActive: true };
    if (contentType) where.contentType = contentType;
    return this.publicationRepository.find({
      where,
      relations: ['publishedBy'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findAll(clientId?: string): Promise<PortalPublication[]> {
    const where: any = {};
    if (clientId) where.clientId = clientId;
    return this.publicationRepository.find({
      where,
      relations: ['client', 'publishedBy'],
      order: { publishedAt: 'DESC' },
    });
  }

  async isPublished(contentType: string, contentId: string): Promise<boolean> {
    const count = await this.publicationRepository.count({
      where: { contentType, contentId, isActive: true },
    });
    return count > 0;
  }

  async getPublishedIds(contentType: string, clientId?: string): Promise<string[]> {
    const where: any = { contentType, isActive: true };
    if (clientId) where.clientId = clientId;
    const pubs = await this.publicationRepository.find({
      where,
      select: ['contentId'],
    });
    return pubs.map(p => p.contentId);
  }

  // ═══ PORTAL (CLIENT) QUERIES ═══════════════════════════════════════════════

  async getClientPublications(clientId: string, contentType?: string): Promise<any[]> {
    const where: any = { clientId, isActive: true };
    if (contentType) where.contentType = contentType;
    return this.publicationRepository.find({
      where,
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * Get portal publications with enriched data from the original tables
   */
  async getClientPublicationsEnriched(clientId: string, contentType: string): Promise<any[]> {
    const publications = await this.getClientPublications(clientId, contentType);
    if (publications.length === 0) return [];

    const contentIds = publications.map(p => p.contentId);

    // Build enriched results based on content type
    let enrichedData: Record<string, any> = {};

    try {
      switch (contentType) {
        case 'proposal': {
          const rows = await this.dataSource.query(
            `SELECT id, "proposalNumber", title, status, total, "validUntil", "activityType",
                    "createdAt", "sentAt", "acceptedAt", scope, deadline, "paymentConditions"
             FROM proposals WHERE id = ANY($1) AND "deletedAt" IS NULL`,
            [contentIds],
          );
          rows.forEach((r: any) => { enrichedData[r.id] = r; });
          break;
        }
        case 'contract': {
          const rows = await this.dataSource.query(
            `SELECT id, "contractNumber", title, status, "totalValue", "startDate", "endDate", "createdAt"
             FROM contracts WHERE id = ANY($1) AND "deletedAt" IS NULL`,
            [contentIds],
          );
          rows.forEach((r: any) => { enrichedData[r.id] = r; });
          break;
        }
        case 'receipt': {
          const rows = await this.dataSource.query(
            `SELECT id, "receiptNumber", description, amount, "paymentDate", status, "createdAt"
             FROM receipts WHERE id = ANY($1) AND "deletedAt" IS NULL`,
            [contentIds],
          );
          rows.forEach((r: any) => { enrichedData[r.id] = r; });
          break;
        }
        case 'service_order': {
          const rows = await this.dataSource.query(
            `SELECT id, "osNumber", title, status, "createdAt"
             FROM service_orders WHERE id = ANY($1) AND "deletedAt" IS NULL`,
            [contentIds],
          );
          rows.forEach((r: any) => { enrichedData[r.id] = r; });
          break;
        }
        case 'document': {
          const rows = await this.dataSource.query(
            `SELECT id, name, "fileName", url, "mimeType", size, description, "createdAt"
             FROM documents WHERE id = ANY($1) AND "deletedAt" IS NULL`,
            [contentIds],
          );
          rows.forEach((r: any) => { enrichedData[r.id] = r; });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      this.logger.warn(`Could not enrich ${contentType}: ${err?.message}`);
    }

    // Merge publication + enriched data
    return publications.map(pub => ({
      ...pub,
      content: enrichedData[pub.contentId] || null,
    }));
  }

  // ═══ CLIENT PORTAL MODULES ═══════════════════════════════════════════════

  async getClientPortalModules(clientId: string): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        `SELECT "portalModules" FROM clients WHERE id = $1`,
        [clientId],
      );
      if (result?.[0]?.portalModules) {
        const modules = result[0].portalModules;
        return typeof modules === 'string' ? JSON.parse(modules) : modules;
      }
    } catch {}
    return ['obras', 'propostas', 'documentos', 'solicitacoes'];
  }

  async updateClientPortalModules(clientId: string, modules: string[]): Promise<void> {
    await this.dataSource.query(
      `UPDATE clients SET "portalModules" = $1 WHERE id = $2`,
      [JSON.stringify(modules), clientId],
    );
  }
}
