import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './user.entity';
import { UserSession } from './user-session.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private emailService: EmailService,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      relations: ['supervisor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['supervisor'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  // === Convite de Colaborador ===
  async inviteUser(data: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    supervisorId?: string;
    department?: string;
    position?: string;
    invitedBy: string;
  }): Promise<{ user: Partial<User>; emailSent: boolean; generatedPassword: string }> {
    // Verifica se email já está cadastrado
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema');
    }

    // Gera senha aleatória de 8 caracteres
    const generatedPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Cria o usuário
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      permissions: data.permissions,
      supervisorId: data.supervisorId || null,
      department: data.department || null,
      position: data.position || null,
      status: UserStatus.PENDING,
      isActive: true,
      invitedAt: new Date(),
      invitedBy: data.invitedBy,
    });

    await this.userRepository.save(user);

    // Envia e-mail com credenciais
    const emailSent = await this.emailService.sendInviteEmail(
      data.email,
      data.name,
      generatedPassword,
    );

    // Remove password do retorno
    const { password, ...result } = user;
    return { user: result, emailSent, generatedPassword };
  }

  // === Atualizar Permissões ===
  async updatePermissions(id: string, permissions: string[]): Promise<User> {
    const user = await this.findOne(id);
    user.permissions = permissions;
    await this.userRepository.save(user);
    const { password, ...result } = user;
    return result as User;
  }

  // === Atualizar Supervisor ===
  async updateSupervisor(id: string, supervisorId: string): Promise<User> {
    const user = await this.findOne(id);
    if (supervisorId) {
      await this.findOne(supervisorId); // Verifica se supervisor existe
    }
    user.supervisorId = supervisorId || null;
    await this.userRepository.save(user);
    return user;
  }

  // === Resetar Senha (Admin) ===
  async resetPassword(id: string): Promise<{ newPassword: string }> {
    const user = await this.findOne(id);
    const newPassword = this.generatePassword();
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { newPassword };
  }

  // Gera senha aleatória
  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ═══ Disponibilidade / Heartbeat ═══════════════════════════════════════

  async heartbeat(userId: string): Promise<{ ok: boolean }> {
    const now = new Date();
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

    // Fechar sessões abandonadas de qualquer usuário (>5 min sem heartbeat)
    await this.sessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({
        isActive: false,
        logoutAt: () => '"lastHeartbeat"',
        durationMinutes: () => 'EXTRACT(EPOCH FROM ("lastHeartbeat" - "loginAt")) / 60',
      })
      .where('"isActive" = true AND "lastHeartbeat" < :cutoff', {
        cutoff: new Date(now.getTime() - TIMEOUT_MS),
      })
      .execute();

    // Procurar sessão ativa deste usuário
    let session = await this.sessionRepository.findOne({
      where: { userId, isActive: true },
    });

    if (session) {
      // Atualizar heartbeat
      session.lastHeartbeat = now;
      session.durationMinutes = Math.round(
        (now.getTime() - new Date(session.loginAt).getTime()) / 60000,
      );
      await this.sessionRepository.save(session);
    } else {
      // Criar nova sessão
      session = this.sessionRepository.create({
        userId,
        loginAt: now,
        lastHeartbeat: now,
        durationMinutes: 0,
        isActive: true,
      });
      await this.sessionRepository.save(session);
      this.logger.log(`[Session] Nova sessão iniciada para userId=${userId}`);
    }

    // Atualizar isOnline no user
    await this.userRepository.update(userId, { isOnline: true });

    return { ok: true };
  }

  async getAvailability(dateStr?: string): Promise<any[]> {
    const targetDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar todos os usuários ativos
    const users = await this.userRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    // Buscar sessões do dia
    const sessions = await this.sessionRepository.find({
      where: {
        loginAt: Between(startOfDay, endOfDay),
      },
      order: { loginAt: 'ASC' },
    });

    // Agrupar por usuário
    const result = users.map(user => {
      const userSessions = sessions.filter(s => s.userId === user.id);
      const totalMinutes = userSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
        lastLoginAt: user.lastLoginAt,
        totalMinutes,
        totalFormatted: `${hours}h ${mins}m`,
        sessions: userSessions.map(s => ({
          id: s.id,
          loginAt: s.loginAt,
          logoutAt: s.logoutAt,
          durationMinutes: s.durationMinutes,
          isActive: s.isActive,
        })),
      };
    });

    // Ordenar por tempo online (maior primeiro)
    result.sort((a, b) => b.totalMinutes - a.totalMinutes);

    return result;
  }
}
