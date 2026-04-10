import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortalPublicationsService } from './portal-publications.service';

@ApiTags('Portal Publications')
@Controller('portal-publications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortalPublicationsController {
  constructor(private service: PortalPublicationsService) {}

  // ═══ ADMIN ROUTES ═══════════════════════════════════════════════════════════

  @Post()
  @ApiOperation({ summary: 'Publicar conteúdo no portal do cliente' })
  async publish(@Body() data: any, @Request() req) {
    return this.service.publish({
      ...data,
      publishedById: req.user?.userId || req.user?.id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover publicação do portal' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Desativar publicação (manter histórico)' })
  async unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar publicações (admin)' })
  async findAll(@Query('clientId') clientId?: string) {
    return this.service.findAll(clientId);
  }

  @Get('check')
  @ApiOperation({ summary: 'Verificar se conteúdo já foi publicado' })
  async checkPublished(
    @Query('contentType') contentType: string,
    @Query('contentId') contentId: string,
  ) {
    const published = await this.service.isPublished(contentType, contentId);
    return { published };
  }

  @Get('published-ids')
  @ApiOperation({ summary: 'Listar IDs publicados por tipo' })
  async getPublishedIds(
    @Query('contentType') contentType: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.getPublishedIds(contentType, clientId);
  }

  // ═══ PORTAL MODULE CONFIG ═══════════════════════════════════════════════

  @Get('modules/:clientId')
  @ApiOperation({ summary: 'Obter módulos do portal por cliente' })
  async getModules(@Param('clientId') clientId: string) {
    const modules = await this.service.getClientPortalModules(clientId);
    return { modules };
  }

  @Put('modules/:clientId')
  @ApiOperation({ summary: 'Atualizar módulos do portal do cliente' })
  async updateModules(@Param('clientId') clientId: string, @Body() body: { modules: string[] }) {
    await this.service.updateClientPortalModules(clientId, body.modules);
    return { success: true, modules: body.modules };
  }
}

@ApiTags('Portal do Cliente - Publicações')
@Controller('client-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientPortalPublicationsController {
  private readonly logger = new Logger(ClientPortalPublicationsController.name);

  constructor(private service: PortalPublicationsService) {}

  /**
   * Resolve the clientId from the JWT user.
   * - If logged in as client (via client-login), clientId comes from JWT
   * - If logged in as user with role='client', userId may be the user.id (from users table)
   *   and we need to find the matching client by userId/email
   */
  private async resolveClientId(user: any): Promise<string | null> {
    // Priority 1: clientId from JWT (set by client-login)
    if (user.clientId) {
      this.logger.debug(`Client resolved from JWT clientId: ${user.clientId}`);
      return user.clientId;
    }
    // Priority 2: userId (when sub = client.id, i.e., direct client login)
    if (user.userId && user.role === 'client') {
      this.logger.debug(`Client resolved from userId (role=client): ${user.userId}`);
      return user.userId;
    }
    this.logger.warn(`Could not resolve clientId from user: ${JSON.stringify(user)}`);
    return null;
  }

  @Get('my-publications')
  @ApiOperation({ summary: 'Publicações do cliente logado' })
  async getMyPublications(
    @Request() req,
    @Query('contentType') contentType?: string,
  ) {
    const clientId = await this.resolveClientId(req.user);
    this.logger.log(`my-publications: clientId=${clientId}, contentType=${contentType}, user=${JSON.stringify(req.user)}`);
    if (!clientId) return [];
    return this.service.getClientPublicationsEnriched(clientId, contentType);
  }

  @Get('my-portal-modules')
  @ApiOperation({ summary: 'Módulos habilitados no portal do cliente logado' })
  async getMyModules(@Request() req) {
    const clientId = await this.resolveClientId(req.user);
    if (!clientId) return { modules: [] };
    const modules = await this.service.getClientPortalModules(clientId);
    return { modules };
  }
}
