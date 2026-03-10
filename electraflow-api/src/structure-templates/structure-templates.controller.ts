import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StructureTemplatesService } from './structure-templates.service';
import { StructureTemplate, StructureTemplateItem } from './structure-template.entity';

@ApiTags('Estruturas')
@Controller('structure-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StructureTemplatesController {
    constructor(private service: StructureTemplatesService) { }

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATES
    // ═══════════════════════════════════════════════════════════════

    @Get()
    @ApiOperation({ summary: 'Listar templates de estrutura' })
    findAll(
        @Query('concessionaria') concessionaria?: string,
        @Query('tensionLevel') tensionLevel?: string,
        @Query('category') category?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAll({ concessionaria, tensionLevel, category, search });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar template por ID' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Get(':id/summary')
    @ApiOperation({ summary: 'Resumo do template com custos' })
    getSummary(@Param('id') id: string) {
        return this.service.getTemplateSummary(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar template de estrutura' })
    create(@Body() data: Partial<StructureTemplate>) {
        return this.service.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar template de estrutura' })
    update(@Param('id') id: string, @Body() data: Partial<StructureTemplate>) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover template de estrutura' })
    async remove(@Param('id') id: string) {
        await this.service.remove(id);
        return { message: 'Template removido com sucesso' };
    }

    // ═══════════════════════════════════════════════════════════════
    // ITEMS
    // ═══════════════════════════════════════════════════════════════

    @Post(':id/items')
    @ApiOperation({ summary: 'Adicionar item ao template' })
    addItem(@Param('id') templateId: string, @Body() data: Partial<StructureTemplateItem>) {
        return this.service.addItem(templateId, data);
    }

    @Put('items/:itemId')
    @ApiOperation({ summary: 'Atualizar item do template' })
    updateItem(@Param('itemId') itemId: string, @Body() data: Partial<StructureTemplateItem>) {
        return this.service.updateItem(itemId, data);
    }

    @Delete('items/:itemId')
    @ApiOperation({ summary: 'Remover item do template' })
    async removeItem(@Param('itemId') itemId: string) {
        await this.service.removeItem(itemId);
        return { message: 'Item removido com sucesso' };
    }
}
