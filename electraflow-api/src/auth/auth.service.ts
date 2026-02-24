import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Client } from '../clients/client.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private jwtService: JwtService,
  ) { }

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

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      permissions: user.permissions || [],
    };
    return {
      access_token: this.jwtService.sign(payload),
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
}
