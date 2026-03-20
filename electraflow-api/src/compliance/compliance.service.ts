import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual, IsNull, DataSource } from 'typeorm';
import { DocumentType, DocumentCategory, DEFAULT_CATEGORY_LABELS } from './document-type.entity';
import { DocumentTypeRule, ConditionOperator, RuleResult } from './document-type-rule.entity';
import { EmployeeDocRequirement, Applicability } from './employee-doc-requirement.entity';
import { ComplianceDocument, ComplianceStatus } from './compliance-document.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentApproval, ApprovalAction } from './document-approval.entity';
import { AuditLog } from './audit-log.entity';
import { RetentionPolicy } from './retention-policy.entity';
import { SafetyProgram } from './safety-program.entity';
import { RiskGroup } from './risk-group.entity';
import { OccupationalExam } from './occupational-exam.entity';
import { RiskGroupExam } from './risk-group-exam.entity';
import { ExamReferral, ExamReferralItem } from './exam-referral.entity';
import { Employee } from '../employees/employee.entity';
import { Supplier } from '../supply/supply.entity';

@Injectable()
export class ComplianceService implements OnModuleInit {
    private readonly logger = new Logger(ComplianceService.name);
    constructor(
        @InjectRepository(DocumentType)
        private docTypeRepo: Repository<DocumentType>,
        @InjectRepository(DocumentTypeRule)
        private ruleRepo: Repository<DocumentTypeRule>,
        @InjectRepository(EmployeeDocRequirement)
        private requirementRepo: Repository<EmployeeDocRequirement>,
        @InjectRepository(ComplianceDocument)
        private compDocRepo: Repository<ComplianceDocument>,
        @InjectRepository(DocumentVersion)
        private versionRepo: Repository<DocumentVersion>,
        @InjectRepository(DocumentApproval)
        private approvalRepo: Repository<DocumentApproval>,
        @InjectRepository(AuditLog)
        private auditRepo: Repository<AuditLog>,
        @InjectRepository(RetentionPolicy)
        private retentionRepo: Repository<RetentionPolicy>,
        @InjectRepository(Employee)
        private employeeRepo: Repository<Employee>,
        @InjectRepository(SafetyProgram)
        private programRepo: Repository<SafetyProgram>,
        @InjectRepository(RiskGroup)
        private riskGroupRepo: Repository<RiskGroup>,
        @InjectRepository(OccupationalExam)
        private occExamRepo: Repository<OccupationalExam>,
        @InjectRepository(RiskGroupExam)
        private rgExamRepo: Repository<RiskGroupExam>,
        @InjectRepository(ExamReferral)
        private referralRepo: Repository<ExamReferral>,
        @InjectRepository(ExamReferralItem)
        private referralItemRepo: Repository<ExamReferralItem>,
        @InjectRepository(Supplier)
        private supplierRepo: Repository<Supplier>,
        private dataSource: DataSource,
    ) { }

    async onModuleInit() {
        // Migrate category column from ENUM to VARCHAR (allows dynamic categories)
        try {
            await this.dataSource.query(`ALTER TABLE document_types ALTER COLUMN category TYPE VARCHAR USING category::VARCHAR`);
            this.logger.log('document_types.category converted to VARCHAR');
        } catch (err) {
            this.logger.warn('category column migration: ' + err?.message);
        }
        // Drop the old enum type if it exists
        try {
            await this.dataSource.query(`DROP TYPE IF EXISTS "document_types_category_enum"`);
        } catch {}

        // ═══ Auto-migration: new tables + columns for safety programs & exam referrals ═══
        try {
            // Add columns to employees table
            await this.dataSource.query(`
                DO $$ BEGIN
                    ALTER TABLE employees ADD COLUMN IF NOT EXISTS "jobFunction" VARCHAR;
                    ALTER TABLE employees ADD COLUMN IF NOT EXISTS "riskGroupId" UUID;
                EXCEPTION WHEN OTHERS THEN NULL;
                END $$;
            `);

            // Add modality column to suppliers table
            await this.dataSource.query(`
                DO $$ BEGIN
                    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "modality" VARCHAR;
                EXCEPTION WHEN OTHERS THEN NULL;
                END $$;
            `);

            // company_documents table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS company_documents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "companyId" UUID,
                    "documentGroup" VARCHAR DEFAULT 'other',
                    name VARCHAR NOT NULL,
                    description TEXT,
                    "fileUrl" VARCHAR,
                    "fileName" VARCHAR,
                    "mimeType" VARCHAR,
                    "issueDate" DATE,
                    "expiryDate" DATE,
                    status VARCHAR DEFAULT 'pending',
                    "responsibleName" VARCHAR,
                    "registrationNumber" VARCHAR,
                    observations TEXT,
                    "isActive" BOOLEAN DEFAULT true,
                    "sortOrder" INT DEFAULT 0,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    "updatedAt" TIMESTAMP DEFAULT now(),
                    "deletedAt" TIMESTAMP
                );
            `);

            // safety_programs table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS safety_programs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "programType" VARCHAR NOT NULL,
                    name VARCHAR NOT NULL,
                    "nrReference" VARCHAR,
                    description TEXT,
                    "responsibleName" VARCHAR,
                    "responsibleRegistration" VARCHAR,
                    "validFrom" DATE,
                    "validUntil" DATE,
                    status VARCHAR DEFAULT 'draft',
                    "fileUrl" VARCHAR,
                    observations TEXT,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    "updatedAt" TIMESTAMP DEFAULT now(),
                    "deletedAt" TIMESTAMP
                );
            `);

