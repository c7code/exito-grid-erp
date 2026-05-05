import {
    Controller, Get, Param, Query, Headers, Res, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'compliance');

const MIME_MAP: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Controller SEPARADO para servir arquivos de compliance.
 * NÃO tem @UseGuards(JwtAuthGuard) — a autenticação é feita
 * manualmente via ?token= (query) ou Authorization header,
 * pois <iframe> e <img> não enviam headers de auth.
 */
@ApiTags('Compliance — Arquivos')
@Controller('compliance')
export class ComplianceFilesController {
    constructor(private complianceService: ComplianceService) {}

    private validateToken(token?: string, authHeader?: string): boolean {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        const bearerToken = authHeader?.replace('Bearer ', '');
        const tokenToVerify = token || bearerToken;
        if (!tokenToVerify) return false;
        try {
            jwt.verify(tokenToVerify, secret);
            return true;
        } catch {
            return false;
        }
    }

    @Get('files/:filename')
    @ApiOperation({ summary: 'Visualizar arquivo (inline)' })
    async serveFile(
        @Param('filename') filename: string,
        @Query('token') token: string,
        @Headers('authorization') authHeader: string,
        @Res() res: Response,
    ) {
        if (!this.validateToken(token, authHeader)) {
            return res.status(401).json({ message: 'Token não fornecido ou inválido' });
        }

        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Arquivo não encontrado');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_MAP[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    }

    @Get('files/:filename/download')
    @ApiOperation({ summary: 'Forçar download do arquivo' })
    async forceDownload(
        @Param('filename') filename: string,
        @Query('token') token: string,
        @Headers('authorization') authHeader: string,
        @Res() res: Response,
    ) {
        if (!this.validateToken(token, authHeader)) {
            return res.status(401).json({ message: 'Token não fornecido ou inválido' });
        }

        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Arquivo não encontrado');
        }

        const originalName = await this.complianceService.getOriginalFileName(filename);
        const downloadName = originalName || filename;

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    }
}
