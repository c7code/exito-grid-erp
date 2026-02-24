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
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@ApiTags('Proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todas as propostas' })
  async findAll() {
    return this.proposalsService.findAll();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  async findById(@Param('id') id: string) {
    return this.proposalsService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar nova proposta' })
  async create(@Body() data: any) {
    return this.proposalsService.create(data);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar proposta' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.proposalsService.update(id, data);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover proposta' })
  async delete(@Param('id') id: string) {
    await this.proposalsService.delete(id);
    return { message: 'Proposta removida com sucesso' };
  }
}
