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
import { WorksService, CreateWorkDto, UpdateWorkDto } from './works.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Works')
@Controller('works')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorksController {
  constructor(private worksService: WorksService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todas as obras' })
  async findAll() {
    return this.worksService.findAll();
  }

  @Get('active')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obras ativas' })
  async findActive() {
    return this.worksService.findActive();
  }

  @Get('my-works')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minhas obras' })
  async findMyWorks(@Request() req) {
    return this.worksService.findByResponsible(req.user.sub);
  }

  @Get('by-client/:clientId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obras por cliente' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.worksService.findByClient(clientId);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de obras' })
  async getStats() {
    return this.worksService.getStats();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar obra por ID' })
  async findById(@Param('id') id: string) {
    return this.worksService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar nova obra' })
  async create(@Body() createDto: CreateWorkDto) {
    return this.worksService.create(createDto);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar obra' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkDto) {
    return this.worksService.update(id, updateDto);
  }

  @Put(':id/progress')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar progresso da obra' })
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.worksService.updateProgress(id, progress);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover obra' })
  async delete(@Param('id') id: string) {
    await this.worksService.delete(id);
    return { message: 'Obra removida com sucesso' };
  }
}
