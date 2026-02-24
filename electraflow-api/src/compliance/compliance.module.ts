import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentType } from './document-type.entity';
import { DocumentTypeRule } from './document-type-rule.entity';
import { EmployeeDocRequirement } from './employee-doc-requirement.entity';
import { ComplianceDocument } from './compliance-document.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentApproval } from './document-approval.entity';
import { AuditLog } from './audit-log.entity';
import { RetentionPolicy } from './retention-policy.entity';
import { Employee } from '../employees/employee.entity';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DocumentType,
            DocumentTypeRule,
            EmployeeDocRequirement,
            ComplianceDocument,
            DocumentVersion,
            DocumentApproval,
            AuditLog,
            RetentionPolicy,
            Employee,
        ]),
    ],
    controllers: [ComplianceController],
    providers: [ComplianceService],
    exports: [ComplianceService],
})
export class ComplianceModule { }
