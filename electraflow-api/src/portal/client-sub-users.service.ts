import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientSubUser, ClientSubUserRole } from './client-sub-user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientSubUsersService implements OnModuleInit {
  private readonly logger = new Logger(ClientSubUsersService.name);

  constructor(
    @InjectRepository(ClientSubUser)
    private subUserRepo: Repository<ClientSubUser>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Auto-create table
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS client_sub_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "clientId" UUID NOT NULL,
          name VARCHAR NOT NULL,
          email VARCHAR NOT NULL,
          password VARCHAR NOT NULL,
          role VARCHAR(30) DEFAULT 'viewer',
          phone VARCHAR,
          position VARCHAR,
          "isActive" BOOLEAN DEFAULT true,
          "allowedModules" TEXT,
          "allowedWorks" TEXT,
          "createdById" UUID,
          "lastLoginAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "deletedAt" TIMESTAMP,
          UNIQUE("email")
        )
      `);
      this.logger.log('Table client_sub_users ensured');
    } catch (err) {
      this.logger.warn('Could not create client_sub_users: ' + err?.message);
    }

    // Index for fast lookups by client
    try {
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_client_sub_users_client ON client_sub_users ("clientId") WHERE "deletedAt" IS NULL
      `);
    } catch {}
  }

  // ═══ CRUD ═══════════════════════════════════════════════════════════

  async create(data: {
    clientId: string;
    name: string;
    email: string;
    password: string;
    role?: ClientSubUserRole;
    phone?: string;
    position?: string;
    allowedModules?: string[];
    allowedWorks?: string[];
    createdById?: string;
  }): Promise<ClientSubUser & { plainPassword: string }> {
    // Check duplicate email
    const existing = await this.subUserRepo.findOne({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Já existe um sub-usuário com este email.');

    const plainPassword = data.password || this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const subUser = this.subUserRepo.create({
      ...data,
      password: hashedPassword,
      role: data.role || ClientSubUserRole.VIEWER,
    });

    const saved = await this.subUserRepo.save(subUser);
    return { ...saved, plainPassword };
  }

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    role: ClientSubUserRole;
    phone: string;
    position: string;
    isActive: boolean;
    allowedModules: string[] | null;
    allowedWorks: string[] | null;
  }>): Promise<ClientSubUser> {
    const subUser = await this.subUserRepo.findOneBy({ id });
    if (!subUser) throw new NotFoundException('Sub-usuário não encontrado');
    Object.assign(subUser, data);
    return this.subUserRepo.save(subUser);
  }

  async resetPassword(id: string): Promise<{ plainPassword: string }> {
    const subUser = await this.subUserRepo.findOneBy({ id });
    if (!subUser) throw new NotFoundException('Sub-usuário não encontrado');
    const plainPassword = this.generatePassword();
    subUser.password = await bcrypt.hash(plainPassword, 10);
    await this.subUserRepo.save(subUser);
    return { plainPassword };
  }

  async remove(id: string): Promise<void> {
    const subUser = await this.subUserRepo.findOneBy({ id });
    if (!subUser) throw new NotFoundException('Sub-usuário não encontrado');
    await this.subUserRepo.softRemove(subUser);
  }

  async findByClient(clientId: string): Promise<ClientSubUser[]> {
    return this.subUserRepo.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<ClientSubUser | null> {
    return this.subUserRepo.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<ClientSubUser | null> {
    return this.subUserRepo.findOne({ where: { email, isActive: true } });
  }

  async validatePassword(subUser: ClientSubUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, subUser.password);
  }

  async recordLogin(id: string): Promise<void> {
    await this.subUserRepo.update(id, { lastLoginAt: new Date() });
  }

  // ═══ ADMIN OVERVIEW ═══════════════════════════════════════════════════

  async findAll(): Promise<any[]> {
    const rows = await this.dataSource.query(`
      SELECT su.*, c.name as "clientName", c.email as "clientEmail"
      FROM client_sub_users su
      LEFT JOIN clients c ON c.id = su."clientId"
      WHERE su."deletedAt" IS NULL
      ORDER BY su."createdAt" DESC
    `);
    return rows;
  }

  // ═══ HELPERS ═══════════════════════════════════════════════════════════

  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
