import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Client } from '../clients/client.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) { }

  // ═══ AUTO-MIGRATION ═════════════════════════════════════════════════════
  async onModuleInit() {
    try {
      // Add refreshToken columns to users table if missing
      await this.dataSource.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
          ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP;
      `);
      this.logger.log('Auto-migration: refreshToken columns OK');
    } catch (e) {
      this.logger.warn('Auto-migration skipped:', e.message);
    }
  }

  // ═══ USER AUTH ════════════════════════════════════════════════════════════

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    if (!user.isActive) return null;

    if (await bcrypt.compare(password, user.password)) {
      if (user.status === UserStatus.PENDING) {
        user.status = UserStatus.ACTIVE;
      }
      user.lastLoginAt = new Date();
      user.isOnline = true;
      await this.userRepository.save(user);

      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  // ─── Generate refresh token ───────────────────────────────────────────────
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      permissions: user.permissions || [],
    };

    // Generate and store refresh token via raw SQL (resilient if columns not yet migrated)
    let refreshToken: string | undefined;
    try {
      refreshToken = this.generateRefreshToken();
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const hashedRefresh = await bcrypt.hash(refreshToken, 8);
      await this.dataSource.query(
        `UPDATE users SET "refreshToken" = $1, "refreshTokenExpiresAt" = $2 WHERE id = $3`,
        [hashedRefresh, refreshTokenExpiresAt, user.id],
      );
    } catch (e) {
      this.logger.warn('refresh token storage skipped (migration pending):', e.message);
      refreshToken = undefined;
    }

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '8h' }),
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
      expires_in: 8 * 60 * 60,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        avatarUrl: user.avatarUrl,
        department: user.department,
        position: user.position,
        status: user.status,
      },
    };
  }

  async refreshAccessToken(token: string) {
    try {
      // Use raw SQL to avoid TypeORM entity column binding issues during migration
      const users = await this.dataSource.query(
        `SELECT id, email, role, permissions, "refreshToken", "refreshTokenExpiresAt"
         FROM users
         WHERE "isActive" = true
           AND "deletedAt" IS NULL
           AND "refreshTokenExpiresAt" > NOW()
           AND "refreshToken" IS NOT NULL`,
      );

      for (const user of users) {
        if (user.refreshToken && await bcrypt.compare(token, user.refreshToken)) {
          const payload = {
            email: user.email, sub: user.id, role: user.role,
            permissions: user.permissions || [],
          };
          const newRefresh = this.generateRefreshToken();
          const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await this.dataSource.query(
            `UPDATE users SET "refreshToken" = $1, "refreshTokenExpiresAt" = $2 WHERE id = $3`,
            [await bcrypt.hash(newRefresh, 8), newExpiry, user.id],
          );
          return {
            access_token: this.jwtService.sign(payload, { expiresIn: '8h' }),
            refresh_token: newRefresh,
            expires_in: 8 * 60 * 60,
          };
        }
      }
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      this.logger.warn('refreshAccessToken error:', e.message);
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  async revokeRefreshToken(userId: string) {
    try {
      await this.dataSource.query(
        `UPDATE users SET "refreshToken" = NULL, "refreshTokenExpiresAt" = NULL WHERE id = $1`,
        [userId],
      );
    } catch { /* column may not exist yet */ }
  }

  async register(name: string, email: string, password: string, role: UserRole = UserRole.VIEWER) {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(user);
    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['supervisor'],
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const { password, ...result } = user;
    return result;
  }

  // ═══ CLIENT AUTH ══════════════════════════════════════════════════════════

  async validateClient(email: string, password: string): Promise<any> {
    const client = await this.clientRepository.findOne({ where: { email } });
    if (!client) return null;
    if (!client.isActive) return null;
    if (!client.hasPortalAccess) return null;
    if (!client.password) return null;

    if (await bcrypt.compare(password, client.password)) {
      const { password: _, ...result } = client;
      return result;
    }
    return null;
  }

  async loginClient(client: any) {
    const payload = {
      email: client.email,
      sub: client.id,
      role: 'client',
      clientId: client.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        role: 'client',
        clientId: client.id,
        permissions: [],
      },
    };
  }

  async getClientProfile(clientId: string) {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['works'],
    });
    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado');
    }
    const { password, ...result } = client;
    return result;
  }

  // ═══ UNIFIED LOGIN ════════════════════════════════════════════════════════

  async unifiedLogin(email: string, password: string) {
    const portals: any[] = [];

    // 1. Check admin/employee/commercial user
    const userResult = await this.validateUser(email, password);
    if (userResult) {
      const tokenData = await this.login(userResult);
      portals.push({
        type: userResult.role === 'client' ? 'client_user' : 'admin',
        label: this.getRoleLabel(userResult.role),
        icon: this.getRoleIcon(userResult.role),
        token: tokenData.access_token,
        user: tokenData.user,
      });
    }

    // 2. Check client portal
    const clientResult = await this.validateClient(email, password);
    if (clientResult) {
      const tokenData = await this.loginClient(clientResult);
      portals.push({
        type: 'client',
        label: 'Portal do Cliente',
        icon: 'building2',
        token: tokenData.access_token,
        user: tokenData.user,
      });
    }

    // 3. Check partner portal (referral_consultants)
    try {
      const consultants = await this.userRepository.query(
        `SELECT * FROM referral_consultants WHERE email = $1 AND "deletedAt" IS NULL AND "isPortalActive" = true AND "passwordHash" IS NOT NULL LIMIT 1`,
        [email],
      );
      if (consultants && consultants.length > 0) {
        const c = consultants[0];
        const bcrypt = require('bcryptjs');
        const valid = await bcrypt.compare(password, c.passwordHash);
        if (valid) {
          const payload = { sub: c.id, email: c.email, role: 'partner', consultantId: c.id };
          portals.push({
            type: 'partner',
            label: 'Portal do Parceiro',
            icon: 'user-plus',
            token: this.jwtService.sign(payload),
            user: { id: c.id, name: c.name, email: c.email, commissionPercent: c.commissionPercent },
          });
          await this.userRepository.query(
            `UPDATE referral_consultants SET "lastLoginAt" = NOW() WHERE id = $1`,
            [c.id],
          );
        }
      }
    } catch (_) { /* partner table may not exist yet */ }

    if (portals.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas ou acesso não habilitado.');
    }

    return { portals };
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      commercial: 'Equipe Comercial',
      engineer: 'Engenharia',
      finance: 'Financeiro',
      employee: 'Funcionário',
      viewer: 'Visualizador',
    };
    return labels[role] || 'Equipe';
  }

  private getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      admin: 'shield',
      commercial: 'trending-up',
      engineer: 'hard-hat',
      finance: 'banknote',
      employee: 'user',
      viewer: 'eye',
    };
    return icons[role] || 'zap';
  }
}
