import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@ApiTags('Opportunities')
@Controller('opportunities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todas as oportunidades' })
  async findAll() {
    return this.opportunitiesService.findAll();
  }

  @Get('by-status/:status')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Oportunidades por status' })
  async findByStatus(@Param('status') status: string) {
    return this.opportunitiesService.findByStatus(status as any);
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar oportunidade por ID' })
  async findById(@Param('id') id: string) {
    return this.opportunitiesService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar nova oportunidade' })
  async create(@Body() data: any) {
    return this.opportunitiesService.create(data);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar oportunidade' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.opportunitiesService.update(id, data);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover oportunidade' })
  async delete(@Param('id') id: string) {
    await this.opportunitiesService.delete(id);
    return { message: 'Oportunidade removida com sucesso' };
  }
}
