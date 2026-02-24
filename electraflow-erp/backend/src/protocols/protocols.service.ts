import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolEvent, ProtocolEventType } from './protocol-event.entity';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectRepository(Protocol)
    private protocolRepository: Repository<Protocol>,
    @InjectRepository(ProtocolEvent)
    private eventRepository: Repository<ProtocolEvent>,
  ) { }

  async findAll(status?: ProtocolStatus): Promise<Protocol[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.protocolRepository.find({
      where,
      relations: ['work', 'client', 'task', 'events'],
      order: { openedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Protocol> {
    const protocol = await this.protocolRepository.findOne({
      where: { id },
      relations: ['work', 'client', 'task', 'events', 'events.user'],
      order: { events: { createdAt: 'DESC' } },
    });
    if (!protocol) {
      throw new NotFoundException('Protocolo não encontrado');
    }
    return protocol;
  }

  async findByWork(workId: string): Promise<Protocol[]> {
    return this.protocolRepository.find({
      where: { workId },
      relations: ['work', 'client', 'task', 'events'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Protocol>, userId?: string): Promise<Protocol> {
    const code = await this.generateCode();
    const protocol = this.protocolRepository.create({
      ...data,
      code,
      openedAt: data.openedAt || new Date(),
    });
    const savedProtocol = await this.protocolRepository.save(protocol);

    await this.addEvent(savedProtocol.id, {
      type: ProtocolEventType.STATUS_CHANGE,
      description: `Protocolo criado com status: ${savedProtocol.status}`,
      userId,
    });

    return savedProtocol;
  }

  async update(id: string, data: Partial<Protocol>, userId?: string): Promise<Protocol> {
    const protocol = await this.findOne(id);
    const oldStatus = protocol.status;

    Object.assign(protocol, data);
    const savedProtocol = await this.protocolRepository.save(protocol);

    if (data.status && data.status !== oldStatus) {
      await this.addEvent(id, {
        type: ProtocolEventType.STATUS_CHANGE,
        description: `Status alterado de ${oldStatus} para ${data.status}`,
        userId,
      });
    }

    return savedProtocol;
  }

  async addEvent(protocolId: string, eventData: Partial<ProtocolEvent>): Promise<ProtocolEvent> {
    const event = this.eventRepository.create({
      ...eventData,
      protocolId,
    });
    return this.eventRepository.save(event);
  }

  async delete(id: string): Promise<void> {
    const protocol = await this.findOne(id);
    await this.protocolRepository.remove(protocol);
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.protocolRepository.count();
    return `PROTO-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
