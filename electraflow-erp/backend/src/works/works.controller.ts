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
import { WorksService } from './works.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

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

  @Get('my-works')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minhas obras' })
  async findMyWorks(@Request() req) {
    return this.worksService.findByResponsible(req.user.userId);
  }

  @Get('by-client/:clientId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obras por cliente' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.worksService.findByClient(clientId);
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
  async create(@Body() data: any) {
    return this.worksService.create(data);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar obra' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.worksService.update(id, data);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover obra' })
  async delete(@Param('id') id: string) {
    await this.worksService.delete(id);
    return { message: 'Obra removida com sucesso' };
  }
}
