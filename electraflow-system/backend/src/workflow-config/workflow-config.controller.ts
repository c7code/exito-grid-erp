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
import { WorkflowConfigService, CreateWorkflowConfigDto, UpdateWorkflowConfigDto } from './workflow-config.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { WorkType, ProcessStage } from './workflow-config.entity';

@ApiTags('Workflow Config')
@Controller('workflow-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowConfigController {
  constructor(private workflowConfigService: WorkflowConfigService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todas as configurações de workflow' })
  async findAll() {
    return this.workflowConfigService.findAll();
  }

  @Get('by-type/:workType')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar configurações por tipo de obra' })
  async findByWorkType(@Param('workType') workType: WorkType) {
    return this.workflowConfigService.findByWorkType(workType);
  }

  @Get('template/:workType')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obter template completo de workflow' })
  async getTemplate(@Param('workType') workType: WorkType) {
    return this.workflowConfigService.getWorkflowTemplate(workType);
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar configuração por ID' })
  async findById(@Param('id') id: string) {
    return this.workflowConfigService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova configuração de workflow (Admin only)' })
  async create(@Body() createDto: CreateWorkflowConfigDto, @Request() req) {
    return this.workflowConfigService.create({
      ...createDto,
      createdById: req.user.userId,
    });
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar configuração (Admin only)' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkflowConfigDto) {
    return this.workflowConfigService.update(id, updateDto);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover configuração (Admin only)' })
  async delete(@Param('id') id: string) {
    await this.workflowConfigService.delete(id);
    return { message: 'Configuração removida com sucesso' };
  }

  @Post('validate-deadline')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Validar prazo proposto' })
  async validateDeadline(
    @Body() data: { workType: WorkType; stage: ProcessStage; stepName: string; proposedDays: number },
  ) {
    return this.workflowConfigService.validateDeadline(
      data.workType,
      data.stage,
      data.stepName,
      data.proposedDays,
    );
  }
}
