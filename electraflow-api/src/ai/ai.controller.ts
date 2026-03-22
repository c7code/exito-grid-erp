import {
    Controller, Get, Post, Put, Delete, Body, Param, Req,
    UseGuards, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('IA')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
    constructor(private service: AiService) { }

    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════

    @Get('config')
    @ApiOperation({ summary: 'Ler configurações de IA' })
    getConfigs() {
        return this.service.getAllConfigs();
    }

    @Put('config')
    @ApiOperation({ summary: 'Salvar configurações de IA' })
    async setConfig(@Body() body: { key: string; value: string; isSecret?: boolean }) {
        return this.service.setConfig(body.key, body.value, body.isSecret);
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAT — passa contexto do user para verificação de permissão
    // ═══════════════════════════════════════════════════════════════

    @Post('chat')
    @ApiOperation({ summary: 'Enviar mensagem ao assistente IA' })
    async chat(
        @Body() body: { message: string; history?: { role: string; content: string }[] },
        @Req() req: any,
    ) {
        const userId = req.user?.userId || req.user?.id;
        const userRole = req.user?.role || 'viewer';
        console.log(`🤖 AI chat [user=${userId}, role=${userRole}]:`, body?.message?.substring(0, 50));
        try {
            const result = await this.service.chat(body.message, body.history || [], userId, userRole);
            console.log('✅ AI chat response OK');
            return result;
        } catch (error: any) {
            console.error('❌ AI chat error:', error?.message, error?.status);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISE DE MATERIAIS
    // ═══════════════════════════════════════════════════════════════

    @Post('analyze-materials')
    @ApiOperation({ summary: 'Analisar lista de materiais e fazer matching com catálogo' })
    analyzeMaterials(@Body() body: { text: string }) {
        return this.service.analyzeMaterialList(body.text);
    }

    // ═══════════════════════════════════════════════════════════════
    // TOKENS DE AÇÃO — Gerenciamento pelo Admin
    // ═══════════════════════════════════════════════════════════════

    @Get('action-tokens')
    @ApiOperation({ summary: 'Listar tokens de ação ativos' })
    async getActionTokens(@Req() req: any) {
        const userRole = req.user?.role;
        if (userRole !== 'admin') throw new ForbiddenException('Apenas administradores podem gerenciar tokens.');
        return this.service.getActiveActionTokens();
    }

    @Post('action-tokens')
    @ApiOperation({ summary: 'Criar token de ação (liberar IA para executar ações)' })
    async createActionToken(
        @Body() body: { targetUserId?: string; durationMinutes: number; description?: string },
        @Req() req: any,
    ) {
        const userRole = req.user?.role;
        const userId = req.user?.userId || req.user?.id;
        if (userRole !== 'admin') throw new ForbiddenException('Apenas administradores podem criar tokens.');
        if (!body.durationMinutes || body.durationMinutes < 1) {
            throw new BadRequestException('Informe a duração em minutos (mínimo 1).');
        }
        return this.service.createActionToken(userId, body.targetUserId || null, body.durationMinutes, body.description);
    }

    @Delete('action-tokens/:id')
    @ApiOperation({ summary: 'Revogar token de ação' })
    async revokeActionToken(@Param('id') id: string, @Req() req: any) {
        const userRole = req.user?.role;
        if (userRole !== 'admin') throw new ForbiddenException('Apenas administradores podem revogar tokens.');
        return this.service.revokeActionToken(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // SUGESTÃO DE CLÁUSULAS VIA IA
    // ═══════════════════════════════════════════════════════════════

    @Post('suggest-clauses')
    @ApiOperation({ summary: 'Gerar sugestões de cláusulas contratuais via IA' })
    async suggestClauses(
        @Body() body: { contractType: string; scope?: string; value?: number; proposalId?: string; fields?: string[] },
    ) {
        return this.service.suggestContractClauses(body);
    }
}
