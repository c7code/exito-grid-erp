import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientType, ClientSegment } from './client.entity';
import * as bcrypt from 'bcrypt';

export interface CreateClientDto {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  document?: string;
  type?: ClientType;
  segment?: ClientSegment;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  accountManagerId?: string;
  hasPortalAccess?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  type?: ClientType;
  segment?: ClientSegment;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  accountManagerId?: string;
  hasPortalAccess?: boolean;
  isActive?: boolean;
  rating?: number;
  totalValue?: number;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      relations: ['accountManager'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['accountManager', 'works'],
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

  async findBySegment(segment: ClientSegment): Promise<Client[]> {
    return this.clientRepository.find({
      where: { segment, isActive: true },
      relations: ['accountManager'],
      order: { name: 'ASC' },
    });
  }

  async findWithPortalAccess(): Promise<Client[]> {
    return this.clientRepository.find({
      where: { hasPortalAccess: true, isActive: true },
      order: { name: 'ASC' },
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

  async updateTotalValue(id: string): Promise<void> {
    const client = await this.findById(id);
    const totalValue = client.works?.reduce((sum, work) => sum + Number(work.totalValue), 0) || 0;
    await this.clientRepository.update(id, { totalValue });
  }

  async delete(id: string): Promise<void> {
    const client = await this.findById(id);
    await this.clientRepository.update(id, { isActive: false });
  }

  async validateClientLogin(email: string, password: string): Promise<Client | null> {
    const client = await this.findByEmail(email);
    if (!client || !client.password || !client.hasPortalAccess) {
      return null;
    }

    const isValid = await bcrypt.compare(password, client.password);
    if (!isValid) {
      return null;
    }

    return client;
  }

  async getStats() {
    const bySegment = await this.clientRepository
      .createQueryBuilder('client')
      .select('client.segment', 'segment')
      .addSelect('COUNT(*)', 'count')
      .where('client.isActive = true')
      .groupBy('client.segment')
      .getRawMany();

    const total = await this.clientRepository.count({ where: { isActive: true } });
    const withPortal = await this.clientRepository.count({ where: { hasPortalAccess: true, isActive: true } });
    const totalValue = await this.clientRepository
      .createQueryBuilder('client')
      .select('SUM(client.totalValue)', 'total')
      .where('client.isActive = true')
      .getRawOne();

    return {
      total,
      withPortal,
      totalValue: totalValue?.total || 0,
      bySegment,
    };
  }
}
