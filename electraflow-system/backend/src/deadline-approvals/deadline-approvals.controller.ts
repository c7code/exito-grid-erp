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
import { DeadlineApprovalsService, CreateDeadlineApprovalDto, AdminApprovalDto, ClientApprovalDto } from './deadline-approvals.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Deadline Approvals')
@Controller('deadline-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeadlineApprovalsController {
  constructor(private deadlineApprovalsService: DeadlineApprovalsService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas as solicitações (Admin only)' })
  async findAll() {
    return this.deadlineApprovalsService.findAll();
  }

  @Get('pending-admin')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar solicitações pendentes para admin' })
  async findPendingForAdmin() {
    return this.deadlineApprovalsService.findPendingForAdmin();
  }

  @Get('pending-client')
  @RequireRoles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Listar solicitações pendentes para cliente' })
  async findPendingForClient(@Request() req) {
    return this.deadlineApprovalsService.findPendingForClient(req.user.sub);
  }

  @Get('my-requests')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar minhas solicitações' })
  async findMyRequests(@Request() req) {
    return this.deadlineApprovalsService.findByRequester(req.user.sub);
  }

  @Get('by-task/:taskId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar solicitações por tarefa' })
  async findByTask(@Param('taskId') taskId: string) {
    return this.deadlineApprovalsService.findByTask(taskId);
  }

  @Get('by-work/:workId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar solicitações por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.deadlineApprovalsService.findByWork(workId);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de aprovações' })
  async getStats() {
    return this.deadlineApprovalsService.getStats();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar solicitação por ID' })
  async findById(@Param('id') id: string) {
    return this.deadlineApprovalsService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova solicitação de prazo' })
  async create(@Body() createDto: CreateDeadlineApprovalDto, @Request() req) {
    return this.deadlineApprovalsService.create({
      ...createDto,
      requestedById: req.user.sub,
    });
  }

  @Put(':id/admin-approve')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprovar/rejeitar solicitação (Admin only)' })
  async adminApprove(
    @Param('id') id: string,
    @Body() approvalDto: AdminApprovalDto,
    @Request() req,
  ) {
    return this.deadlineApprovalsService.adminApprove(id, req.user.sub, approvalDto);
  }

  @Put(':id/client-approve')
  @RequireRoles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Aprovar/rejeitar solicitação (Cliente)' })
  async clientApprove(
    @Param('id') id: string,
    @Body() approvalDto: ClientApprovalDto,
    @Request() req,
  ) {
    return this.deadlineApprovalsService.clientApprove(id, req.user.sub, approvalDto);
  }

  @Delete(':id')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar solicitação' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.deadlineApprovalsService.cancel(id, req.user.sub);
  }
}
