import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest, RequestStatus } from './client-request.entity';
import { RequestAttachment } from './request-attachment.entity';
import { Work } from '../works/work.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientDocument)
    private documentRepository: Repository<ClientDocument>,
    @InjectRepository(ClientRequest)
    private requestRepository: Repository<ClientRequest>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RequestAttachment)
    private attachmentRepository: Repository<RequestAttachment>,
  ) { }

  // ═══ CRUD ═════════════════════════════════════════════════════════════════

  async findAll(query?: string): Promise<Client[]> {
    if (query) {
      return this.clientRepository.find({
        where: [
          { name: Like(`%${query}%`) },
          { email: Like(`%${query}%`) },
          { document: Like(`%${query}%`) },
        ],
        relations: ['documents'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.clientRepository.find({ relations: ['documents'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['leads', 'works', 'documents'],
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async create(clientData: Partial<Client>): Promise<any> {
    // Auto-generate portal password
    const plainPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const client = this.clientRepository.create({
      ...clientData,
      password: hashedPassword,
      hasPortalAccess: true,
    });
    const saved = await this.clientRepository.save(client);

    // Auto-create a User record with role CLIENT
    try {
      const existingUser = await this.userRepository.findOne({ where: { email: saved.email } });
      if (existingUser) {
        // User with this email already exists — update role to client
        existingUser.role = UserRole.CLIENT;
        existingUser.password = hashedPassword;
        existingUser.isActive = true;
        existingUser.status = UserStatus.ACTIVE;
        await this.userRepository.save(existingUser);
        this.logger.log(`Usuário existente ${saved.email} atualizado para role CLIENT`);
      } else {
        // Create new user
        const user = this.userRepository.create({
          name: saved.name,
          email: saved.email,
          password: hashedPassword,
          role: UserRole.CLIENT,
          phone: saved.phone || null,
          permissions: [],
          status: UserStatus.ACTIVE,
          isActive: true,
        });
        await this.userRepository.save(user);
        this.logger.log(`Usuário CLIENT criado automaticamente para ${saved.email}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao criar usuário para cliente ${saved.email}: ${error.message}`);
      // Don't block the client creation if user creation fails
    }

    // Return with plain password so admin can share with client
    const { password: _, ...result } = saved;
    return { ...result, portalPassword: plainPassword };
  }

  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, clientData);
    return this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  // ═══ SYNC — Criar Users para clientes existentes ═══════════════════════

  async syncExistingClientsToUsers(): Promise<{ synced: { name: string; email: string; portalPassword: string }[]; skipped: string[]; errors: string[] }> {
    const allClients = await this.clientRepository.find();
    const synced: { name: string; email: string; portalPassword: string }[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const client of allClients) {
      try {
        if (!client.email) {
          skipped.push(`${client.name} (sem email)`);
          continue;
        }

        const existingUser = await this.userRepository.findOne({ where: { email: client.email } });
        if (existingUser) {
          skipped.push(`${client.name} (${client.email} - já tem User)`);
          continue;
        }

        // Generate new password
        const plainPassword = this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Update client password
        client.password = hashedPassword;
        client.hasPortalAccess = true;
        await this.clientRepository.save(client);

        // Create User
        const user = this.userRepository.create({
          name: client.name,
          email: client.email,
          password: hashedPassword,
          role: UserRole.CLIENT,
          phone: client.phone || null,
          permissions: [],
          status: UserStatus.ACTIVE,
          isActive: true,
        });
        await this.userRepository.save(user);

        synced.push({ name: client.name, email: client.email, portalPassword: plainPassword });
        this.logger.log(`Sincronizado: ${client.name} (${client.email})`);
      } catch (error) {
        errors.push(`${client.name}: ${error.message}`);
        this.logger.error(`Erro ao sincronizar ${client.name}: ${error.message}`);
      }
    }

    return { synced, skipped, errors };
  }

  // ═══ PORTAL ACCESS ════════════════════════════════════════════════════════

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async generatePortalAccess(clientId: string): Promise<{ portalPassword: string }> {
    const client = await this.findOne(clientId);
    const plainPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    client.password = hashedPassword;
    client.hasPortalAccess = true;
    await this.clientRepository.save(client);

    // Also update the corresponding User record
    try {
      const user = await this.userRepository.findOne({ where: { email: client.email } });
      if (user) {
        user.password = hashedPassword;
        await this.userRepository.save(user);
        this.logger.log(`Senha do usuário ${client.email} atualizada junto com o cliente`);
      }
    } catch (error) {
      this.logger.error(`Erro ao atualizar senha do usuário ${client.email}: ${error.message}`);
    }

    return { portalPassword: plainPassword };
  }

  // ═══ PORTAL QUERIES ═══════════════════════════════════════════════════════

  async getClientWorks(clientId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getClientWorkDetail(clientId: string, workId: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id: workId, clientId },
      relations: ['client', 'tasks', 'documents'],
    });
    if (!work) throw new NotFoundException('Obra não encontrada');
    return work;
  }

  async getClientRequests(clientId: string): Promise<ClientRequest[]> {
    return this.requestRepository.find({
      where: { clientId },
      relations: ['work', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async createClientRequest(
    clientId: string,
    data: Partial<ClientRequest>,
    files?: Express.Multer.File[],
  ): Promise<ClientRequest> {
    const request = this.requestRepository.create({
      ...data,
      clientId,
      status: RequestStatus.OPEN,
    });
    const saved = await this.requestRepository.save(request);
    const requestRecord = Array.isArray(saved) ? saved[0] : saved;

    // Save attachments
    if (files && files.length > 0) {
      const attachments = files.map(file => this.attachmentRepository.create({
        requestId: requestRecord.id,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/requests/${file.filename}`,
      }));
      await this.attachmentRepository.save(attachments);
      requestRecord.attachments = attachments;
    }

    return requestRecord;
  }

  // ═══ ADMIN REQUEST MANAGEMENT ═══════════════════════════════════════════════

  async getAllRequests(): Promise<ClientRequest[]> {
    return this.requestRepository.find({
      relations: ['client', 'work', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRequestDetail(requestId: string): Promise<ClientRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['client', 'work', 'attachments'],
    });
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    return request;
  }

  async respondToRequest(requestId: string, responseData: {
    adminResponse: string;
    status: RequestStatus;
    respondedBy: string;
  }): Promise<ClientRequest> {
    const request = await this.getRequestDetail(requestId);
    request.adminResponse = responseData.adminResponse;
    request.status = responseData.status;
    request.respondedBy = responseData.respondedBy;
    request.respondedAt = new Date();
    return this.requestRepository.save(request);
  }

  // ═══ DOCUMENTS ════════════════════════════════════════════════════════════

  async addDocument(clientId: string, docData: Partial<ClientDocument>): Promise<ClientDocument> {
    const doc = this.documentRepository.create({
      ...docData,
      clientId,
    });
    return this.documentRepository.save(doc);
  }

  async updateDocument(id: string, docData: Partial<ClientDocument>): Promise<ClientDocument> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    Object.assign(doc, docData);
    return this.documentRepository.save(doc);
  }

  async removeDocument(id: string): Promise<void> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.documentRepository.remove(doc);
  }
}

