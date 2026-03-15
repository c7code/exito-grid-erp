import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorksService } from './works.service';
import { Work, WorkStatus } from './work.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const uploadStorage = diskStorage({
  destination: './uploads/works',
  filename: (_req, file, cb) => {
    const uniqueName = `${uuid()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@ApiTags('Obras')
@Controller('works')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorksController {
  constructor(private worksService: WorksService) { }

  @Get()
  @ApiOperation({ summary: 'Listar obras' })
  async findAll(@Query('status') status?: WorkStatus) {
    return this.worksService.findAll(status);
  }

  @Get('my-works')
  @ApiOperation({ summary: 'Listar obras do funcionário logado' })
  async findMyWorks(@Request() req) {
    return this.worksService.findMyWorks(req.user.email);
  }

  // ═══════ WORK TYPE CONFIGS (must be before :id) ═══════

  @Get('types/all')
  @ApiOperation({ summary: 'Listar tipos de obra cadastrados' })
  async getWorkTypes() {
    return this.worksService.findAllWorkTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Cadastrar novo tipo de obra' })
  async createWorkType(@Body() data: { label: string; key?: string }) {
    return this.worksService.createWorkType(data);
  }

  @Put('types/:id')
  @ApiOperation({ summary: 'Atualizar tipo de obra' })
  async updateWorkType(@Param('id') id: string, @Body() data: any) {
    return this.worksService.updateWorkType(id, data);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Remover tipo de obra' })
  async removeWorkType(@Param('id') id: string) {
    await this.worksService.removeWorkType(id);
    return { message: 'Tipo de obra removido' };
  }

  // ═══════ WORKS CRUD ═══════

  @Get(':id')
  @ApiOperation({ summary: 'Buscar obra por ID' })
  async findOne(@Param('id') id: string) {
    return this.worksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar obra' })
  async create(@Body() workData: Partial<Work>, @Request() req) {
    return this.worksService.create({ ...workData, createdById: req.user?.userId || req.user?.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar obra' })
  async update(@Param('id') id: string, @Body() workData: Partial<Work>, @Request() req) {
    return this.worksService.update(id, { ...workData, updatedById: req.user?.userId || req.user?.id });
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Atualizar progresso da obra' })
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.worksService.updateProgress(id, progress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover obra' })
  async remove(@Param('id') id: string) {
    await this.worksService.remove(id);
    return { message: 'Obra removida com sucesso' };
  }

  // --- Work Updates (progress tracking with images) ---

  @Get(':id/updates')
  @ApiOperation({ summary: 'Listar atualizações de progresso da obra' })
  async getUpdates(@Param('id') id: string) {
    return this.worksService.getUpdates(id);
  }

  @Post(':id/updates')
  @ApiOperation({ summary: 'Criar atualização de progresso com imagem' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: uploadStorage }))
  async createUpdate(
    @Param('id') id: string,
    @Body() body: { description: string; progress: string },
    @UploadedFile() file?: any,
  ) {
    const imageUrl = file ? `/uploads/works/${file.filename}` : undefined;
    return this.worksService.createUpdate(id, {
      description: body.description,
      progress: Number(body.progress),
      imageUrl,
    });
  }

  @Put('updates/:updateId')
  @ApiOperation({ summary: 'Editar atualização de progresso' })
  async updateWorkUpdate(
    @Param('updateId') updateId: string,
    @Body() body: { description?: string; progress?: number },
  ) {
    return this.worksService.updateWorkUpdate(updateId, body);
  }

  @Delete('updates/:updateId')
  @ApiOperation({ summary: 'Excluir atualização de progresso' })
  async deleteWorkUpdate(@Param('updateId') updateId: string) {
    await this.worksService.deleteWorkUpdate(updateId);
    return { message: 'Atualização removida' };
  }

  // ═══════ WORK PHASES (dynamic stages) ═══════

  @Get(':id/phases')
  @ApiOperation({ summary: 'Listar etapas da obra' })
  async getPhases(@Param('id') id: string) {
    return this.worksService.findPhases(id);
  }

  @Post(':id/phases')
  @ApiOperation({ summary: 'Criar etapa na obra' })
  async createPhase(@Param('id') id: string, @Body() body: any) {
    return this.worksService.createPhase(id, body);
  }

  @Put('phases/:phaseId')
  @ApiOperation({ summary: 'Editar etapa' })
  async updatePhase(@Param('phaseId') phaseId: string, @Body() body: any) {
    return this.worksService.updatePhase(phaseId, body);
  }

  @Delete('phases/:phaseId')
  @ApiOperation({ summary: 'Excluir etapa' })
  async deletePhase(@Param('phaseId') phaseId: string) {
    await this.worksService.deletePhase(phaseId);
    return { message: 'Etapa removida' };
  }

  @Post(':id/recalculate-progress')
  @ApiOperation({ summary: 'Recalcular progresso da obra com base nas etapas' })
  async recalculateProgress(@Param('id') id: string) {
    const progress = await this.worksService.recalculateProgress(id);
    return { progress };
  }
}
