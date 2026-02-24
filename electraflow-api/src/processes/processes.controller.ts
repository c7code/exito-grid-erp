import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProcessesService } from './processes.service';
import { Process } from './process.entity';

@ApiTags('Processos')
@Controller('processes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProcessesController {
  constructor(private processesService: ProcessesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar processos' })
  async findAll() {
    return this.processesService.findAll();
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
  async create(@Body() processData: Partial<Process>) {
    return this.processesService.create(processData);
  }

  @Put('stages/:stageId')
  @ApiOperation({ summary: 'Atualizar etapa' })
  async updateStage(@Param('stageId') stageId: string, @Body() stageData: any) {
    return this.processesService.updateStage(stageId, stageData);
  }

  @Post('checklist/:itemId/toggle')
  @ApiOperation({ summary: 'Marcar/desmarcar item do checklist' })
  async toggleChecklist(@Param('itemId') itemId: string, @Body('completed') completed: boolean, @Request() req) {
    return this.processesService.toggleChecklistItem(itemId, completed, req.user.userId);
  }
}
