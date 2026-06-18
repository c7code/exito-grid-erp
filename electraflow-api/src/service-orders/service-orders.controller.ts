import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceOrdersService } from './service-orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateServiceOrderDto, UpdateServiceOrderDto, ClientSignServiceOrderDto } from './dto';

@ApiTags('Ordens de Serviço')
@Controller('service-orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ServiceOrdersController {
    constructor(private readonly service: ServiceOrdersService) { }

    @Get()
    @ApiOperation({ summary: 'Listar ordens de serviço' })
    findAll(
        @Query('status') status?: string,
        @Query('workId') workId?: string,
        @Query('assignedToId') assignedToId?: string,
    ) {
        return this.service.findAll({ status, workId, assignedToId });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Estatísticas de ordens de serviço' })
    getStats() {
        return this.service.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar ordem de serviço' })
    create(@Body() data: CreateServiceOrderDto, @Req() req: any) {
        return this.service.create({
            ...data,
            createdById: req.user?.id || req.user?.sub,
        } as any);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar ordem de serviço' })
    update(@Param('id') id: string, @Body() data: UpdateServiceOrderDto) {
        return this.service.update(id, data as any);
    }

    @Post(':id/sign')
    @ApiOperation({ summary: 'Assinatura do cliente na OS' })
    clientSign(@Param('id') id: string, @Body() data: ClientSignServiceOrderDto) {
        return this.service.clientSign(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover ordem de serviço' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
