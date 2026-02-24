import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';


// ═══════════════════════════════════════════════════════════════
// Configuração Fiscal da Empresa
// ═══════════════════════════════════════════════════════════════

@Entity('fiscal_config')
export class FiscalConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Dados da empresa
    @Column({ nullable: true })
    companyName: string;

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    stateRegistration: string;        // Inscrição Estadual

    @Column({ nullable: true })
    municipalRegistration: string;    // Inscrição Municipal

    @Column({ type: 'text', nullable: true })
    companyAddress: string;

    @Column({ nullable: true })
    companyCity: string;

    @Column({ nullable: true })
    companyState: string;

    @Column({ nullable: true })
    companyCep: string;

    // Certificado Digital A1
    @Column({ nullable: true })
    certificateFile: string;           // Caminho do arquivo .pfx

    @Column({ nullable: true })
    certificateOriginalName: string;   // Nome original do arquivo

    @Column({ nullable: true })
    certificatePassword: string;       // Senha (criptografada)

    @Column({ nullable: true })
    certificateExpiresAt: Date;        // Validade do certificado

    @Column({ nullable: true })
    certificateUploadedAt: Date;

    // Permissões de faturamento
    @Column({ default: false })
    canInvoiceMaterial: boolean;       // Pode emitir NF-e (materiais)

    @Column({ default: false })
    canInvoiceService: boolean;        // Pode emitir NFS-e (serviços)

    // ═══ CONFIGURAÇÃO TRIBUTÁRIA ═══
    // Regime tributário
    @Column({ nullable: true, default: '1' })
    regimeTributario: string;          // 1=Simples Nacional, 2=Simples Exc. Sublimite, 3=Lucro Presumido, 4=Lucro Real

    @Column({ nullable: true })
    simplesAnexo: string;              // I, II, III, IV, V (anexo do Simples Nacional)

    @Column({ type: 'int', nullable: true, default: 1 })
    crt: number;                       // Código de Regime Tributário (1=Simples, 2=Simples Exc., 3=Normal)

    // Impostos sobre serviço (NFS-e)
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 5.0 })
    aliquotaIss: number;               // Alíquota ISS (%)

    @Column({ nullable: true })
    codigoServico: string;             // Código do serviço municipal (LC 116) ex: 14.01

    @Column({ nullable: true, default: '01.01.01' })
    codigoTribNacional: string;        // Código de tributação nacional (NFS-e padrão nacional)

    @Column({ nullable: true })
    cnae: string;                      // CNAE principal da empresa

    @Column({ nullable: true })
    codigoMunicipio: string;           // Código IBGE do município (7 dígitos)

    @Column({ nullable: true })
    nomeMunicipio: string;             // Nome do município

    // Retenções de impostos
    @Column({ default: false })
    retIss: boolean;                   // Reter ISS na fonte

    @Column({ default: false })
    retIrpj: boolean;                  // Reter IRPJ

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 1.5 })
    aliquotaIrpj: number;              // Alíquota IRPJ (%)

    @Column({ default: false })
    retCsll: boolean;                  // Reter CSLL

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 1.0 })
    aliquotaCsll: number;              // Alíquota CSLL (%)

    @Column({ default: false })
    retPis: boolean;                   // Reter PIS

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0.65 })
    aliquotaPis: number;               // Alíquota PIS (%)

    @Column({ default: false })
    retCofins: boolean;                // Reter COFINS

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 3.0 })
    aliquotaCofins: number;            // Alíquota COFINS (%)

    @Column({ default: false })
    retInss: boolean;                  // Reter INSS

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 11.0 })
    aliquotaInss: number;              // Alíquota INSS (%)

    // Construção civil
    @Column({ nullable: true })
    cno: string;                       // Cadastro Nacional de Obras (CNO)

    // API Fiscal (integração futura)
    @Column({ nullable: true, default: 'nuvem_fiscal' })
    fiscalApiProvider: string;         // 'nuvem_fiscal' | 'focus_nfe' | 'none'

    @Column({ nullable: true })
    fiscalApiClientId: string;         // Client ID OAuth2

    @Column({ nullable: true })
    fiscalApiClientSecret: string;     // Client Secret OAuth2

    // Regime Especial de Tributação (NFS-e)
    // 0-Sem regime, 1-ME/EPP SN, 2-Estimativa, 3-Soc.Profissionais,
    // 4-Cooperativa, 5-MEI, 6-ME/EPP ISSQN fixo
    @Column({ type: 'int', nullable: true })
    regEspTrib: number;

    @Column({ nullable: true })
    fiscalApiEnvironment: string;      // 'sandbox' | 'production'

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// Nota Fiscal Emitida
// ═══════════════════════════════════════════════════════════════

export enum InvoiceType {
    NFE = 'nfe',       // Nota Fiscal Eletrônica (materiais)
    NFSE = 'nfse',     // Nota Fiscal de Serviço (serviços)
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    PROCESSING = 'processing',
    AUTHORIZED = 'authorized',
    CANCELLED = 'cancelled',
    ERROR = 'error',
}

