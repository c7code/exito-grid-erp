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
import { ClientsService, CreateClientDto, UpdateClientDto } from './clients.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todos os clientes' })
  async findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findById(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar novo cliente' })
  async create(@Body() createDto: CreateClientDto) {
    return this.clientsService.create(createDto);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar cliente' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateClientDto) {
    return this.clientsService.update(id, updateDto);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover cliente' })
  async delete(@Param('id') id: string) {
    await this.clientsService.delete(id);
    return { message: 'Cliente removido com sucesso' };
  }
}
