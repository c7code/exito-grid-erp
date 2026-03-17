import {
    Controller, Get, Post, Put, Body, Query,
    UseGuards,
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
    // CHAT
    // ═══════════════════════════════════════════════════════════════

    @Post('chat')
    @ApiOperation({ summary: 'Enviar mensagem ao assistente IA' })
    async chat(@Body() body: { message: string; history?: { role: string; content: string }[] }) {
        console.log('🤖 AI chat request received:', body?.message?.substring(0, 50));
        try {
            const result = await this.service.chat(body.message, body.history || []);
            console.log('✅ AI chat response OK');
            return result;
        } catch (error: any) {
            console.error('❌ AI chat error:', error?.message, error?.status, error?.stack?.substring(0, 300));
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
}
