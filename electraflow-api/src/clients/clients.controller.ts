import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest, RequestStatus } from './client-request.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const documentUploadStorage = diskStorage({
  destination: './uploads/client-documents',
  filename: (_req, file, cb) => {
    const uniqueName = `${uuid()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const requestUploadStorage = diskStorage({
  destination: './uploads/requests',
  filename: (_req, file, cb) => {
    const uniqueName = `${uuid()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@ApiTags('Clientes')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private clientsService: ClientsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  async findAll(@Query('q') query?: string) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar cliente (gera acesso ao portal automaticamente)' })
  async create(@Body() clientData: Partial<Client>, @Request() req) {
    return this.clientsService.create({ ...clientData, createdById: req.user?.userId || req.user?.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  async update(@Param('id') id: string, @Body() clientData: Partial<Client>) {
    return this.clientsService.update(id, clientData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/generate-access')
  @ApiOperation({ summary: 'Gerar/resetar senha do portal para o cliente' })
  async generatePortalAccess(@Param('id') id: string) {
    return this.clientsService.generatePortalAccess(id);
  }

  @Post('sync-users')
  @ApiOperation({ summary: 'Sincronizar clientes existentes — cria Users para quem ainda não tem' })
  async syncClientsToUsers() {
    return this.clientsService.syncExistingClientsToUsers();
  }

  // ═══ ADMIN REQUEST MANAGEMENT ═══════════════════════════════════════════════

  @Get('requests/all')
  @ApiOperation({ summary: 'Listar todas as solicitações de clientes (admin)' })
  async getAllRequests() {
    return this.clientsService.getAllRequests();
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Detalhe de solicitação (admin)' })
  async getRequestDetail(@Param('id') id: string) {
    return this.clientsService.getRequestDetail(id);
  }

  @Put('requests/:id/respond')
  @ApiOperation({ summary: 'Responder solicitação do cliente (admin)' })
  async respondToRequest(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { adminResponse: string; status: RequestStatus },
  ) {
    return this.clientsService.respondToRequest(id, {
      adminResponse: body.adminResponse,
      status: body.status,
      respondedBy: req.user.name || req.user.email || req.user.userId,
    });
  }

  // ═══ DOCUMENTS ═════════════════════════════════════════════════════════════

  @Post(':id/documents')
  @ApiOperation({ summary: 'Adicionar documento ao cliente' })
  async addDocument(@Param('id') id: string, @Body() data: Partial<ClientDocument>) {
    return this.clientsService.addDocument(id, data);
  }

  @Post(':id/documents/upload')
  @ApiOperation({ summary: 'Upload de documento do cliente' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: documentUploadStorage }))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: string; issueDate?: string; expiryDate?: string },
  ) {
    const fileUrl = `/uploads/client-documents/${file.filename}`;
    return this.clientsService.addDocument(id, {
      name: file.originalname,
      url: fileUrl,
      type: body.type || 'other',
      issueDate: body.issueDate || null,
      expiryDate: body.expiryDate || null,
    } as any);
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Atualizar documento do cliente' })
  async updateDocument(@Param('id') id: string, @Body() data: Partial<ClientDocument>) {
    return this.clientsService.updateDocument(id, data);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Remover documento do cliente' })
  async removeDocument(@Param('id') id: string) {
    return this.clientsService.removeDocument(id);
  }
}

// ═══ CLIENT PORTAL CONTROLLER ═══════════════════════════════════════════════

@ApiTags('Portal do Cliente')
@Controller('client-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientPortalController {
  constructor(private clientsService: ClientsService) { }

  @Get('my-works')
  @ApiOperation({ summary: 'Obras do cliente logado' })
  async getMyWorks(@Request() req) {
    return this.clientsService.getClientWorks(req.user.userId);
  }

  @Get('my-works/:id')
  @ApiOperation({ summary: 'Detalhe de obra do cliente' })
  async getMyWorkDetail(@Request() req, @Param('id') workId: string) {
    return this.clientsService.getClientWorkDetail(req.user.userId, workId);
  }

  @Get('my-proposals')
  @ApiOperation({ summary: 'Propostas do cliente logado' })
  async getMyProposals(@Request() req) {
    return this.clientsService.getClientProposals(req.user.clientId || req.user.userId);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Solicitações do cliente logado' })
  async getMyRequests(@Request() req) {
    return this.clientsService.getClientRequests(req.user.userId);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Criar nova solicitação com anexos' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: requestUploadStorage }))
  async createRequest(
    @Request() req,
    @Body() data: Partial<ClientRequest>,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.clientsService.createClientRequest(req.user.userId, data, files);
  }
}
