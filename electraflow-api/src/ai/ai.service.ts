import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { AiActionToken } from './ai-action-token.entity';
import OpenAI from 'openai';

import { CatalogItem } from '../catalog/catalog.entity';
import { Supplier } from '../supply/supply.entity';
import { StructureTemplate } from '../structure-templates/structure-template.entity';
import { MarkupConfig } from '../markup/markup.entity';
import { Document } from '../documents/document.entity';

// ═══════════════════════════════════════════════════════════════
// TOOLS DE CONSULTA (liberadas para todos)
// ═══════════════════════════════════════════════════════════════

const READ_TOOLS: any[] = [
    {
        type: 'function',
        function: {
            name: 'buscar_contratos',
            description: 'Busca contratos no sistema pelo título, nome do cliente, número ou status.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no título, número ou cliente' },
                    status: { type: 'string', enum: ['draft', 'active', 'completed', 'cancelled', 'suspended', 'expired'] },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_propostas',
            description: 'Busca propostas comerciais no sistema. Retorna valores, status, itens e condições.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no título, número ou cliente' },
                    status: { type: 'string', enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'] },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_obras',
            description: 'Busca obras/projetos no sistema.',
            parameters: {
                type: 'object',
                properties: { busca: { type: 'string', description: 'Título ou cliente' } },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_clientes',
            description: 'Busca clientes cadastrados por nome, CNPJ/CPF ou email.',
            parameters: {
                type: 'object',
                properties: { busca: { type: 'string', description: 'Nome, CNPJ, CPF ou email' } },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_produtos',
            description: 'Busca produtos/materiais/serviços no catálogo.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Nome, SKU ou código' },
                    tipo: { type: 'string', enum: ['material', 'service'] },
                },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'resumo_financeiro',
            description: 'Retorna resumo financeiro geral do sistema.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_documentos',
            description: 'Busca documentos/arquivos enviados ao sistema por nome, tipo, pasta, tags ou finalidade. Retorna metadados dos documentos encontrados.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no nome, descrição, tags ou organização origem' },
                    tipo: { type: 'string', enum: ['project', 'report', 'art', 'memorial', 'photo', 'contract', 'invoice', 'certificate', 'protocol', 'norm', 'pop', 'supplier_catalog', 'other'], description: 'Tipo de documento' },
                    finalidade: { type: 'string', enum: ['norma_tecnica', 'pop', 'catalogo_fornecedor', 'manual', 'projeto_tipo', 'tabela_preco', 'book_estruturas', 'documentacao_obra', 'other'], description: 'Finalidade do documento' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'ler_documento',
            description: 'Lê o conteúdo textual extraído de um documento específico. Use buscar_documentos primeiro para encontrar o documento, depois use esta ferramenta com o nome exato para ler o conteúdo.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Nome exato ou parte do nome do documento para ler' },
                },
                required: ['busca'],
            },
        },
    },
];

// ═══════════════════════════════════════════════════════════════
// TOOLS DE AÇÃO (requerem autorização)
// ═══════════════════════════════════════════════════════════════