// Naturezas de Operação mais comuns
export const NATUREZA_OPERACAO = {
    venda: 'Venda de mercadoria',
    venda_futura: 'Venda para entrega futura',
    troca: 'Troca / Devolução em garantia',
    devolucao: 'Devolução de mercadoria',
    remessa_demo: 'Remessa para demonstração',
    remessa_conserto: 'Remessa para conserto ou reparo',
    consignacao: 'Remessa em consignação mercantil',
    bonificacao: 'Remessa em bonificação, doação ou brinde',
    transferencia: 'Transferência de mercadoria',
    servico: 'Prestação de serviço',
    complementar: 'NF complementar',
    simples_faturamento: 'Simples faturamento',
    industrializacao: 'Industrialização por encomenda',
    exportacao: 'Exportação de mercadoria',
    outras: 'Outras saídas',
} as const;

// Finalidade da NF-e (tag finNFe)
export enum FinalidadeNFe {
    NORMAL = 1,           // 1 - NF-e normal
    COMPLEMENTAR = 2,     // 2 - NF-e complementar
    AJUSTE = 3,           // 3 - NF-e de ajuste
    DEVOLUCAO = 4,        // 4 - Devolução de mercadoria
}

// ═══ Interfaces para emissão de NF ═══

export interface ClientData {
    name: string;
    document: string;        // CPF ou CNPJ
    address?: string;
    number?: string;         // Número do endereço
    complement?: string;     // Complemento
    neighborhood?: string;   // Bairro
    city?: string;
    state?: string;
    zipCode?: string;
    ibgeCode?: string;       // Código IBGE do município
    email?: string;
    phone?: string;
}

export interface InvoiceItemData {
    description: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    ncm?: string;
    cfopInterno?: string;
    serviceType?: string;
    origem?: number;
}

@Entity('fiscal_invoices')
export class FiscalInvoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    proposalId: string;

    @ManyToOne('Proposal', 'fiscalInvoices', { eager: false })
    @JoinColumn({ name: 'proposalId' })
    proposal: any;

    @Column({ type: 'enum', enum: InvoiceType })
    type: InvoiceType;

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
    status: InvoiceStatus;

    @Column({ nullable: true })
    invoiceNumber: string;             // Número da NF

    @Column({ nullable: true })
    series: string;                    // Série

    @Column({ nullable: true })
    accessKey: string;                 // Chave de acesso (44 dígitos)

    @Column({ nullable: true })
    issueDate: Date;                   // Data de emissão

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalValue: number;                // Valor total

    @Column({ type: 'text', nullable: true })
    description: string;               // Descrição dos itens

    // Dados do destinatário
    @Column({ nullable: true })
    recipientName: string;

    @Column({ nullable: true })
    recipientDocument: string;         // CNPJ/CPF

    @Column({ type: 'text', nullable: true })
    recipientAddress: string;

    // Itens faturados (JSON)
    @Column({ type: 'jsonb', nullable: true })
    items: any[];                      // Array dos itens da proposta faturados

    // Dados fiscais gerados
    @Column({ type: 'text', nullable: true })
    xmlContent: string;                // XML da NF (quando gerado pela API)

    @Column({ nullable: true })
    danfePdfPath: string;              // Caminho do DANFE em PDF

    // Integração com API fiscal
    @Column({ nullable: true })
    externalId: string;                // ID na API fiscal (Focus, Nuvem, etc.)

    @Column({ type: 'text', nullable: true })
    externalResponse: string;          // Resposta completa da API

    @Column({ type: 'text', nullable: true })
    errorMessage: string;              // Mensagem de erro

    @Column({ nullable: true })
    cancelledAt: Date;

    @Column({ type: 'text', nullable: true })
    cancellationReason: string;

    // Natureza de Operação (ex: 'Venda de mercadoria', 'Devolução', etc.)
    @Column({ nullable: true, default: 'Venda de mercadoria' })
    naturezaOperacao: string;

    // Finalidade da NF-e (1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução)
    @Column({ type: 'int', nullable: true, default: 1 })
    finalidadeNfe: number;

    // CFOP principal da operação
    @Column({ nullable: true })
    cfopCode: string;

    // ═══ EMISSÃO PARCIAL / EDIÇÃO DE VALOR ═══

    // Valor original calculado da proposta (para auditoria)
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    originalValue: number;

    // Valor customizado pelo usuário (null = usar valor original)
    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    customValue: number;

    // Controle de parcelas
    @Column({ type: 'int', nullable: true })
    installmentNumber: number;             // Parcela nº (1, 2, 3...)

    @Column({ type: 'int', nullable: true })
    installmentTotal: number;              // Total de parcelas planejadas

    // Quem editou o valor por último
    @Column({ nullable: true })
    editedBy: string;                      // userId

    // Histórico inline de edições [{userId, userName, from, to, at, reason}]
    @Column({ type: 'jsonb', nullable: true, default: '[]' })
    editHistory: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
