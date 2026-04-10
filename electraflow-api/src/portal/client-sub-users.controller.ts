import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards, Request, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientSubUsersService } from './client-sub-users.service';
import { ClientSubUserRole } from './client-sub-user.entity';

/**
 * Admin endpoints for managing client sub-users
 * Admin has FULL authority over all sub-users
 */
@Controller('admin/client-sub-users')
@UseGuards(JwtAuthGuard)
export class AdminClientSubUsersController {
  constructor(private subUsersService: ClientSubUsersService) {}

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    if (clientId) {
      return this.subUsersService.findByClient(clientId);
    }
    return this.subUsersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subUsersService.findById(id);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.subUsersService.create({
      ...body,
      createdById: req.user?.sub || req.user?.id,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.subUsersService.update(id, body);
  }

  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.subUsersService.resetPassword(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.subUsersService.remove(id);
    return { success: true };
  }
}

/**
 * Client-facing endpoints - the client owner can manage their own sub-users
 * But admin always has override authority
 */
@Controller('client/sub-users')
@UseGuards(JwtAuthGuard)
export class ClientSubUsersController {
  constructor(private subUsersService: ClientSubUsersService) {}

  @Get()
  async getMySubUsers(@Request() req: any) {
    const clientId = req.user?.clientId;
    if (!clientId) return [];
    return this.subUsersService.findByClient(clientId);
  }

  @Post()
  async createSubUser(@Body() body: any, @Request() req: any) {
    const clientId = req.user?.clientId;
    if (!clientId) return { error: 'Sem permissão' };

    // Client owner can only create viewer/safety roles
    const allowedRoles = [ClientSubUserRole.VIEWER, ClientSubUserRole.SAFETY];
    const role = allowedRoles.includes(body.role) ? body.role : ClientSubUserRole.VIEWER;

    return this.subUsersService.create({
      ...body,
      clientId,
      role,
      createdById: req.user?.sub || req.user?.id,
    });
  }

  @Put(':id')
  async updateSubUser(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const clientId = req.user?.clientId;
    const subUser = await this.subUsersService.findById(id);
    if (!subUser || subUser.clientId !== clientId) {
      return { error: 'Sem permissão' };
    }

    // Client can only change limited fields
    const allowed: any = {};
    if (body.name) allowed.name = body.name;
    if (body.phone) allowed.phone = body.phone;
    if (body.position) allowed.position = body.position;
    if (body.isActive !== undefined) allowed.isActive = body.isActive;
    if (body.allowedModules) allowed.allowedModules = body.allowedModules;

    return this.subUsersService.update(id, allowed);
  }

  @Delete(':id')
  async deleteSubUser(@Param('id') id: string, @Request() req: any) {
    const clientId = req.user?.clientId;
    const subUser = await this.subUsersService.findById(id);
    if (!subUser || subUser.clientId !== clientId) {
      return { error: 'Sem permissão' };
    }
    await this.subUsersService.remove(id);
    return { success: true };
  }
}
