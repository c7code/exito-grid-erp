import { Injectable, Logger, OnModuleInit, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LaudoAtendimento } from './laudo.entity';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class LaudosService implements OnModuleInit {
  private readonly logger = new Logger(LaudosService.name);
  private supabase: any;

  constructor(
    @InjectRepository(LaudoAtendimento) private laudoRepo: Repository<LaudoAtendimento>,
    private dataSource: DataSource,
  ) {}

  // ═══ AUTO-MIGRATION ═════════════════════════════════════════════
  async onModuleInit() {
    // 1. Criar tabela se não existir
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS laudo_atendimentos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "clientId" UUID REFERENCES clients(id) ON DELETE CASCADE,
          "vendedorId" UUID NOT NULL,
          dados TEXT,
          documentos TEXT,
          status VARCHAR DEFAULT 'aberto',
          "proposalId" UUID,
          observacoes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP
        )
      `);
      this.logger.log('✅ Tabela laudo_atendimentos verificada/criada');
    } catch (e) {
      this.logger.warn('⚠️ Erro ao criar tabela laudo_atendimentos: ' + e?.message);
    }

    // 1.1 Adicionar coluna publicToken se não existir
    try {
      await this.dataSource.query(`
        ALTER TABLE laudo_atendimentos ADD COLUMN IF NOT EXISTS "publicToken" VARCHAR UNIQUE
      `);
      this.logger.log('✅ Coluna publicToken verificada/criada');
    } catch (e) {
      this.logger.warn('⚠️ Erro ao adicionar coluna publicToken: ' + e?.message);
    }

    // 1.2 Tornar clientId nullable (para laudos criados via link público)
    try {
      await this.dataSource.query(`
        ALTER TABLE laudo_atendimentos ALTER COLUMN "clientId" DROP NOT NULL
      `);
    } catch { /* coluna já pode ser nullable */ }

    // 2. Garantir índices
    const indexes = [
      { name: 'idx_laudo_client', col: '"clientId"' },
      { name: 'idx_laudo_vendedor', col: '"vendedorId"' },
      { name: 'idx_laudo_status', col: 'status' },
      { name: 'idx_laudo_proposal', col: '"proposalId"' },
    ];
    for (const idx of indexes) {
      try {
        await this.dataSource.query(
          `CREATE INDEX IF NOT EXISTS ${idx.name} ON laudo_atendimentos (${idx.col})`
        );
      } catch { /* índice pode já existir */ }
    }

    // 3. Inicializar Supabase client para Storage
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY;
      if (url && key) {
        this.supabase = createClient(url, key);
        // Criar bucket se não existir
        const { error } = await this.supabase.storage.createBucket('laudo-documentos', {
          public: true,
          fileSizeLimit: 52428800, // 50 MB
        });
        if (error && !error.message?.includes('already exists')) {
          this.logger.warn('⚠️ Erro ao criar bucket laudo-documentos: ' + error.message);
        } else {
          this.logger.log('✅ Bucket laudo-documentos verificado/criado');
        }
      }
    } catch (e) {
      this.logger.warn('⚠️ Erro ao inicializar Supabase Storage: ' + e?.message);
    }
  }

  // ═══ CONTROLE DE ACESSO (RLS via código) ════════════════════════
  // Vendedor (commercial) vê apenas os seus atendimentos
  // Engenheiro, admin veem todos
  private applyAccessFilter(user: any): { where: any } {
    if (!user) return { where: {} };
    const role = user.role;
    // Admin, engineer, finance veem todos
    if (['admin', 'engineer', 'finance'].includes(role)) {
      return { where: {} };
    }
    // Commercial (vendedor) vê apenas os seus
    return { where: { vendedorId: user.id } };
  }

  // ═══ CRUD ═══════════════════════════════════════════════════════
  async findAll(user?: any): Promise<LaudoAtendimento[]> {
    const filter = this.applyAccessFilter(user);
    return this.laudoRepo.find({
      ...filter,
      order: { createdAt: 'DESC' },
      relations: ['client'],
    });
  }

  async findOne(id: string, user?: any): Promise<LaudoAtendimento> {
    const laudo = await this.laudoRepo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!laudo) throw new NotFoundException('Atendimento não encontrado');

    // Verificar acesso
    if (user && !['admin', 'engineer', 'finance'].includes(user.role)) {
      if (laudo.vendedorId !== user.id) {
        throw new ForbiddenException('Você não tem acesso a este atendimento');
      }
    }
    return laudo;
  }

  async create(data: Partial<LaudoAtendimento>): Promise<LaudoAtendimento> {
    // Validar status
    const validStatus = ['aberto', 'pendente_cliente', 'enviado_orcamento', 'perdido'];
    if (data.status && !validStatus.includes(data.status)) {
      data.status = 'aberto';
    }

    // Serializar JSON se necessário
    if (data.dados && typeof data.dados === 'object') {
      data.dados = JSON.stringify(data.dados);
    }
    if (data.documentos && typeof data.documentos === 'object') {
      data.documentos = JSON.stringify(data.documentos);
    }

    const laudo = this.laudoRepo.create(data);
    const saved = await this.laudoRepo.save(laudo);
    return this.findOne(saved.id);
  }

  async update(id: string, data: Partial<LaudoAtendimento>, user?: any): Promise<LaudoAtendimento> {
    // Verificar acesso
    await this.findOne(id, user);

    // Validar status
    const validStatus = ['aberto', 'pendente_cliente', 'enviado_orcamento', 'perdido'];
    if (data.status && !validStatus.includes(data.status)) {
      delete data.status;
    }

    // Serializar JSON se necessário
    if (data.dados && typeof data.dados === 'object') {
      data.dados = JSON.stringify(data.dados);
    }
    if (data.documentos && typeof data.documentos === 'object') {
      data.documentos = JSON.stringify(data.documentos);
    }

    await this.laudoRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string, user?: any): Promise<void> {
    await this.findOne(id, user); // Verifica acesso
    await this.laudoRepo.softDelete(id);
  }

  async updateStatus(id: string, status: string, user?: any): Promise<LaudoAtendimento> {
    const validStatus = ['aberto', 'pendente_cliente', 'enviado_orcamento', 'perdido'];
    if (!validStatus.includes(status)) {
      throw new NotFoundException('Status inválido. Use: ' + validStatus.join(', '));
    }
    await this.findOne(id, user); // Verifica acesso
    await this.laudoRepo.update(id, { status });
    return this.findOne(id);
  }

  async linkProposal(id: string, proposalId: string, user?: any): Promise<LaudoAtendimento> {
    await this.findOne(id, user); // Verifica acesso
    await this.laudoRepo.update(id, { proposalId, status: 'enviado_orcamento' });
    return this.findOne(id);
  }

  // ═══ STORAGE — Upload de documentos ═════════════════════════════
  async uploadDocument(
    laudoId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    user?: any
  ): Promise<{ url: string; filePath: string }> {
    await this.findOne(laudoId, user); // Verifica acesso

    if (!this.supabase) {
      throw new Error('Supabase Storage não configurado');
    }

    // Sanitizar nome do arquivo
    const sanitized = file.originalname
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${laudoId}/${Date.now()}_${sanitized}`;

    const { error } = await this.supabase.storage
      .from('laudo-documentos')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (error) throw new Error('Erro ao fazer upload: ' + error.message);

    const { data: urlData } = this.supabase.storage
      .from('laudo-documentos')
      .getPublicUrl(filePath);

    const url = urlData?.publicUrl || '';

    // Adicionar referência ao array de documentos do laudo
    const laudo = await this.laudoRepo.findOneBy({ id: laudoId });
    const docs = laudo?.documentos ? JSON.parse(laudo.documentos) : [];
    docs.push({
      fileName: sanitized,
      originalName: file.originalname,
      url,
      filePath,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
    await this.laudoRepo.update(laudoId, { documentos: JSON.stringify(docs) });

    return { url, filePath };
  }

  async removeDocument(laudoId: string, filePath: string, user?: any): Promise<void> {
    await this.findOne(laudoId, user);

    if (this.supabase) {
      await this.supabase.storage.from('laudo-documentos').remove([filePath]);
    }

    const laudo = await this.laudoRepo.findOneBy({ id: laudoId });
    const docs = laudo?.documentos ? JSON.parse(laudo.documentos) : [];
    const filtered = docs.filter((d: any) => d.filePath !== filePath);
    await this.laudoRepo.update(laudoId, { documentos: JSON.stringify(filtered) });
  }

  // ═══ PUBLIC LINK ════════════════════════════════════════════════
  async generatePublicLink(vendedorId: string, description?: string): Promise<{ token: string; id: string }> {
    const token = crypto.randomUUID();
    const dados = JSON.stringify({
      _linkDescription: description,
      _linkCreatedAt: new Date().toISOString(),
    });

    const laudo = this.laudoRepo.create({
      vendedorId,
      publicToken: token,
      status: 'pendente_cliente',
      dados,
    } as any);
    const saved = await this.laudoRepo.save(laudo);

    return { token, id: saved.id };
  }

  async findByToken(token: string): Promise<LaudoAtendimento> {
    const laudo = await this.laudoRepo.findOne({
      where: { publicToken: token, status: 'pendente_cliente' },
    });
    if (!laudo) throw new NotFoundException('Link não encontrado ou já utilizado');
    return laudo;
  }

  async submitPublicForm(token: string, data: { client: any; dados: any }): Promise<LaudoAtendimento> {
    const laudo = await this.laudoRepo.findOne({
      where: { publicToken: token },
    });
    if (!laudo || laudo.status !== 'pendente_cliente') {
      throw new BadRequestException('Link inválido ou já utilizado');
    }

    const existingClient = await this.dataSource.query(
      'SELECT id FROM clients WHERE document = $1 LIMIT 1',
      [data.client.document],
    );

    let clientId: string;
    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
    } else {
      const result = await this.dataSource.query(
        'INSERT INTO clients (name, document, email, phone, city, type, segment) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [
          data.client.name,
          data.client.document || null,
          data.client.email || null,
          data.client.phone || null,
          data.client.city || null,
          'company',
          'commercial',
        ],
      );
      clientId = result[0].id;
    }

    await this.laudoRepo.update(laudo.id, {
      clientId,
      dados: JSON.stringify(data.dados),
      status: 'aberto',
    });

    return this.laudoRepo.findOne({ where: { id: laudo.id }, relations: ['client'] });
  }
}
