import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Get()
    findAll(
        @Query('status') status?: string,
        @Query('workId') workId?: string,
        @Query('clientId') clientId?: string,
    ) {
        return this.contractsService.findAll({ status, workId, clientId });
    }

    @Get('stats')
    getStats() {
        return this.contractsService.getStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Req() req: any) {
        return this.contractsService.create({ ...data, createdById: req.user?.userId || req.user?.id });
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.contractsService.update(id, { ...data, updatedById: req.user?.userId || req.user?.id });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contractsService.remove(id);
    }

    // ── Addendums ──
    @Post(':id/addendums')
    createAddendum(@Param('id') id: string, @Body() data: any) {
        return this.contractsService.createAddendum(id, data);
    }

    @Delete('addendums/:addendumId')
    removeAddendum(@Param('addendumId') addendumId: string) {
        return this.contractsService.removeAddendum(addendumId);
    }

    // ═══ Assinatura Digital (endpoints protegidos) ═══

    @Post(':id/generate-signature-link')
    generateSignatureLink(@Param('id') id: string) {
        return this.contractsService.generateSignatureLink(id);
    }

    @Get(':id/signature-status')
    getSignatureStatus(@Param('id') id: string) {
        return this.contractsService.getSignatureStatus(id);
    }
}

// ═══════════════════════════════════════════════════════════════
// Controller PÚBLICO (sem autenticação) — Assinatura do cliente
// ═══════════════════════════════════════════════════════════════

@Controller('contracts/sign')
export class ContractPublicController {
    constructor(private readonly contractsService: ContractsService) { }

    @Get(':token')
    getByToken(@Param('token') token: string) {
        return this.contractsService.getContractByToken(token);
    }

    @Post(':token/confirm')
    confirmSignature(
        @Param('token') token: string,
        @Body() data: { name: string; document: string },
        @Req() req: Request,
    ) {
        const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        return this.contractsService.signContract(token, {
            name: data.name,
            document: data.document,
            ip,
            userAgent,
        });
    }
}
