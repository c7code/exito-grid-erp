import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query,
    UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { Company } from './company.entity';
import { CompanyDocument } from './company-document.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) {}

    @Get()
    findAll(): Promise<Company[]> {
        return this.companiesService.findAll();
    }

    @Get('primary')
    findPrimary(): Promise<Company | null> {
        return this.companiesService.findPrimary();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Company> {
        return this.companiesService.findOne(id);
    }

    @Post()
    create(@Body() data: Partial<Company>): Promise<Company> {
        return this.companiesService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<Company>): Promise<Company> {
        return this.companiesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.companiesService.remove(id);
    }

    @Post(':id/logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/logos',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml|webp)$/)) {
                return cb(new Error('Apenas imagens são permitidas'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async uploadLogo(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Company> {
        const logoUrl = `/uploads/logos/${file.filename}`;
        return this.companiesService.updateLogo(id, logoUrl);
    }

    @Post(':id/signature')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/signatures',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `sig-${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return cb(new Error('Apenas imagens são permitidas'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async uploadSignature(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Company> {
        const signatureImageUrl = `/uploads/signatures/${file.filename}`;
        return this.companiesService.update(id, { signatureImageUrl });
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPANY DOCUMENTS
    // ═══════════════════════════════════════════════════════════════

    @Get(':companyId/documents')
    findAllDocuments(@Param('companyId') companyId: string): Promise<CompanyDocument[]> {
        return this.companiesService.findAllDocuments(companyId);
    }

    @Post(':companyId/documents')
    createDocument(
        @Param('companyId') companyId: string,
        @Body() data: Partial<CompanyDocument>,
    ): Promise<CompanyDocument> {
        return this.companiesService.createDocument({ ...data, companyId });
    }

    @Patch('documents/:docId')
    updateDocument(
        @Param('docId') docId: string,
        @Body() data: Partial<CompanyDocument>,
    ): Promise<CompanyDocument> {
        return this.companiesService.updateDocument(docId, data);
    }

    @Delete('documents/:docId')
    removeDocument(@Param('docId') docId: string): Promise<void> {
        return this.companiesService.removeDocument(docId);
    }
}
