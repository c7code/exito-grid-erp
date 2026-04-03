import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { SolarReportsService } from './solar-reports.service';

@Controller('solar-reports')
@UseGuards(AuthGuard('jwt'))
export class SolarReportsController {
    constructor(private readonly service: SolarReportsService) {}

    @Get()
    findAll(
        @Query('usinaId') usinaId?: string,
        @Query('clienteId') clienteId?: string,
        @Query('status') status?: string,
        @Query('mesReferencia') mesReferencia?: string,
    ) {
        return this.service.findAll({ usinaId, clienteId, status, mesReferencia });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() data: any) {
        return this.service.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    @Post(':id/calculate')
    calculate(@Param('id') id: string) {
        return this.service.calculateAndSave(id);
    }

    @Post(':id/publish')
    publish(@Param('id') id: string) {
        return this.service.publish(id);
    }

    @Get('usina/:usinaId/history')
    getHistory(@Param('usinaId') usinaId: string, @Query('limit') limit?: string) {
        return this.service.getHistory(usinaId, limit ? parseInt(limit) : 12);
    }

    // Upload + parse CSV de geração
    @Post(':id/parse-generation')
    @UseInterceptors(FileInterceptor('file'))
    async parseGeneration(@Param('id') id: string, @UploadedFile() file: any) {
        if (!file) throw new BadRequestException('Arquivo CSV não enviado');
        const csvContent = file.buffer.toString('utf-8');
        const parsed = this.service.parseGenerationCsv(csvContent);
        
        // Atualizar relatório com dados extraídos
        return this.service.update(id, {
            geracaoRealKwh: parsed.totalKwh,
            geracaoDiariaKwh: JSON.stringify(parsed.diaria),
            picoGeracaoKw: parsed.picoKw || undefined,
            fonteGeracao: parsed.fonte as any,
        });
    }

    // Upload + parse PDF da conta
    @Post(':id/parse-bill')
    @UseInterceptors(FileInterceptor('file'))
    async parseBill(@Param('id') id: string, @UploadedFile() file: any) {
        if (!file) throw new BadRequestException('Arquivo PDF não enviado');
        
        let text = '';
        try {
            // Dynamic import of pdf-parse
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(file.buffer);
            text = data.text;
        } catch (e) {
            throw new BadRequestException('Não foi possível ler o PDF. Verifique se o arquivo é um PDF válido.');
        }

        const parsed = this.service.parseBillText(text);

        // Atualizar relatório com dados extraídos
        const updateData: any = { fonteConcessionaria: 'pdf' };
        if (parsed.consumoKwh !== null) updateData.consumoConcessionariaKwh = parsed.consumoKwh;
        if (parsed.injetadaKwh !== null) updateData.energiaInjetadaKwh = parsed.injetadaKwh;
        if (parsed.creditosKwh !== null) updateData.creditosAcumuladosKwh = parsed.creditosKwh;
        if (parsed.valorContaRs !== null) updateData.valorContaRs = parsed.valorContaRs;
        if (parsed.numeroUC !== null) updateData.numeroUC = parsed.numeroUC;

        const report = await this.service.update(id, updateData);
        return { report, parseResult: parsed };
    }
}
