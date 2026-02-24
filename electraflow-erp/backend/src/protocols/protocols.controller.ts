import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProtocolsService } from './protocols.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { SetMetadata } from '@nestjs/common';
import { ProtocolStatus } from './protocol.entity';
import { ProtocolEvent } from './protocol-event.entity';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@ApiTags('Protocols')
@Controller('protocols')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProtocolsController {
  constructor(private protocolsService: ProtocolsService) { }

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todos os protocolos' })
  async findAll(@Query('status') status?: ProtocolStatus) {
    return this.protocolsService.findAll(status);
  }

  @Get('by-work/:workId')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Protocolos por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.protocolsService.findByWork(workId);
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Buscar protocolo por ID' })
  async findOne(@Param('id') id: string) {
    return this.protocolsService.findOne(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Criar novo protocolo' })
  async create(@Body() data: any, @Req() req: any) {
    return this.protocolsService.create(data, req.user?.id);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar protocolo' })
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.protocolsService.update(id, data, req.user?.id);
  }

  @Post(':id/events')
  @RequireRoles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Adicionar evento ao protocolo' })
  async addEvent(@Param('id') id: string, @Body() eventData: Partial<ProtocolEvent>, @Req() req: any) {
    return this.protocolsService.addEvent(id, { ...eventData, userId: req.user?.id });
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover protocolo' })
  async delete(@Param('id') id: string) {
    await this.protocolsService.delete(id);
    return { message: 'Protocolo removido com sucesso' };
  }
}
