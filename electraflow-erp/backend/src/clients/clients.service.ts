import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientSegment } from './client.entity';
import * as bcrypt from 'bcrypt';

export interface CreateClientDto {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  document?: string;
  segment?: ClientSegment;
  address?: string;
  hasPortalAccess?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  segment?: ClientSegment;
  address?: string;
  hasPortalAccess?: boolean;
  isActive?: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { email },
    });
  }

  async create(createDto: CreateClientDto): Promise<Client> {
    const existingClient = await this.findByEmail(createDto.email);
    if (existingClient) {
      throw new ConflictException('Email já cadastrado');
    }

    let hashedPassword = null;
    if (createDto.password) {
      hashedPassword = await bcrypt.hash(createDto.password, 10);
    }

    const client = this.clientRepository.create({
      ...createDto,
      password: hashedPassword,
    });
    return this.clientRepository.save(client);
  }

  async update(id: string, updateDto: UpdateClientDto): Promise<Client> {
    const client = await this.findById(id);
    
    if (updateDto.email && updateDto.email !== client.email) {
      const existingClient = await this.findByEmail(updateDto.email);
      if (existingClient) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    await this.clientRepository.update(id, updateDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const client = await this.findById(id);
    await this.clientRepository.update(id, { isActive: false });
  }
}
