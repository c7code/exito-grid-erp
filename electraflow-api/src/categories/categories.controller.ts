import { Controller, Get, Post, Put, Patch, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Get('all')
  @ApiOperation({ summary: 'Listar todas as categorias (admin)' })
  findAll() {
    return this.svc.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias por grupo' })
  findByGroup(@Query('group') group: string) {
    return this.svc.findByGroup(group);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria' })
  create(@Body() data: CreateCategoryDto, @Req() req: any) {
    if (!['admin', 'engineer', 'commercial'].includes(req.user?.role)) throw new ForbiddenException('Acesso negado');
    return this.svc.create({ ...data, createdBy: req.user?.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(@Param('id') id: string, @Body() data: UpdateCategoryDto, @Req() req: any) {
    if (!['admin', 'engineer', 'commercial'].includes(req.user?.role)) throw new ForbiddenException('Acesso negado');
    return this.svc.update(id, data);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar categoria' })
  toggleActive(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir');
    return this.svc.toggleActive(id);
  }
}
