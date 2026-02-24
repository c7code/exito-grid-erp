import {
    Controller, Get, Post, Put, Delete, Body, Param, Query, Res, Req, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FiscalService } from './fiscal.service';
import { InvoiceType, InvoiceStatus, NATUREZA_OPERACAO } from './fiscal.entity';

const certificateStorage = diskStorage({
    destination: './uploads/certificates',
    filename: (_, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `cert-${unique}${extname(file.originalname)}`);
    },
});

@ApiTags('Fiscal')
@Controller('fiscal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FiscalController {
    constructor(private fiscalService: FiscalService) { }

    // ═══ CONFIGURAÇÃO ═══════════════════════════════════════════

    @Get('config')
    @ApiOperation({ summary: 'Buscar configuração fiscal' })
    async getConfig() {
        return this.fiscalService.getConfig();
    }

    @Put('config')
    @ApiOperation({ summary: 'Atualizar configuração fiscal' })
    async updateConfig(@Body() data: any) {
        return this.fiscalService.updateConfig(data);
    }

    @Post('config/certificate')
    @ApiOperation({ summary: 'Upload do certificado digital A1 (.pfx)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage: certificateStorage }))
    async uploadCertificate(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { password: string },
    ) {
        if (!file) {
            throw new BadRequestException('Arquivo do certificado é obrigatório');
        }
        const ext = extname(file.originalname).toLowerCase();
        if (ext !== '.pfx' && ext !== '.p12') {
            throw new BadRequestException('Formato inválido. Envie .pfx ou .p12');
        }
        if (!body.password) {
            throw new BadRequestException('Senha do certificado é obrigatória');
        }
        return this.fiscalService.uploadCertificate(
            file.filename,
            file.originalname,
            body.password,
        );
    }

    @Delete('config/certificate')
    @ApiOperation({ summary: 'Remover certificado digital' })
    async removeCertificate() {
        return this.fiscalService.removeCertificate();
    }

    // ═══ NUVEM FISCAL — SYNC ═══════════════════════════════════

    @Post('config/sync-company')
    @ApiOperation({ summary: 'Cadastrar/atualizar empresa na Nuvem Fiscal' })
    async syncCompany() {
        return this.fiscalService.syncCompanyToNuvemFiscal();
    }

    @Post('config/sync-services')
    @ApiOperation({ summary: 'Configurar NF-e/NFS-e na Nuvem Fiscal' })
    async syncServices() {
        return this.fiscalService.configureNuvemFiscalServices();
    }

    @Get('config/test-connection')
    @ApiOperation({ summary: 'Testar conexão com Nuvem Fiscal' })
    async testConnection() {
        return this.fiscalService.testConnection();
    }

    // ═══ NOTAS FISCAIS ═══════════════════════════════════════════

    @Get('naturezas')
    @ApiOperation({ summary: 'Listar naturezas de operação disponíveis' })
    getNaturezas() {
        return NATUREZA_OPERACAO;
    }

    @Get('invoices')
    @ApiOperation({ summary: 'Listar notas fiscais' })
    async findAllInvoices(
        @Query('type') type?: InvoiceType,
        @Query('status') status?: InvoiceStatus,
        @Query('proposalId') proposalId?: string,
    ) {
        return this.fiscalService.findAllInvoices({ type, status, proposalId });
    }

    @Get('invoices/:id')
    @ApiOperation({ summary: 'Buscar nota fiscal por ID' })
    async findOneInvoice(@Param('id') id: string) {
        return this.fiscalService.findOneInvoice(id);
    }

    @Post('invoices')
    @ApiOperation({ summary: 'Emitir nota fiscal via Nuvem Fiscal' })
    async createInvoice(
        @Body() data: {
            proposalId?: string;
            type: InvoiceType;
            naturezaOperacao?: string;
            finalidadeNfe?: number;
            cfopCode?: string;
            customValue?: number;
            installmentNumber?: number;
            installmentTotal?: number;
            // NFS-e specific
            dCompet?: string;
            municipioPrestacao?: string;
            descricaoServico?: string;
            infoComplementares?: string;
            numPedido?: string;
            docReferencia?: string;
            clientData?: {
                name: string;
                document: string;
                address?: string;
                number?: string;
                complement?: string;
                neighborhood?: string;
                city?: string;
                state?: string;
                zipCode?: string;
                ibgeCode?: string;
                email?: string;
                phone?: string;
            };
            items?: {
                description: string;
                unit?: string;
                quantity: number;
                unitPrice: number;
                total: number;
                serviceType?: string;
                ncm?: string;
                cfopInterno?: string;
                origem?: number;
            }[];
        },
    ) {
        return this.fiscalService.createInvoice(
            data.proposalId || null,
            data.type,
            {
                naturezaOperacao: data.naturezaOperacao,
                finalidadeNfe: data.finalidadeNfe,
                cfopCode: data.cfopCode,
                customValue: data.customValue,
                installmentNumber: data.installmentNumber,
                installmentTotal: data.installmentTotal,
                dCompet: data.dCompet,
                municipioPrestacao: data.municipioPrestacao,
                descricaoServico: data.descricaoServico,
                infoComplementares: data.infoComplementares,
                numPedido: data.numPedido,
                docReferencia: data.docReferencia,
            },
            data.clientData,
            data.items,
        );
    }

    @Get('invoices/:id/status')
    @ApiOperation({ summary: 'Consultar status atualizado da NF na Nuvem Fiscal' })
    async checkStatus(@Param('id') id: string) {
        return this.fiscalService.checkInvoiceStatus(id);
    }

    @Get('invoices/:id/xml')
    @ApiOperation({ summary: 'Download XML da NF' })
    async downloadXml(@Param('id') id: string, @Res() res: Response) {
        const xml = await this.fiscalService.downloadXml(id);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="nf-${id}.xml"`);
        res.send(xml);
    }

    @Get('invoices/:id/pdf')
    @ApiOperation({ summary: 'Download PDF (DANFE/DANFSe) da NF' })
    async downloadPdf(@Param('id') id: string, @Res() res: Response) {
        const pdf = await this.fiscalService.downloadPdf(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="nf-${id}.pdf"`);
        res.send(pdf);
    }

    @Post('invoices/:id/cancel')
    @ApiOperation({ summary: 'Cancelar nota fiscal' })
    async cancelInvoice(
        @Param('id') id: string,
        @Body() data: { reason: string },
    ) {
        return this.fiscalService.cancelInvoice(id, data.reason);
    }

    @Post('invoices/:id/retry')
    @ApiOperation({ summary: 'Reenviar nota fiscal que deu erro ou ficou como rascunho' })
    async retryInvoice(@Param('id') id: string) {
        return this.fiscalService.retryInvoice(id);
    }

    // ═══ PREVIEW ═══════════════════════════════════════════════════

    @Get('proposal/:proposalId/preview')
    @ApiOperation({ summary: 'Preview dos itens faturáveis de uma proposta' })
    async getProposalPreview(@Param('proposalId') proposalId: string) {
        return this.fiscalService.getProposalPreview(proposalId);
    }

    // ═══ EDIÇÃO DE VALOR ═══════════════════════════════════════════════

    @Put('invoices/:id/value')
    @ApiOperation({ summary: 'Editar valor de uma nota fiscal em rascunho' })
    async updateInvoiceValue(
        @Param('id') id: string,
        @Body() data: { newValue: number; reason: string },
        @Req() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub || 'unknown';
        const userName = req.user?.name || req.user?.email || 'Usuário';
        return this.fiscalService.updateInvoiceValue(
            id,
            data.newValue,
            userId,
            userName,
            data.reason,
        );
    }

    @Get('invoices/:id/history')
    @ApiOperation({ summary: 'Histórico de edições de valor de uma NF' })
    async getInvoiceEditHistory(@Param('id') id: string) {
        return this.fiscalService.getInvoiceEditHistory(id);
    }

    @Get('proposal/:proposalId/summary')
    @ApiOperation({ summary: 'Resumo de faturamento de uma proposta' })
    async getProposalSummary(@Param('proposalId') proposalId: string) {
        return this.fiscalService.getProposalInvoiceSummary(proposalId);
    }
}
