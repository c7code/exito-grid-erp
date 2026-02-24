import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProtocolsService } from './protocols.service';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolEvent } from './protocol-event.entity';

@ApiTags('Protocolos')
@Controller('protocols')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProtocolsController {
  constructor(private protocolsService: ProtocolsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar protocolos' })
  async findAll(@Query('status') status?: ProtocolStatus) {
    return this.protocolsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar protocolo por ID' })
  async findOne(@Param('id') id: string) {
    return this.protocolsService.findOne(id);
  }

  @Post('attachment/:eventId')
  @ApiOperation({ summary: 'Anexar documento ao evento' })
  async addAttachment(@Param('eventId') eventId: string, @Body() data: any) {
    return this.protocolsService.saveAttachment(eventId, data);
  }

  @Put('events/:eventId')
  @ApiOperation({ summary: 'Atualizar evento do protocolo' })
  async updateEvent(@Param('eventId') eventId: string, @Body() eventData: Partial<ProtocolEvent>, @Req() req: any) {
    return this.protocolsService.updateEvent(eventId, { ...eventData, userId: req.user?.id });
  }

  @Post()
  @ApiOperation({ summary: 'Criar protocolo' })
  async create(@Body() protocolData: Partial<Protocol>, @Req() req: any) {
    return this.protocolsService.create(protocolData, req.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar protocolo' })
  async update(@Param('id') id: string, @Body() protocolData: Partial<Protocol>, @Req() req: any) {
    return this.protocolsService.update(id, protocolData, req.user?.id);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Adicionar evento ao protocolo' })
  async addEvent(@Param('id') id: string, @Body() eventData: Partial<ProtocolEvent>, @Req() req: any) {
    return this.protocolsService.addEvent(id, { ...eventData, userId: req.user?.id });
  }
}
