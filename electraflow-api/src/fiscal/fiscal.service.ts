import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { FiscalConfig, FiscalInvoice, InvoiceType, InvoiceStatus, ClientData, InvoiceItemData } from './fiscal.entity';
import { InvoiceValueEdit } from './invoice-value-edit.entity';
import { Proposal } from '../proposals/proposal.entity';
import { NuvemFiscalService, NuvemFiscalConfig } from './nuvem-fiscal.service';

@Injectable()
export class FiscalService {
    private readonly logger = new Logger(FiscalService.name);

    constructor(
        @InjectRepository(FiscalConfig)
        private configRepo: Repository<FiscalConfig>,
        @InjectRepository(FiscalInvoice)
        private invoiceRepo: Repository<FiscalInvoice>,
        @InjectRepository(InvoiceValueEdit)
        private valueEditRepo: Repository<InvoiceValueEdit>,
        @InjectRepository(Proposal)
        private proposalRepo: Repository<Proposal>,
        private nuvemFiscal: NuvemFiscalService,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // HELPER: Obter config da Nuvem Fiscal
    // ═══════════════════════════════════════════════════════════════

    private getNuvemConfig(config: FiscalConfig): NuvemFiscalConfig {
        if (!config.fiscalApiClientId || !config.fiscalApiClientSecret) {
            throw new BadRequestException(
                'Client ID e Client Secret da Nuvem Fiscal não configurados. Vá em Configuração Fiscal.',
            );
        }
        return {
            clientId: config.fiscalApiClientId,
            clientSecret: config.fiscalApiClientSecret,
            sandbox: config.fiscalApiEnvironment !== 'production',
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER: Resolver código IBGE do município a partir de cidade+UF
    // ═══════════════════════════════════════════════════════════════

    private async resolverCodigoIBGE(cidade: string, uf: string): Promise<string | null> {
        if (!cidade?.trim() || !uf?.trim()) return null;
        try {
            const response = await axios.get(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`,
                { timeout: 5000 },
            );
            const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const cidadeNorm = normalizar(cidade);
            const municipio = response.data.find((m: any) => normalizar(m.nome) === cidadeNorm);
            if (municipio) {
                this.logger.log(`[IBGE] Resolvido: ${cidade}/${uf} → ${municipio.id}`);
                return String(municipio.id);
            }
            this.logger.warn(`[IBGE] Município não encontrado: ${cidade}/${uf}`);
            return null;
        } catch (err) {
            this.logger.warn(`[IBGE] Falha ao consultar API IBGE: ${err.message}`);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO FISCAL
    // ═══════════════════════════════════════════════════════════════

    async getConfig(): Promise<FiscalConfig> {
        const configs = await this.configRepo.find();
        if (configs.length === 0) {
            const newConfig = this.configRepo.create({
                canInvoiceMaterial: false,
                canInvoiceService: false,
                fiscalApiProvider: 'nuvem_fiscal',
                fiscalApiEnvironment: 'sandbox',
            });
            return this.configRepo.save(newConfig);
        }
        return configs[0];
    }

    async updateConfig(data: Partial<FiscalConfig>): Promise<FiscalConfig> {
        const config = await this.getConfig();

        // Sanitize numeric fields that may arrive as empty strings from the frontend
        const sanitized: any = { ...data };
        const intFields = ['crt', 'regEspTrib'];
        const decimalFields = [
            'aliquotaIss', 'aliquotaIrpj', 'aliquotaCsll',
            'aliquotaPis', 'aliquotaCofins', 'aliquotaInss',
        ];

        for (const f of intFields) {
            if (f in sanitized) {
                sanitized[f] = sanitized[f] === '' || sanitized[f] == null ? null : Number(sanitized[f]);
            }
        }
        for (const f of decimalFields) {
            if (f in sanitized) {
                sanitized[f] = sanitized[f] === '' || sanitized[f] == null ? null : Number(sanitized[f]);
            }
        }

        Object.assign(config, sanitized);
        return this.configRepo.save(config);
    }

    async uploadCertificate(
        filename: string,
        originalName: string,
        password: string,
    ): Promise<FiscalConfig> {
        const config = await this.getConfig();
        config.certificateFile = filename;
        config.certificateOriginalName = originalName;
        config.certificatePassword = password;
        config.certificateUploadedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        config.certificateExpiresAt = expiresAt;
        const saved = await this.configRepo.save(config);

        // Sincronizar certificado com Nuvem Fiscal se configurado
        if (config.fiscalApiProvider === 'nuvem_fiscal' && config.fiscalApiClientId && config.cnpj) {
            try {
                const nuvemConfig = this.getNuvemConfig(config);
                const filePath = path.join('./uploads/certificates', filename);
                await this.nuvemFiscal.cadastrarCertificadoFromFile(
                    nuvemConfig,
                    config.cnpj.replace(/\D/g, ''),
                    filePath,
                    password,
                );
                this.logger.log('Certificado sincronizado com Nuvem Fiscal');
            } catch (error) {
                this.logger.warn('Não foi possível sincronizar certificado com Nuvem Fiscal:', error.message);
            }
        }

        return saved;
    }

    async removeCertificate(): Promise<FiscalConfig> {
        const config = await this.getConfig();
        config.certificateFile = null;
        config.certificateOriginalName = null;
        config.certificatePassword = null;
        config.certificateExpiresAt = null;
        config.certificateUploadedAt = null;
        return this.configRepo.save(config);
    }

    // ═══════════════════════════════════════════════════════════════
    // CADASTRAR EMPRESA NA NUVEM FISCAL
    // ═══════════════════════════════════════════════════════════════

    async syncCompanyToNuvemFiscal(): Promise<any> {
        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (!config.cnpj) {
            throw new BadRequestException('CNPJ da empresa não configurado');
        }

        const cnpjLimpo = config.cnpj.replace(/\D/g, '');

        // Tenta consultar se a empresa já está cadastrada
        try {
            const existing = await this.nuvemFiscal.consultarEmpresa(nuvemConfig, cnpjLimpo);
            this.logger.log('Empresa já cadastrada na Nuvem Fiscal, atualizando...');
            return this.nuvemFiscal.alterarEmpresa(nuvemConfig, cnpjLimpo, {
                cpf_cnpj: cnpjLimpo,
                inscricao_estadual: config.stateRegistration || '',
                inscricao_municipal: config.municipalRegistration || '',
                nome_razao_social: config.companyName || '',
                endereco: {
                    logradouro: config.companyAddress || '',
                    cidade: config.companyCity || '',
                    uf: config.companyState || '',
                    cep: (config.companyCep || '').replace(/\D/g, ''),
                },
            });
        } catch {
            // Empresa não existe, cadastrar
            this.logger.log('Cadastrando empresa na Nuvem Fiscal...');
            return this.nuvemFiscal.cadastrarEmpresa(nuvemConfig, {
                cpf_cnpj: cnpjLimpo,
                inscricao_estadual: config.stateRegistration || '',
                inscricao_municipal: config.municipalRegistration || '',
                nome_razao_social: config.companyName || '',
                endereco: {
                    logradouro: config.companyAddress || '',
                    cidade: config.companyCity || '',
                    uf: config.companyState || '',
                    cep: (config.companyCep || '').replace(/\D/g, ''),
                },
            });
        }
    }

    async configureNuvemFiscalServices(): Promise<any> {
        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);
        const cnpjLimpo = config.cnpj.replace(/\D/g, '');
        const ambiente = config.fiscalApiEnvironment === 'production' ? 'producao' : 'homologacao';
        const results: any = {};

        if (config.canInvoiceMaterial) {
            try {
                results.nfe = await this.nuvemFiscal.configurarNfe(nuvemConfig, cnpjLimpo, {
                    serie: 1,
                    numero: 1,
                    ambiente,
                });
                this.logger.log('NF-e configurada na Nuvem Fiscal');
            } catch (e) {
                results.nfeError = e.message;
            }
        }

        if (config.canInvoiceService) {
            try {
                results.nfse = await this.nuvemFiscal.configurarNfse(nuvemConfig, cnpjLimpo, {
                    rps: { lote: 1, serie: 'NF', numero: 1 },
                    ambiente,
                });
                this.logger.log('NFS-e configurada na Nuvem Fiscal');
            } catch (e) {
                results.nfseError = e.message;
            }
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTAS FISCAIS
    // ═══════════════════════════════════════════════════════════════

    async findAllInvoices(filters?: {
        type?: InvoiceType;
        status?: InvoiceStatus;
        proposalId?: string;
    }): Promise<FiscalInvoice[]> {
        const query = this.invoiceRepo.createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.proposal', 'proposal')
            .leftJoinAndSelect('proposal.client', 'client')
            .orderBy('invoice.createdAt', 'DESC');

        if (filters?.type) {
            query.andWhere('invoice.type = :type', { type: filters.type });
        }
        if (filters?.status) {
            query.andWhere('invoice.status = :status', { status: filters.status });
        }
        if (filters?.proposalId) {
            query.andWhere('invoice.proposalId = :proposalId', { proposalId: filters.proposalId });
        }

        return query.getMany();
    }

    async findOneInvoice(id: string): Promise<FiscalInvoice> {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ['proposal', 'proposal.client', 'proposal.items'],
        });
        if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');
        return invoice;
    }

    async getProposalPreview(proposalId: string) {
        const proposal = await this.proposalRepo.findOne({
            where: { id: proposalId },
            relations: ['items', 'client'],
        });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');

        const config = await this.getConfig();

        const materialItems = proposal.items.filter(
            (item) => item.serviceType === 'material',
        );
        const serviceItems = proposal.items.filter(
            (item) => item.serviceType === 'service' || item.serviceType === 'servico',
        );

        const materialTotal = materialItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );
        const serviceTotal = serviceItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );

        const existingInvoices = await this.invoiceRepo.find({
            where: { proposalId },
        });

        const hasNfe = existingInvoices.some(
            (inv) => inv.type === InvoiceType.NFE && inv.status !== InvoiceStatus.CANCELLED,
        );
        const hasNfse = existingInvoices.some(
            (inv) => inv.type === InvoiceType.NFSE && inv.status !== InvoiceStatus.CANCELLED,
        );

        // Calcular totais já faturados (excluindo canceladas)
        const activeInvoices = existingInvoices.filter(inv => inv.status !== InvoiceStatus.CANCELLED);
        const nfeInvoiced = activeInvoices
            .filter(inv => inv.type === InvoiceType.NFE)
            .reduce((sum, inv) => sum + Number(inv.totalValue || 0), 0);
        const nfseInvoiced = activeInvoices
            .filter(inv => inv.type === InvoiceType.NFSE)
            .reduce((sum, inv) => sum + Number(inv.totalValue || 0), 0);

        return {
            proposal: {
                id: proposal.id,
                proposalNumber: proposal.proposalNumber,
                title: proposal.title,
                status: proposal.status,
                client: proposal.client ? {
                    id: proposal.client.id,
                    name: proposal.client.name,
                    document: proposal.client.document,
                    address: proposal.client.address,
                    city: proposal.client.city,
                    state: proposal.client.state,
                    zipCode: proposal.client.zipCode,
                } : null,
            },
            material: {
                items: materialItems,
                total: materialTotal,
                canInvoice: config.canInvoiceMaterial,
                alreadyInvoiced: hasNfe,
                totalInvoiced: nfeInvoiced,
                remaining: materialTotal - nfeInvoiced,
            },
            service: {
                items: serviceItems,
                total: serviceTotal,
                canInvoice: config.canInvoiceService,
                alreadyInvoiced: hasNfse,
                totalInvoiced: nfseInvoiced,
                remaining: serviceTotal - nfseInvoiced,
            },
            existingInvoices,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // EMISSÃO DE NOTA FISCAL (COM NUVEM FISCAL)
    // ═══════════════════════════════════════════════════════════════

    async createInvoice(
        proposalId: string | null,
        type: InvoiceType,
        fiscalOptions?: {
            naturezaOperacao?: string;
            finalidadeNfe?: number;
            cfopCode?: string;
            customValue?: number;
            installmentNumber?: number;
            installmentTotal?: number;
            // NFS-e specific
            dCompet?: string;               // Data de competência (YYYY-MM-DD)
            municipioPrestacao?: string;     // Código IBGE do município de prestação
            descricaoServico?: string;       // Descrição detalhada do serviço
            infoComplementares?: string;     // Informações complementares
            numPedido?: string;              // Número do pedido/ordem
            docReferencia?: string;          // Documento de referência
        },
        clientData?: ClientData,
        manualItems?: InvoiceItemData[],
    ): Promise<FiscalInvoice> {
        const config = await this.getConfig();

        // ═══ VALIDAÇÃO PRÉ-EMISSÃO ═══
        const missingFields: { campo: string; local: string }[] = [];

        // Validações básicas de habilitação
        if (type === InvoiceType.NFE && !config.canInvoiceMaterial) {
            throw new BadRequestException('Empresa não habilitada para NF-e (materiais)');
        }
        if (type === InvoiceType.NFSE && !config.canInvoiceService) {
            throw new BadRequestException('Empresa não habilitada para NFS-e (serviços)');
        }

        // Validações de configuração fiscal (dados da empresa)
        if (!config.certificateFile) {
            missingFields.push({ campo: 'Certificado Digital', local: 'Configuração Fiscal → Certificado' });
        }
        if (!config.cnpj || config.cnpj.replace(/\D/g, '').length < 14) {
            missingFields.push({ campo: 'CNPJ da Empresa', local: 'Configuração Fiscal → Dados da Empresa' });
        }
        if (!config.companyName?.trim()) {
            missingFields.push({ campo: 'Razão Social', local: 'Configuração Fiscal → Dados da Empresa' });
        }
        if (!config.companyAddress?.trim()) {
            missingFields.push({ campo: 'Endereço da Empresa', local: 'Configuração Fiscal → Dados da Empresa' });
        }
        if (!config.companyState?.trim()) {
            missingFields.push({ campo: 'UF da Empresa', local: 'Configuração Fiscal → Dados da Empresa' });
        }
        if (!config.companyCep || config.companyCep.replace(/\D/g, '').length < 8) {
            missingFields.push({ campo: 'CEP da Empresa', local: 'Configuração Fiscal → Dados da Empresa' });
        }
        // codigoMunicipio is optional — will be auto-resolved from city+state if missing

        // Credenciais API
        if (!config.fiscalApiClientId?.trim()) {
            missingFields.push({ campo: 'Client ID (Nuvem Fiscal)', local: 'Configuração Fiscal → API' });
        }
        if (!config.fiscalApiClientSecret?.trim()) {
            missingFields.push({ campo: 'Client Secret (Nuvem Fiscal)', local: 'Configuração Fiscal → API' });
        }

        // Validações específicas por tipo
        if (type === InvoiceType.NFE) {
            if (!config.stateRegistration?.trim()) {
                missingFields.push({ campo: 'Inscrição Estadual', local: 'Configuração Fiscal → Dados da Empresa' });
            }
        }
        if (type === InvoiceType.NFSE) {
            if (!config.municipalRegistration?.trim()) {
                missingFields.push({ campo: 'Inscrição Municipal', local: 'Configuração Fiscal → Dados da Empresa' });
            }
            if (!config.codigoTribNacional?.trim()) {
                missingFields.push({ campo: 'Código Tributação Nacional', local: 'Configuração Fiscal → Tributação' });
            }
        }

        // ═══ CARREGAR PROPOSTA OU USAR DADOS AVULSOS ═══
        let proposal: Proposal | null = null;
        let invoiceItems: any[] = [];

        if (proposalId) {
            proposal = await this.proposalRepo.findOne({
                where: { id: proposalId },
                relations: ['items', 'client'],
            });
            if (!proposal) throw new NotFoundException('Proposta não encontrada');

            invoiceItems = proposal.items.filter((item) => {
                if (type === InvoiceType.NFE) return item.serviceType === 'material';
                return item.serviceType === 'service' || item.serviceType === 'servico';
            });

            if (invoiceItems.length === 0) {
                throw new BadRequestException(
                    `A proposta não possui itens do tipo ${type === InvoiceType.NFE ? 'material' : 'serviço'}`,
                );
            }
        } else if (manualItems && manualItems.length > 0) {
            // Nota avulsa — itens manuais
            invoiceItems = manualItems.map(item => ({
                description: item.description,
                unit: item.unit || 'UN',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total || item.quantity * item.unitPrice,
                ncm: item.ncm,
                cfopInterno: item.cfopInterno,
                serviceType: item.serviceType || (type === InvoiceType.NFE ? 'material' : 'service'),
                origem: item.origem,
            }));
        } else {
            throw new BadRequestException('Informe uma proposta ou itens manuais para emitir a nota fiscal.');
        }

        // ═══ RESOLVER DADOS DO CLIENTE ═══
        // Prioridade: clientData > proposal.client
        const resolvedClient: ClientData = {
            name: clientData?.name || proposal?.client?.name || '',
            document: clientData?.document || proposal?.client?.document || '',
            address: clientData?.address || proposal?.client?.address || '',
            number: clientData?.number || (proposal?.client as any)?.number || '',
            complement: clientData?.complement || (proposal?.client as any)?.complement || '',
            neighborhood: clientData?.neighborhood || (proposal?.client as any)?.neighborhood || '',
            city: clientData?.city || proposal?.client?.city || '',
            state: clientData?.state || proposal?.client?.state || '',
            zipCode: clientData?.zipCode || proposal?.client?.zipCode || '',
            ibgeCode: clientData?.ibgeCode || (proposal?.client as any)?.ibgeCode || '',
            email: clientData?.email || proposal?.client?.email || '',
        };

        // Validações do cliente/destinatário
        const localLabel = proposalId ? 'Dados do Cliente (informados na emissão)' : 'Dados do Cliente (nota avulsa)';
        if (!resolvedClient.name?.trim()) {
            missingFields.push({ campo: 'Nome do Cliente', local: localLabel });
        }
        if (!resolvedClient.document || resolvedClient.document.replace(/\D/g, '').length < 11) {
            missingFields.push({ campo: 'CPF/CNPJ do Cliente', local: localLabel });
        }

        // Se há campos faltando, lançar exceção com relatório estruturado
        if (missingFields.length > 0) {
            const report = missingFields
                .map((f, i) => `${i + 1}. ${f.campo} — ${f.local}`)
                .join('\n');
            throw new BadRequestException({
                message: `Não é possível emitir a nota fiscal. ${missingFields.length} campo(s) obrigatório(s) não preenchido(s):`,
                missingFields,
                report,
            });
        }

        const calculatedTotal = invoiceItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );

        // Se customValue foi informado, usar como totalValue (emissão parcial)
        const customValue = fiscalOptions?.customValue != null ? Number(fiscalOptions.customValue) : null;
        const totalValue = customValue != null && customValue > 0 ? customValue : calculatedTotal;

        // Validar que o valor customizado não excede o total disponível
        if (customValue != null && customValue > calculatedTotal) {
            throw new BadRequestException(
                `Valor customizado (R$ ${customValue.toFixed(2)}) excede o total dos itens (R$ ${calculatedTotal.toFixed(2)})`,
            );
        }

        const description = invoiceItems
            .map((item) => `${item.description} - Qtd: ${item.quantity} x R$ ${Number(item.unitPrice).toFixed(2)}`)
            .join('; ');

        // Criar registro local
        const invoice = this.invoiceRepo.create({
            proposalId: proposalId || null,
            type,
            status: InvoiceStatus.PROCESSING,
            totalValue,
            originalValue: calculatedTotal,
            customValue: customValue,
            installmentNumber: fiscalOptions?.installmentNumber || null,
            installmentTotal: fiscalOptions?.installmentTotal || null,
            description,
            issueDate: new Date(),
            recipientName: resolvedClient.name,
            recipientDocument: resolvedClient.document,
            recipientAddress: resolvedClient.address || '',
            items: invoiceItems.map((item) => ({
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
            })),
            naturezaOperacao: fiscalOptions?.naturezaOperacao || 'Venda de mercadoria',
            finalidadeNfe: fiscalOptions?.finalidadeNfe || 1,
            cfopCode: fiscalOptions?.cfopCode || '',
            editHistory: [],
        });

        const saved = await this.invoiceRepo.save(invoice);

        // Emitir via Nuvem Fiscal
        const hasNuvemCredentials = !!(config.fiscalApiClientId && config.fiscalApiClientSecret);
        const shouldEmitViaNuvem = hasNuvemCredentials;

        if (shouldEmitViaNuvem) {
            if (config.fiscalApiProvider !== 'nuvem_fiscal') {
                this.logger.warn(
                    `Provider configurado como "${config.fiscalApiProvider}" mas credenciais Nuvem Fiscal existem. Emitindo via Nuvem Fiscal.`,
                );
            }
            try {
                const nuvemConfig = this.getNuvemConfig(config);
                const cnpjLimpo = config.cnpj?.replace(/\D/g, '') || '';
                const ambiente = config.fiscalApiEnvironment === 'production' ? 'producao' : 'homologacao';

                let result: any;

                if (type === InvoiceType.NFE) {
                    result = await this.emitirNfeViaNuvem(nuvemConfig, config, resolvedClient, invoiceItems, totalValue, cnpjLimpo, ambiente, saved.id, saved.naturezaOperacao, saved.finalidadeNfe);
                } else {
                    result = await this.emitirNfseViaNuvem(
                        nuvemConfig, config, resolvedClient, invoiceItems, totalValue, cnpjLimpo, ambiente, saved.id,
                        {
                            dCompet: fiscalOptions?.dCompet,
                            municipioPrestacao: fiscalOptions?.municipioPrestacao,
                            descricaoServico: fiscalOptions?.descricaoServico,
                            infoComplementares: fiscalOptions?.infoComplementares,
                            numPedido: fiscalOptions?.numPedido,
                            docReferencia: fiscalOptions?.docReferencia,
                        },
                    );
                }

                // Atualizar invoice com dados da Nuvem Fiscal
                saved.externalId = result.id;
                saved.status = result.status === 'autorizado'
                    ? InvoiceStatus.AUTHORIZED
                    : result.status === 'rejeitado' || result.status === 'erro'
                        ? InvoiceStatus.ERROR
                        : InvoiceStatus.PROCESSING;
                saved.externalResponse = JSON.stringify(result);

                if (result.chave_acesso) saved.accessKey = result.chave_acesso;
                if (result.numero) saved.invoiceNumber = String(result.numero);

                await this.invoiceRepo.save(saved);
                this.logger.log(`NF emitida via Nuvem Fiscal — ID: ${result.id}, Status: ${result.status}`);
            } catch (error) {
                saved.status = InvoiceStatus.ERROR;
                saved.errorMessage = error.message || JSON.stringify(error);
                await this.invoiceRepo.save(saved);
                this.logger.error('Erro ao emitir NF via Nuvem Fiscal:', error);
            }
        } else {
            // Sem credenciais configuradas, fica como rascunho
            this.logger.warn('Nenhuma credencial de API fiscal configurada. NF salva como rascunho.');
            saved.status = InvoiceStatus.DRAFT;
            await this.invoiceRepo.save(saved);
        }

        return saved;
    }

    // ═══════════════════════════════════════════════════════════════
    // RETENTAR EMISSÃO DE NOTA FISCAL
    // ═══════════════════════════════════════════════════════════════
    async retryInvoice(invoiceId: string): Promise<FiscalInvoice> {
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

        if (!['error', 'draft'].includes(invoice.status)) {
            throw new BadRequestException(
                `Só é possível reenviar notas com status "Erro" ou "Rascunho". Status atual: "${invoice.status}"`,
            );
        }

        const config = await this.getConfig();

        // Validação pré-emissão
        const missingFields: { campo: string; local: string }[] = [];
        if (!config.certificateFile) missingFields.push({ campo: 'Certificado Digital', local: 'Configuração Fiscal → Certificado' });
        if (!config.cnpj || config.cnpj.replace(/\D/g, '').length < 14) missingFields.push({ campo: 'CNPJ da Empresa', local: 'Configuração Fiscal → Dados da Empresa' });
        if (!config.companyName?.trim()) missingFields.push({ campo: 'Razão Social', local: 'Configuração Fiscal → Dados da Empresa' });
        if (!config.fiscalApiClientId?.trim()) missingFields.push({ campo: 'Client ID (Nuvem Fiscal)', local: 'Configuração Fiscal → API' });
        if (!config.fiscalApiClientSecret?.trim()) missingFields.push({ campo: 'Client Secret (Nuvem Fiscal)', local: 'Configuração Fiscal → API' });

        if (missingFields.length > 0) {
            throw new BadRequestException({
                message: `Não é possível reenviar a nota fiscal. ${missingFields.length} campo(s) obrigatório(s) não preenchido(s):`,
                missingFields,
            });
        }

        // Reconstruir dados do cliente a partir dos dados da invoice
        const resolvedClient: ClientData = {
            name: invoice.recipientName || '',
            document: invoice.recipientDocument || '',
            address: invoice.recipientAddress || '',
        };

        // Tentar enriquecer com dados da proposta se ainda existir
        if (invoice.proposalId) {
            const proposal = await this.proposalRepo.findOne({
                where: { id: invoice.proposalId },
                relations: ['client'],
            });
            if (proposal?.client) {
                resolvedClient.city = proposal.client.city || '';
                resolvedClient.state = proposal.client.state || '';
                resolvedClient.zipCode = proposal.client.zipCode || '';
                resolvedClient.ibgeCode = (proposal.client as any)?.ibgeCode || '';
                resolvedClient.email = proposal.client.email || '';
            }
        }

        const invoiceItems = invoice.items || [];

        // Limpar erro anterior e marcar como processando
        invoice.status = InvoiceStatus.PROCESSING;
        invoice.errorMessage = null;
        invoice.externalResponse = null;
        await this.invoiceRepo.save(invoice);

        const nuvemConfig = this.getNuvemConfig(config);
        const cnpjLimpo = config.cnpj?.replace(/\D/g, '') || '';
        const ambiente = config.fiscalApiEnvironment === 'production' ? 'producao' : 'homologacao';
        const totalValue = Number(invoice.totalValue);

        try {
            let result: any;

            if (invoice.type === InvoiceType.NFE) {
                result = await this.emitirNfeViaNuvem(nuvemConfig, config, resolvedClient, invoiceItems, totalValue, cnpjLimpo, ambiente, invoice.id, invoice.naturezaOperacao, invoice.finalidadeNfe);
            } else {
                result = await this.emitirNfseViaNuvem(nuvemConfig, config, resolvedClient, invoiceItems, totalValue, cnpjLimpo, ambiente, invoice.id);
            }

            invoice.externalId = result.id;
            invoice.status = result.status === 'autorizado'
                ? InvoiceStatus.AUTHORIZED
                : result.status === 'rejeitado' || result.status === 'erro'
                    ? InvoiceStatus.ERROR
                    : InvoiceStatus.PROCESSING;
            invoice.externalResponse = JSON.stringify(result);

            if (result.chave_acesso) invoice.accessKey = result.chave_acesso;
            if (result.numero) invoice.invoiceNumber = String(result.numero);

            await this.invoiceRepo.save(invoice);
            this.logger.log(`NF reenviada com sucesso — ID: ${result.id}, Status: ${result.status}`);
        } catch (error) {
            invoice.status = InvoiceStatus.ERROR;
            invoice.errorMessage = error.message || JSON.stringify(error);
            await this.invoiceRepo.save(invoice);
            this.logger.error('Erro ao reenviar NF via Nuvem Fiscal:', error);
        }

        return invoice;
    }

    private async emitirNfeViaNuvem(
        nuvemConfig: NuvemFiscalConfig,
        config: FiscalConfig,
        client: ClientData,
        items: any[],
        total: number,
        cnpj: string,
        ambiente: string,
        refInterna: string,
        naturezaOperacao?: string,
        finalidadeNfe?: number,
    ) {
        const detItems = items.map((item, index) => ({
            nItem: index + 1,
            prod: {
                cProd: String(index + 1).padStart(3, '0'),
                cEAN: 'SEM GTIN',
                xProd: item.description,
                NCM: item.ncm || '85444900',
                CFOP: item.cfopInterno || '5102',
                uCom: item.unit || 'UN',
                qCom: Number(item.quantity),
                vUnCom: Number(item.unitPrice),
                vProd: Number(item.total),
                cEANTrib: 'SEM GTIN',
                uTrib: item.unit || 'UN',
                qTrib: Number(item.quantity),
                vUnTrib: Number(item.unitPrice),
                indTot: 1,
            },
            imposto: {
                ICMS: { ICMSSN102: { orig: item.origem ?? 0, CSOSN: '102' } },
                PIS: { PISNT: { CST: '07' } },
                COFINS: { COFINSNT: { CST: '07' } },
            },
        }));

        const clientDoc = client.document?.replace(/\D/g, '') || '';
        const isClientCnpj = clientDoc.length === 14;

        const nfeData = {
            ambiente: ambiente === 'producao' ? 'producao' : 'homologacao',
            referencia: `nfe-${refInterna}`,
            infNFe: {
                versao: '4.00',
                ide: {
                    cUF: 26, // TODO: derivar da UF do config
                    natOp: naturezaOperacao || 'Venda de mercadoria',
                    mod: 55,
                    serie: 1,
                    dhEmi: new Date().toISOString(),
                    tpNF: 1,
                    idDest: 1,
                    cMunFG: config.codigoMunicipio || '2611606',
                    tpImp: 1,
                    tpEmis: 1,
                    finNFe: finalidadeNfe || 1,
                    indFinal: 1,
                    indPres: 1,
                    procEmi: 0,
                    verProc: '1.0',
                },
                emit: {
                    CNPJ: cnpj,
                    xNome: config.companyName || '',
                    enderEmit: {
                        xLgr: config.companyAddress || '',
                        xBairro: 'Centro',
                        cMun: config.codigoMunicipio || '2611606',
                        xMun: config.nomeMunicipio || config.companyCity || 'Recife',
                        UF: config.companyState || 'PE',
                        CEP: (config.companyCep || '').replace(/\D/g, ''),
                        cPais: '1058',
                        xPais: 'Brasil',
                    },
                    IE: config.stateRegistration || '',
                    CRT: config.crt || 1,
                },
                dest: {
                    ...(isClientCnpj ? { CNPJ: clientDoc } : { CPF: clientDoc }),
                    xNome: client.name || 'Consumidor',
                    enderDest: {
                        xLgr: client.address || '',
                        xBairro: 'Centro',
                        cMun: client.ibgeCode || config.codigoMunicipio || '2611606',
                        xMun: client.city || config.nomeMunicipio || 'Recife',
                        UF: client.state || 'PE',
                        CEP: (client.zipCode || '').replace(/\D/g, ''),
                        cPais: '1058',
                        xPais: 'Brasil',
                    },
                    indIEDest: 9,
                },
                det: detItems,
                total: {
                    ICMSTot: {
                        vBC: 0, vICMS: 0, vICMSDeson: 0, vFCP: 0,
                        vBCST: 0, vST: 0, vFCPST: 0, vFCPSTRet: 0,
                        vProd: total, vFrete: 0, vSeg: 0, vDesc: 0,
                        vII: 0, vIPI: 0, vIPIDevol: 0, vPIS: 0,
                        vCOFINS: 0, vOutro: 0, vNF: total,
                    },
                },
                transp: { modFrete: 9 },
                pag: { detPag: [{ tPag: '01', vPag: total }] },
                infRespTec: {
                    CNPJ: cnpj,
                    xContato: 'Suporte ERP',
                    email: 'suporte@erp.com.br',
                    fone: '81999999999',
                },
            },
        };

        return this.nuvemFiscal.emitirNfe(nuvemConfig, nfeData);
    }

    private async emitirNfseViaNuvem(
        nuvemConfig: NuvemFiscalConfig,
        config: FiscalConfig,
        client: ClientData,
        items: any[],
        total: number,
        cnpj: string,
        ambiente: string,
        refInterna: string,
        nfseOptions?: {
            dCompet?: string;
            municipioPrestacao?: string;
            descricaoServico?: string;
            infoComplementares?: string;
            numPedido?: string;
            docReferencia?: string;
        },
    ) {
        const clientDoc = client.document?.replace(/\D/g, '') || '';
        const isClientCnpj = clientDoc.length === 14;
        const descricaoServicos = nfseOptions?.descricaoServico?.trim()
            || items.map(i => `${i.description} (Qtd: ${i.quantity})`).join('; ');

        const aliquotaIss = Number(config.aliquotaIss || 5);
        const vIss = total * (aliquotaIss / 100);

        // Auto-resolve IBGE code para a empresa se não configurado
        let cMun = config.codigoMunicipio || '';
        if (!cMun && config.companyCity && config.companyState) {
            const resolved = await this.resolverCodigoIBGE(config.companyCity, config.companyState);
            if (resolved) cMun = resolved;
        }
        if (!cMun) cMun = '2611606'; // fallback padrão
        const xMun = config.nomeMunicipio || config.companyCity || 'Recife';

        // Auto-resolve IBGE code para o cliente se não informado
        let clientIbge = client.ibgeCode || '';
        if (!clientIbge && client.city && client.state) {
            const resolved = await this.resolverCodigoIBGE(client.city, client.state);
            if (resolved) clientIbge = resolved;
        }

        // Calcula retenções
        const retencoes: any = {};
        let totalRetencoes = 0;

        if (config.retIss) {
            retencoes.vRetISS = vIss;
            totalRetencoes += vIss;
        }
        if (config.retIrpj) {
            const vRetIr = total * (Number(config.aliquotaIrpj || 1.5) / 100);
            retencoes.vRetIR = vRetIr;  // IRRF (Imposto de Renda Retido na Fonte)
            totalRetencoes += vRetIr;
        }
        if (config.retCsll) {
            const vRetCsll = total * (Number(config.aliquotaCsll || 1.0) / 100);
            retencoes.vRetCSLL = vRetCsll;
            totalRetencoes += vRetCsll;
        }
        if (config.retPis) {
            const vRetPis = total * (Number(config.aliquotaPis || 0.65) / 100);
            retencoes.vRetPIS = vRetPis;
            totalRetencoes += vRetPis;
        }
        if (config.retCofins) {
            const vRetCofins = total * (Number(config.aliquotaCofins || 3.0) / 100);
            retencoes.vRetCOFINS = vRetCofins;
            totalRetencoes += vRetCofins;
        }
        if (config.retInss) {
            const vRetInss = total * (Number(config.aliquotaInss || 11.0) / 100);
            retencoes.vRetINSS = vRetInss;
            totalRetencoes += vRetInss;
        }

        // ═══════════════════════════════════════════════════════════════
        // PAYLOAD NFS-e — Conforme schema Nuvem Fiscal POST /nfse/dps
        // Tipo: TNfseDpsPedidoEmissao → infDPS: TInfDPS
        // ═══════════════════════════════════════════════════════════════
        const nfseData = {
            provedor: 'padrao',
            ambiente: ambiente === 'producao' ? 'producao' : 'homologacao',
            referencia: `nfse-${refInterna}`,
            infDPS: {
                tpAmb: ambiente === 'producao' ? 1 : 2,
                dhEmi: new Date().toISOString(),
                verAplic: '1.0',
                dCompet: nfseOptions?.dCompet || new Date().toISOString().split('T')[0],

                // ── Prestador ──
                prest: {
                    ...(cnpj.length === 14 ? { CNPJ: cnpj } : { CPF: cnpj }),
                    ...(config.regEspTrib != null ? { regTrib: { regEspTrib: Number(config.regEspTrib) } } : {}),
                },

                // ── Tomador (cliente) ──
                toma: {
                    ...(isClientCnpj ? { CNPJ: clientDoc } : { CPF: clientDoc }),
                    ...(config.municipalRegistration ? { IM: config.municipalRegistration } : {}),
                    xNome: client.name || 'Consumidor',
                    end: {
                        endNac: {
                            cMun: clientIbge || cMun,
                            CEP: (client.zipCode || '').replace(/\D/g, ''),
                        },
                        xLgr: client.address || 'Não informado',
                        nro: client.number || 'S/N',
                        xBairro: client.neighborhood || 'Centro',
                        ...(client.complement ? { xCpl: client.complement } : {}),
                    },
                    ...(client.email ? { email: client.email } : {}),
                },

                // ── Serviço ──
                serv: {
                    locPrest: {
                        cLocPrestacao: nfseOptions?.municipioPrestacao || clientIbge || cMun,
                        cPaisPrestacao: '1058',  // Brasil
                    },
                    cServ: {
                        cTribNac: config.codigoTribNacional || '01.01.01',
                        ...(config.codigoServico ? { cTribMun: config.codigoServico } : {}),
                        ...(config.cnae ? { CNAE: config.cnae } : {}),
                        xDescServ: descricaoServicos,
                    },
                    ...(nfseOptions?.infoComplementares || nfseOptions?.numPedido || nfseOptions?.docReferencia ? {
                        infAdic: {
                            ...(nfseOptions?.infoComplementares ? { xInfComp: nfseOptions.infoComplementares } : {}),
                            ...(nfseOptions?.numPedido ? { xPed: nfseOptions.numPedido } : {}),
                            ...(nfseOptions?.docReferencia ? { xContato: nfseOptions.docReferencia } : {}),
                        },
                    } : {}),
                },

                // ── Valores e Tributação ──
                valores: {
                    vServPrest: {
                        vServ: total,
                    },
                    trib: {
                        tribMun: {
                            tribISSQN: 1,  // 1=Operação normal
                            cLocIncid: client.ibgeCode || cMun,
                            ...(config.retIss
                                ? { tpRetISSQN: 2 }    // 2 = ISS Retido pelo tomador
                                : { tpRetISSQN: 1 }),  // 1 = ISS não retido
                            pAliq: aliquotaIss,
                            vBC: total,
                            vISSQN: vIss,
                            vLiq: total - totalRetencoes,
                        },
                        ...(Object.keys(retencoes).length > 0 ? {
                            tribFed: {
                                ...(retencoes.vRetIR != null ? { vRetIRRF: retencoes.vRetIR } : {}),
                                ...(retencoes.vRetCSLL != null ? { vRetCSLL: retencoes.vRetCSLL } : {}),
                                ...(retencoes.vRetINSS != null ? { vRetCP: retencoes.vRetINSS } : {}),
                                ...((retencoes.vRetPIS != null || retencoes.vRetCOFINS != null) ? {
                                    piscofins: {
                                        CST: '99',
                                        vBCPisCofins: total,
                                        pAliqPis: Number(config.aliquotaPis || 0.65),
                                        pAliqCofins: Number(config.aliquotaCofins || 3.0),
                                        vPis: retencoes.vRetPIS || 0,
                                        vCofins: retencoes.vRetCOFINS || 0,
                                        tpRetPisCofins: 1,
                                    },
                                } : {}),
                            },
                        } : {}),
                    },
                },
            },
        };

        this.logger.log(`[NFS-e] Enviando payload para Nuvem Fiscal: ${JSON.stringify(nfseData, null, 2)}`);
        return this.nuvemFiscal.emitirNfse(nuvemConfig, nfseData);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONSULTA DE STATUS (Polling)
    // ═══════════════════════════════════════════════════════════════

    async checkInvoiceStatus(id: string): Promise<FiscalInvoice> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) return invoice;
        if (invoice.status === InvoiceStatus.AUTHORIZED || invoice.status === InvoiceStatus.CANCELLED) {
            return invoice; // Status final, não precisa consultar
        }

        const config = await this.getConfig();
        if (config.fiscalApiProvider !== 'nuvem_fiscal' || !config.fiscalApiClientId) return invoice;

        const nuvemConfig = this.getNuvemConfig(config);

        try {
            let result: any;
            if (invoice.type === InvoiceType.NFE) {
                result = await this.nuvemFiscal.consultarNfe(nuvemConfig, invoice.externalId);
            } else {
                result = await this.nuvemFiscal.consultarNfse(nuvemConfig, invoice.externalId);
            }

            invoice.externalResponse = JSON.stringify(result);

            if (result.status === 'autorizado') {
                invoice.status = InvoiceStatus.AUTHORIZED;
                if (result.chave_acesso) invoice.accessKey = result.chave_acesso;
                if (result.numero) invoice.invoiceNumber = String(result.numero);
            } else if (result.status === 'rejeitado' || result.status === 'erro') {
                invoice.status = InvoiceStatus.ERROR;
                invoice.errorMessage = result.motivo || result.mensagem_sefaz || 'Rejeitada pela SEFAZ/Prefeitura';
            }

            await this.invoiceRepo.save(invoice);
        } catch (error) {
            this.logger.error('Erro ao consultar status:', error);
        }

        return invoice;
    }

    // ═══════════════════════════════════════════════════════════════
    // DOWNLOAD XML / PDF
    // ═══════════════════════════════════════════════════════════════

    async downloadXml(id: string): Promise<string> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) throw new BadRequestException('Nota fiscal não emitida via API fiscal');

        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (invoice.type === InvoiceType.NFE) {
            return this.nuvemFiscal.downloadXmlNfe(nuvemConfig, invoice.externalId);
        }
        return this.nuvemFiscal.downloadXmlNfse(nuvemConfig, invoice.externalId);
    }

    async downloadPdf(id: string): Promise<Buffer> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) throw new BadRequestException('Nota fiscal não emitida via API fiscal');

        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (invoice.type === InvoiceType.NFE) {
            return this.nuvemFiscal.downloadPdfNfe(nuvemConfig, invoice.externalId);
        }
        return this.nuvemFiscal.downloadPdfNfse(nuvemConfig, invoice.externalId);
    }

    // ═══════════════════════════════════════════════════════════════
    // CANCELAMENTO
    // ═══════════════════════════════════════════════════════════════

    async cancelInvoice(id: string, reason: string): Promise<FiscalInvoice> {
        const invoice = await this.findOneInvoice(id);
        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new BadRequestException('Nota fiscal já está cancelada');
        }

        // Cancelar na Nuvem Fiscal se houver ID externo
        if (invoice.externalId) {
            const config = await this.getConfig();
            if (config.fiscalApiProvider === 'nuvem_fiscal' && config.fiscalApiClientId) {
                const nuvemConfig = this.getNuvemConfig(config);
                try {
                    if (invoice.type === InvoiceType.NFE) {
                        await this.nuvemFiscal.cancelarNfe(nuvemConfig, invoice.externalId, reason);
                    } else {
                        await this.nuvemFiscal.cancelarNfse(nuvemConfig, invoice.externalId, reason);
                    }
                } catch (error) {
                    this.logger.error('Erro ao cancelar na Nuvem Fiscal:', error);
                    throw new BadRequestException(error.message || 'Erro ao cancelar na Nuvem Fiscal');
                }
            }
        }

        invoice.status = InvoiceStatus.CANCELLED;
        invoice.cancelledAt = new Date();
        invoice.cancellationReason = reason;
        return this.invoiceRepo.save(invoice);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTAR CONEXÃO
    // ═══════════════════════════════════════════════════════════════

    async testConnection(): Promise<any> {
        const config = await this.getConfig();

        if (!config.fiscalApiClientId || !config.fiscalApiClientSecret) {
            return {
                success: false,
                message: 'Client ID e Client Secret não configurados. Configure as credenciais da Nuvem Fiscal primeiro.',
                environment: config.fiscalApiEnvironment,
            };
        }

        try {
            const nuvemConfig = this.getNuvemConfig(config);

            // Tenta obter token para validar credenciais
            await this.nuvemFiscal.getToken(nuvemConfig);

            // Busca cotas
            const cotas = await this.nuvemFiscal.consultarCotas(nuvemConfig);

            return {
                success: true,
                message: 'Conexão com Nuvem Fiscal estabelecida com sucesso!',
                environment: config.fiscalApiEnvironment,
                cotas: cotas?.data || cotas,
            };
        } catch (error: any) {
            this.logger.error('Falha no teste de conexão com Nuvem Fiscal:', error?.message);
            return {
                success: false,
                message: error?.response?.data?.message
                    || error?.message
                    || 'Falha ao conectar com a Nuvem Fiscal. Verifique Client ID, Client Secret e ambiente.',
                environment: config.fiscalApiEnvironment,
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EDIÇÃO DE VALOR (com auditoria)
    // ═══════════════════════════════════════════════════════════════

    async updateInvoiceValue(
        id: string,
        newValue: number,
        userId: string,
        userName: string,
        reason: string,
    ): Promise<FiscalInvoice> {
        const invoice = await this.findOneInvoice(id);

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new BadRequestException(
                'Só é possível alterar o valor de notas em rascunho (Draft)',
            );
        }

        if (!newValue || newValue <= 0) {
            throw new BadRequestException('O novo valor deve ser maior que zero');
        }

        if (!reason || !reason.trim()) {
            throw new BadRequestException('É obrigatório informar o motivo da alteração');
        }

        const previousValue = Number(invoice.totalValue);

        // Registrar no histórico inline da invoice
        const editEntry = {
            userId,
            userName,
            from: previousValue,
            to: newValue,
            at: new Date().toISOString(),
            reason: reason.trim(),
        };

        if (!invoice.editHistory) invoice.editHistory = [];
        invoice.editHistory.push(editEntry);

        // Atualizar valor
        invoice.totalValue = newValue;
        invoice.customValue = newValue;
        invoice.editedBy = userId;

        await this.invoiceRepo.save(invoice);

        // Registrar na tabela de auditoria permanente
        const auditRecord = this.valueEditRepo.create({
            invoiceId: id,
            userId,
            userName,
            previousValue,
            newValue,
            reason: reason.trim(),
        });
        await this.valueEditRepo.save(auditRecord);

        this.logger.log(
            `Valor da NF ${id} alterado: R$ ${previousValue.toFixed(2)} → R$ ${newValue.toFixed(2)} por ${userName} (${reason})`,
        );

        return invoice;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMO DE FATURAMENTO DA PROPOSTA
    // ═══════════════════════════════════════════════════════════════

    async getProposalInvoiceSummary(proposalId: string): Promise<any> {
        const proposal = await this.proposalRepo.findOne({
            where: { id: proposalId },
            relations: ['items'],
        });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');

        const invoices = await this.invoiceRepo.find({
            where: { proposalId },
        });

        const activeInvoices = invoices.filter(
            (inv) => inv.status !== InvoiceStatus.CANCELLED,
        );

        const materialItems = proposal.items.filter(
            (item) => item.serviceType === 'material',
        );
        const serviceItems = proposal.items.filter(
            (item) => item.serviceType === 'service' || item.serviceType === 'servico',
        );

        const materialTotal = materialItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );
        const serviceTotal = serviceItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );

        const nfeInvoiced = activeInvoices
            .filter((inv) => inv.type === InvoiceType.NFE)
            .reduce((sum, inv) => sum + Number(inv.totalValue || 0), 0);
        const nfseInvoiced = activeInvoices
            .filter((inv) => inv.type === InvoiceType.NFSE)
            .reduce((sum, inv) => sum + Number(inv.totalValue || 0), 0);

        return {
            proposalId,
            proposalTotal: materialTotal + serviceTotal,
            material: {
                total: materialTotal,
                invoiced: nfeInvoiced,
                remaining: materialTotal - nfeInvoiced,
                count: activeInvoices.filter((inv) => inv.type === InvoiceType.NFE).length,
            },
            service: {
                total: serviceTotal,
                invoiced: nfseInvoiced,
                remaining: serviceTotal - nfseInvoiced,
                count: activeInvoices.filter((inv) => inv.type === InvoiceType.NFSE).length,
            },
            invoices: activeInvoices.map((inv) => ({
                id: inv.id,
                type: inv.type,
                status: inv.status,
                totalValue: Number(inv.totalValue),
                installmentNumber: inv.installmentNumber,
                installmentTotal: inv.installmentTotal,
                createdAt: inv.createdAt,
            })),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HISTÓRICO DE EDIÇÕES DE VALOR
    // ═══════════════════════════════════════════════════════════════

    async getInvoiceEditHistory(id: string): Promise<InvoiceValueEdit[]> {
        return this.valueEditRepo.find({
            where: { invoiceId: id },
            order: { createdAt: 'DESC' },
        });
    }
}
