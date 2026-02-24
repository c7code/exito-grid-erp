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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Protocol, ProtocolStatus, ProtocolEvent } from './protocol.entity';

@ApiTags('Protocols')
@Controller('protocols')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProtocolsController {
    constructor(private protocolsService: ProtocolsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos os protocolos' })
    async findAll(@Query('status') status?: ProtocolStatus) {
        return this.protocolsService.findAll(status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar protocolo por ID' })
    async findOne(@Param('id') id: string) {
        return this.protocolsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar novo protocolo' })
    async create(@Body() data: any, @Req() req: any) {
        return this.protocolsService.create(data, req.user?.id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar protocolo' })
    async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.protocolsService.update(id, data, req.user?.id);
    }

    @Post(':id/events')
    @ApiOperation({ summary: 'Adicionar evento ao protocolo' })
    async addEvent(@Param('id') id: string, @Body() eventData: Partial<ProtocolEvent>, @Req() req: any) {
        return this.protocolsService.addEvent(id, { ...eventData, userId: req.user?.id });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover protocolo' })
    async delete(@Param('id') id: string) {
        await this.protocolsService.delete(id);
        return { message: 'Protocolo removido com sucesso' };
    }
}
