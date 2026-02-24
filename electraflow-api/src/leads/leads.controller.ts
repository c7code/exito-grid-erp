import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeadsService } from './leads.service';
import { Lead, LeadStatus } from './lead.entity';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar leads' })
  async findAll(@Query('status') status?: LeadStatus) {
    return this.leadsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lead por ID' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar lead' })
  async create(@Body() leadData: Partial<Lead>) {
    return this.leadsService.create(leadData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lead' })
  async update(@Param('id') id: string, @Body() leadData: Partial<Lead>) {
    return this.leadsService.update(id, leadData);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Converter lead em oportunidade' })
  async convert(@Param('id') id: string, @Body('opportunityId') opportunityId: string) {
    return this.leadsService.convert(id, opportunityId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover lead' })
  async remove(@Param('id') id: string) {
    await this.leadsService.remove(id);
    return { message: 'Lead removido com sucesso' };
  }
}
