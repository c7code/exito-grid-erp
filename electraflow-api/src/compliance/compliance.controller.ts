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
    // DOCUMENT CATEGORIES (dynamic)
    // ═══════════════════════════════════════════════════════════════

    @Get('document-categories')
    @ApiOperation({ summary: 'Listar categorias de documento (padrão + personalizadas)' })
    async getCategories() {
        return this.complianceService.getCategories();
    }

    @Post('document-categories')
    @ApiOperation({ summary: 'Criar nova categoria de documento' })
    async createCategory(@Body() data: { slug?: string; label: string }) {
        return this.complianceService.createCategory(data);
    }

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

    @Delete('requirements/:id')
    @ApiOperation({ summary: 'Excluir requisito do checklist' })
    async deleteRequirement(@Param('id') id: string) {
        await this.complianceService.deleteRequirement(id);
        return { message: 'Requisito excluído' };
    }

    @Put('document-types/:id/name')
    @ApiOperation({ summary: 'Atualizar nome do tipo de documento' })
    async updateDocTypeName(
        @Param('id') id: string,
        @Body() body: { name: string },
    ) {
        return this.complianceService.updateDocumentTypeName(id, body.name);
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

    @Put('documents/:id')
    @ApiOperation({ summary: 'Atualizar documento de conformidade (datas, observações)' })
    async updateDocument(
        @Param('id') id: string,
        @Body() data: { issueDate?: string; expiryDate?: string; observations?: string },
    ) {
        return this.complianceService.updateComplianceDocument(id, {
            issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            observations: data.observations,
        });
    }

    @Delete('documents/:id')
    @ApiOperation({ summary: 'Excluir documento de conformidade e seus arquivos' })
    async deleteDocument(@Param('id') id: string) {
        // Remove files from disk before deleting
        try {
            const versions = await this.complianceService.getVersions(id);
            for (const v of versions) {
                const filename = v.fileUrl?.split('/').pop();
                if (filename) {
                    const filePath = path.join(UPLOAD_DIR, filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        } catch { /* ignore cleanup errors */ }
        return this.complianceService.deleteComplianceDocument(id);
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
    async downloadFile(
        @Param('filename') filename: string,
        @Query('token') token: string,
        @Res() res: Response,
    ) {
        // Validate token from query if present (for iframe/img preview)
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
            } catch {
                return res.status(401).json({ message: 'Token inválido' });
            }
        }

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
    async forceDownloadFile(
        @Param('filename') filename: string,
        @Query('token') token: string,
        @Res() res: Response,
    ) {
        // Validate token from query if present (for iframe/img preview)
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
            } catch {
                return res.status(401).json({ message: 'Token inválido' });
            }
        }

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

    // ═══════════════════════════════════════════════════════════════
    // ZIP DOWNLOAD
    // ═══════════════════════════════════════════════════════════════

    @Post('download-zip')
    @ApiOperation({ summary: 'Download ZIP de documentos de funcionários' })
    async downloadZip(
        @Body() body: { employeeIds: string[]; categories?: string[]; documentTypeIds?: string[] },
        @Res() res: Response,
    ) {
        const archiver = require('archiver');
        const { files, employees } = await this.complianceService.buildDownloadZip(
            body.employeeIds, body.categories, body.documentTypeIds,
        );

        if (files.length === 0) {
            return res.status(404).json({ message: 'Nenhum arquivo encontrado para os filtros selecionados' });
        }

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="documentos_funcionarios.zip"`,
        });

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.pipe(res);

        for (const file of files) {
            archive.file(file.diskPath, { name: file.path });
        }

        archive.finalize();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESTORE DOCUMENT
    // ═══════════════════════════════════════════════════════════════

    @Post('documents/:id/restore')
    @ApiOperation({ summary: 'Restaurar documento excluído (soft-delete)' })
    async restoreDocument(@Param('id') id: string) {
        return this.complianceService.restoreComplianceDocument(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPIRING DOCUMENTS
    // ═══════════════════════════════════════════════════════════════

    @Get('expiring')
    @ApiOperation({ summary: 'Documentos vencendo nos próximos N dias' })
    async getExpiring(@Query('days') days?: string) {
        return this.complianceService.getExpiringDocuments(days ? parseInt(days) : 15);
    }

    // ═══════════════════════════════════════════════════════════════
    // WORK EMPLOYEE DOCS (client portal)
    // ═══════════════════════════════════════════════════════════════

    @Get('works/:workId/employee-documents')
    @ApiOperation({ summary: 'Documentos dos funcionários alocados em uma obra' })
    async getWorkEmployeeDocs(@Param('workId') workId: string) {
        return this.complianceService.getEmployeesComplianceForWork(workId);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENTS WITH DELETED (admin)
    // ═══════════════════════════════════════════════════════════════

    @Get('employees/:id/documents-all')
    @ApiOperation({ summary: 'Todos os documentos (incluindo excluídos) de um funcionário' })
    async getEmployeeDocsAll(@Param('id') id: string) {
        return this.complianceService.getEmployeeDocumentsIncludingDeleted(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // SAFETY PROGRAMS (PGR, PCMSO, LTCAT, etc.)
    // ═══════════════════════════════════════════════════════════════

    @Get('safety-programs')
    @ApiOperation({ summary: 'Listar programas de segurança' })
    async getPrograms() {
        return this.complianceService.findAllPrograms();
    }

    @Get('safety-programs/:id')
    @ApiOperation({ summary: 'Detalhar programa de segurança' })
    async getProgram(@Param('id') id: string) {
        return this.complianceService.findProgram(id);
    }

    @Post('safety-programs')
    @ApiOperation({ summary: 'Criar programa de segurança' })
    async createProgram(@Body() data: any) {
        return this.complianceService.createProgram(data);
    }

    @Put('safety-programs/:id')
    @ApiOperation({ summary: 'Atualizar programa de segurança' })
    async updateProgram(@Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateProgram(id, data);
    }

    @Delete('safety-programs/:id')
    @ApiOperation({ summary: 'Excluir programa de segurança' })
    async removeProgram(@Param('id') id: string) {
        return this.complianceService.removeProgram(id);
    }

    @Post('safety-programs/:id/upload')
    @ApiOperation({ summary: 'Upload de arquivo do programa de segurança' })
    @UseInterceptors(FileInterceptor('file', { storage: complianceStorage }))
    async uploadProgramFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new NotFoundException('Nenhum arquivo enviado');
        const fileUrl = `/uploads/compliance/${file.filename}`;
        const fileName = file.originalname;
        await this.complianceService.updateProgram(id, { fileUrl, fileName } as any);
        return { fileUrl, fileName };
    }

    @Get('safety-programs/:id/download')
    @ApiOperation({ summary: 'Download do arquivo do programa' })
    async downloadProgramFile(@Param('id') id: string, @Res() res: Response) {
        const program = await this.complianceService.findProgram(id);
        if (!program?.fileUrl) throw new NotFoundException('Nenhum arquivo');
        const filePath = path.join(process.cwd(), program.fileUrl);
        if (!fs.existsSync(filePath)) throw new NotFoundException('Arquivo não encontrado no disco');
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_MAP[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `inline; filename="${program.fileName || 'arquivo'}"`);
        fs.createReadStream(filePath).pipe(res);
    }

    // ═══════════════════════════════════════════════════════════════
    // RISK GROUPS — GHE
    // ═══════════════════════════════════════════════════════════════

    @Get('risk-groups')
    @ApiOperation({ summary: 'Listar GHEs (Grupos Homogêneos de Exposição)' })
    async getRiskGroups(@Query('programId') programId?: string) {
        return this.complianceService.findAllRiskGroups(programId);
    }

    @Get('risk-groups/:id')
    @ApiOperation({ summary: 'Detalhar GHE' })
    async getRiskGroup(@Param('id') id: string) {
        return this.complianceService.findRiskGroup(id);
    }

    @Post('risk-groups')
    @ApiOperation({ summary: 'Criar GHE' })
    async createRiskGroup(@Body() data: any) {
        return this.complianceService.createRiskGroup(data);
    }

    @Put('risk-groups/:id')
    @ApiOperation({ summary: 'Atualizar GHE' })
    async updateRiskGroup(@Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateRiskGroup(id, data);
    }

    @Delete('risk-groups/:id')
    @ApiOperation({ summary: 'Excluir GHE' })
    async removeRiskGroup(@Param('id') id: string) {
        return this.complianceService.removeRiskGroup(id);
    }

    @Post('risk-groups/:riskGroupId/exams')
    @ApiOperation({ summary: 'Vincular exame a GHE' })
    async addExamToRiskGroup(@Param('riskGroupId') riskGroupId: string, @Body() data: any) {
        return this.complianceService.addExamToRiskGroup({ ...data, riskGroupId });
    }

    @Put('risk-group-exams/:id')
    @ApiOperation({ summary: 'Atualizar vínculo exame-GHE' })
    async updateRiskGroupExam(@Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateRiskGroupExam(id, data);
    }

    @Delete('risk-group-exams/:id')
    @ApiOperation({ summary: 'Remover exame do GHE' })
    async removeExamFromRiskGroup(@Param('id') id: string) {
        return this.complianceService.removeExamFromRiskGroup(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // OCCUPATIONAL EXAMS — Catálogo
    // ═══════════════════════════════════════════════════════════════

    @Get('occupational-exams')
    @ApiOperation({ summary: 'Listar catálogo de exames ocupacionais' })
    async getOccExams() {
        return this.complianceService.findAllOccExams();
    }

    @Post('occupational-exams')
    @ApiOperation({ summary: 'Criar exame ocupacional' })
    async createOccExam(@Body() data: any) {
        return this.complianceService.createOccExam(data);
    }

    @Put('occupational-exams/:id')
    @ApiOperation({ summary: 'Atualizar exame ocupacional' })
    async updateOccExam(@Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateOccExam(id, data);
    }

    @Delete('occupational-exams/:id')
    @ApiOperation({ summary: 'Excluir exame ocupacional' })
    async removeOccExam(@Param('id') id: string) {
        return this.complianceService.removeOccExam(id);
    }

    @Post('occupational-exams/seed')
    @ApiOperation({ summary: 'Popular catálogo de exames com dados padrão' })
    async seedOccExams() {
        return this.complianceService.seedOccupationalExams();
    }

    // ═══════════════════════════════════════════════════════════════
    // EXAM REFERRALS — Guias de Encaminhamento
    // ═══════════════════════════════════════════════════════════════

    @Get('exam-referrals')
    @ApiOperation({ summary: 'Listar guias de encaminhamento' })
    async getReferrals() {
        return this.complianceService.findAllReferrals();
    }

    @Get('exam-referrals/:id')
    @ApiOperation({ summary: 'Detalhar guia de encaminhamento' })
    async getReferral(@Param('id') id: string) {
        return this.complianceService.findReferral(id);
    }

    @Post('exam-referrals')
    @ApiOperation({ summary: 'Criar guia de encaminhamento' })
    async createReferral(@Body() data: any) {
        return this.complianceService.createReferral(data);
    }

    @Put('exam-referrals/:id')
    @ApiOperation({ summary: 'Atualizar guia (status, orçamento, etc.)' })
    async updateReferral(@Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateReferral(id, data);
    }

    @Put('exam-referrals/:id/items')
    @ApiOperation({ summary: 'Atualizar itens da guia' })
    async updateReferralItems(@Param('id') id: string, @Body() data: { items: any[] }) {
        return this.complianceService.updateReferralItems(id, data.items);
    }

    @Delete('exam-referrals/:id')
    @ApiOperation({ summary: 'Excluir guia de encaminhamento' })
    async removeReferral(@Param('id') id: string) {
        return this.complianceService.removeReferral(id);
    }

    @Get('clinic-suppliers')
    @ApiOperation({ summary: 'Listar clínicas (fornecedores com modality=clinica_saude)' })
    async getClinicSuppliers() {
        return this.complianceService.findClinicSuppliers();
    }
}
