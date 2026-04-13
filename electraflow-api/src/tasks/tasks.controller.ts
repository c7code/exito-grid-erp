import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';

@ApiTags('Tarefas')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) { }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas' })
  async findAll(@Request() req) {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    return this.tasksService.findAll(req.user?.email, isAdmin);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Listar tarefas atribuídas ao funcionário logado' })
  async findMyTasks(@Request() req) {
    return this.tasksService.findByEmployee(req.user.email);
  }

  @Get('my-pending')
  @ApiOperation({ summary: 'Listar tarefas pendentes do funcionário logado' })
  async findMyPending(@Request() req) {
    return this.tasksService.findByEmployee(req.user.email, 'pending');
  }

  @Get('by-work/:workId')
  @ApiOperation({ summary: 'Listar tarefas por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.tasksService.findByWork(workId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar tarefa' })
  async create(@Body() taskData: Partial<Task> & { resolverIds?: string[] }) {
    return this.tasksService.create(taskData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() taskData: Partial<Task> & { resolverIds?: string[] }) {
    return this.tasksService.update(id, taskData);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar tarefa' })
  async complete(
    @Param('id') id: string,
    @Body('result') result: string,
    @Body('resolutionType') resolutionType: string,
    @Body('resolutionNotes') resolutionNotes: string,
    @Request() req,
  ) {
    return this.tasksService.complete(
      id,
      req.user.userId,
      result,
      req.user.email, // resolvedByEmail from JWT
      resolutionType || 'total',
      resolutionNotes,
    );
  }

  @Put(':id/resolvers')
  @ApiOperation({ summary: 'Atualizar resolvedores da tarefa' })
  async updateResolvers(@Param('id') id: string, @Body('resolverIds') resolverIds: string[]) {
    await this.tasksService.syncResolvers(id, resolverIds || []);
    return this.tasksService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tarefa' })
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
    return { message: 'Tarefa removida com sucesso' };
  }
}
