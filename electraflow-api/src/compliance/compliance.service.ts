import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentType, DocumentCategory } from './document-type.entity';
import { DocumentTypeRule, ConditionOperator, RuleResult } from './document-type-rule.entity';
import { EmployeeDocRequirement, Applicability } from './employee-doc-requirement.entity';
import { ComplianceDocument, ComplianceStatus } from './compliance-document.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentApproval, ApprovalAction } from './document-approval.entity';
import { AuditLog } from './audit-log.entity';
import { RetentionPolicy } from './retention-policy.entity';
import { Employee } from '../employees/employee.entity';

@Injectable()
export class ComplianceService {
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
    ) { }

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
        await this.ruleRepo.remove(rule);
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
                category: (data.customCategory || 'other') as DocumentCategory,
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
}
