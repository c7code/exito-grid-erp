import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards, Request, UseInterceptors, UploadedFile, UploadedFiles, Res, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ComplianceService } from './compliance.service';
import { DocumentType } from './document-type.entity';
import { DocumentTypeRule } from './document-type-rule.entity';
import { Applicability } from './employee-doc-requirement.entity';
import { RetentionPolicy } from './retention-policy.entity';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

// ═══ Upload config ═══
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'compliance');

// Garante que a pasta existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const complianceStorage = diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid()}${ext}`);
    },
});

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

@ApiTags('Compliance — Documentação Ocupacional')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
    constructor(private complianceService: ComplianceService) { }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENT TYPES
    // ═══════════════════════════════════════════════════════════════

    @Get('document-types')
    @ApiOperation({ summary: 'Listar tipos de documento' })
    async getDocumentTypes() {
        return this.complianceService.findAllDocumentTypes();
    }

    @Get('document-types/:id')
    @ApiOperation({ summary: 'Buscar tipo de documento' })
    async getDocumentType(@Param('id') id: string) {
        return this.complianceService.findDocumentType(id);
    }

    @Post('document-types')
    @ApiOperation({ summary: 'Criar tipo de documento' })
    async createDocumentType(@Body() data: Partial<DocumentType>) {
        return this.complianceService.createDocumentType(data);
    }

    @Put('document-types/:id')
    @ApiOperation({ summary: 'Atualizar tipo de documento' })
    async updateDocumentType(@Param('id') id: string, @Body() data: Partial<DocumentType>) {
        return this.complianceService.updateDocumentType(id, data);
    }

    @Delete('document-types/:id')
    @ApiOperation({ summary: 'Desativar tipo de documento' })
    async removeDocumentType(@Param('id') id: string) {
        return this.complianceService.removeDocumentType(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENT TYPE RULES
    // ═══════════════════════════════════════════════════════════════

    @Get('document-types/:id/rules')
    @ApiOperation({ summary: 'Listar regras de um tipo' })
    async getRules(@Param('id') id: string) {
        return this.complianceService.getRulesByDocType(id);
    }

    @Post('document-types/:id/rules')
    @ApiOperation({ summary: 'Criar regra para tipo de documento' })
    async createRule(@Param('id') id: string, @Body() data: Partial<DocumentTypeRule>) {
        return this.complianceService.createRule(id, data);
    }

    @Delete('rules/:id')
    @ApiOperation({ summary: 'Remover regra' })
    async removeRule(@Param('id') id: string) {
        return this.complianceService.removeRule(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // EMPLOYEE REQUIREMENTS (CHECKLIST)
    // ═══════════════════════════════════════════════════════════════

    @Get('employees/:id/requirements')
    @ApiOperation({ summary: 'Checklist de documentos do funcionário' })
    async getRequirements(@Param('id') id: string) {
        return this.complianceService.getRequirements(id);
    }

    @Post('employees/:id/generate-checklist')
    @ApiOperation({ summary: 'Gerar/atualizar checklist do funcionário' })
    async generateChecklist(@Param('id') id: string) {
        return this.complianceService.generateChecklist(id);
    }

    @Post('employees/:id/add-requirement')
    @ApiOperation({ summary: 'Adicionar documento extra ao checklist (manual)' })
    async addManualRequirement(
        @Param('id') id: string,
        @Body() body: {
            documentTypeId?: string;
            customName?: string;
            customCategory?: string;
            customNrs?: string[];
            customValidityMonths?: number | null;
            customRequiresApproval?: boolean;
        },
        @Request() req: any,
    ) {
        return this.complianceService.addManualRequirement(
            id, body, req.user?.userId, req.user?.email,
        );
    }

    @Put('requirements/:id/applicability')
    @ApiOperation({ summary: 'Alterar aplicabilidade (aplica / não aplica)' })
    async setApplicability(
        @Param('id') id: string,
        @Body() body: { applicability: Applicability; justification?: string },
        @Request() req: any,
    ) {
        return this.complianceService.setApplicability(
            id,
            body.applicability,
            body.justification || null,
            req.user.userId,
            req.user.email,
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLIANCE DOCUMENTS
    // ═══════════════════════════════════════════════════════════════

    @Get('employees/:id/documents')
    @ApiOperation({ summary: 'Documentos do funcionário' })
    async getEmployeeDocuments(@Param('id') id: string) {
        return this.complianceService.getEmployeeDocuments(id);
    }

    @Post('documents')
    @ApiOperation({ summary: 'Criar documento de conformidade' })
    async createDocument(@Body() data: {
        requirementId?: string;
        documentTypeId: string;
        ownerType: string;
        ownerId: string;
        issueDate?: Date;
        expiryDate?: Date;
        observations?: string;
    }) {
        return this.complianceService.createComplianceDocument(data);
    }

    // ═══════════════════════════════════════════════════════════════
    // FILE UPLOAD — aceita arquivo real da máquina (single)
    // ═══════════════════════════════════════════════════════════════

    @Post('documents/:id/upload')
    @ApiOperation({ summary: 'Upload de arquivo (single) para documento' })
    @UseInterceptors(FileInterceptor('file', {
        storage: complianceStorage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }))
    async uploadFile(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { issueDate?: string; expiryDate?: string },
        @Request() req: any,
    ) {
        if (!file) throw new NotFoundException('Nenhum arquivo enviado');

        const fileUrl = `/api/compliance/files/${file.filename}`;

        return this.complianceService.addVersion(
            id,
            {
                fileUrl,
                fileName: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                uploadedById: req.user?.userId,
                uploadedByName: req.user?.email,
            },
            {
                issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
            },
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // FILE UPLOAD — múltiplos arquivos de uma vez
    // ═══════════════════════════════════════════════════════════════

    @Post('documents/:id/upload-multiple')
    @ApiOperation({ summary: 'Upload de múltiplos arquivos para documento' })
    @UseInterceptors(FilesInterceptor('files', 20, {
        storage: complianceStorage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB cada
    }))
    async uploadMultipleFiles(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: { issueDate?: string; expiryDate?: string },
        @Request() req: any,
    ) {
        if (!files || files.length === 0) throw new NotFoundException('Nenhum arquivo enviado');

        const results = [];
        for (const file of files) {
            const fileUrl = `/api/compliance/files/${file.filename}`;
            const version = await this.complianceService.addVersion(
                id,
                {
                    fileUrl,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    uploadedById: req.user?.userId,
                    uploadedByName: req.user?.email,
                },
                {
                    issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
                    expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                },
            );
            results.push(version);
        }
        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // UPLOAD RÁPIDO — cria documento + envia arquivo(s) em um passo
    // ═══════════════════════════════════════════════════════════════

    @Post('upload-quick')
    @ApiOperation({ summary: 'Criar documento + upload de arquivos em uma chamada' })
    @UseInterceptors(FilesInterceptor('files', 20, {
        storage: complianceStorage,
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async quickUpload(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: {
            requirementId?: string;
            documentTypeId: string;
            ownerType: string;
            ownerId: string;
            issueDate?: string;
            expiryDate?: string;
        },
        @Request() req: any,
    ) {
        if (!files || files.length === 0) throw new NotFoundException('Nenhum arquivo enviado');

        // Criar ou buscar documento existente
        let doc = await this.complianceService.findDocByRequirement(body.requirementId, body.documentTypeId, body.ownerType, body.ownerId);

        if (!doc) {
            doc = await this.complianceService.createComplianceDocument({
                requirementId: body.requirementId,
                documentTypeId: body.documentTypeId,
                ownerType: body.ownerType,
                ownerId: body.ownerId,
                issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
            });
        }

        const versions = [];
        for (const file of files) {
            const fileUrl = `/api/compliance/files/${file.filename}`;
            const version = await this.complianceService.addVersion(
                doc.id,
                {
                    fileUrl,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    uploadedById: req.user?.userId,
                    uploadedByName: req.user?.email,
                },
                {
                    issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
                    expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                },
            );
            versions.push(version);
        }

        return { document: doc, versions };
    }

    // ═══════════════════════════════════════════════════════════════
    // FILE DOWNLOAD / SERVE
    // ═══════════════════════════════════════════════════════════════

    @Get('files/:filename')
    @ApiOperation({ summary: 'Download/visualizar arquivo' })
    async downloadFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = path.join(UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Arquivo não encontrado');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_MAP[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    }

    @Get('files/:filename/download')
    @ApiOperation({ summary: 'Forçar download do arquivo' })
    async forceDownloadFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = path.join(UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Arquivo não encontrado');
        }

        // Buscar nome original via versão
        const originalName = await this.complianceService.getOriginalFileName(filename);
        const downloadName = originalName || filename;

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    }

    // ═══════════════════════════════════════════════════════════════
    // VERSIONS (list)
    // ═══════════════════════════════════════════════════════════════

    @Get('documents/:id/versions')
    @ApiOperation({ summary: 'Histórico de versões' })
    async getVersions(@Param('id') id: string) {
        return this.complianceService.getVersions(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // APPROVAL / REJECTION
    // ═══════════════════════════════════════════════════════════════

    @Post('documents/:id/approve')
    @ApiOperation({ summary: 'Aprovar documento' })
    async approve(
        @Param('id') id: string,
        @Body() body: { comments?: string },
        @Request() req: any,
    ) {
        return this.complianceService.approveDocument(id, req.user.userId, req.user.email, body.comments);
    }

    @Post('documents/:id/reject')
    @ApiOperation({ summary: 'Reprovar documento' })
    async reject(
        @Param('id') id: string,
        @Body() body: { reason: string },
        @Request() req: any,
    ) {
        return this.complianceService.rejectDocument(id, req.user.userId, body.reason, req.user.email);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLIANCE SUMMARY
    // ═══════════════════════════════════════════════════════════════

    @Get('employees/:id/summary')
    @ApiOperation({ summary: 'Resumo de conformidade do funcionário' })
    async getSummary(@Param('id') id: string) {
        return this.complianceService.getComplianceSummary(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ═══════════════════════════════════════════════════════════════

    @Get('audit-logs')
    @ApiOperation({ summary: 'Logs de auditoria' })
    async getAuditLogs(
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.complianceService.getAuditLogs(entityType, entityId, limit ? parseInt(limit) : 50);
    }

    // ═══════════════════════════════════════════════════════════════
    // SEED
    // ═══════════════════════════════════════════════════════════════

    @Post('seed')
    @ApiOperation({ summary: 'Popular tipos de documento iniciais' })
    async seed() {
        return this.complianceService.seedDocumentTypes();
    }

    // ═══════════════════════════════════════════════════════════════
    // RETENTION POLICIES
    // ═══════════════════════════════════════════════════════════════

    @Get('retention-policies')
    @ApiOperation({ summary: 'Listar políticas de retenção' })
    async getRetentionPolicies() {
        return this.complianceService.getRetentionPolicies();
    }

    @Post('retention-policies')
    @ApiOperation({ summary: 'Criar política de retenção' })
    async createRetentionPolicy(@Body() data: Partial<RetentionPolicy>) {
        return this.complianceService.createRetentionPolicy(data);
    }
}
