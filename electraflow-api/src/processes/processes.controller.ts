import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProcessesService } from './processes.service';
import { CreateProcessDto, UpdateProcessDto, CreateProcessStageDto, UpdateProcessStageDto, CreateChecklistItemDto, ToggleChecklistDto } from './dto';

@ApiTags('Processos')
@Controller('processes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProcessesController {
  constructor(private processesService: ProcessesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar processos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.processesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo por ID' })
  async findOne(@Param('id') id: string) {
    return this.processesService.findOne(id);
  }

  @Get('work/:workId')
  @ApiOperation({ summary: 'Buscar processo por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.processesService.findByWork(workId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar processo' })
  async create(@Body() processData: CreateProcessDto) {
    return this.processesService.create(processData as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar processo' })
  async update(@Param('id') id: string, @Body() data: UpdateProcessDto) {
    return this.processesService.update(id, data as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover processo' })
  async remove(@Param('id') id: string) {
    return this.processesService.remove(id);
  }

  @Post(':id/stages')
  @ApiOperation({ summary: 'Criar etapa do processo' })
  async createStage(@Param('id') processId: string, @Body() stageData: CreateProcessStageDto) {
    return this.processesService.createStage(processId, stageData as any);
  }

  @Delete('stages/:stageId')
  @ApiOperation({ summary: 'Remover etapa' })
  async removeStage(@Param('stageId') stageId: string) {
    return this.processesService.removeStage(stageId);
  }

  @Put('stages/:stageId')
  @ApiOperation({ summary: 'Atualizar etapa' })
  async updateStage(@Param('stageId') stageId: string, @Body() stageData: UpdateProcessStageDto) {
    return this.processesService.updateStage(stageId, stageData as any);
  }

  @Post('stages/:stageId/checklist')
  @ApiOperation({ summary: 'Adicionar item ao checklist' })
  async createChecklistItem(@Param('stageId') stageId: string, @Body() itemData: CreateChecklistItemDto) {
    return this.processesService.createChecklistItem(stageId, itemData as any);
  }

  @Delete('stages/:stageId/checklist/:itemIndex')
  @ApiOperation({ summary: 'Remover item do checklist' })
  async removeChecklistItem(@Param('stageId') stageId: string, @Param('itemIndex') itemIndex: string) {
    return this.processesService.removeChecklistItem(stageId, itemIndex);
  }

  @Post('checklist/:itemId/toggle')
  @ApiOperation({ summary: 'Marcar/desmarcar item do checklist' })
  async toggleChecklist(@Param('itemId') itemId: string, @Body() data: ToggleChecklistDto, @Request() req) {
    return this.processesService.toggleChecklistItem(itemId, data.completed, req.user.userId);
  }
}
