import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

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
    return this.tasksService.findByAssignedUser(req.user.userId);
  }

  @Get('my-pending')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minhas tarefas pendentes' })
  async findMyPending(@Request() req) {
    return this.tasksService.findPendingByUser(req.user.userId);
  }

  @Get('by-work/:workId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Tarefas por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.tasksService.findByWork(workId);
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
  async create(@Body() data: any) {
    return this.tasksService.create(data);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover tarefa' })
  async delete(@Param('id') id: string) {
    await this.tasksService.delete(id);
    return { message: 'Tarefa removida com sucesso' };
  }
}
