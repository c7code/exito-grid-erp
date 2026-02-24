import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeasurementsService } from './measurements.service';
import { Measurement } from './measurement.entity';

@ApiTags('Medições')
@Controller('measurements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeasurementsController {
    constructor(private measurementsService: MeasurementsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar medições' })
    async findAll(@Query('workId') workId?: string) {
        return this.measurementsService.findAll(workId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar medição por ID' })
    async findOne(@Param('id') id: string) {
        return this.measurementsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar nova medição' })
    async create(@Body() data: { workId: string } & Partial<Measurement>) {
        return this.measurementsService.create(data.workId, data);
    }

    @Post(':id/calculate')
    @ApiOperation({ summary: 'Calcular valores da medição com base no progresso das tarefas' })
    async calculate(@Param('id') id: string) {
        return this.measurementsService.calculateFromTasks(id);
    }

    @Post(':id/approve')
    @ApiOperation({ summary: 'Aprovar medição e gerar contas a receber' })
    async approve(@Param('id') id: string) {
        return this.measurementsService.approve(id);
    }
}
