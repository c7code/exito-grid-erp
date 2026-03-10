import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarkupService } from './markup.service';
import { MarkupConfig } from './markup.entity';

@ApiTags('Markup')
@Controller('markup')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarkupController {
    constructor(private service: MarkupService) { }

    @Get()
    @ApiOperation({ summary: 'Listar configurações de markup' })
    findAll(@Query('scope') scope?: string) {
        return this.service.findAll(scope);
    }

    @Get('resolve')
    @ApiOperation({ summary: 'Resolver markup aplicável para um contexto' })
    resolve(
        @Query('categoryId') categoryId?: string,
        @Query('activityType') activityType?: string,
        @Query('supplierType') supplierType?: string,
        @Query('clientType') clientType?: string,
    ) {
        return this.service.resolveMarkup({ categoryId, activityType, supplierType, clientType });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar configuração por ID' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar configuração de markup' })
    create(@Body() data: Partial<MarkupConfig>) {
        return this.service.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar configuração de markup' })
    update(@Param('id') id: string, @Body() data: Partial<MarkupConfig>) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover configuração de markup' })
    async remove(@Param('id') id: string) {
        await this.service.remove(id);
        return { message: 'Configuração removida com sucesso' };
    }
}
