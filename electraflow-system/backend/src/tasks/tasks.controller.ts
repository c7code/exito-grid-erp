import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService, CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todas as tarefas' })
  async findAll() {
    return this.tasksService.findAll();
  }

  @Get('my-tasks')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minhas tarefas' })
  async findMyTasks(@Request() req) {
    return this.tasksService.findByAssignedUser(req.user.sub);
  }

  @Get('my-pending')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minhas tarefas pendentes' })
  async findMyPending(@Request() req) {
    return this.tasksService.findPendingByUser(req.user.sub);
  }

  @Get('overdue')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tarefas atrasadas' })
  async findOverdue() {
    return this.tasksService.findOverdue();
  }

  @Get('by-work/:workId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Tarefas por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.tasksService.findByWork(workId);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de tarefas' })
  async getStats() {
    return this.tasksService.getStats();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  async findById(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar nova tarefa' })
  async create(@Body() createDto: CreateTaskDto) {
    return this.tasksService.create(createDto);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateDto);
  }

  @Put(':id/progress')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar progresso da tarefa' })
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.tasksService.updateProgress(id, progress);
  }

  @Put(':id/checklist')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar checklist da tarefa' })
  async updateChecklist(@Param('id') id: string, @Body('checklist') checklist: any[]) {
    return this.tasksService.updateChecklist(id, checklist);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover tarefa' })
  async delete(@Param('id') id: string) {
    await this.tasksService.delete(id);
    return { message: 'Tarefa removida com sucesso' };
  }
}
