import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidates ALL DDL from service onModuleInit/constructor methods into a single
 * TypeORM migration. This covers ~15 services that were previously running raw DDL
 * at startup.
 *
 * All statements use IF NOT EXISTS / IF EXISTS for idempotency.
 * Each query is wrapped in try/catch so partial-run production DBs can be migrated.
 *
 * Dependency order:
 *  1. ENUM types
 *  2. Standalone tables (no FK)
 *  3. Referral / partner tables
 *  4. Proposal tables + ALTER TABLE proposals/proposal_items
 *  5. Finance tables
 *  6. Contract templates
 *  7. OEM tables
 *  8. Budget tables
 *  9. Service order table
 * 10. SINAPI tables
 * 11. Solar tables
 * 12. Simulation tables
 * 13. Portal / Structure / Client sub-user tables
 * 14. All ALTER TABLE ADD COLUMN statements (grouped by target table)
 * 15. Clients: DROP UNIQUE on document
 */
export class ConsolidateOnModuleInitDDL1718700000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    // ═══════════════════════════════════════════════════════════════
    // 1. ENUM TYPES (service-orders)
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      DO $$ BEGIN
        CREATE TYPE service_order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'on_hold');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await this.run(queryRunner, `
      DO $$ BEGIN
        CREATE TYPE service_order_priority AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ═══════════════════════════════════════════════════════════════
    // 2. STANDALONE TABLES (no FK references)
    // ═══════════════════════════════════════════════════════════════

    // -- compliance: company_documents
    await this.run(queryRunner, `
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
      )
    `);

    // -- compliance: safety_programs
    await this.run(queryRunner, `
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
        "fileName" VARCHAR,
        "companyId" UUID,
        observations TEXT,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);

    // -- compliance: risk_groups (GHE)
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS risk_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "programId" UUID,
        code VARCHAR,
        name VARCHAR NOT NULL,
        "jobFunctions" JSONB DEFAULT '[]',
        risks JSONB DEFAULT '[]',
        "examFrequencyMonths" INT DEFAULT 12,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP
      )
    `);

    // -- compliance: occupational_exams
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS occupational_exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        "group" VARCHAR DEFAULT 'laboratorial',
        description TEXT,
        "validityMonths" INT,
        "isActive" BOOLEAN DEFAULT true,
        "sortOrder" INT DEFAULT 0,
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now()
      )
    `);

    // -- compliance: risk_group_exams (GHE × Exam matrix)
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS risk_group_exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "riskGroupId" UUID,
        "examId" UUID,
        "requiredOnAdmission" BOOLEAN DEFAULT true,
        "requiredOnPeriodic" BOOLEAN DEFAULT true,
        "requiredOnDismissal" BOOLEAN DEFAULT false,
        "requiredOnReturn" BOOLEAN DEFAULT false,
        "requiredOnFunctionChange" BOOLEAN DEFAULT false,
        "customValidityMonths" INT,
        "createdAt" TIMESTAMP DEFAULT now()
      )
    `);

    // -- compliance: exam_referrals
    await this.run(queryRunner, `
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
      )
    `);

    // -- compliance: exam_referral_items
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS exam_referral_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "referralId" UUID,
        "examId" UUID,
        "examName" VARCHAR,
        "examGroup" VARCHAR,
        "isRenewal" BOOLEAN DEFAULT false,
        "lastExamDate" DATE,
        "expiryDate" DATE,
        "selected" BOOLEAN DEFAULT true,
        "sortOrder" INT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT now()
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 3. REFERRAL TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_consultants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        email VARCHAR,
        phone VARCHAR,
        whatsapp VARCHAR,
        document VARCHAR,
        status VARCHAR DEFAULT 'active',
        "zipCode" VARCHAR,
        street VARCHAR,
        city VARCHAR,
        state VARCHAR,
        region VARCHAR,
        "responsibleUserId" UUID,
        "weeklyGoal" INT DEFAULT 0,
        "monthlyGoal" INT DEFAULT 0,
        "commissionPercent" NUMERIC(5,2) DEFAULT 2.00,
        "accessChannel" VARCHAR DEFAULT 'all',
        "bankName" VARCHAR,
        "pixKey" VARCHAR,
        "bankAgency" VARCHAR,
        "bankAccount" VARCHAR,
        "passwordHash" VARCHAR,
        "isPortalActive" BOOLEAN DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "commissionType" VARCHAR DEFAULT 'percentage',
        "commissionFixedValue" NUMERIC(15,2),
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        phone VARCHAR,
        email VARCHAR,
        document VARCHAR,
        city VARCHAR,
        state VARCHAR,
        address VARCHAR,
        "consultantId" UUID,
        status VARCHAR DEFAULT 'new',
        "potentialKwp" NUMERIC(10,2),
        "potentialValue" NUMERIC(15,2),
        "proposalId" UUID,
        "proposalVisible" BOOLEAN DEFAULT false,
        "clientId" UUID,
        "lostReason" VARCHAR,
        "services" JSONB DEFAULT '[]',
        "zipCode" VARCHAR,
        "neighborhood" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_lead_proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "leadId" UUID NOT NULL,
        "proposalId" UUID NOT NULL,
        visible BOOLEAN DEFAULT false,
        "allowDownload" BOOLEAN DEFAULT false,
        "proposalTemplate" VARCHAR DEFAULT 'commercial',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("leadId", "proposalId")
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_commitments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        type VARCHAR DEFAULT 'monthly',
        "targetCount" INT DEFAULT 0,
        "periodStart" TIMESTAMP,
        "periodEnd" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_followups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        "leadId" UUID,
        type VARCHAR DEFAULT 'internal_note',
        description TEXT NOT NULL,
        outcome TEXT,
        "nextActionDate" TIMESTAMP,
        "nextActionDescription" VARCHAR,
        "createdById" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS referral_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID,
        "leadId" UUID,
        "proposalId" UUID,
        "saleValue" NUMERIC(15,2),
        "commissionPercent" NUMERIC(5,2),
        "commissionValue" NUMERIC(15,2),
        status VARCHAR DEFAULT 'pending',
        "paidAt" TIMESTAMP,
        "paidBy" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS lead_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "leadId" UUID NOT NULL,
        "fileName" VARCHAR NOT NULL,
        "originalName" VARCHAR NOT NULL,
        "mimeType" VARCHAR,
        "size" INT,
        "url" VARCHAR NOT NULL,
        "docType" VARCHAR DEFAULT 'upload',
        "visibility" VARCHAR DEFAULT 'public',
        "targetConsultantId" UUID,
        "uploadedBy" VARCHAR,
        "uploadedByRole" VARCHAR DEFAULT 'consultant',
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS broadcast_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fileName" VARCHAR NOT NULL,
        "originalName" VARCHAR NOT NULL,
        "mimeType" VARCHAR,
        "size" INT,
        "url" VARCHAR NOT NULL,
        "targetChannel" VARCHAR DEFAULT 'all',
        "uploadedBy" VARCHAR,
        "uploadedByRole" VARCHAR DEFAULT 'admin',
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS partner_withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consultantId" UUID NOT NULL,
        "commissionId" UUID,
        amount NUMERIC(15,2) NOT NULL,
        status VARCHAR DEFAULT 'pending',
        "bankName" VARCHAR,
        "bankAgency" VARCHAR,
        "bankAccount" VARCHAR,
        "pixKey" VARCHAR,
        notes TEXT,
        "receiptUrl" VARCHAR,
        "receiptFileName" VARCHAR,
        "requestedAt" TIMESTAMP DEFAULT NOW(),
        "processedAt" TIMESTAMP,
        "processedBy" VARCHAR,
        "adminNotes" TEXT
      )
    `);

    // -- partner-requests
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS partner_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR DEFAULT 'other',
        "customCategory" VARCHAR,
        status VARCHAR DEFAULT 'open',
        priority VARCHAR DEFAULT 'medium',
        "consultantId" UUID NOT NULL,
        "consultantName" VARCHAR,
        "assignedToId" UUID,
        "assignedToName" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS partner_request_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT DEFAULT '',
        "senderType" VARCHAR DEFAULT 'admin',
        "senderName" VARCHAR,
        attachments JSONB DEFAULT '[]'::jsonb,
        "isDeleted" BOOLEAN DEFAULT false,
        "requestId" UUID NOT NULL REFERENCES partner_requests(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 4. PROPOSAL TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS proposal_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "proposalId" UUID NOT NULL,
        "revisionNumber" INT DEFAULT 1,
        "snapshotData" TEXT,
        "changeDescription" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 5. FINANCE TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS payment_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "receiptNumber" VARCHAR UNIQUE NOT NULL,
        "proposalId" UUID, "clientId" UUID, description TEXT,
        "totalProposalValue" DECIMAL(15,2) DEFAULT 0,
        percentage DECIMAL(5,2) DEFAULT 100,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR, "paidAt" TIMESTAMP,
        notes TEXT, status VARCHAR DEFAULT 'issued',
        "proposalNumber" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" VARCHAR UNIQUE NOT NULL,
        "proposalId" UUID, "supplierId" UUID, "clientId" UUID,
        type VARCHAR DEFAULT 'company_billing',
        status VARCHAR DEFAULT 'draft',
        "totalValue" DECIMAL(15,2) DEFAULT 0,
        "paymentTerms" TEXT, "internalNotes" TEXT,
        "internalMargin" DECIMAL(5,2) DEFAULT 0,
        "deliveryDate" TIMESTAMP, "deliveryAddress" TEXT, notes TEXT,
        "proposalNumber" TEXT,
        "contractNumber" TEXT,
        "workName" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "purchaseOrderId" UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        description VARCHAR NOT NULL,
        quantity DECIMAL(15,4) DEFAULT 1, unit VARCHAR DEFAULT 'un',
        "unitPrice" DECIMAL(15,2) DEFAULT 0, "totalPrice" DECIMAL(15,2) DEFAULT 0,
        "internalCost" DECIMAL(15,2), notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS measurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workId" UUID NOT NULL,
        number INTEGER NOT NULL DEFAULT 1,
        status VARCHAR DEFAULT 'draft',
        description VARCHAR,
        "startDate" TIMESTAMP, "endDate" TIMESTAMP,
        "contractValue" DECIMAL(15,2) DEFAULT 0,
        "directBillingTotal" DECIMAL(15,2) DEFAULT 0,
        "baseValue" DECIMAL(15,2) DEFAULT 0,
        "executedPercentage" DECIMAL(5,2) DEFAULT 0,
        "accumulatedPercentage" DECIMAL(5,2) DEFAULT 0,
        "directBillingItems" TEXT,
        stages TEXT,
        "totalAmount" DECIMAL(15,2) DEFAULT 0,
        "retentionAmount" DECIMAL(15,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        "netAmount" DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        "proposalId" UUID, "contractId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS measurement_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "measurementId" UUID REFERENCES measurements(id) ON DELETE CASCADE,
        "taskId" UUID,
        "previousProgress" DECIMAL(5,2) DEFAULT 0,
        "currentProgress" DECIMAL(5,2) DEFAULT 0,
        "weightPercentage" DECIMAL(5,2) DEFAULT 0,
        "calculatedValue" DECIMAL(15,2) DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS payment_installments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "paymentId" UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        "installmentNumber" INT DEFAULT 1,
        "totalInstallments" INT DEFAULT 1,
        description VARCHAR,
        amount DECIMAL(15,2) NOT NULL,
        "paidAmount" DECIMAL(15,2) DEFAULT 0,
        "dueDate" TIMESTAMP NOT NULL,
        "paidAt" TIMESTAMP,
        status VARCHAR DEFAULT 'pending',
        "paymentMethod" VARCHAR,
        "transactionId" VARCHAR,
        "receiptFile" VARCHAR,
        "receiptFileName" VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS debts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT NOT NULL, creditor VARCHAR,
        type VARCHAR DEFAULT 'other', nature VARCHAR DEFAULT 'neutral', status VARCHAR DEFAULT 'active',
        "originalAmount" DECIMAL(15,2) NOT NULL, "currentBalance" DECIMAL(15,2) DEFAULT 0, "totalPaid" DECIMAL(15,2) DEFAULT 0,
        "interestRate" DECIMAL(6,3) DEFAULT 0, "interestPeriod" VARCHAR DEFAULT 'monthly', "interestType" VARCHAR DEFAULT 'fixed',
        "startDate" TIMESTAMP, "endDate" TIMESTAMP,
        "totalInstallments" INT DEFAULT 0, "paidInstallments" INT DEFAULT 0,
        "monthlyPayment" DECIMAL(15,2) DEFAULT 0, "nextDueDate" TIMESTAMP,
        "guaranteeType" VARCHAR, "guaranteeDescription" TEXT,
        "bankAccountId" UUID, "contractNumber" VARCHAR, notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS debt_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "debtId" UUID NOT NULL, amount DECIMAL(15,2) NOT NULL,
        "principalAmount" DECIMAL(15,2) DEFAULT 0, "interestAmount" DECIMAL(15,2) DEFAULT 0,
        "paidAt" TIMESTAMP, method VARCHAR, reference VARCHAR, notes TEXT,
        "installmentNumber" INT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS bank_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bankAccountId" UUID NOT NULL, "referenceMonth" VARCHAR NOT NULL,
        "fileName" VARCHAR, "totalCredits" DECIMAL(15,2) DEFAULT 0, "totalDebits" DECIMAL(15,2) DEFAULT 0,
        "openingBalance" DECIMAL(15,2) DEFAULT 0, "closingBalance" DECIMAL(15,2) DEFAULT 0,
        "totalEntries" INT DEFAULT 0, "matchedEntries" INT DEFAULT 0,
        status VARCHAR DEFAULT 'pending', notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS bank_statement_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "statementId" UUID NOT NULL, date DATE NOT NULL,
        description TEXT NOT NULL, amount DECIMAL(15,2) NOT NULL,
        "entryType" VARCHAR DEFAULT 'credit',
        "matchedPaymentId" UUID, "matchStatus" VARCHAR DEFAULT 'unmatched',
        "matchDifference" DECIMAL(15,2) DEFAULT 0,
        notes TEXT, category VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 6. CONTRACT TEMPLATES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS contract_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        type VARCHAR DEFAULT 'service',
        scope TEXT, "paymentTerms" TEXT, penalties TEXT, warranty TEXT,
        termination TEXT, confidentiality TEXT, "forceMajeure" TEXT,
        jurisdiction TEXT, "contractorObligations" TEXT, "clientObligations" TEXT,
        "generalProvisions" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 7. OEM TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS oem_usinas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clienteId" UUID NOT NULL,
        "empresaId" UUID,
        "projetoSolarId" UUID,
        nome TEXT NOT NULL,
        "potenciaKwp" DECIMAL(10,2) NOT NULL,
        "qtdModulos" INTEGER NOT NULL,
        "modeloModulos" TEXT,
        "qtdInversores" INTEGER DEFAULT 1,
        "modeloInversores" TEXT,
        "marcaInversor" TEXT,
        "serialInversores" TEXT,
        "dataInstalacao" DATE NOT NULL,
        "tipoTelhado" TEXT,
        "inclinacaoGraus" DECIMAL(5,2),
        "azimuteGraus" DECIMAL(5,2),
        endereco TEXT NOT NULL,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        "geracaoMensalEsperadaKwh" DECIMAL(10,2),
        "apiMonitoramentoTipo" TEXT,
        "apiMonitoramentoCredentials" TEXT,
        "valorEstimadoUsina" DECIMAL(14,2),
        "percentualManutencao" DECIMAL(5,2) DEFAULT 10,
        status VARCHAR DEFAULT 'ativa',
        observacoes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS oem_planos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        descricao TEXT,
        "incluiLimpeza" BOOLEAN DEFAULT true,
        "incluiInspecaoVisual" BOOLEAN DEFAULT true,
        "incluiTermografia" BOOLEAN DEFAULT false,
        "incluiTesteString" BOOLEAN DEFAULT false,
        "incluiMonitoramentoRemoto" BOOLEAN DEFAULT false,
        "incluiCorretivaPrioritaria" BOOLEAN DEFAULT false,
        "garantiaPerformancePr" DECIMAL(5,2),
        "frequenciaPreventiva" VARCHAR DEFAULT 'semestral',
        "precoBaseMensal" DECIMAL(10,2) NOT NULL,
        "kwpLimiteBase" DECIMAL(10,2) DEFAULT 10,
        "precoKwpExcedente" DECIMAL(10,2),
        "unidadeCobranca" VARCHAR DEFAULT 'kWp',
        "faixasPreco" TEXT,
        "custoMobilizacao" DECIMAL(10,2) DEFAULT 0,
        "custosFixosDetalhados" TEXT,
        "tipoPlano" VARCHAR DEFAULT 'standard',
        "tempoRespostaSlaHoras" INTEGER DEFAULT 48,
        "tempoRespostaUrgenteHoras" INTEGER DEFAULT 4,
        "atendimentoHorario" VARCHAR DEFAULT 'comercial',
        "coberturaMaxAnual" DECIMAL(10,2),
        "limiteCorretivas" INTEGER,
        "abrangenciaKm" INTEGER,
        "incluiSeguro" BOOLEAN DEFAULT false,
        "incluiRelatorio" BOOLEAN DEFAULT true,
        "frequenciaRelatorio" VARCHAR DEFAULT 'trimestral',
        "termosDuracaoMeses" INTEGER DEFAULT 12,
        "descontoAnualPercent" DECIMAL(5,2) DEFAULT 0,
        "exclusoes" TEXT,
        "penalidades" TEXT,
        "beneficios" TEXT,
        ativo BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS oem_contratos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clienteId" UUID NOT NULL,
        "usinaId" UUID NOT NULL REFERENCES oem_usinas(id) ON DELETE CASCADE,
        "planoId" UUID NOT NULL REFERENCES oem_planos(id) ON DELETE CASCADE,
        "dataInicio" DATE NOT NULL,
        "dataFim" DATE,
        "valorMensal" DECIMAL(10,2) NOT NULL,
        "indiceReajuste" TEXT,
        "dataProximoReajuste" DATE,
        "renovacaoAutomatica" BOOLEAN DEFAULT true,
        status VARCHAR DEFAULT 'ativo',
        "motivoCancelamento" TEXT,
        "parceiroId" UUID,
        observacoes TEXT,
        "calculoDetalhado" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS oem_servicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "usinaId" UUID NOT NULL,
        "clienteId" UUID NOT NULL,
        "proposalId" UUID,
        tipo VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'pendente',
        prioridade VARCHAR DEFAULT 'normal',
        descricao TEXT,
        diagnostico TEXT,
        solucao TEXT,
        "componentesAfetados" TEXT,
        "dataAgendada" DATE,
        "dataConclusao" DATE,
        "valorEstimado" DECIMAL(10,2),
        "valorFinal" DECIMAL(10,2),
        checklist TEXT,
        "fotosAntes" TEXT,
        "fotosDepois" TEXT,
        "relatorioTecnico" TEXT,
        recomendacoes TEXT,
        "tecnicoResponsavel" VARCHAR,
        equipe TEXT,
        "materiaisUtilizados" TEXT,
        "proposalTitle" TEXT,
        "proposalValidUntil" VARCHAR,
        "proposalMode" VARCHAR DEFAULT 'servico',
        "sectionToggles" TEXT,
        "oemMateriais" TEXT,
        "incluirMateriaisNoTotal" BOOLEAN DEFAULT false,
        "totalServicos" DECIMAL(12,2),
        "totalMateriais" DECIMAL(12,2),
        "oemProposalId" VARCHAR,
        "oemExtraItems" TEXT,
        "oemItemDisplayMode" VARCHAR,
        "paymentConditions" TEXT,
        "contractorObligations" TEXT,
        "clientObligations" TEXT,
        "generalProvisions" TEXT,
        "complianceText" TEXT,
        observacoes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 8. BUDGET TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        description TEXT,
        state VARCHAR(10) DEFAULT 'PE',
        "workType" VARCHAR(50) DEFAULT 'geral',
        "bdiPercent" DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'rascunho',
        "totalMaterial" DECIMAL(14,2) DEFAULT 0,
        "totalLabor" DECIMAL(14,2) DEFAULT 0,
        "totalEquipment" DECIMAL(14,2) DEFAULT 0,
        subtotal DECIMAL(14,2) DEFAULT 0,
        "bdiValue" DECIMAL(14,2) DEFAULT 0,
        total DECIMAL(14,2) DEFAULT 0,
        "userId" UUID,
        "companyId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS budget_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "budgetId" UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        "sinapiCode" VARCHAR(20),
        "sinapiCompositionId" UUID,
        description TEXT NOT NULL,
        unit VARCHAR(20) DEFAULT 'UN',
        "itemType" VARCHAR(30) DEFAULT 'composicao',
        "costCategory" VARCHAR(30) DEFAULT 'material',
        quantity DECIMAL(14,6) DEFAULT 1,
        "sinapiCoefficient" DECIMAL(14,6),
        "unitCost" DECIMAL(14,4) DEFAULT 0,
        subtotal DECIMAL(14,2) DEFAULT 0,
        "priceSource" VARCHAR(30),
        "sortOrder" INTEGER DEFAULT 0,
        notes TEXT,
        "parametricData" JSONB,
        "isManualOverride" BOOLEAN DEFAULT false,
        "suggestedCost" DECIMAL(14,4),
        "confidenceLevel" VARCHAR(20),
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items("budgetId")`);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS service_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50) DEFAULT 'eletrica',
        keywords JSONB DEFAULT '[]',
        "excludeKeywords" JSONB DEFAULT '[]',
        "parameterName" VARCHAR(100),
        "parameterRegex" VARCHAR(500),
        "professionalCode" VARCHAR(20),
        "professionalLabel" VARCHAR(100),
        "helperCode" VARCHAR(20),
        "helperLabel" VARCHAR(100),
        bands JSONB DEFAULT '[]',
        "customProfitPercent" DECIMAL(6,2),
        "isActive" BOOLEAN DEFAULT true,
        "sortOrder" INTEGER DEFAULT 0,
        "companyId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS company_financials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "profileName" VARCHAR(200) DEFAULT 'Padrão',
        "encargosPercent" DECIMAL(6,2) DEFAULT 68.47,
        "adminCentralPercent" DECIMAL(6,2) DEFAULT 4.00,
        "seguroPercent" DECIMAL(6,2) DEFAULT 0.80,
        "riscoPercent" DECIMAL(6,2) DEFAULT 1.20,
        "despesasFinanceirasPercent" DECIMAL(6,2) DEFAULT 1.40,
        "lucroPercent" DECIMAL(6,2) DEFAULT 8.00,
        "pisCofinPercent" DECIMAL(6,2) DEFAULT 3.65,
        "issPercent" DECIMAL(6,2) DEFAULT 5.00,
        "icmsPercent" DECIMAL(6,2) DEFAULT 0.00,
        "categoryMargins" JSONB,
        "bdiCalculated" DECIMAL(6,2) DEFAULT 25.00,
        "isActive" BOOLEAN DEFAULT true,
        "companyId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 9. SERVICE ORDERS
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS service_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR UNIQUE,
        title VARCHAR NOT NULL,
        description TEXT,
        status service_order_status DEFAULT 'open',
        priority service_order_priority DEFAULT 'medium',
        category VARCHAR,
        "workId" UUID REFERENCES works(id),
        "clientId" UUID REFERENCES clients(id),
        "assignedToId" UUID REFERENCES users(id),
        address VARCHAR,
        city VARCHAR,
        state VARCHAR,
        "scheduledDate" TIMESTAMP,
        "startTime" VARCHAR,
        "endTime" VARCHAR,
        "hoursWorked" DECIMAL(5,2),
        checklist TEXT,
        "materialsUsed" TEXT,
        photos TEXT,
        "clientSignature" TEXT,
        "clientSignedName" VARCHAR,
        "clientSignedAt" TIMESTAMP,
        "technicianNotes" TEXT,
        "clientNotes" TEXT,
        "laborCost" DECIMAL(15,2) DEFAULT 0,
        "materialCost" DECIMAL(15,2) DEFAULT 0,
        "totalCost" DECIMAL(15,2) DEFAULT 0,
        "createdById" UUID REFERENCES users(id),
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 10. SINAPI TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_references (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        year INT NOT NULL,
        month INT NOT NULL,
        state CHAR(2),
        label VARCHAR,
        "publishedAt" DATE,
        source VARCHAR DEFAULT 'sinapi_caixa',
        status VARCHAR DEFAULT 'active',
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this.run(queryRunner, `ALTER TABLE sinapi_references ALTER COLUMN state DROP NOT NULL`);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_inputs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR NOT NULL,
        description TEXT NOT NULL,
        unit VARCHAR NOT NULL DEFAULT 'UN',
        type VARCHAR DEFAULT 'material',
        "groupClass" VARCHAR,
        origin VARCHAR DEFAULT 'sinapi',
        "catalogItemId" UUID,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this.run(queryRunner, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_input_code ON sinapi_inputs(code)`);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_compositions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR NOT NULL,
        description TEXT NOT NULL,
        unit VARCHAR NOT NULL DEFAULT 'UN',
        "classCode" VARCHAR,
        "className" VARCHAR,
        type VARCHAR DEFAULT 'composition',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this.run(queryRunner, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_comp_code ON sinapi_compositions(code)`);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_composition_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
        "inputId" UUID REFERENCES sinapi_inputs(id) ON DELETE SET NULL,
        "childCompositionId" UUID REFERENCES sinapi_compositions(id) ON DELETE SET NULL,
        "itemType" VARCHAR DEFAULT 'insumo',
        coefficient DECIMAL(15,6) NOT NULL DEFAULT 1,
        "sortOrder" INT DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_input_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
        "inputId" UUID NOT NULL REFERENCES sinapi_inputs(id) ON DELETE CASCADE,
        state CHAR(2),
        "priceNotTaxed" DECIMAL(15,4),
        "priceTaxed" DECIMAL(15,4),
        origin VARCHAR DEFAULT 'sinapi',
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_composition_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
        "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
        state CHAR(2),
        "totalNotTaxed" DECIMAL(15,4),
        "totalTaxed" DECIMAL(15,4),
        "materialCost" DECIMAL(15,4),
        "laborCost" DECIMAL(15,4),
        "equipmentCost" DECIMAL(15,4),
        "laborPercent" DECIMAL(8,4),
        "calculationMethod" VARCHAR DEFAULT 'imported',
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_budget_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "proposalId" UUID NOT NULL,
        "proposalItemId" VARCHAR NOT NULL,
        "compositionId" UUID NOT NULL REFERENCES sinapi_compositions(id) ON DELETE CASCADE,
        "referenceId" UUID NOT NULL REFERENCES sinapi_references(id) ON DELETE CASCADE,
        coefficient DECIMAL(15,6) DEFAULT 1,
        "sinapiUnitCost" DECIMAL(15,4) NOT NULL,
        "budgetUnitPrice" DECIMAL(15,4) NOT NULL,
        "bdiPercent" DECIMAL(5,2) DEFAULT 0,
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR NOT NULL UNIQUE,
        value TEXT,
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_import_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "referenceId" UUID REFERENCES sinapi_references(id) ON DELETE SET NULL,
        "fileName" VARCHAR,
        "fileType" VARCHAR DEFAULT 'inputs',
        state CHAR(2),
        year INT,
        month INT,
        "taxRegime" VARCHAR DEFAULT 'nao_desonerado',
        status VARCHAR DEFAULT 'running',
        "totalRows" INT DEFAULT 0,
        "insertedCount" INT DEFAULT 0,
        "updatedCount" INT DEFAULT 0,
        "skippedCount" INT DEFAULT 0,
        "errorCount" INT DEFAULT 0,
        errors TEXT,
        warnings TEXT,
        "durationMs" INT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS sinapi_pricing_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        "isDefault" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "bdiAdminPercent" DECIMAL(6,2) DEFAULT 0,
        "bdiFinancialPercent" DECIMAL(6,2) DEFAULT 0,
        "bdiInsurancePercent" DECIMAL(6,2) DEFAULT 0,
        "bdiProfitPercent" DECIMAL(6,2) DEFAULT 0,
        "mobilizationPercent" DECIMAL(6,2) DEFAULT 0,
        "localAdminPercent" DECIMAL(6,2) DEFAULT 0,
        "logisticsPercent" DECIMAL(6,2) DEFAULT 0,
        "contingencyPercent" DECIMAL(6,2) DEFAULT 0,
        "technicalVisitCost" DECIMAL(15,2) DEFAULT 0,
        "artPermitCost" DECIMAL(15,2) DEFAULT 0,
        "otherFixedCosts" DECIMAL(15,2) DEFAULT 0,
        "issPercent" DECIMAL(6,2) DEFAULT 0,
        "pisPercent" DECIMAL(6,2) DEFAULT 0,
        "cofinsPercent" DECIMAL(6,2) DEFAULT 0,
        "irpjPercent" DECIMAL(6,2) DEFAULT 0,
        "csllPercent" DECIMAL(6,2) DEFAULT 0,
        "inssPercent" DECIMAL(6,2) DEFAULT 0,
        "otherTaxPercent" DECIMAL(6,2) DEFAULT 0,
        "roundingMode" VARCHAR DEFAULT 'none',
        "customRoundingValue" DECIMAL(15,2),
        "calculationMethod" VARCHAR DEFAULT 'standard',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // SINAPI indexes
    await this.run(queryRunner, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_ref_year_month ON sinapi_references(year, month)`);
    await this.run(queryRunner, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_iprice_ref_input_state ON sinapi_input_prices("referenceId","inputId",state)`);
    await this.run(queryRunner, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sinapi_ccost_ref_comp_state ON sinapi_composition_costs("referenceId","compositionId",state)`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_sinapi_iprice_state ON sinapi_input_prices(state)`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_sinapi_ccost_state ON sinapi_composition_costs(state)`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_sinapi_budget_link_proposal ON sinapi_budget_links("proposalId")`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_sinapi_budget_link_comp ON sinapi_budget_links("compositionId")`);

    // ═══════════════════════════════════════════════════════════════
    // 11. SOLAR TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS solar_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL, description TEXT,
        status VARCHAR DEFAULT 'active',
        "minPowerKwp" DECIMAL(10,2) DEFAULT 0, "maxPowerKwp" DECIMAL(10,2) DEFAULT 0,
        "systemPowerKwp" DECIMAL(10,2) DEFAULT 0,
        "basePrice" DECIMAL(15,2) DEFAULT 0,
        "equipmentCost" DECIMAL(15,2) DEFAULT 0,
        "installationCost" DECIMAL(15,2) DEFAULT 0,
        equipment TEXT,
        "maxSlots" INT DEFAULT 0,
        "totalInstallments" INT DEFAULT 48,
        "enrollmentFeePercent" DECIMAL(5,2) DEFAULT 10,
        "contemplationThresholdPercent" DECIMAL(5,2) DEFAULT 50,
        "contemplationMinMonths" INT DEFAULT 0,
        "cancellationFeePercent" DECIMAL(5,2) DEFAULT 20,
        "gracePeriodDays" INT DEFAULT 7,
        "adjustmentIndex" VARCHAR DEFAULT 'IGPM',
        "safetyMarginPercent" DECIMAL(5,2) DEFAULT 15,
        "defaultDaysToCancel" INT DEFAULT 90,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS solar_plan_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR UNIQUE NOT NULL,
        "planId" UUID REFERENCES solar_plans(id) ON DELETE SET NULL,
        "clientId" UUID,
        status VARCHAR DEFAULT 'awaiting',
        "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "enrollmentFee" DECIMAL(15,2) DEFAULT 0,
        "monthlyPayment" DECIMAL(15,2) DEFAULT 0,
        "totalInstallments" INT DEFAULT 48,
        "paidAmount" DECIMAL(15,2) DEFAULT 0,
        "paidInstallments" INT DEFAULT 0,
        "contemplationThreshold" DECIMAL(5,2) DEFAULT 50,
        "currentMonthlyBill" DECIMAL(15,2) DEFAULT 0,
        "currentConsumptionKwh" DECIMAL(12,2) DEFAULT 0,
        "utilityCompany" VARCHAR,
        "monthlySavingsFromDay1" DECIMAL(15,2) DEFAULT 0,
        "systemPowerKwp" DECIMAL(10,2) DEFAULT 0,
        "estimatedMonthlySavings" DECIMAL(15,2) DEFAULT 0,
        "equipmentCost" DECIMAL(15,2) DEFAULT 0,
        "installationCost" DECIMAL(15,2) DEFAULT 0,
        "propertyAddress" VARCHAR, "propertyCity" VARCHAR, "propertyState" VARCHAR, "propertyCep" VARCHAR,
        "enrollmentPaidAt" TIMESTAMP, "contemplatedAt" TIMESTAMP, "installationStartedAt" TIMESTAMP,
        "installedAt" TIMESTAMP, "settledAt" TIMESTAMP, "cancelledAt" TIMESTAMP,
        "cancellationReason" TEXT,
        "solarProjectId" UUID, "proposalId" UUID, "contractId" UUID,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS solar_plan_installments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subscriptionId" UUID NOT NULL REFERENCES solar_plan_subscriptions(id) ON DELETE CASCADE,
        "installmentNumber" INT NOT NULL,
        type VARCHAR DEFAULT 'monthly',
        amount DECIMAL(15,2) NOT NULL,
        "dueDate" TIMESTAMP NOT NULL,
        status VARCHAR DEFAULT 'pending',
        "paidAt" TIMESTAMP, "paidAmount" DECIMAL(15,2) DEFAULT 0,
        "paymentMethod" VARCHAR,
        "boletoUrl" TEXT, "pixQrCode" TEXT,
        "lateFee" DECIMAL(15,2) DEFAULT 0, "interestAmount" DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), "deletedAt" TIMESTAMP
      )
    `);

    // -- solar_monthly_reports
    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS solar_monthly_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "usinaId" UUID NOT NULL,
        "clienteId" UUID NOT NULL,
        "mesReferencia" DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'rascunho',
        "statusDesempenho" VARCHAR(20),
        "geracaoRealKwh" DECIMAL(12,2),
        "geracaoEsperadaKwh" DECIMAL(12,2),
        "geracaoDiariaKwh" TEXT,
        "picoGeracaoKw" DECIMAL(10,2),
        "diasSemGeracao" INTEGER DEFAULT 0,
        "fonteGeracao" VARCHAR(20) DEFAULT 'manual',
        "consumoConcessionariaKwh" DECIMAL(12,2),
        "energiaInjetadaKwh" DECIMAL(12,2),
        "creditosAcumuladosKwh" DECIMAL(12,2),
        "valorContaRs" DECIMAL(12,2),
        "tarifaPraticadaRsKwh" DECIMAL(8,4),
        "numeroUC" VARCHAR(50),
        "fonteConcessionaria" VARCHAR(20) DEFAULT 'manual',
        "performanceRatio" DECIMAL(6,2),
        "perdaGeracaoKwh" DECIMAL(12,2),
        "perdaFinanceiraRs" DECIMAL(12,2),
        "economiaGeradaRs" DECIMAL(12,2),
        "hspMedio" DECIMAL(6,2),
        "variacaoMesAnterior" DECIMAL(6,2),
        "usinaSnapshot" TEXT,
        "resumoAutomatico" TEXT,
        "resumoCustomizado" TEXT,
        "observacoesTecnicas" TEXT,
        "pdfConcessionariaUrl" TEXT,
        "relatorioGeracaoUrl" TEXT,
        "fotosAnexas" TEXT,
        "tipoPeriodo" VARCHAR(20) DEFAULT 'mensal',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP,
        UNIQUE("usinaId", "mesReferencia")
      )
    `);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_smr_usina ON solar_monthly_reports("usinaId")`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_smr_cliente ON solar_monthly_reports("clienteId")`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_smr_mes ON solar_monthly_reports("mesReferencia")`);

    // ═══════════════════════════════════════════════════════════════
    // 12. SIMULATION TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS simulation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "proposalId" UUID DEFAULT NULL,
        "clientId" UUID DEFAULT NULL,
        "createdById" UUID DEFAULT NULL,
        label VARCHAR DEFAULT NULL,
        "serviceDescription" TEXT DEFAULT NULL,
        "inputData" TEXT DEFAULT NULL,
        "resultData" TEXT DEFAULT NULL,
        "selectedConditionId" VARCHAR DEFAULT NULL,
        "detectedProfile" VARCHAR DEFAULT NULL,
        "basePrice" numeric(15,2) DEFAULT NULL,
        "selectedTotal" numeric(15,2) DEFAULT NULL,
        "selectedMargin" numeric(5,2) DEFAULT NULL,
        "totalConditions" INT DEFAULT 0,
        "viableConditions" INT DEFAULT 0,
        "blockedConditions" INT DEFAULT 0,
        status VARCHAR DEFAULT 'draft',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP DEFAULT NULL
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS simulation_exceptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionId" UUID DEFAULT NULL,
        "exceptionType" VARCHAR DEFAULT 'other',
        status VARCHAR DEFAULT 'pending',
        "conditionId" VARCHAR DEFAULT NULL,
        "conditionSnapshot" TEXT DEFAULT NULL,
        "conditionLabel" VARCHAR DEFAULT NULL,
        "marginAtException" numeric(5,2) DEFAULT NULL,
        "minMarginRequired" numeric(5,2) DEFAULT NULL,
        "cashGapAmount" numeric(15,2) DEFAULT NULL,
        "riskScoreAtException" INT DEFAULT NULL,
        "requestedById" UUID DEFAULT NULL,
        justification TEXT DEFAULT NULL,
        "approvedById" UUID DEFAULT NULL,
        "approvalNote" TEXT DEFAULT NULL,
        "approvedAt" TIMESTAMP DEFAULT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // 13. PORTAL / STRUCTURE / CLIENT SUB-USER TABLES
    // ═══════════════════════════════════════════════════════════════

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS portal_publications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clientId" UUID NOT NULL,
        "workId" UUID,
        "contentType" VARCHAR(50) NOT NULL,
        "contentId" UUID NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        "publishedById" UUID,
        "publishedAt" TIMESTAMP DEFAULT NOW(),
        "isActive" BOOLEAN DEFAULT true,
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_portal_pub_client ON portal_publications ("clientId") WHERE "deletedAt" IS NULL`);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_portal_pub_content ON portal_publications ("contentType", "contentId") WHERE "deletedAt" IS NULL`);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS structure_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        concessionaria VARCHAR,
        "normCode" VARCHAR,
        "tensionLevel" VARCHAR,
        category VARCHAR,
        description TEXT,
        "diagramUrl" VARCHAR,
        tags TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "markupPercent" NUMERIC(5,2) DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS structure_template_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "templateId" UUID NOT NULL,
        "catalogItemId" UUID,
        description VARCHAR NOT NULL,
        quantity NUMERIC(10,3) DEFAULT 1,
        unit VARCHAR DEFAULT 'UN',
        "isOptional" BOOLEAN DEFAULT false,
        "unitPrice" NUMERIC(15,2) DEFAULT 0,
        "sortOrder" INT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.run(queryRunner, `
      CREATE TABLE IF NOT EXISTS client_sub_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clientId" UUID NOT NULL,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        role VARCHAR(30) DEFAULT 'viewer',
        phone VARCHAR,
        position VARCHAR,
        "isActive" BOOLEAN DEFAULT true,
        "allowedModules" TEXT,
        "allowedWorks" TEXT,
        "createdById" UUID,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP,
        UNIQUE("email")
      )
    `);
    await this.run(queryRunner, `CREATE INDEX IF NOT EXISTS idx_client_sub_users_client ON client_sub_users ("clientId") WHERE "deletedAt" IS NULL`);

    // ═══════════════════════════════════════════════════════════════
    // 14. ALTER TABLE ADD COLUMN IF NOT EXISTS
    //     (grouped by target table)
    // ═══════════════════════════════════════════════════════════════

    // -- compliance: employees
    await this.run(queryRunner, `ALTER TABLE employees ADD COLUMN IF NOT EXISTS "jobFunction" VARCHAR`);
    await this.run(queryRunner, `ALTER TABLE employees ADD COLUMN IF NOT EXISTS "riskGroupId" UUID`);

    // -- compliance: suppliers
    await this.run(queryRunner, `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "modality" VARCHAR`);

    // -- compliance: document_types category → VARCHAR
    await this.run(queryRunner, `ALTER TABLE document_types ALTER COLUMN category TYPE VARCHAR USING category::VARCHAR`);
    await this.run(queryRunner, `DROP TYPE IF EXISTS "document_types_category_enum"`);

    // -- proposals columns
    const proposalColumns = [
      `"signatureToken" VARCHAR DEFAULT NULL`,
      `"signatureTokenExpiresAt" TIMESTAMP DEFAULT NULL`,
      `"signedAt" TIMESTAMP DEFAULT NULL`,
      `"signedByName" VARCHAR DEFAULT NULL`,
      `"signedByDocument" VARCHAR DEFAULT NULL`,
      `"signedByIP" VARCHAR DEFAULT NULL`,
      `"signedByUserAgent" TEXT DEFAULT NULL`,
      `"signatureVerificationCode" VARCHAR DEFAULT NULL`,
      `"signatureImageBase64" TEXT DEFAULT NULL`,
      `"revisionNumber" INT DEFAULT 1`,
      `"createdById" UUID DEFAULT NULL`,
      `"updatedById" UUID DEFAULT NULL`,
      `"itemVisibilityMode" VARCHAR DEFAULT 'detailed'`,
      `"materialSummaryText" TEXT DEFAULT NULL`,
      `"serviceSummaryText" TEXT DEFAULT NULL`,
      `"summaryTotalLabel" VARCHAR DEFAULT NULL`,
      `"workDescription" TEXT DEFAULT NULL`,
      `"workAddress" TEXT DEFAULT NULL`,
      `"materialFornecimento" TEXT DEFAULT NULL`,
      `"materialFaturamento" TEXT DEFAULT NULL`,
      `"serviceDescription" TEXT DEFAULT NULL`,
      `"paymentBank" TEXT DEFAULT NULL`,
      `"paymentDueCondition" TEXT DEFAULT NULL`,
      `"workDeadlineDays" INT DEFAULT NULL`,
      `"contractorObligations" TEXT DEFAULT NULL`,
      `"clientObligations" TEXT DEFAULT NULL`,
      `"generalProvisions" TEXT DEFAULT NULL`,
      `"activityType" VARCHAR DEFAULT NULL`,
      `"workDeadlineType" VARCHAR DEFAULT 'calendar_days'`,
      `"workDeadlineText" TEXT DEFAULT NULL`,
      `"objectiveType" VARCHAR DEFAULT NULL`,
      `"objectiveText" TEXT DEFAULT NULL`,
      `"thirdPartyDeadlines" TEXT DEFAULT NULL`,
      `"simulationData" TEXT DEFAULT NULL`,
      `"logisticsCostValue" numeric(15,2) DEFAULT NULL`,
      `"logisticsCostMode" VARCHAR DEFAULT 'visible'`,
      `"logisticsCostPercent" numeric(5,2) DEFAULT NULL`,
      `"logisticsCostApplyTo" VARCHAR DEFAULT 'material'`,
      `"logisticsCostEmbedMaterialPct" numeric(5,2) DEFAULT 100`,
      `"logisticsCostEmbedServicePct" numeric(5,2) DEFAULT 0`,
      `"logisticsCostDescription" TEXT DEFAULT NULL`,
      `"adminCostValue" numeric(15,2) DEFAULT NULL`,
      `"adminCostMode" VARCHAR DEFAULT 'visible'`,
      `"adminCostPercent" numeric(5,2) DEFAULT NULL`,
      `"adminCostApplyTo" VARCHAR DEFAULT 'material'`,
      `"adminCostEmbedMaterialPct" numeric(5,2) DEFAULT 100`,
      `"adminCostEmbedServicePct" numeric(5,2) DEFAULT 0`,
      `"adminCostDescription" TEXT DEFAULT NULL`,
      `"brokerageCostValue" numeric(15,2) DEFAULT NULL`,
      `"brokerageCostMode" VARCHAR DEFAULT 'visible'`,
      `"brokerageCostPercent" numeric(5,2) DEFAULT NULL`,
      `"brokerageCostApplyTo" VARCHAR DEFAULT 'material'`,
      `"brokerageCostEmbedMaterialPct" numeric(5,2) DEFAULT 100`,
      `"brokerageCostEmbedServicePct" numeric(5,2) DEFAULT 0`,
      `"brokerageCostDescription" TEXT DEFAULT NULL`,
      `"insuranceCostValue" numeric(15,2) DEFAULT NULL`,
      `"insuranceCostMode" VARCHAR DEFAULT 'visible'`,
      `"insuranceCostPercent" numeric(5,2) DEFAULT NULL`,
      `"insuranceCostApplyTo" VARCHAR DEFAULT 'material'`,
      `"insuranceCostEmbedMaterialPct" numeric(5,2) DEFAULT 100`,
      `"insuranceCostEmbedServicePct" numeric(5,2) DEFAULT 0`,
      `"insuranceCostDescription" TEXT DEFAULT NULL`,
      `"complianceText" TEXT DEFAULT NULL`,
      `"customLabel" VARCHAR DEFAULT NULL`,
      `"referralConsultantId" UUID DEFAULT NULL`,
    ];
    for (const col of proposalColumns) {
      await this.run(queryRunner, `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS ${col}`);
    }

    // -- proposal_items columns
    const proposalItemColumns = [
      `"overridePrice" numeric(15,2) DEFAULT NULL`,
      `"isBundleParent" BOOLEAN DEFAULT false`,
      `"parentId" UUID DEFAULT NULL`,
      `"showDetailedPrices" BOOLEAN DEFAULT true`,
      `"showGroupTitle" BOOLEAN DEFAULT true`,
      `"isSuggested" BOOLEAN DEFAULT false`,
      `"suggestedByRule" VARCHAR DEFAULT NULL`,
      `"sortOrder" INT DEFAULT 0`,
      `"notes" TEXT DEFAULT NULL`,
      `"unit" VARCHAR DEFAULT NULL`,
      `"deletedAt" TIMESTAMP DEFAULT NULL`,
      // SINAPI columns
      `"isSinapiLinked" BOOLEAN DEFAULT false`,
      `"sinapiCompositionCode" VARCHAR`,
      `"sinapiCompositionId" UUID`,
      `"sinapiReferenceId" UUID`,
      `"sinapiUnitCost" DECIMAL(15,4)`,
      `"sinapiBdiPercent" DECIMAL(6,2)`,
      `"sinapiPricingProfileId" UUID`,
      `"sinapiSellingPrice" DECIMAL(15,4)`,
      `"sinapiPricingSnapshot" TEXT`,
      `"sinapiFrozenAt" TIMESTAMPTZ`,
    ];
    for (const col of proposalItemColumns) {
      await this.run(queryRunner, `ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS ${col}`);
    }

    // -- proposal_items: convert quantity to DECIMAL
    await this.run(queryRunner, `ALTER TABLE proposal_items ALTER COLUMN quantity TYPE numeric(15,4) USING quantity::numeric`);

    // -- payments columns
    const paymentColumns = [
      `"boletoUrl" TEXT`,
      `"boletoFileName" VARCHAR`,
      `"pixQrCode" TEXT`,
      `"pixQrCodeImage" TEXT`,
      `"proposalId" UUID`,
      `"proposalNumber" VARCHAR`,
      `"measurementId" UUID`,
      `"isAnticipated" BOOLEAN DEFAULT false`,
      `"anticipatedDate" TIMESTAMP`,
      `"anticipationDiscount" DECIMAL(15,2) DEFAULT 0`,
      `"inssBasePercentage" DECIMAL(5,2) DEFAULT 0`,
      `"inssRate" DECIMAL(5,2) DEFAULT 0`,
      `"inssAmount" DECIMAL(15,2) DEFAULT 0`,
      `"inssGpsNumber" VARCHAR`,
      `"simplesRate" DECIMAL(5,2) DEFAULT 0`,
      `"simplesAmount" DECIMAL(15,2) DEFAULT 0`,
      `"simplesStatus" VARCHAR DEFAULT 'none'`,
      `"simplesCompetence" VARCHAR`,
    ];
    for (const col of paymentColumns) {
      await this.run(queryRunner, `ALTER TABLE payments ADD COLUMN IF NOT EXISTS ${col}`);
    }

    // -- companies signature columns
    await this.run(queryRunner, `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureImageUrl" VARCHAR`);
    await this.run(queryRunner, `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureSignerName" VARCHAR`);
    await this.run(queryRunner, `ALTER TABLE companies ADD COLUMN IF NOT EXISTS "signatureSignerRole" VARCHAR`);

    // -- clients columns
    await this.run(queryRunner, `ALTER TABLE clients ADD COLUMN IF NOT EXISTS "signatureImageUrl" VARCHAR`);
    await this.run(queryRunner, `ALTER TABLE clients ADD COLUMN IF NOT EXISTS "portalModules" TEXT DEFAULT '["obras","propostas","documentos","solicitacoes"]'`);

    // -- documents column
    await this.run(queryRunner, `ALTER TABLE documents ADD COLUMN IF NOT EXISTS "proposalId" UUID`);

    // -- employee_documents columns
    await this.run(queryRunner, `ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS "documentCategory" VARCHAR(50) DEFAULT 'other'`);
    await this.run(queryRunner, `ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS "referenceMonth" VARCHAR(7)`);

    // -- tasks columns
    await this.run(queryRunner, `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "visibility" varchar(20) DEFAULT 'public'`);
    await this.run(queryRunner, `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "visibleToIds" text DEFAULT NULL`);

    // -- opportunities columns
    await this.run(queryRunner, `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS "clientName" varchar(255) DEFAULT NULL`);
    await this.run(queryRunner, `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS "clientPhone" varchar(100) DEFAULT NULL`);
    await this.run(queryRunner, `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS "clientEmail" varchar(255) DEFAULT NULL`);
    await this.run(queryRunner, `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS "source" varchar(100) DEFAULT NULL`);

    // -- SINAPI composition items columns
    await this.run(queryRunner, `ALTER TABLE sinapi_composition_items ADD COLUMN IF NOT EXISTS "itemType" VARCHAR DEFAULT 'insumo'`);
    await this.run(queryRunner, `ALTER TABLE sinapi_composition_items ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0`);

    // -- SINAPI input columns
    await this.run(queryRunner, `ALTER TABLE sinapi_inputs ADD COLUMN IF NOT EXISTS "groupClass" VARCHAR`);

    // -- SINAPI price state columns
    await this.run(queryRunner, `ALTER TABLE sinapi_input_prices ADD COLUMN IF NOT EXISTS state CHAR(2)`);
    await this.run(queryRunner, `ALTER TABLE sinapi_composition_costs ADD COLUMN IF NOT EXISTS state CHAR(2)`);
    await this.run(queryRunner, `ALTER TABLE sinapi_composition_costs ADD COLUMN IF NOT EXISTS "laborPercent" DECIMAL(8,4)`);

    // ═══════════════════════════════════════════════════════════════
    // 15. CLIENTS: DROP UNIQUE on document
    // ═══════════════════════════════════════════════════════════════

    // Drop UNIQUE index/constraint on clients.document (allows duplicate CNPJ)
    // This uses DO $$ block to check if it exists before dropping
    await this.run(queryRunner, `
      DO $$ 
      DECLARE
        idx_name TEXT;
      BEGIN
        -- Drop unique indexes
        SELECT i.relname INTO idx_name
        FROM pg_index ix
        JOIN pg_class i ON ix.indexrelid = i.oid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = 'clients' AND a.attname = 'document' AND ix.indisunique
        LIMIT 1;
        
        IF idx_name IS NOT NULL THEN
          EXECUTE 'DROP INDEX IF EXISTS ' || idx_name;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order — only DROP tables created by this migration.
    // We do NOT drop base tables (users, clients, payments, etc.)
    // We do NOT revert ALTER TABLE ADD COLUMN (too dangerous for production data)

    const tablesToDrop = [
      // 13. Portal / Structure / Client sub-user
      'client_sub_users',
      'structure_template_items',
      'structure_templates',
      'portal_publications',
      // 12. Simulations
      'simulation_exceptions',
      'simulation_sessions',
      // 11. Solar
      'solar_monthly_reports',
      'solar_plan_installments',
      'solar_plan_subscriptions',
      'solar_plans',
      // 10. SINAPI
      'sinapi_pricing_profiles',
      'sinapi_import_logs',
      'sinapi_configs',
      'sinapi_budget_links',
      'sinapi_composition_costs',
      'sinapi_input_prices',
      'sinapi_composition_items',
      'sinapi_compositions',
      'sinapi_inputs',
      'sinapi_references',
      // 9. Service orders
      'service_orders',
      // 8. Budget
      'company_financials',
      'service_rules',
      'budget_items',
      'budgets',
      // 7. OEM
      'oem_servicos',
      'oem_contratos',
      'oem_planos',
      'oem_usinas',
      // 6. Contract templates
      'contract_templates',
      // 5. Finance
      'bank_statement_entries',
      'bank_statements',
      'debt_payments',
      'debts',
      'payment_installments',
      'measurement_items',
      'measurements',
      'purchase_order_items',
      'purchase_orders',
      'payment_receipts',
      // 4. Proposals
      'proposal_revisions',
      // 3. Referral / Partner
      'partner_request_messages',
      'partner_requests',
      'partner_withdrawal_requests',
      'broadcast_documents',
      'lead_documents',
      'referral_commissions',
      'referral_followups',
      'referral_commitments',
      'referral_lead_proposals',
      'referral_leads',
      'referral_consultants',
      // 2. Compliance standalone
      'exam_referral_items',
      'exam_referrals',
      'risk_group_exams',
      'occupational_exams',
      'risk_groups',
      'safety_programs',
      'company_documents',
    ];

    for (const table of tablesToDrop) {
      await this.run(queryRunner, `DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    // Drop ENUMs
    await this.run(queryRunner, `DROP TYPE IF EXISTS service_order_priority`);
    await this.run(queryRunner, `DROP TYPE IF EXISTS service_order_status`);
  }

  /**
   * Helper: run a query with try/catch so already-applied DDL doesn't crash the migration.
   */
  private async run(queryRunner: QueryRunner, sql: string): Promise<void> {
    try {
      await queryRunner.query(sql);
    } catch (err) {
      // Silently ignore — table/column/type may already exist
    }
  }
}