            // risk_groups table (GHE)
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS risk_groups (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "programId" UUID,
                    code VARCHAR,
                    name VARCHAR NOT NULL,
                    "jobFunctions" JSONB DEFAULT '[]',
                    risks JSONB DEFAULT '[]',
                    "examFrequencyMonths" INT DEFAULT 12,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    "updatedAt" TIMESTAMP DEFAULT now(),
                    "deletedAt" TIMESTAMP
                );
            `);

            // occupational_exams table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS occupational_exams (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    code VARCHAR NOT NULL,
                    "group" VARCHAR DEFAULT 'laboratorial',
                    description TEXT,
                    "validityMonths" INT,
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    "updatedAt" TIMESTAMP DEFAULT now()
                );
            `);

            // risk_group_exams table (matrix GHE × Exam)
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS risk_group_exams (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "riskGroupId" UUID,
                    "examId" UUID,
                    "requiredOnAdmission" BOOLEAN DEFAULT true,
                    "requiredOnPeriodic" BOOLEAN DEFAULT true,
                    "requiredOnDismissal" BOOLEAN DEFAULT false,
                    "requiredOnReturn" BOOLEAN DEFAULT false,
                    "requiredOnFunctionChange" BOOLEAN DEFAULT false,
                    "createdAt" TIMESTAMP DEFAULT now()
                );
            `);

            // exam_referrals table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS exam_referrals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "referralNumber" VARCHAR,
                    "employeeId" UUID,
                    "clinicSupplierId" UUID,
                    "examType" VARCHAR DEFAULT 'periodico',
                    "jobFunction" VARCHAR,
                    risks JSONB DEFAULT '[]',
                    status VARCHAR DEFAULT 'draft',
                    "sentAt" TIMESTAMP,
                    "budgetValue" DECIMAL(12,2),
                    "budgetReceivedAt" TIMESTAMP,
                    "scheduledDate" DATE,
                    "completedAt" TIMESTAMP,
                    observations TEXT,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    "updatedAt" TIMESTAMP DEFAULT now(),
                    "deletedAt" TIMESTAMP
                );
            `);

            // exam_referral_items table
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS exam_referral_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "referralId" UUID,
                    "examId" UUID,
                    "examName" VARCHAR,
                    "examGroup" VARCHAR,
                    "isRenewal" BOOLEAN DEFAULT false,
                    "lastExamDate" DATE,
                    "createdAt" TIMESTAMP DEFAULT now()
                );
            `);

            this.logger.log('Safety/Exam tables migration completed');

            // ═══ Patch missing columns (entity has them but CREATE TABLE missed them) ═══
            const patches = [
                `ALTER TABLE occupational_exams ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`,
                `ALTER TABLE occupational_exams ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
                `ALTER TABLE risk_groups ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`,
                `ALTER TABLE safety_programs ADD COLUMN IF NOT EXISTS "fileName" VARCHAR`,
                `ALTER TABLE safety_programs ADD COLUMN IF NOT EXISTS description TEXT`,
                `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "expiryDate" DATE`,
                `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "selected" BOOLEAN DEFAULT true`,
                `ALTER TABLE exam_referral_items ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`,
            ];
            for (const sql of patches) {
                try { await this.dataSource.query(sql); } catch {}
            }
            this.logger.log('Column patches applied');
        } catch (err) {
            this.logger.error('Safety/Exam migration error: ' + err?.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENT TYPES (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async findAllDocumentTypes(): Promise<DocumentType[]> {
        return this.docTypeRepo.find({
            where: { isActive: true },
            relations: ['rules'],
            order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENT CATEGORIES (dynamic)
    // ═══════════════════════════════════════════════════════════════

    async getCategories(): Promise<{ slug: string; label: string }[]> {
        // Get all distinct categories from DB
        const dbCategories: { category: string }[] = await this.docTypeRepo
            .createQueryBuilder('dt')
            .select('DISTINCT dt.category', 'category')
            .where('dt.category IS NOT NULL')
            .getRawMany();

        // Merge defaults + DB custom ones
        const result: { slug: string; label: string }[] = [];
        const seen = new Set<string>();

        // Built-in defaults first (in order)
        for (const [slug, label] of Object.entries(DEFAULT_CATEGORY_LABELS)) {
            result.push({ slug, label });
            seen.add(slug);
        }

        // Custom categories from DB
        // Also check system_configs for custom labels
        let customLabels: Record<string, string> = {};
        try {
            const config = await this.docTypeRepo.manager.query(
                `SELECT value FROM system_configs WHERE key = 'document_category_labels'`
            );
            if (config?.[0]?.value) customLabels = JSON.parse(config[0].value);
        } catch {}

        for (const row of dbCategories) {
            if (!seen.has(row.category)) {
                result.push({
                    slug: row.category,
                    label: customLabels[row.category] || row.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                });
                seen.add(row.category);
            }
        }

        return result;
    }

    async createCategory(data: { slug?: string; label: string }): Promise<{ slug: string; label: string }> {
        // Generate slug from label if not provided
        const slug = data.slug || data.label
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

        if (!slug) throw new BadRequestException('Slug inválido');

        // Save label to system_configs
        let customLabels: Record<string, string> = {};
        try {
            const config = await this.docTypeRepo.manager.query(
                `SELECT value FROM system_configs WHERE key = 'document_category_labels'`
            );
            if (config?.[0]?.value) customLabels = JSON.parse(config[0].value);
        } catch {}

        customLabels[slug] = data.label;

        await this.docTypeRepo.manager.query(
            `INSERT INTO system_configs (key, value) VALUES ('document_category_labels', $1)
             ON CONFLICT (key) DO UPDATE SET value = $1`,
            [JSON.stringify(customLabels)]
        );

        return { slug, label: data.label };
    }

    async findDocumentType(id: string): Promise<DocumentType> {
        const dt = await this.docTypeRepo.findOne({ where: { id }, relations: ['rules'] });
        if (!dt) throw new NotFoundException('Tipo de documento não encontrado');
        return dt;
    }

    async createDocumentType(data: Partial<DocumentType>): Promise<DocumentType> {
        const dt = this.docTypeRepo.create(data);
        const saved = await this.docTypeRepo.save(dt);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateDocumentType(id: string, data: Partial<DocumentType>): Promise<DocumentType> {
        const dt = await this.findDocumentType(id);
        Object.assign(dt, data);
        return this.docTypeRepo.save(dt);
    }

    async removeDocumentType(id: string): Promise<void> {
        const dt = await this.findDocumentType(id);
        dt.isActive = false;
        await this.docTypeRepo.save(dt);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCUMENT TYPE RULES (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async getRulesByDocType(documentTypeId: string): Promise<DocumentTypeRule[]> {
        return this.ruleRepo.find({ where: { documentTypeId }, order: { createdAt: 'ASC' } });
    }

    async createRule(documentTypeId: string, data: Partial<DocumentTypeRule>): Promise<DocumentTypeRule> {
        const rule = this.ruleRepo.create({ ...data, documentTypeId });
        const saved = await this.ruleRepo.save(rule);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async removeRule(id: string): Promise<void> {
        const rule = await this.ruleRepo.findOneBy({ id });
        if (!rule) throw new NotFoundException('Regra não encontrada');
        await this.ruleRepo.softRemove(rule);
    }

    // ═══════════════════════════════════════════════════════════════
    // MOTOR DE REGRAS — gera checklist do funcionário
    // ═══════════════════════════════════════════════════════════════

    async generateChecklist(employeeId: string): Promise<EmployeeDocRequirement[]> {
        const employee = await this.employeeRepo.findOneBy({ id: employeeId });
        if (!employee) throw new NotFoundException('Funcionário não encontrado');

        const docTypes = await this.docTypeRepo.find({
            where: { isActive: true },
            relations: ['rules'],
        });

        const results: EmployeeDocRequirement[] = [];

        for (const dt of docTypes) {
            // Verificar se já existe requirement para este funcionário + tipo
            let req = await this.requirementRepo.findOne({
                where: { employeeId, documentTypeId: dt.id },
            });

            // Se já existe e foi manualmente definido, não sobrescrever
            if (req && req.applicability !== Applicability.PENDING_REVIEW) {
                results.push(req);
                continue;
            }

            // Avaliar regras
            const shouldApply = this.evaluateRules(dt, employee);

            if (!req) {
                req = this.requirementRepo.create({
                    employeeId,
                    documentTypeId: dt.id,
                    applicability: shouldApply ? Applicability.APPLICABLE : Applicability.PENDING_REVIEW,
                });
            } else {
                req.applicability = shouldApply ? Applicability.APPLICABLE : Applicability.PENDING_REVIEW;
            }

            const saved = await this.requirementRepo.save(req);
            results.push(Array.isArray(saved) ? saved[0] : saved);
        }

        return results;
    }

    private evaluateRules(docType: DocumentType, employee: Employee): boolean {
        if (!docType.rules || docType.rules.length === 0) {
            // Sem regras = obrigatório por padrão se isMandatory
            return docType.isMandatory;
        }

        // Se alguma regra mandatory/conditional casar, aplica
        for (const rule of docType.rules) {
            const fieldValue = this.getEmployeeField(employee, rule.conditionField);
            const matches = this.evaluateCondition(fieldValue, rule.conditionOperator, rule.conditionValue);

            if (matches && (rule.result === RuleResult.MANDATORY || rule.result === RuleResult.CONDITIONAL)) {
                return true;
            }
        }

        return false;
    }

    private getEmployeeField(employee: Employee, field: string): string {
        const map: Record<string, string> = {
            role: employee.role || '',
            specialty: employee.specialty || '',
            employmentType: employee.employmentType || '',
            status: employee.status || '',
            city: employee.city || '',
            state: employee.state || '',
        };
        return map[field] || '';
    }

    private evaluateCondition(fieldValue: string, operator: ConditionOperator, conditionValue: string): boolean {
        const fv = fieldValue.toLowerCase();
        const cv = conditionValue.toLowerCase();

        switch (operator) {
            case ConditionOperator.EQUALS:
                return fv === cv;
            case ConditionOperator.NOT_EQUALS:
                return fv !== cv;
            case ConditionOperator.IN:
                try {
                    const arr = JSON.parse(cv) as string[];
                    return arr.map(s => s.toLowerCase()).includes(fv);
                } catch { return cv.split(',').map(s => s.trim().toLowerCase()).includes(fv); }
            case ConditionOperator.NOT_IN:
                try {
                    const arr = JSON.parse(cv) as string[];
                    return !arr.map(s => s.toLowerCase()).includes(fv);
                } catch { return !cv.split(',').map(s => s.trim().toLowerCase()).includes(fv); }
            case ConditionOperator.CONTAINS:
                return fv.includes(cv);
            default:
                return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REQUIREMENTS (checklist do funcionário)
    // ═══════════════════════════════════════════════════════════════

    async getRequirements(employeeId: string): Promise<EmployeeDocRequirement[]> {
        return this.requirementRepo.find({
            where: { employeeId },
            relations: ['documentType'],
            order: { createdAt: 'ASC' },
        });
    }

    async deleteRequirement(requirementId: string): Promise<void> {
        const req = await this.requirementRepo.findOne({ where: { id: requirementId } });
        if (!req) throw new NotFoundException('Requisito não encontrado');
        // Soft-delete associated compliance docs
        const docs = await this.compDocRepo.find({ where: { requirementId } });
        if (docs.length > 0) {
            await this.compDocRepo.softRemove(docs);
        }
        await this.requirementRepo.remove(req);
    }

    async updateDocumentTypeName(docTypeId: string, name: string): Promise<DocumentType> {
        const dt = await this.docTypeRepo.findOne({ where: { id: docTypeId } });
        if (!dt) throw new NotFoundException('Tipo de documento não encontrado');
        dt.name = name;
        return this.docTypeRepo.save(dt);
    }

    /**
     * Adicionar manualmente um documento que não está no checklist automático.
     * Útil para obras complexas que exigem docs extras.
     */
    async addManualRequirement(
        employeeId: string,
        data: {
            documentTypeId?: string;           // Usar tipo existente
            customName?: string;               // OU criar novo tipo ad-hoc
            customCategory?: string;
            customNrs?: string[];
            customValidityMonths?: number | null;
            customRequiresApproval?: boolean;
        },
        userId?: string,
        userName?: string,
    ): Promise<EmployeeDocRequirement> {
        const employee = await this.employeeRepo.findOneBy({ id: employeeId });
        if (!employee) throw new NotFoundException('Funcionário não encontrado');

        let docTypeId = data.documentTypeId;

        // Se não selecionou um tipo existente, criar um ad-hoc
        if (!docTypeId && data.customName) {
            const code = 'CUSTOM_' + Date.now();
            const newType = this.docTypeRepo.create({
                name: data.customName,
                code,
                category: data.customCategory || 'other',
                nrsRelated: data.customNrs || [],
                defaultValidityMonths: data.customValidityMonths ?? null,
                isMandatory: false,
                requiresApproval: data.customRequiresApproval ?? true,
                allowsNotApplicable: true,
                requiresJustification: true,
                allowedFormats: ['pdf', 'jpg', 'png', 'doc', 'docx'],
                isActive: true,
            });
            const saved = await this.docTypeRepo.save(newType);
            docTypeId = Array.isArray(saved) ? saved[0].id : saved.id;
        }

        if (!docTypeId) throw new BadRequestException('Informe um tipo de documento ou nome personalizado');

        // Verificar se já existe requirement
        const existing = await this.requirementRepo.findOne({
            where: { employeeId, documentTypeId: docTypeId },
        });
        if (existing) throw new BadRequestException('Este documento já está no checklist deste funcionário');

        const req = this.requirementRepo.create({
            employeeId,
            documentTypeId: docTypeId,
            applicability: Applicability.APPLICABLE,
        });
        const saved = await this.requirementRepo.save(req);
        const result = Array.isArray(saved) ? saved[0] : saved;

        await this.createAuditLog({
            entityType: 'employee_document_requirement',
            entityId: result.id,
            action: 'manual_requirement_added',
            newValues: { documentTypeId: docTypeId, employeeId },
            performedById: userId,
            performedByName: userName,
            description: `Documento adicionado manualmente ao checklist`,
        });

        // Retornar com relação documentType
        return this.requirementRepo.findOne({
            where: { id: result.id },
            relations: ['documentType'],
        }) as Promise<EmployeeDocRequirement>;
    }

    async setApplicability(
        requirementId: string,
        applicability: Applicability,
        justification: string | null,
        userId: string,
        userName?: string,
    ): Promise<EmployeeDocRequirement> {
        const req = await this.requirementRepo.findOne({
            where: { id: requirementId },
            relations: ['documentType'],
        });
        if (!req) throw new NotFoundException('Requirement não encontrado');

        if (applicability === Applicability.NOT_APPLICABLE && req.documentType?.requiresJustification && !justification) {
            throw new BadRequestException('Justificativa obrigatória para marcar como "Não Aplica"');
        }

        const oldApplicability = req.applicability;
        req.applicability = applicability;
        req.justification = justification;

        if (applicability === Applicability.NOT_APPLICABLE) {
            req.dispensedById = userId;
            req.dispensedAt = new Date();
        } else {
            req.dispensedById = null;
            req.dispensedAt = null;
        }

        const saved = await this.requirementRepo.save(req);

        // Audit log
        await this.createAuditLog({
            entityType: 'employee_document_requirement',
            entityId: req.id,
            action: 'applicability_changed',
            oldValues: { applicability: oldApplicability },
            newValues: { applicability, justification },
            performedById: userId,
            performedByName: userName,
            description: `Aplicabilidade alterada de "${oldApplicability}" para "${applicability}"`,
        });

        // Se marcou como dispensado, atualizar documento correspondente se existir
        if (applicability === Applicability.NOT_APPLICABLE) {
            const doc = await this.compDocRepo.findOne({
                where: { requirementId: req.id },
            });
            if (doc) {
                doc.status = ComplianceStatus.DISPENSED;
                await this.compDocRepo.save(doc);
            }
        }

        return Array.isArray(saved) ? saved[0] : saved;
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLIANCE DOCUMENTS (instâncias)
    // ═══════════════════════════════════════════════════════════════

    async getEmployeeDocuments(employeeId: string): Promise<ComplianceDocument[]> {
        return this.compDocRepo.find({
            where: { ownerType: 'employee', ownerId: employeeId },
            relations: ['documentType', 'versions', 'approvals', 'requirement'],
            order: { createdAt: 'ASC' },
        });
    }

    async getEmployeeDocumentsIncludingDeleted(employeeId: string): Promise<ComplianceDocument[]> {
        return this.compDocRepo.find({
            where: { ownerType: 'employee', ownerId: employeeId },
            relations: ['documentType', 'versions', 'approvals', 'requirement'],
            order: { createdAt: 'ASC' },
            withDeleted: true,
        });
    }

    async createComplianceDocument(data: {
        requirementId?: string;
        documentTypeId: string;
        ownerType: string;
        ownerId: string;
        issueDate?: Date;
        expiryDate?: Date;
        observations?: string;
    }): Promise<ComplianceDocument> {
        const doc = this.compDocRepo.create({
            ...data,
            status: ComplianceStatus.PENDING,
            currentVersion: 0,
        });
        const saved = await this.compDocRepo.save(doc);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateComplianceDocument(
        id: string,
        data: { issueDate?: Date; expiryDate?: Date; observations?: string },
    ): Promise<ComplianceDocument> {
        const doc = await this.compDocRepo.findOneBy({ id });
        if (!doc) throw new NotFoundException('Documento não encontrado');

        if (data.issueDate !== undefined) doc.issueDate = data.issueDate;
        if (data.expiryDate !== undefined) doc.expiryDate = data.expiryDate;
        if (data.observations !== undefined) doc.observations = data.observations;

        const saved = await this.compDocRepo.save(doc);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async deleteComplianceDocument(id: string): Promise<{ message: string }> {
        const doc = await this.compDocRepo.findOneBy({ id });
        if (!doc) throw new NotFoundException('Documento não encontrado');

        // Soft delete — mantém no banco, seta deletedAt
        await this.compDocRepo.softRemove(doc);

        return { message: 'Documento excluído (soft-delete)' };
    }

    async restoreComplianceDocument(id: string): Promise<ComplianceDocument> {
        const doc = await this.compDocRepo.findOne({ where: { id }, withDeleted: true });
        if (!doc) throw new NotFoundException('Documento não encontrado');
        if (!doc.deletedAt) throw new BadRequestException('Documento não está excluído');
        await this.compDocRepo.recover(doc);
        return this.compDocRepo.findOne({ where: { id }, relations: ['documentType', 'versions'] });
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPIRING DOCUMENTS (15 days)
    // ═══════════════════════════════════════════════════════════════

    async getExpiringDocuments(daysAhead = 15): Promise<any[]> {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const docs = await this.compDocRepo.find({
            where: {
                expiryDate: LessThanOrEqual(futureDate),
                status: In([ComplianceStatus.APPROVED, ComplianceStatus.EXPIRING]),
            },
            relations: ['documentType'],
        });

        // Enrich with employee name
        const results: any[] = [];
        for (const doc of docs) {
            const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft > daysAhead) continue; // skip if beyond range

            let ownerName = doc.ownerId;
            if (doc.ownerType === 'employee') {
                const emp = await this.employeeRepo.findOneBy({ id: doc.ownerId });
                if (emp) ownerName = emp.name;
            }

            results.push({
                id: doc.id,
                documentType: doc.documentType?.name || 'N/A',
                documentTypeCode: doc.documentType?.code || '',
                category: doc.documentType?.category || '',
                ownerType: doc.ownerType,
                ownerId: doc.ownerId,
                ownerName,
                expiryDate: doc.expiryDate,
                daysLeft,
                isExpired: daysLeft <= 0,
                status: doc.status,
            });
        }

        return results.sort((a, b) => a.daysLeft - b.daysLeft);
    }

    // ═══════════════════════════════════════════════════════════════
    // EMPLOYEE DOCS FOR WORK (client portal)
    // ═══════════════════════════════════════════════════════════════

    async getEmployeesComplianceForWork(workId: string): Promise<any[]> {
        const employees = await this.employeeRepo.find({
            where: { workId, status: 'active' as any },
        });

        const results: any[] = [];
        for (const emp of employees) {
            const docs = await this.compDocRepo.find({
                where: {
                    ownerType: 'employee',
                    ownerId: emp.id,
                    status: In([ComplianceStatus.APPROVED, ComplianceStatus.EXPIRING]),
                },
                relations: ['documentType', 'versions'],
                order: { createdAt: 'ASC' },
            });
            results.push({
                employee: { id: emp.id, name: emp.name, role: emp.role, specialty: emp.specialty },
                documents: docs,
            });
        }
        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // ZIP DOWNLOAD
    // ═══════════════════════════════════════════════════════════════

    async buildDownloadZip(
        employeeIds: string[],
        categories?: string[],
        documentTypeIds?: string[],
    ): Promise<{ files: Array<{ path: string; diskPath: string }>; employees: string[] }> {
        const files: Array<{ path: string; diskPath: string }> = [];
        const employeeNames: string[] = [];

        for (const empId of employeeIds) {
            const emp = await this.employeeRepo.findOneBy({ id: empId });
            if (!emp) continue;

            const empFolder = emp.name.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim();
            employeeNames.push(emp.name);

            const qb: any = {
                ownerType: 'employee',
                ownerId: empId,
            };

            if (documentTypeIds?.length) {
                qb.documentTypeId = In(documentTypeIds);
            }

            let docs = await this.compDocRepo.find({
                where: qb,
                relations: ['documentType', 'versions'],
            });

            // Filter by category if given
            if (categories?.length) {
                docs = docs.filter(d => d.documentType && categories.includes(d.documentType.category));
            }

            for (const doc of docs) {
                const catFolder = doc.documentType?.category || 'outros';
                const typeName = doc.documentType?.code || 'DOC';

                // Get latest version
                const latestVersion = (doc.versions || [])
                    .sort((a, b) => b.versionNumber - a.versionNumber)[0];

                if (latestVersion?.fileUrl) {
                    const diskPath = latestVersion.fileUrl.startsWith('/')
                        ? latestVersion.fileUrl
                        : require('path').join(process.cwd(), 'uploads', 'compliance', latestVersion.fileUrl);

                    const ext = require('path').extname(latestVersion.fileName || latestVersion.fileUrl);
                    const zipPath = `${empFolder}/${catFolder}/${typeName}_v${latestVersion.versionNumber}${ext}`;

                    if (require('fs').existsSync(diskPath)) {
                        files.push({ path: zipPath, diskPath });
                    }
                }
            }
        }

        return { files, employees: employeeNames };
    }

    async findDocByRequirement(
        requirementId?: string,
        documentTypeId?: string,
        ownerType?: string,
        ownerId?: string,
    ): Promise<ComplianceDocument | null> {
        if (requirementId) {
            return this.compDocRepo.findOne({ where: { requirementId } });
        }
        if (documentTypeId && ownerType && ownerId) {
            return this.compDocRepo.findOne({ where: { documentTypeId, ownerType, ownerId } });
        }
        return null;
    }

    async getOriginalFileName(storedFilename: string): Promise<string | null> {
        const version = await this.versionRepo.findOne({
            where: { fileUrl: `/api/compliance/files/${storedFilename}` },
            order: { versionNumber: 'DESC' },
        });
        return version?.fileName || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // VERSÕES (Upload)
    // ═══════════════════════════════════════════════════════════════

    async addVersion(
        complianceDocumentId: string,
        versionData: {
            fileUrl: string;
            fileName: string;
            mimeType?: string;
            fileSize?: number;
            uploadedById?: string;
            uploadedByName?: string;
        },
        dates?: { issueDate?: Date; expiryDate?: Date },
    ): Promise<DocumentVersion> {
        const doc = await this.compDocRepo.findOne({
            where: { id: complianceDocumentId },
            relations: ['documentType'],
        });
        if (!doc) throw new NotFoundException('Documento não encontrado');

        const nextVersion = doc.currentVersion + 1;

        const version = this.versionRepo.create({
            complianceDocumentId,
            versionNumber: nextVersion,
            ...versionData,
        });
        const savedVersion = await this.versionRepo.save(version);

        // Atualizar documento
        doc.currentVersion = nextVersion;
        doc.status = doc.documentType?.requiresApproval
            ? ComplianceStatus.UNDER_REVIEW
            : ComplianceStatus.APPROVED;

        if (dates?.issueDate) doc.issueDate = dates.issueDate;
        if (dates?.expiryDate) doc.expiryDate = dates.expiryDate;

        await this.compDocRepo.save(doc);

        // Audit log
        await this.createAuditLog({
            entityType: 'compliance_document',
            entityId: doc.id,
            action: 'version_uploaded',
            newValues: { versionNumber: nextVersion, fileName: versionData.fileName },
            performedById: versionData.uploadedById,
            performedByName: versionData.uploadedByName,
            description: `Versão ${nextVersion} enviada: ${versionData.fileName}`,
        });

        return Array.isArray(savedVersion) ? savedVersion[0] : savedVersion;
    }

    async getVersions(complianceDocumentId: string): Promise<DocumentVersion[]> {
        return this.versionRepo.find({
            where: { complianceDocumentId },
            order: { versionNumber: 'DESC' },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // APROVAÇÃO / REPROVAÇÃO
    // ═══════════════════════════════════════════════════════════════

    async approveDocument(
        complianceDocumentId: string,
        reviewerId: string,
        reviewerName?: string,
        comments?: string,
    ): Promise<DocumentApproval> {
        const doc = await this.compDocRepo.findOneBy({ id: complianceDocumentId });
        if (!doc) throw new NotFoundException('Documento não encontrado');

        // Buscar última versão
        const lastVersion = await this.versionRepo.findOne({
            where: { complianceDocumentId },
            order: { versionNumber: 'DESC' },
        });

        const approval = this.approvalRepo.create({
            complianceDocumentId,
            versionId: lastVersion?.id,
            action: ApprovalAction.APPROVED,
            reviewedById: reviewerId,
            reviewedByName: reviewerName,
            comments,
        });
        const savedApproval = await this.approvalRepo.save(approval);

        // Atualizar status do documento
        doc.status = ComplianceStatus.APPROVED;
        await this.compDocRepo.save(doc);

        await this.createAuditLog({
            entityType: 'compliance_document',
            entityId: doc.id,
            action: 'approved',
            newValues: { status: ComplianceStatus.APPROVED },
            performedById: reviewerId,
            performedByName: reviewerName,
            description: `Documento aprovado${comments ? ': ' + comments : ''}`,
        });

        return Array.isArray(savedApproval) ? savedApproval[0] : savedApproval;
    }

    async rejectDocument(
        complianceDocumentId: string,
        reviewerId: string,
        reason: string,
        reviewerName?: string,
    ): Promise<DocumentApproval> {
        if (!reason) throw new BadRequestException('Motivo de reprovação é obrigatório');

        const doc = await this.compDocRepo.findOneBy({ id: complianceDocumentId });
        if (!doc) throw new NotFoundException('Documento não encontrado');

        const lastVersion = await this.versionRepo.findOne({
            where: { complianceDocumentId },
            order: { versionNumber: 'DESC' },
        });

        const approval = this.approvalRepo.create({
            complianceDocumentId,
            versionId: lastVersion?.id,
            action: ApprovalAction.REJECTED,
            reviewedById: reviewerId,
            reviewedByName: reviewerName,
            comments: reason,
        });
        const savedApproval = await this.approvalRepo.save(approval);

        doc.status = ComplianceStatus.REJECTED;
        await this.compDocRepo.save(doc);

        await this.createAuditLog({
            entityType: 'compliance_document',
            entityId: doc.id,
            action: 'rejected',
            newValues: { status: ComplianceStatus.REJECTED, reason },
            performedById: reviewerId,
            performedByName: reviewerName,
            description: `Documento reprovado: ${reason}`,
        });

        return Array.isArray(savedApproval) ? savedApproval[0] : savedApproval;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMO DE CONFORMIDADE
    // ═══════════════════════════════════════════════════════════════

    async getComplianceSummary(employeeId: string) {
        const requirements = await this.requirementRepo.find({
            where: { employeeId },
            relations: ['documentType'],
        });

        const documents = await this.compDocRepo.find({
            where: { ownerType: 'employee', ownerId: employeeId },
            relations: ['documentType', 'versions'],
        });

        const applicable = requirements.filter(r => r.applicability === Applicability.APPLICABLE);
        const totalApplicable = applicable.length;

        const approved = documents.filter(d => d.status === ComplianceStatus.APPROVED).length;
        const expired = documents.filter(d => d.status === ComplianceStatus.EXPIRED).length;
        const pending = documents.filter(d =>
            d.status === ComplianceStatus.PENDING || d.status === ComplianceStatus.UNDER_REVIEW
        ).length;
        const rejected = documents.filter(d => d.status === ComplianceStatus.REJECTED).length;

        // Documentos exigidos sem nenhum documento enviado
        const docTypeIdsWithDocs = new Set(documents.map(d => d.documentTypeId));
        const missing = applicable.filter(r => !docTypeIdsWithDocs.has(r.documentTypeId)).length;

        // Próximos vencimentos
        const now = new Date();
        const expiringDocs = documents
            .filter(d => d.expiryDate && d.status !== ComplianceStatus.EXPIRED && d.status !== ComplianceStatus.DISPENSED)
            .map(d => {
                const diff = Math.ceil(
                    (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );
                return { ...d, daysUntilExpiry: diff };
            })
            .filter(d => d.daysUntilExpiry <= 60 && d.daysUntilExpiry > 0)
            .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

        const conformityPct = totalApplicable > 0
            ? Math.round((approved / totalApplicable) * 100)
            : 100;

        const hasCriticalPending = expired > 0 || missing > 0;
        const clearedForWork = !hasCriticalPending;
        const clearanceReason = hasCriticalPending
            ? `${expired} doc(s) vencido(s), ${missing} doc(s) faltante(s)`
            : 'Toda documentação em ordem';

        return {
            conformityPercent: conformityPct,
            totalApplicable,
            approved,
            pending,
            rejected,
            expired,
            missing,
            expiringSoon: expiringDocs.length,
            expiringDocuments: expiringDocs.slice(0, 10),
            clearedForWork,
            clearanceReason,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ═══════════════════════════════════════════════════════════════

    async getAuditLogs(entityType?: string, entityId?: string, limit = 50): Promise<AuditLog[]> {
        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        return this.auditRepo.find({
            where,
            order: { performedAt: 'DESC' },
            take: limit,
        });
    }

    private async createAuditLog(data: Partial<AuditLog>): Promise<AuditLog> {
        const log = this.auditRepo.create(data);
        const saved = await this.auditRepo.save(log);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    // ═══════════════════════════════════════════════════════════════
    // RETENTION POLICIES
    // ═══════════════════════════════════════════════════════════════

    async getRetentionPolicies(): Promise<RetentionPolicy[]> {
        return this.retentionRepo.find({ order: { createdAt: 'ASC' } });
    }

    async createRetentionPolicy(data: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
        const policy = this.retentionRepo.create(data);
        const saved = await this.retentionRepo.save(policy);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    // ═══════════════════════════════════════════════════════════════
    // SEED: Tipos de Documento Iniciais
    // ═══════════════════════════════════════════════════════════════

    async seedDocumentTypes(): Promise<{ created: number; skipped: number }> {
        const defaults = [
            { code: 'RG_CPF', name: 'RG / CPF', category: DocumentCategory.IDENTIFICATION, nrsRelated: [], defaultValidityMonths: null, isMandatory: true, requiresApproval: false },
            { code: 'CTPS', name: 'CTPS', category: DocumentCategory.IDENTIFICATION, nrsRelated: [], defaultValidityMonths: null, isMandatory: true, requiresApproval: false },
            { code: 'COMP_RES', name: 'Comprovante de Residência', category: DocumentCategory.IDENTIFICATION, nrsRelated: [], defaultValidityMonths: 6, isMandatory: true, requiresApproval: false },
            { code: 'ASO', name: 'Atestado de Saúde Ocupacional', category: DocumentCategory.HEALTH, nrsRelated: ['NR-7'], defaultValidityMonths: 12, isMandatory: true, requiresApproval: true },
            { code: 'EXAM_LAB', name: 'Exames Laboratoriais', category: DocumentCategory.HEALTH, nrsRelated: ['NR-7'], defaultValidityMonths: 12, isMandatory: true, requiresApproval: true },
            { code: 'NR10_CERT', name: 'Certificado NR-10 (Eletricidade)', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-10'], defaultValidityMonths: 24, isMandatory: false, requiresApproval: true },
            { code: 'NR35_CERT', name: 'Certificado NR-35 (Trabalho em Altura)', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-35'], defaultValidityMonths: 24, isMandatory: false, requiresApproval: true },
            { code: 'NR12_CERT', name: 'Certificado NR-12 (Máquinas)', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-12'], defaultValidityMonths: 24, isMandatory: false, requiresApproval: true },
            { code: 'NR33_CERT', name: 'Certificado NR-33 (Espaço Confinado)', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-33'], defaultValidityMonths: 24, isMandatory: false, requiresApproval: true },
            { code: 'NR06_FICHA', name: 'Ficha de EPI (NR-6)', category: DocumentCategory.EPI_EPC, nrsRelated: ['NR-6'], defaultValidityMonths: null, isMandatory: true, requiresApproval: true },
            { code: 'OS_SEG', name: 'Ordem de Serviço de Segurança', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-1'], defaultValidityMonths: null, isMandatory: true, requiresApproval: false },
            { code: 'CNH', name: 'Carteira Nacional de Habilitação', category: DocumentCategory.QUALIFICATION, nrsRelated: [], defaultValidityMonths: null, isMandatory: false, requiresApproval: false },
            { code: 'CREA_CFT', name: 'Registro CREA / CFT', category: DocumentCategory.QUALIFICATION, nrsRelated: [], defaultValidityMonths: 12, isMandatory: false, requiresApproval: true },
            { code: 'INTEG_SEG', name: 'Integração de Segurança', category: DocumentCategory.SAFETY_NR, nrsRelated: ['NR-1'], defaultValidityMonths: 12, isMandatory: true, requiresApproval: true },
        ];

        let created = 0;
        let skipped = 0;

        for (const dt of defaults) {
            const exists = await this.docTypeRepo.findOneBy({ code: dt.code });
            if (exists) { skipped++; continue; }

            await this.docTypeRepo.save(this.docTypeRepo.create({
                ...dt,
                allowsNotApplicable: true,
                requiresJustification: true,
                allowedFormats: ['pdf', 'jpg', 'png', 'doc', 'docx'],
                isActive: true,
            }));
            created++;
        }

        return { created, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // SAFETY PROGRAMS (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async findAllPrograms(): Promise<SafetyProgram[]> {
        return this.programRepo.find({
            relations: ['company', 'riskGroups'],
            order: { programType: 'ASC', validFrom: 'DESC' },
        });
    }

    async findProgram(id: string): Promise<SafetyProgram> {
        const p = await this.programRepo.findOne({
            where: { id },
            relations: ['company', 'riskGroups'],
        });
        if (!p) throw new NotFoundException('Programa não encontrado');
        return p;
    }

    async createProgram(data: Partial<SafetyProgram>): Promise<SafetyProgram> {
        const program = this.programRepo.create(data);
        const saved = await this.programRepo.save(program);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateProgram(id: string, data: Partial<SafetyProgram>): Promise<SafetyProgram> {
        const program = await this.findProgram(id);
        Object.assign(program, data);
        return this.programRepo.save(program);
    }

    async removeProgram(id: string): Promise<void> {
        await this.programRepo.softDelete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // RISK GROUPS — GHE (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async findAllRiskGroups(programId?: string): Promise<RiskGroup[]> {
        const where: any = { isActive: true };
        if (programId) where.programId = programId;
        return this.riskGroupRepo.find({
            where,
            relations: ['exams', 'exams.exam'],
            order: { name: 'ASC' },
        });
    }

    async findRiskGroup(id: string): Promise<RiskGroup> {
        const rg = await this.riskGroupRepo.findOne({
            where: { id },
            relations: ['exams', 'exams.exam', 'safetyProgram'],
        });
        if (!rg) throw new NotFoundException('GHE não encontrado');
        return rg;
    }

    async createRiskGroup(data: Partial<RiskGroup>): Promise<RiskGroup> {
        const rg = this.riskGroupRepo.create(data);
        const saved = await this.riskGroupRepo.save(rg);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateRiskGroup(id: string, data: Partial<RiskGroup>): Promise<RiskGroup> {
        const rg = await this.findRiskGroup(id);
        Object.assign(rg, data);
        return this.riskGroupRepo.save(rg);
    }

    async removeRiskGroup(id: string): Promise<void> {
        await this.riskGroupRepo.softDelete(id);
    }

    // Add/remove exams to risk group
    async addExamToRiskGroup(data: Partial<RiskGroupExam>): Promise<RiskGroupExam> {
        const rge = this.rgExamRepo.create(data);
        const saved = await this.rgExamRepo.save(rge);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async removeExamFromRiskGroup(id: string): Promise<void> {
        await this.rgExamRepo.delete(id);
    }

    async updateRiskGroupExam(id: string, data: Partial<RiskGroupExam>): Promise<RiskGroupExam> {
        const rge = await this.rgExamRepo.findOneBy({ id });
        if (!rge) throw new NotFoundException('Vínculo não encontrado');
        Object.assign(rge, data);
        return this.rgExamRepo.save(rge);
    }

    // ═══════════════════════════════════════════════════════════════
    // OCCUPATIONAL EXAMS — Catálogo (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async findAllOccExams(): Promise<OccupationalExam[]> {
        return this.occExamRepo.find({
            where: { isActive: true },
            order: { group: 'ASC', sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async createOccExam(data: Partial<OccupationalExam>): Promise<OccupationalExam> {
        const exam = this.occExamRepo.create(data);
        const saved = await this.occExamRepo.save(exam);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateOccExam(id: string, data: Partial<OccupationalExam>): Promise<OccupationalExam> {
        const exam = await this.occExamRepo.findOneBy({ id });
        if (!exam) throw new NotFoundException('Exame não encontrado');
        Object.assign(exam, data);
        return this.occExamRepo.save(exam);
    }

    async removeOccExam(id: string): Promise<void> {
        await this.occExamRepo.softDelete(id);
    }

    async seedOccupationalExams(): Promise<{ created: number; skipped: number }> {
        const defaults = [
            // Laboratoriais
            { code: 'HEMOGRAMA', name: 'Hemograma Completo com Plaquetas', group: 'laboratorial', validityMonths: 12 },
            { code: 'SUMARIO_URINA', name: 'Sumário de Urina', group: 'laboratorial', validityMonths: 12 },
            { code: 'ACIDO_METIL', name: 'Ácido Metil Hipúrico', group: 'laboratorial', validityMonths: 12 },
            { code: 'GLICEMIA', name: 'Glicemia em Jejum', group: 'laboratorial', validityMonths: 12 },
            { code: 'VDRL', name: 'VDRL', group: 'laboratorial', validityMonths: 12 },
            { code: 'COPROCULTURA', name: 'Coprocultura', group: 'laboratorial', validityMonths: 12 },
            { code: 'CULTURA_FEZES', name: 'Cultura de Fezes', group: 'laboratorial', validityMonths: 12 },
            { code: 'PARASIT_FEZES', name: 'Parasitológico de Fezes', group: 'laboratorial', validityMonths: 12 },
            { code: 'SWAB_ORO', name: 'Swab de Orofaringe', group: 'laboratorial', validityMonths: 12 },
            { code: 'TRANSAMINASES', name: 'Transaminases (TGO/TGP)', group: 'laboratorial', validityMonths: 12 },
            { code: 'RASPAGEM_UNHAS', name: 'Raspagem das Unhas', group: 'laboratorial', validityMonths: 12 },
            { code: 'ACIDO_HIPURICO', name: 'Ácido Hipúrico', group: 'laboratorial', validityMonths: 12 },
            // Complementares
            { code: 'EEG', name: 'Eletroencefalograma (EEG)', group: 'complementar', validityMonths: 24 },
            { code: 'ECG', name: 'Eletrocardiograma (ECG)', group: 'complementar', validityMonths: 24 },
            { code: 'TESTE_ERGO', name: 'Teste Ergométrico', group: 'complementar', validityMonths: 24 },
            { code: 'RX_TORAX', name: 'Raio X de Tórax em PA', group: 'complementar', validityMonths: 24 },
            { code: 'PARECER_CARDIO', name: 'Parecer Cardiológico', group: 'complementar', validityMonths: 24 },
            { code: 'LAUDO_RX_TORAX', name: 'Laudo do Raio X de Tórax', group: 'complementar', validityMonths: 24 },
            { code: 'TESTE_PSICO', name: 'Teste Psicológico', group: 'complementar', validityMonths: 24 },
            { code: 'ESPIROMETRIA', name: 'Espirometria', group: 'complementar', validityMonths: 24 },
            { code: 'AUDIOMETRIA', name: 'Audiometria', group: 'complementar', validityMonths: 12 },
            { code: 'PARECER_PNEUMO', name: 'Parecer do Pneumologista', group: 'complementar', validityMonths: 24 },
            { code: 'OSTEO_MUSCULAR', name: 'Osteo Muscular', group: 'complementar', validityMonths: 24 },
            { code: 'ORTHO_OFTALMO', name: 'Orthorater - Oftalmológico', group: 'complementar', validityMonths: 24 },
            { code: 'ACUIDADE', name: 'Acuidade Visual', group: 'complementar', validityMonths: 12 },
            { code: 'RX_COLUNA', name: 'Raio X de Coluna em PA e Perfil', group: 'complementar', validityMonths: 24 },
            { code: 'LAUDO_RX_COLUNA', name: 'Laudo do Raio X de Coluna', group: 'complementar', validityMonths: 24 },
            // Clínicos
            { code: 'ASO_ADM', name: 'ASO Admissional', group: 'clinico', validityMonths: 12 },
            { code: 'ASO_RET', name: 'ASO Retorno ao Trabalho', group: 'clinico', validityMonths: null },
            { code: 'ASO_DEM', name: 'ASO Demissional', group: 'clinico', validityMonths: null },
            { code: 'ASO_MUD', name: 'ASO Mudança de Função', group: 'clinico', validityMonths: null },
            { code: 'ASO_PER', name: 'ASO Periódico', group: 'clinico', validityMonths: 12 },
            { code: 'CONSULTA', name: 'Consulta Médica', group: 'clinico', validityMonths: null },
        ];

        let created = 0, skipped = 0;
        for (const exam of defaults) {
            const exists = await this.occExamRepo.findOneBy({ code: exam.code });
            if (exists) { skipped++; continue; }
            await this.occExamRepo.save(this.occExamRepo.create({ ...exam, isActive: true }));
            created++;
        }
        return { created, skipped };
    }

    // ═══════════════════════════════════════════════════════════════
    // EXAM REFERRALS — Guia de Encaminhamento (CRUD)
    // ═══════════════════════════════════════════════════════════════

    async findAllReferrals(): Promise<ExamReferral[]> {
        return this.referralRepo.find({
            relations: ['employee', 'clinicSupplier', 'items'],
            order: { createdAt: 'DESC' },
        });
    }

    async findReferral(id: string): Promise<ExamReferral> {
        const r = await this.referralRepo.findOne({
            where: { id },
            relations: ['employee', 'clinicSupplier', 'items'],
        });
        if (!r) throw new NotFoundException('Guia não encontrada');
        return r;
    }

    async createReferral(data: {
        employeeId: string;
        clinicSupplierId?: string;
        examType: string;
        observations?: string;
        items: Partial<ExamReferralItem>[];
    }): Promise<ExamReferral> {
        // Auto number
        const year = new Date().getFullYear();
        const count = await this.referralRepo.count();
        const referralNumber = `GE-${year}-${String(count + 1).padStart(3, '0')}`;

        // Snapshot employee data
        const employee = await this.employeeRepo.findOneBy({ id: data.employeeId });
        let risks: any[] = [];
        let jobFunction = employee?.jobFunction || employee?.specialty || '';
        if (employee?.riskGroupId) {
            const rg = await this.riskGroupRepo.findOneBy({ id: employee.riskGroupId });
            if (rg) {
                risks = rg.risks || [];
                if (!jobFunction && rg.jobFunctions?.length) jobFunction = rg.jobFunctions[0];
            }
        }

        const referral = this.referralRepo.create({
            referralNumber,
            employeeId: data.employeeId,
            clinicSupplierId: data.clinicSupplierId || null,
            examType: data.examType,
            status: 'draft',
            jobFunction,
            risks,
            observations: data.observations || null,
        });

        const saved = await this.referralRepo.save(referral);
        const referralId = Array.isArray(saved) ? saved[0].id : saved.id;

        // Save items
        if (data.items?.length) {
            for (const item of data.items) {
                await this.referralItemRepo.save(this.referralItemRepo.create({
                    ...item,
                    referralId,
                }));
            }
        }

        return this.findReferral(referralId);
    }

    async updateReferral(id: string, data: Partial<ExamReferral>): Promise<ExamReferral> {
        const r = await this.findReferral(id);
        Object.assign(r, data);
        return this.referralRepo.save(r);
    }

    async updateReferralItems(referralId: string, items: Partial<ExamReferralItem>[]): Promise<ExamReferral> {
        // Delete old items and insert new ones
        await this.referralItemRepo.delete({ referralId });
        for (const item of items) {
            await this.referralItemRepo.save(this.referralItemRepo.create({ ...item, referralId }));
        }
        return this.findReferral(referralId);
    }

    async removeReferral(id: string): Promise<void> {
        await this.referralRepo.softDelete(id);
    }

    // Clinics (suppliers with modality = clinica_saude)
    async findClinicSuppliers(): Promise<Supplier[]> {
        return this.supplierRepo.find({
            where: { modality: 'clinica_saude' },
            order: { name: 'ASC' },
        });
    }
}