const ACTION_TOOLS: any[] = [
    {
        type: 'function',
        function: {
            name: 'criar_proposta',
            description: 'Cria uma proposta comercial rascunho no sistema. Necessita do nome do cliente e título. Os itens podem ser adicionados opcionalmente.',
            parameters: {
                type: 'object',
                properties: {
                    clienteNome: { type: 'string', description: 'Nome do cliente (será buscado no sistema)' },
                    titulo: { type: 'string', description: 'Título da proposta' },
                    escopo: { type: 'string', description: 'Escopo do serviço' },
                    prazo: { type: 'string', description: 'Prazo de execução' },
                    condicoesPagamento: { type: 'string', description: 'Condições de pagamento' },
                    itens: {
                        type: 'array',
                        description: 'Itens da proposta',
                        items: {
                            type: 'object',
                            properties: {
                                descricao: { type: 'string' },
                                quantidade: { type: 'number' },
                                unidade: { type: 'string' },
                                precoUnitario: { type: 'number' },
                            },
                            required: ['descricao', 'quantidade', 'precoUnitario'],
                        },
                    },
                },
                required: ['clienteNome', 'titulo'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'criar_cliente',
            description: 'Cadastra um novo cliente no sistema.',
            parameters: {
                type: 'object',
                properties: {
                    nome: { type: 'string', description: 'Nome ou razão social' },
                    documento: { type: 'string', description: 'CPF ou CNPJ' },
                    tipo: { type: 'string', enum: ['pf', 'pj'], description: 'Tipo: pf (pessoa física) ou pj (pessoa jurídica)' },
                    email: { type: 'string' },
                    telefone: { type: 'string' },
                    endereco: { type: 'string' },
                    cidade: { type: 'string' },
                    estado: { type: 'string' },
                },
                required: ['nome'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'criar_obra',
            description: 'Cria uma nova obra/projeto no sistema.',
            parameters: {
                type: 'object',
                properties: {
                    titulo: { type: 'string', description: 'Título da obra' },
                    clienteNome: { type: 'string', description: 'Nome do cliente' },
                    tipo: { type: 'string', enum: ['installation', 'maintenance', 'expansion', 'consulting'], description: 'Tipo da obra' },
                    endereco: { type: 'string' },
                    cidade: { type: 'string' },
                    estado: { type: 'string' },
                    valorEstimado: { type: 'number' },
                },
                required: ['titulo'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'atualizar_status_contrato',
            description: 'Atualiza o status de um contrato existente.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Título ou número do contrato para identificá-lo' },
                    novoStatus: { type: 'string', enum: ['draft', 'active', 'completed', 'cancelled', 'suspended'], description: 'Novo status' },
                },
                required: ['busca', 'novoStatus'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'cadastrar_produto',
            description: 'Cadastra um novo produto/material/serviço no catálogo.',
            parameters: {
                type: 'object',
                properties: {
                    nome: { type: 'string', description: 'Nome do produto' },
                    tipo: { type: 'string', enum: ['material', 'service'], description: 'material ou service' },
                    unidade: { type: 'string', description: 'Unidade: UN, M, KG, KIT, etc.' },
                    precoVenda: { type: 'number', description: 'Preço de venda' },
                    precoCusto: { type: 'number', description: 'Preço de custo' },
                    sku: { type: 'string', description: 'SKU do produto' },
                    codigoExterno: { type: 'string', description: 'Código externo' },
                },
                required: ['nome', 'tipo', 'unidade'],
            },
        },
    },
];

// Nomes das tools de ação para verificação rápida
const ACTION_TOOL_NAMES = new Set(ACTION_TOOLS.map((t: any) => t.function.name));

@Injectable()
export class AiService implements OnModuleInit {
    private readonly logger = new Logger(AiService.name);

    constructor(
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
        @InjectRepository(AiActionToken)
        private actionTokenRepo: Repository<AiActionToken>,
        @InjectRepository(CatalogItem)
        private catalogRepo: Repository<CatalogItem>,
        @InjectRepository(Supplier)
        private supplierRepo: Repository<Supplier>,
        @InjectRepository(StructureTemplate)
        private structureRepo: Repository<StructureTemplate>,
        @InjectRepository(MarkupConfig)
        private markupRepo: Repository<MarkupConfig>,
        @InjectRepository(Document)
        private documentRepo: Repository<Document>,
        private dataSource: DataSource,
    ) { }

    async onModuleInit() {
        // ═══ Create tables if they don't exist (synchronize: false) ═══
        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS system_configs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    key VARCHAR UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    "isSecret" BOOLEAN DEFAULT false,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.log('Table system_configs ensured');
        } catch (err) {
            this.logger.warn('Could not create system_configs: ' + err?.message);
        }

        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS ai_action_tokens (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "createdById" UUID NOT NULL,
                    "targetUserId" UUID,
                    "expiresAt" TIMESTAMP NOT NULL,
                    "isActive" BOOLEAN DEFAULT true,
                    description VARCHAR,
                    "createdAt" TIMESTAMP DEFAULT NOW()
                )
            `);
            this.logger.log('Table ai_action_tokens ensured');
        } catch (err) {
            this.logger.warn('Could not create ai_action_tokens: ' + err?.message);
        }

        // ═══ Ensure document AI columns exist ═══
        const docColumns = [
            { col: 'purpose', type: 'VARCHAR DEFAULT NULL' },
            { col: 'tags', type: 'TEXT DEFAULT NULL' },
            { col: 'extractedText', type: 'TEXT DEFAULT NULL' },
            { col: 'textExtracted', type: 'BOOLEAN DEFAULT false' },
            { col: 'sourceOrganization', type: 'VARCHAR DEFAULT NULL' },
        ];
        for (const { col, type } of docColumns) {
            try {
                await this.dataSource.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
            } catch (err) {
                this.logger.warn(`Could not add ${col} on documents: ${err?.message}`);
            }
        }
        this.logger.log('AI module migration completed');
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════

    async getConfig(key: string): Promise<string | null> {
        const config = await this.configRepo.findOne({ where: { key } });
        return config?.value || null;
    }

    async setConfig(key: string, value: string, isSecret = false) {
        let config = await this.configRepo.findOne({ where: { key } });
        if (config) {
            config.value = value;
            config.isSecret = isSecret;
        } else {
            config = this.configRepo.create({ key, value, isSecret });
        }
        return this.configRepo.save(config);
    }

    async getAllConfigs() {
        const configs = await this.configRepo.find();
        return configs.map(c => ({
            ...c,
            value: c.isSecret ? c.value.replace(/.(?=.{4})/g, '*') : c.value,
        }));
    }

    // ═══════════════════════════════════════════════════════════════
    // TOKENS DE AÇÃO
    // ═══════════════════════════════════════════════════════════════

    async getActiveActionTokens() {
        return this.actionTokenRepo.find({
            where: { isActive: true, expiresAt: MoreThan(new Date()) },
            relations: ['createdBy', 'targetUser'],
            order: { createdAt: 'DESC' },
        });
    }

    async createActionToken(createdById: string, targetUserId: string | null, durationMinutes: number, description?: string) {
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        const token = this.actionTokenRepo.create({
            createdById,
            targetUserId,
            expiresAt,
            isActive: true,
            description: description || (targetUserId ? 'Liberação individual' : 'Liberação para todos'),
        });
        return this.actionTokenRepo.save(token);
    }

    async revokeActionToken(id: string) {
        await this.actionTokenRepo.update(id, { isActive: false });
        return { success: true };
    }

    private async hasActionPermission(userId: string, userRole: string): Promise<boolean> {
        // Admin sempre tem acesso
        if (userRole === 'admin') return true;

        // Verificar se existe token válido (para o user específico OU para todos)
        const token = await this.actionTokenRepo.findOne({
            where: [
                { targetUserId: userId, isActive: true, expiresAt: MoreThan(new Date()) },
                { targetUserId: null as any, isActive: true, expiresAt: MoreThan(new Date()) },
            ],
        });

        return !!token;
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAT — Assistente com Function Calling + Autorização
    // ═══════════════════════════════════════════════════════════════

    async chat(message: string, history: { role: string; content: string }[] = [], userId?: string, userRole?: string) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada. Vá em Configurações → IA.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';
        const enabled = await this.getConfig('ai_enabled');
        if (enabled === 'false') throw new BadRequestException('IA está desabilitada nas configurações.');

        try {
            // Verificar se o user tem permissão para ações
            const canPerformActions = userId && userRole
                ? await this.hasActionPermission(userId, userRole)
                : false;

            let systemContext: string;
            try {
                systemContext = await this.buildSystemContext(canPerformActions);
            } catch (ctxErr: any) {
                console.warn('⚠️ Erro ao construir contexto da IA:', ctxErr?.message);
                systemContext = 'Você é o assistente de IA do sistema ERP Exito System. Responda em português brasileiro.';
            }

            const openai = new OpenAI({ apiKey });

            // Montar tools disponíveis baseado na permissão
            const availableTools = canPerformActions
                ? [...READ_TOOLS, ...ACTION_TOOLS]
                : [...READ_TOOLS];

            const messages: any[] = [
                { role: 'system', content: systemContext },
                ...history.map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message },
            ];

            // Loop de function calling (máx 8 iterações)
            let totalUsage: any = null;
            for (let iteration = 0; iteration < 8; iteration++) {
                const response = await openai.chat.completions.create({
                    model,
                    messages,
                    tools: availableTools,
                    tool_choice: 'auto',
                    temperature: 0.7,
                    max_tokens: 3000,
                } as any);

                totalUsage = response.usage;
                const choice = response.choices[0];
                const msg = choice.message as any;

                if (choice.finish_reason === 'tool_calls' && msg.tool_calls) {
                    messages.push(msg);

                    for (const toolCall of msg.tool_calls) {
                        const fnName = toolCall.function?.name || toolCall.name;
                        const fnArgs = toolCall.function?.arguments || '{}';
                        console.log(`🔧 AI tool: ${fnName}(${fnArgs.substring(0, 100)})`);

                        let result: string;

                        // Verificar autorização para tools de ação
                        if (ACTION_TOOL_NAMES.has(fnName) && !canPerformActions) {
                            result = JSON.stringify({
                                erro: 'Ações da IA não estão liberadas. O administrador precisa liberar as ações na configuração da IA.',
                                solucao: 'Peça ao administrador para criar um token de liberação em Configurações → IA → Liberar Ações.',
                            });
                        } else {
                            try {
                                const args = JSON.parse(fnArgs);
                                result = await this.executeTool(fnName, args, userId);
                            } catch (err: any) {
                                result = JSON.stringify({ error: err?.message || 'Erro ao executar' });
                            }
                        }

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: result,
                        });
                    }
                    continue;
                }

                return {
                    message: msg?.content || 'Sem resposta.',
                    usage: totalUsage,
                };
            }

            return { message: 'Não consegui processar. Tente reformular.', usage: totalUsage };

        } catch (error: any) {
            console.error('❌ AI chat error:', error?.message, error?.status, error?.code);
            if (error?.status === 401 || error?.code === 'invalid_api_key') {
                throw new BadRequestException('Chave de API inválida.');
            }
            if (error?.status === 429) {
                throw new BadRequestException('Limite de requisições atingido. Aguarde.');
            }
            if (error?.code === 'insufficient_quota') {
                throw new BadRequestException('Sem créditos na conta OpenAI.');
            }
            throw new BadRequestException(`Erro na IA: ${error?.message || 'Erro desconhecido'}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXECUTOR DE FERRAMENTAS
    // ═══════════════════════════════════════════════════════════════

    private async executeTool(name: string, args: any, userId?: string): Promise<string> {
        switch (name) {
            // Consultas
            case 'buscar_contratos': return this.toolBuscarContratos(args);
            case 'buscar_propostas': return this.toolBuscarPropostas(args);
            case 'buscar_obras': return this.toolBuscarObras(args);
            case 'buscar_clientes': return this.toolBuscarClientes(args);
            case 'buscar_produtos': return this.toolBuscarProdutos(args);
            case 'resumo_financeiro': return this.toolResumoFinanceiro();
            case 'buscar_documentos': return this.toolBuscarDocumentos(args);
            case 'ler_documento': return this.toolLerDocumento(args);
            // Ações
            case 'criar_proposta': return this.toolCriarProposta(args, userId);
            case 'criar_cliente': return this.toolCriarCliente(args);
            case 'criar_obra': return this.toolCriarObra(args, userId);
            case 'atualizar_status_contrato': return this.toolAtualizarStatusContrato(args);
            case 'cadastrar_produto': return this.toolCadastrarProduto(args);
            default: return JSON.stringify({ error: `Ferramenta "${name}" não encontrada` });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOLS DE CONSULTA
    // ═══════════════════════════════════════════════════════════════

    private async toolBuscarContratos(args: { busca?: string; status?: string }): Promise<string> {
        let query = this.dataSource.createQueryBuilder()
            .select([
                'c.id', 'c."contractNumber"', 'c.title', 'c.status', 'c.type',
                'c."originalValue"', 'c."addendumValue"', 'c."finalValue"',
                'c."startDate"', 'c."endDate"',
                'cl.name AS "clientName"', 'cl.document AS "clientDocument"',
            ])
            .from('contracts', 'c')
            .leftJoin('clients', 'cl', 'cl.id = c."clientId"')
            .where('c."deletedAt" IS NULL');

        if (args.busca) {
            query = query.andWhere(
                '(c.title ILIKE :q OR c."contractNumber" ILIKE :q OR cl.name ILIKE :q)',
                { q: `%${args.busca}%` },
            );
        }
        if (args.status) {
            query = query.andWhere('c.status = :status', { status: args.status });
        }

        const rows = await query.orderBy('c."createdAt"', 'DESC').limit(10).getRawMany();
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum contrato encontrado' });

        return JSON.stringify({
            total: rows.length,
            contratos: rows.map(r => ({
                numero: r.contractNumber, titulo: r.title, status: r.status, tipo: r.type,
                valorOriginal: Number(r.originalValue), valorAditivos: Number(r.addendumValue),
                valorFinal: Number(r.finalValue), inicio: r.startDate, fim: r.endDate,
                cliente: r.clientName, documentoCliente: r.clientDocument,
            })),
        });
    }

    private async toolBuscarPropostas(args: { busca?: string; status?: string }): Promise<string> {
        let query = this.dataSource.createQueryBuilder()
            .select([
                'p.id', 'p."proposalNumber"', 'p.title', 'p.status',
                'p.subtotal', 'p.discount', 'p.total',
                'p."validUntil"', 'p.scope', 'p.deadline', 'p."paymentConditions"',
                'cl.name AS "clientName"',
            ])
            .from('proposals', 'p')
            .leftJoin('clients', 'cl', 'cl.id = p."clientId"')
            .where('p."deletedAt" IS NULL');

        if (args.busca) {
            query = query.andWhere(
                '(p.title ILIKE :q OR p."proposalNumber" ILIKE :q OR cl.name ILIKE :q)',
                { q: `%${args.busca}%` },
            );
        }
        if (args.status) {
            query = query.andWhere('p.status = :status', { status: args.status });
        }

        const rows = await query.orderBy('p."createdAt"', 'DESC').limit(10).getRawMany();
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhuma proposta encontrada' });

        // Buscar itens
        const ids = rows.map(r => r.id);
        let items: any[] = [];
        if (ids.length > 0) {
            try {
                items = await this.dataSource.query(
                    `SELECT pi."proposalId", pi.description, pi.quantity, pi.unit, pi."unitPrice", pi."totalPrice"
                     FROM proposal_items pi WHERE pi."proposalId" = ANY($1) ORDER BY pi."sortOrder"`,
                    [ids],
                );
            } catch { items = []; }
        }

        const byProp: Record<string, any[]> = {};
        items.forEach(i => {
            if (!byProp[i.proposalId]) byProp[i.proposalId] = [];
            byProp[i.proposalId].push({
                descricao: i.description, quantidade: Number(i.quantity),
                unidade: i.unit, precoUnitario: Number(i.unitPrice), precoTotal: Number(i.totalPrice),
            });
        });

        return JSON.stringify({
            total: rows.length,
            propostas: rows.map(r => ({
                numero: r.proposalNumber, titulo: r.title, status: r.status,
                subtotal: Number(r.subtotal), desconto: Number(r.discount), total: Number(r.total),
                validadeAte: r.validUntil, escopo: r.scope, prazo: r.deadline,
                condicoesPagamento: r.paymentConditions, cliente: r.clientName,
                itens: byProp[r.id] || [],
            })),
        });
    }

    private async toolBuscarObras(args: { busca: string }): Promise<string> {
        const rows = await this.dataSource.query(
            `SELECT w.id, w.title, w.status, w."workType", w."estimatedValue",
                    w."startDate", w."endDate", w.address, w.city, w.state,
                    cl.name AS "clientName"
             FROM works w LEFT JOIN clients cl ON cl.id = w."clientId"
             WHERE w."deletedAt" IS NULL AND (w.title ILIKE $1 OR cl.name ILIKE $1)
             ORDER BY w."createdAt" DESC LIMIT 10`,
            [`%${args.busca}%`],
        );
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhuma obra encontrada' });
        return JSON.stringify({
            total: rows.length,
            obras: rows.map((r: any) => ({
                titulo: r.title, status: r.status, tipo: r.workType,
                valorEstimado: Number(r.estimatedValue || 0), inicio: r.startDate, fim: r.endDate,
                endereco: [r.address, r.city, r.state].filter(Boolean).join(', '), cliente: r.clientName,
            })),
        });
    }

    private async toolBuscarClientes(args: { busca: string }): Promise<string> {
        const rows = await this.dataSource.query(
            `SELECT c.id, c.name, c.document, c.email, c.phone, c.type, c.address, c.city, c.state
             FROM clients c WHERE c."deletedAt" IS NULL
               AND (c.name ILIKE $1 OR c.document ILIKE $1 OR c.email ILIKE $1)
             ORDER BY c.name ASC LIMIT 10`,
            [`%${args.busca}%`],
        );
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum cliente encontrado' });
        return JSON.stringify({
            total: rows.length,
            clientes: rows.map((r: any) => ({
                nome: r.name, documento: r.document, email: r.email,
                telefone: r.phone, tipo: r.type,
                endereco: [r.address, r.city, r.state].filter(Boolean).join(', '),
            })),
        });
    }

    private async toolBuscarProdutos(args: { busca: string; tipo?: string }): Promise<string> {
        let q = `SELECT ci.id, ci.name, ci.sku, ci."externalCode", ci.unit, ci.type,
                        ci."unitPrice", ci."costPrice", ci."currentStock", cc.name AS "categoryName"
                 FROM catalog_items ci LEFT JOIN catalog_categories cc ON cc.id = ci."categoryId"
                 WHERE ci."deletedAt" IS NULL AND (ci.name ILIKE $1 OR ci.sku ILIKE $1 OR ci."externalCode" ILIKE $1)`;
        const params: any[] = [`%${args.busca}%`];
        if (args.tipo) { q += ` AND ci.type = $2`; params.push(args.tipo); }
        q += ` ORDER BY ci.name ASC LIMIT 15`;
        const rows = await this.dataSource.query(q, params);
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum produto encontrado' });
        return JSON.stringify({
            total: rows.length,
            produtos: rows.map((r: any) => ({
                nome: r.name, sku: r.sku, codigoExterno: r.externalCode, unidade: r.unit, tipo: r.type,
                precoVenda: Number(r.unitPrice || 0), precoCusto: Number(r.costPrice || 0),
                estoque: Number(r.currentStock || 0), categoria: r.categoryName,
            })),
        });
    }

    private async toolResumoFinanceiro(): Promise<string> {
        const [cs] = await this.dataSource.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='active') as ativos,
                    COALESCE(SUM("finalValue") FILTER (WHERE status='active'),0) as "vAtivos",
                    COALESCE(SUM("finalValue"),0) as "vTotal"
             FROM contracts WHERE "deletedAt" IS NULL`,
        );
        const [ps] = await this.dataSource.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='accepted') as aceitas,
                    COUNT(*) FILTER (WHERE status='draft') as rascunhos, COUNT(*) FILTER (WHERE status='sent') as enviadas,
                    COALESCE(SUM(total) FILTER (WHERE status='accepted'),0) as "vAceitas",
                    COALESCE(SUM(total),0) as "vTotal"
             FROM proposals WHERE "deletedAt" IS NULL`,
        );
        const [ws] = await this.dataSource.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='in_progress') as andamento,
                    COUNT(*) FILTER (WHERE status='completed') as concluidas,
                    COALESCE(SUM("estimatedValue"),0) as "vEstimado"
             FROM works WHERE "deletedAt" IS NULL`,
        );
        const [cls] = await this.dataSource.query(`SELECT COUNT(*) as total FROM clients WHERE "deletedAt" IS NULL`);
        const [cat] = await this.dataSource.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE type='material') as mat, COUNT(*) FILTER (WHERE type='service') as svc
             FROM catalog_items WHERE "deletedAt" IS NULL`,
        );
        return JSON.stringify({
            contratos: { total: +cs.total, ativos: +cs.ativos, valorAtivos: +cs.vAtivos, valorTotal: +cs.vTotal },
            propostas: { total: +ps.total, aceitas: +ps.aceitas, rascunhos: +ps.rascunhos, enviadas: +ps.enviadas, valorAceitas: +ps.vAceitas, valorTotal: +ps.vTotal },
            obras: { total: +ws.total, emAndamento: +ws.andamento, concluidas: +ws.concluidas, valorEstimado: +ws.vEstimado },
            clientes: { total: +cls.total },
            catalogo: { total: +cat.total, materiais: +cat.mat, servicos: +cat.svc },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOLS DE AÇÃO
    // ═══════════════════════════════════════════════════════════════

    private async toolCriarProposta(args: any, userId?: string): Promise<string> {
        // Buscar cliente
        const clients = await this.dataSource.query(
            `SELECT id, name FROM clients WHERE "deletedAt" IS NULL AND name ILIKE $1 LIMIT 1`,
            [`%${args.clienteNome}%`],
        );
        if (clients.length === 0) {
            return JSON.stringify({ erro: `Cliente "${args.clienteNome}" não encontrado. Cadastre primeiro.` });
        }
        const clientId = clients[0].id;

        // Gerar número da proposta
        const [{ max }] = await this.dataSource.query(
            `SELECT COALESCE(MAX(CAST(REGEXP_REPLACE("proposalNumber", '[^0-9]', '', 'g') AS INTEGER)), 0) as max FROM proposals`,
        );
        const proposalNumber = `PROP-${String(max + 1).padStart(4, '0')}`;

        // Calcular totais
        const itens = args.itens || [];
        const subtotal = itens.reduce((s: number, i: any) => s + (i.quantidade * i.precoUnitario), 0);

        // Inserir proposta
        const [proposal] = await this.dataSource.query(
            `INSERT INTO proposals ("proposalNumber", title, "clientId", status, subtotal, discount, total, scope, deadline, "paymentConditions", "createdById")
             VALUES ($1, $2, $3, 'draft', $4, 0, $4, $5, $6, $7, $8) RETURNING id, "proposalNumber"`,
            [proposalNumber, args.titulo, clientId, subtotal, args.escopo || null, args.prazo || null, args.condicoesPagamento || null, userId || null],
        );

        // Inserir itens
        for (let idx = 0; idx < itens.length; idx++) {
            const item = itens[idx];
            await this.dataSource.query(
                `INSERT INTO proposal_items ("proposalId", description, quantity, unit, "unitPrice", "totalPrice", "sortOrder")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [proposal.id, item.descricao, item.quantidade, item.unidade || 'UN', item.precoUnitario, item.quantidade * item.precoUnitario, idx],
            );
        }

        return JSON.stringify({
            sucesso: true,
            mensagem: `Proposta ${proposalNumber} criada com sucesso!`,
            numero: proposalNumber,
            cliente: clients[0].name,
            total: subtotal,
            itensAdicionados: itens.length,
            status: 'rascunho',
        });
    }

    private async toolCriarCliente(args: any): Promise<string> {
        // Verificar duplicata
        if (args.documento) {
            const existing = await this.dataSource.query(
                `SELECT id, name FROM clients WHERE document = $1 AND "deletedAt" IS NULL LIMIT 1`,
                [args.documento],
            );
            if (existing.length > 0) {
                return JSON.stringify({ erro: `Já existe um cliente com este documento: ${existing[0].name}` });
            }
        }

        const [client] = await this.dataSource.query(
            `INSERT INTO clients (name, document, type, email, phone, address, city, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name`,
            [args.nome, args.documento || null, args.tipo || 'pj', args.email || null, args.telefone || null, args.endereco || null, args.cidade || null, args.estado || null],
        );

        return JSON.stringify({ sucesso: true, mensagem: `Cliente "${client.name}" cadastrado com sucesso!`, id: client.id });
    }

    private async toolCriarObra(args: any, userId?: string): Promise<string> {
        let clientId = null;
        if (args.clienteNome) {
            const clients = await this.dataSource.query(
                `SELECT id FROM clients WHERE "deletedAt" IS NULL AND name ILIKE $1 LIMIT 1`,
                [`%${args.clienteNome}%`],
            );
            if (clients.length > 0) clientId = clients[0].id;
        }

        // Gerar título de obra com número
        const [{ cnt }] = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM works`);
        const workNumber = `OBR-${String(Number(cnt) + 1).padStart(4, '0')}`;

        const [work] = await this.dataSource.query(
            `INSERT INTO works (title, "workNumber", "clientId", "workType", status, address, city, state, "estimatedValue", "createdById")
             VALUES ($1, $2, $3, $4, 'planning', $5, $6, $7, $8, $9) RETURNING id, title`,
            [args.titulo, workNumber, clientId, args.tipo || 'installation', args.endereco || null, args.cidade || null, args.estado || null, args.valorEstimado || 0, userId || null],
        );

        return JSON.stringify({ sucesso: true, mensagem: `Obra "${work.title}" criada! Número: ${workNumber}`, id: work.id });
    }

    private async toolAtualizarStatusContrato(args: { busca: string; novoStatus: string }): Promise<string> {
        const contracts = await this.dataSource.query(
            `SELECT id, title, status, "contractNumber" FROM contracts
             WHERE "deletedAt" IS NULL AND (title ILIKE $1 OR "contractNumber" ILIKE $1) LIMIT 1`,
            [`%${args.busca}%`],
        );
        if (contracts.length === 0) {
            return JSON.stringify({ erro: `Contrato "${args.busca}" não encontrado.` });
        }

        const contract = contracts[0];
        await this.dataSource.query(
            `UPDATE contracts SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
            [args.novoStatus, contract.id],
        );

        return JSON.stringify({
            sucesso: true,
            mensagem: `Contrato "${contract.title}" (${contract.contractNumber}) atualizado de "${contract.status}" para "${args.novoStatus}".`,
        });
    }

    private async toolCadastrarProduto(args: any): Promise<string> {
        const [item] = await this.dataSource.query(
            `INSERT INTO catalog_items (name, type, unit, "unitPrice", "costPrice", sku, "externalCode", "isActive")
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, name`,
            [args.nome, args.tipo, args.unidade, args.precoVenda || 0, args.precoCusto || 0, args.sku || null, args.codigoExterno || null],
        );

        return JSON.stringify({ sucesso: true, mensagem: `Produto "${item.name}" cadastrado no catálogo!`, id: item.id });
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOLS DE DOCUMENTOS
    // ═══════════════════════════════════════════════════════════════

    private async toolBuscarDocumentos(args: { busca?: string; tipo?: string; finalidade?: string }): Promise<string> {
        let q = `SELECT d.id, d.name, d."fileName", d.type, d.purpose, d.size, d."mimeType",
                        d."textExtracted", d.tags, d."sourceOrganization", d.description,
                        d."createdAt", df.name AS "folderName"
                 FROM documents d LEFT JOIN document_folders df ON df.id = d."folderId"
                 WHERE d."deletedAt" IS NULL`;
        const params: any[] = [];
        let paramIdx = 1;

        if (args.busca) {
            q += ` AND (d.name ILIKE $${paramIdx} OR d."fileName" ILIKE $${paramIdx} OR d.description ILIKE $${paramIdx}
                   OR d."sourceOrganization" ILIKE $${paramIdx} OR CAST(d.tags AS TEXT) ILIKE $${paramIdx})`;
            params.push(`%${args.busca}%`);
            paramIdx++;
        }
        if (args.tipo) {
            q += ` AND d.type = $${paramIdx}`;
            params.push(args.tipo);
            paramIdx++;
        }
        if (args.finalidade) {
            q += ` AND d.purpose = $${paramIdx}`;
            params.push(args.finalidade);
            paramIdx++;
        }
        q += ` ORDER BY d."createdAt" DESC LIMIT 20`;

        const rows = await this.dataSource.query(q, params);
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum documento encontrado' });

        return JSON.stringify({
            total: rows.length,
            documentos: rows.map((r: any) => ({
                nome: r.name,
                arquivo: r.fileName,
                tipo: r.type,
                finalidade: r.purpose,
                tamanho: r.size ? `${(r.size / 1024).toFixed(1)} KB` : null,
                pasta: r.folderName,
                tags: r.tags,
                origem: r.sourceOrganization,
                descricao: r.description,
                textoExtraido: r.textExtracted ? 'sim' : 'não',
                data: r.createdAt,
            })),
        });
    }

    private async toolLerDocumento(args: { busca: string }): Promise<string> {
        const rows = await this.dataSource.query(
            `SELECT d.id, d.name, d."fileName", d."extractedText", d."textExtracted", d.type,
                    d.purpose, d.description, d.size
             FROM documents d
             WHERE d."deletedAt" IS NULL AND (d.name ILIKE $1 OR d."fileName" ILIKE $1)
             ORDER BY d."createdAt" DESC LIMIT 1`,
            [`%${args.busca}%`],
        );

        if (rows.length === 0) {
            return JSON.stringify({ erro: `Documento "${args.busca}" não encontrado. Use buscar_documentos para listar os disponíveis.` });
        }

        const doc = rows[0];
        if (!doc.textExtracted || !doc.extractedText) {
            return JSON.stringify({
                documento: doc.name,
                arquivo: doc.fileName,
                tipo: doc.type,
                mensagem: 'O texto deste documento ainda não foi extraído. O documento pode não ser um PDF ou o texto não pôde ser lido.',
            });
        }

        // Limit text to 8000 chars to fit within token limits
        const text = doc.extractedText.length > 8000
            ? doc.extractedText.substring(0, 8000) + '\n... [texto truncado — documento muito longo]'
            : doc.extractedText;

        return JSON.stringify({
            documento: doc.name,
            arquivo: doc.fileName,
            tipo: doc.type,
            finalidade: doc.purpose,
            tamanho: doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : null,
            conteudo: text,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISE DE LISTA DE MATERIAIS
    // ═══════════════════════════════════════════════════════════════

    async analyzeMaterialList(text: string) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';

        const catalog = await this.catalogRepo.find({
            select: ['id', 'name', 'sku', 'costPrice', 'unit'],
            take: 500,
        });

        const catalogList = catalog.map(c =>
            `ID:${c.id} | ${c.name} | SKU:${c.sku || '-'} | R$${c.costPrice} | ${c.unit}`
        ).join('\n');

        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: `Você é um assistente especializado em identificar materiais elétricos.
Analise a lista e faça matching com o catálogo.

CATÁLOGO:
${catalogList}

Retorne JSON array: [{"originalDescription":"...","matchedCatalogId":"UUID|null","matchedName":"...|null","confidence":"alta|media|baixa","quantity":N,"unit":"UN","suggestedAction":"vincular|cadastrar_novo|revisar"}]

Retorne APENAS o JSON.`
                },
                { role: 'user', content: text },
            ],
            temperature: 0.3,
            max_tokens: 3000,
        });

        const content = response.choices[0]?.message?.content || '[]';
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return { results: JSON.parse(cleaned), usage: response.usage };
        } catch {
            return { results: [], rawResponse: content, usage: response.usage };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTEXTO DO SISTEMA
    // ═══════════════════════════════════════════════════════════════

    private async buildSystemContext(canPerformActions: boolean): Promise<string> {
        const [catalogCount, supplierCount, structureCount, markupCount] = await Promise.all([
            this.catalogRepo.count(),
            this.supplierRepo.count(),
            this.structureRepo.count(),
            this.markupRepo.count(),
        ]);

        const actionSection = canPerformActions
            ? `
AÇÕES DISPONÍVEIS (liberadas para você):
Você pode EXECUTAR ações no sistema:
- criar_proposta → Cria propostas comerciais
- criar_cliente → Cadastra novos clientes
- criar_obra → Cria obras/projetos
- atualizar_status_contrato → Altera status de contratos
- cadastrar_produto → Cadastra produtos no catálogo

Quando o usuário pedir para criar/cadastrar algo, USE as ferramentas de ação. Confirme os dados antes de executar.`
            : `
AÇÕES: As ações de criação/edição NÃO estão liberadas para este usuário. Se pedirem para criar algo, informe que o administrador precisa liberar as ações na configuração da IA.`;

        return `Você é o assistente de IA do sistema ERP Exito System, especializado em engenharia elétrica.

SISTEMA:
- ERP para engenharia elétrica (obras, propostas, contratos, catálogo, fornecedores, financeiro)
- ${catalogCount} itens no catálogo | ${supplierCount} fornecedores | ${structureCount} estruturas | ${markupCount} markups

FERRAMENTAS DE CONSULTA (sempre disponíveis):
- buscar_contratos, buscar_propostas, buscar_obras, buscar_clientes, buscar_produtos, resumo_financeiro
- buscar_documentos → Pesquisar documentos/arquivos enviados ao sistema
- ler_documento → Ler o conteúdo textual de um documento PDF enviado
${actionSection}

REGRAS:
1. Responda SEMPRE em português brasileiro
2. SEMPRE use as ferramentas para buscar dados reais
3. Nunca invente dados
4. Formate valores como R$ X.XXX,XX
5. Para ações, confirme com o usuário o que será feito antes de executar
6. Seja prático e acionável como um engenheiro consultor
7. Quando perguntarem sobre documentos, USE buscar_documentos e ler_documento para acessar o conteúdo real`;
    }

    // ═══════════════════════════════════════════════════════════════
    // SUGESTÃO DE CLÁUSULAS CONTRATUAIS VIA IA
    // ═══════════════════════════════════════════════════════════════

    async suggestContractClauses(data: {
        contractType: string;
        scope?: string;
        value?: number;
        proposalId?: string;
        fields?: string[];
    }) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada. Vá em Configurações → IA.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';

        // Buscar dados da proposta se vinculada
        let proposalContext = '';
        if (data.proposalId) {
            try {
                const [proposal] = await this.dataSource.query(
                    `SELECT p.*, cl.name as "clientName", cl.document as "clientDocument",
                            cl.type as "clientType", cl.address as "clientAddress", cl.city, cl.state
                     FROM proposals p LEFT JOIN clients cl ON cl.id = p."clientId"
                     WHERE p.id = $1`, [data.proposalId]
                );
                if (proposal) {
                    const items = await this.dataSource.query(
                        `SELECT description, quantity, unit, "unitPrice", "totalPrice"
                         FROM proposal_items WHERE "proposalId" = $1 ORDER BY "sortOrder"`, [data.proposalId]
                    );
                    proposalContext = `
PROPOSTA VINCULADA:
- Número: ${proposal.proposalNumber}
- Cliente: ${proposal.clientName || 'N/A'} (${proposal.clientDocument || 'N/A'})
- Tipo Cliente: ${proposal.clientType === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
- Endereço: ${[proposal.clientAddress, proposal.city, proposal.state].filter(Boolean).join(', ')}
- Valor Total: R$ ${Number(proposal.total || 0).toLocaleString('pt-BR')}
- Escopo: ${proposal.scope || 'N/A'}
- Prazo: ${proposal.deadline || 'N/A'}
- Condições Pagamento: ${proposal.paymentConditions || 'N/A'}
- Itens: ${items.map((i: any) => `${i.description} (${i.quantity} ${i.unit} x R$${i.unitPrice})`).join('; ')}`;
                }
            } catch (e) {
                console.warn('Erro ao buscar proposta para contexto:', e);
            }
        }

        const typeLabels: Record<string, string> = {
            service: 'Prestação de Serviço', supply: 'Fornecimento', subcontract: 'Subcontratação',
            maintenance: 'Manutenção', consulting: 'Consultoria', other: 'Outro',
        };

        const fieldsToGenerate = data.fields || [
            'paymentTerms', 'penalties', 'warranty', 'termination',
            'confidentiality', 'forceMajeure', 'jurisdiction',
            'contractorObligations', 'clientObligations',
        ];

        const fieldLabels: Record<string, string> = {
            paymentTerms: 'Condições de Pagamento',
            penalties: 'Penalidades e Multas',
            warranty: 'Garantia',
            termination: 'Rescisão Contratual',
            confidentiality: 'Confidencialidade',
            forceMajeure: 'Força Maior / Caso Fortuito',
            jurisdiction: 'Foro Competente',
            contractorObligations: 'Obrigações da CONTRATADA (cada obrigação em uma linha)',
            clientObligations: 'Obrigações do CONTRATANTE (cada obrigação em uma linha)',
        };

        const prompt = `Você é um advogado especialista em contratos de engenharia elétrica e energia solar.
Gere cláusulas contratuais profissionais e juridicamente válidas para o seguinte contrato:

TIPO: ${typeLabels[data.contractType] || data.contractType}
ESCOPO: ${data.scope || 'Não informado'}
VALOR: R$ ${data.value ? Number(data.value).toLocaleString('pt-BR') : 'Não informado'}
${proposalContext}

Gere sugestões para os seguintes campos, retornando um JSON válido com as chaves correspondentes:
${fieldsToGenerate.map(f => `- "${f}": ${fieldLabels[f] || f}`).join('\n')}

REGRAS:
- Use linguagem jurídica formal em português brasileiro
- Para obrigações, coloque cada item em uma linha separada
- Para foro, sugira comarca baseada no endereço do cliente (se disponível)
- Para pagamento, considere parcelamento se valor alto
- Para garantia de serviços elétricos/solar, sugira 5 anos para serviço e 12 meses para materiais
- Para penalidades, use multa de 10% + juros 1% ao mês
- Adapte ao tipo de contrato (serviço vs fornecimento vs manutenção)

Retorne APENAS o JSON, sem markdown, sem explicações.`;

        try {
            const openai = new OpenAI({ apiKey });
            const response = await openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 3000,
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0]?.message?.content || '{}';
            try {
                return JSON.parse(content);
            } catch {
                return { error: 'Resposta inválida da IA', raw: content };
            }
        } catch (error: any) {
            console.error('❌ AI suggest-clauses error:', error?.message);
            throw new BadRequestException(`Erro na IA: ${error?.message || 'Erro desconhecido'}`);
        }
    }
}
