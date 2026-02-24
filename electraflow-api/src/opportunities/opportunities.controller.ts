import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpportunitiesService } from './opportunities.service';
import { Opportunity, OpportunityStage } from './opportunity.entity';

@ApiTags('Oportunidades')
@Controller('opportunities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar oportunidades' })
  async findAll(@Query('stage') stage?: OpportunityStage) {
    return this.opportunitiesService.findAll(stage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar oportunidade por ID' })
  async findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar oportunidade' })
  async create(@Body() oppData: Partial<Opportunity>) {
    return this.opportunitiesService.create(oppData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar oportunidade' })
  async update(@Param('id') id: string, @Body() oppData: Partial<Opportunity>) {
    return this.opportunitiesService.update(id, oppData);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Mover oportunidade de estágio' })
  async moveStage(@Param('id') id: string, @Body('stage') stage: OpportunityStage) {
    return this.opportunitiesService.moveStage(id, stage);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover oportunidade' })
  async remove(@Param('id') id: string) {
    await this.opportunitiesService.remove(id);
    return { message: 'Oportunidade removida com sucesso' };
  }
}
