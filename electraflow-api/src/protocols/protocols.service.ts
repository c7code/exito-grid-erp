import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolEvent, ProtocolEventType } from './protocol-event.entity';
import { ProtocolAttachment } from './protocol-attachment.entity';
import { WorksService } from '../works/works.service';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectRepository(Protocol)
    private protocolRepository: Repository<Protocol>,
    @InjectRepository(ProtocolEvent)
    private eventRepository: Repository<ProtocolEvent>,
    @InjectRepository(ProtocolAttachment)
    private attachmentRepository: Repository<ProtocolAttachment>,
    private worksService: WorksService,
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
      relations: ['work', 'client', 'task', 'events', 'events.user', 'events.attachments'],
      order: { events: { createdAt: 'DESC' } },
    });
    if (!protocol) {
      throw new NotFoundException('Protocolo não encontrado');
    }
    return protocol;
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.protocolRepository.count();
    const sequence = (count + 1).toString().padStart(3, '0');
    return `PROT-${year}-${sequence}`;
  }

  async create(protocolData: Partial<Protocol>, userId?: string): Promise<Protocol> {
    if (!protocolData.code) {
      protocolData.code = await this.generateCode();
    }
    const protocol = this.protocolRepository.create(protocolData);
    protocol.openedAt = protocol.openedAt || new Date();
    protocol.submissionDate = protocol.submissionDate || protocol.openedAt;
    const savedProtocol = await this.protocolRepository.save(protocol);

    // Auto-create initial event
    await this.addEvent(savedProtocol.id, {
      type: ProtocolEventType.STATUS_CHANGE,
      description: `Protocolo criado com status: ${savedProtocol.status}`,
      userId,
    });

    return savedProtocol;
  }

  async update(id: string, protocolData: Partial<Protocol>, userId?: string): Promise<Protocol> {
    const protocol = await this.findOne(id);
    const oldStatus = protocol.status;

    Object.assign(protocol, protocolData);
    const savedProtocol = await this.protocolRepository.save(protocol);

    if (protocolData.status && protocolData.status !== oldStatus) {
      await this.addEvent(id, {
        type: ProtocolEventType.STATUS_CHANGE,
        description: `Status alterado de ${oldStatus} para ${protocolData.status}`,
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
    const savedEvent = await this.eventRepository.save(event);

    // Sync work progress if provided
    if (eventData.progress !== undefined) {
      const protocol = await this.protocolRepository.findOneBy({ id: protocolId });
      if (protocol && protocol.workId) {
        await this.worksService.updateProgress(protocol.workId, eventData.progress);
      }
    }

    return savedEvent;
  }

  async updateEvent(id: string, eventData: Partial<ProtocolEvent>): Promise<ProtocolEvent> {
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) throw new NotFoundException('Evento não encontrado');

    Object.assign(event, eventData);
    const savedEvent = await this.eventRepository.save(event);

    if (eventData.progress !== undefined) {
      const protocol = await this.protocolRepository.findOneBy({ id: event.protocolId });
      if (protocol && protocol.workId) {
        await this.worksService.updateProgress(protocol.workId, eventData.progress);
      }
    }

    return savedEvent;
  }

  async saveAttachment(eventId: string, data: Partial<ProtocolAttachment>): Promise<ProtocolAttachment> {
    const attachment = this.attachmentRepository.create({
      ...data,
      eventId,
    });
    return this.attachmentRepository.save(attachment);
  }

  async getSLAStats(): Promise<any> {
    const protocols = await this.protocolRepository.find({
      where: { status: ProtocolStatus.IN_ANALYSIS },
    });

    const stats = {
      total: protocols.length,
      critical: 0,
      warning: 0,
      normal: 0,
    };

    for (const p of protocols) {
      const daysOpen = (Date.now() - p.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      const slaPercent = daysOpen / p.slaDays;

      if (slaPercent > 0.9) stats.critical++;
      else if (slaPercent > 0.7) stats.warning++;
      else stats.normal++;
    }

    return stats;
  }
}
