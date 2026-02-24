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

  @Get(':id')
  @ApiOperation({ summary: 'Buscar obra por ID' })
  async findOne(@Param('id') id: string) {
    return this.worksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar obra' })
  async create(@Body() workData: Partial<Work>) {
    return this.worksService.create(workData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar obra' })
  async update(@Param('id') id: string, @Body() workData: Partial<Work>) {
    return this.worksService.update(id, workData);
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
}
