import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  status?: UserStatus;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'status', 'phone', 'department', 'position', 'avatar', 'isOnline', 'lastLoginAt', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'status', 'phone', 'department', 'position', 'avatar', 'isOnline', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role, status: UserStatus.ACTIVE },
      select: ['id', 'name', 'email', 'role', 'department', 'position', 'avatar'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      isOnline: true,
    });
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.userRepository.update(id, { isOnline });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    await this.userRepository.softDelete(id);
  }

  async getEmployees(): Promise<User[]> {
    return this.findByRole(UserRole.EMPLOYEE);
  }

  async getAdmins(): Promise<User[]> {
    return this.findByRole(UserRole.ADMIN);
  }
}
