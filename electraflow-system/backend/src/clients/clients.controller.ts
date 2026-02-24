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
import { ClientsService, CreateClientDto, UpdateClientDto } from './clients.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { ClientSegment } from './client.entity';

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

  @Get('with-portal')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clientes com acesso ao portal' })
  async findWithPortalAccess() {
    return this.clientsService.findWithPortalAccess();
  }

  @Get('by-segment/:segment')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Clientes por segmento' })
  async findBySegment(@Param('segment') segment: ClientSegment) {
    return this.clientsService.findBySegment(segment);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de clientes' })
  async getStats() {
    return this.clientsService.getStats();
  }

  @Get('my-clients')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Meus clientes (account manager)' })
  async findMyClients(@Request() req) {
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
