import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolEvent, ProtocolEventType } from './protocol-event.entity';
import { ProtocolAttachment } from './protocol-attachment.entity';
import { WorksService } from '../works/works.service';

const VALID_PROTOCOL_TRANSITIONS: Record<string, string[]> = {
  'open': ['in_analysis', 'pending', 'cancelled'],
  'in_analysis': ['pending', 'requirement', 'approved', 'rejected', 'cancelled'],
  'pending': ['in_analysis', 'requirement', 'cancelled'],
  'requirement': ['in_analysis', 'pending', 'cancelled'],
  'approved': ['closed'],
  'rejected': ['open', 'closed'],
  'closed': [],
  'cancelled': ['open'],
};

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

    // Calculate remainingDays from SLA
    if (protocol.slaDays && protocol.slaDays > 0) {
      const openedAt = protocol.openedAt || new Date();
      const daysOpen = (Date.now() - openedAt.getTime()) / (1000 * 60 * 60 * 24);
      protocol.remainingDays = Math.max(0, Math.ceil(protocol.slaDays - daysOpen));
    }

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

    // Validate status transition
    if (protocolData.status && protocolData.status !== oldStatus) {
      const allowed = VALID_PROTOCOL_TRANSITIONS[oldStatus] || [];
      if (!allowed.includes(protocolData.status)) {
        throw new BadRequestException(`Transição de status inválida: ${oldStatus} → ${protocolData.status}`);
      }
    }

    Object.assign(protocol, protocolData);

    // Recalculate remainingDays from SLA
    if (protocol.slaDays && protocol.slaDays > 0 && protocol.openedAt) {
      const daysOpen = (Date.now() - protocol.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      protocol.remainingDays = Math.max(0, Math.ceil(protocol.slaDays - daysOpen));
    }

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

  async softDelete(id: string): Promise<void> {
    const protocol = await this.protocolRepository.findOneBy({ id });
    if (!protocol) throw new NotFoundException('Protocolo não encontrado');
    await this.protocolRepository.softRemove(protocol);
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
    // Check all active statuses, not just IN_ANALYSIS
    const protocols = await this.protocolRepository.find({
      where: [
        { status: ProtocolStatus.OPEN },
        { status: ProtocolStatus.IN_ANALYSIS },
        { status: ProtocolStatus.PENDING },
        { status: ProtocolStatus.REQUIREMENT },
      ],
    });

    const stats = {
      total: protocols.length,
      critical: 0,
      warning: 0,
      normal: 0,
      noSla: 0,
    };

    for (const p of protocols) {
      // Guard against missing/zero slaDays
      if (!p.slaDays || p.slaDays === 0) {
        stats.noSla++;
        continue;
      }

      const daysOpen = (Date.now() - p.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      const slaPercent = daysOpen / p.slaDays;

      if (slaPercent > 0.9) stats.critical++;
      else if (slaPercent > 0.7) stats.warning++;
      else stats.normal++;
    }

    return stats;
  }
}
