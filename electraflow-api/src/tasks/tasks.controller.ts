import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CompleteTaskDto, RejectTaskDto, UpdateTaskResolversDto } from './dto';

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
  async create(@Body() taskData: CreateTaskDto) {
    return this.tasksService.create(taskData as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() taskData: UpdateTaskDto) {
    return this.tasksService.update(id, taskData as any);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar tarefa' })
  async complete(
    @Param('id') id: string,
    @Body() body: CompleteTaskDto,
    @Request() req,
  ) {
    return this.tasksService.complete(
      id,
      req.user.userId,
      body.result,
      req.user.email,
      body.resolutionType || 'total',
      body.resolutionNotes,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar tarefa (revisão interna)' })
  async approve(@Param('id') id: string) {
    return this.tasksService.approve(id);
  }

  @Post(':id/client-approve')
  @ApiOperation({ summary: 'Aprovar tarefa (revisão do cliente)' })
  async clientApprove(@Param('id') id: string) {
    return this.tasksService.clientApprove(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar tarefa' })
  async reject(@Param('id') id: string, @Body() body: RejectTaskDto) {
    return this.tasksService.reject(id, body.reason);
  }

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Enviar tarefa para revisão' })
  async submitForReview(@Param('id') id: string) {
    return this.tasksService.submitForReview(id);
  }

  @Put(':id/resolvers')
  @ApiOperation({ summary: 'Atualizar resolvedores da tarefa' })
  async updateResolvers(@Param('id') id: string, @Body() body: UpdateTaskResolversDto) {
    await this.tasksService.syncResolvers(id, body.resolverIds || []);
    return this.tasksService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tarefa' })
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
    return { message: 'Tarefa removida com sucesso' };
  }
}
