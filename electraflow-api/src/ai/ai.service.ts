import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import OpenAI from 'openai';

import { CatalogItem } from '../catalog/catalog.entity';
import { Supplier } from '../supply/supply.entity';
import { StructureTemplate } from '../structure-templates/structure-template.entity';
import { MarkupConfig } from '../markup/markup.entity';

// ═══════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS TOOLS PARA FUNCTION CALLING
// ═══════════════════════════════════════════════════════════════

const AI_TOOLS: any[] = [
    {
        type: 'function',
        function: {
            name: 'buscar_contratos',
            description: 'Busca contratos no sistema pelo título, nome do cliente, número ou status. Retorna título, valor, status, cliente e datas.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no título, número do contrato ou nome do cliente' },
                    status: { type: 'string', description: 'Filtrar por status: draft, active, completed, cancelled, suspended, expired', enum: ['draft', 'active', 'completed', 'cancelled', 'suspended', 'expired'] },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_propostas',
            description: 'Busca propostas comerciais no sistema pelo título, número ou cliente. Retorna valores, status, itens e condições.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no título, número da proposta ou nome do cliente' },
                    status: { type: 'string', description: 'Filtrar por status: draft, sent, viewed, accepted, rejected, expired', enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'] },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_obras',
            description: 'Busca obras/projetos no sistema pelo título ou cliente.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Texto para buscar no título, número da obra ou nome do cliente' },
                },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_clientes',
            description: 'Busca clientes cadastrados no sistema por nome, CNPJ/CPF ou email.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Nome, CNPJ, CPF ou email do cliente' },
                },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_produtos',
            description: 'Busca produtos/materiais/serviços no catálogo por nome, SKU ou código externo.',
            parameters: {
                type: 'object',
                properties: {
                    busca: { type: 'string', description: 'Nome, SKU ou código do produto' },
                    tipo: { type: 'string', description: 'Tipo: material ou service', enum: ['material', 'service'] },
                },
                required: ['busca'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'resumo_financeiro',
            description: 'Retorna resumo financeiro do sistema: total de contratos ativos, propostas aceitas, valores totais, quantidade de obras.',
            parameters: { type: 'object', properties: {} },
        },
    },
];

@Injectable()
export class AiService {
    constructor(
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
        @InjectRepository(CatalogItem)
        private catalogRepo: Repository<CatalogItem>,
        @InjectRepository(Supplier)
        private supplierRepo: Repository<Supplier>,
        @InjectRepository(StructureTemplate)
        private structureRepo: Repository<StructureTemplate>,
        @InjectRepository(MarkupConfig)
        private markupRepo: Repository<MarkupConfig>,
        private dataSource: DataSource,
    ) { }

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
    // CHAT — Assistente com Function Calling
    // ═══════════════════════════════════════════════════════════════

    async chat(message: string, history: { role: string; content: string }[] = []) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada. Vá em Configurações → IA.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';
        const enabled = await this.getConfig('ai_enabled');
        if (enabled === 'false') throw new BadRequestException('IA está desabilitada nas configurações.');

        try {
            let systemContext: string;
            try {
                systemContext = await this.buildSystemContext();
            } catch (ctxErr: any) {
                console.warn('⚠️ Erro ao construir contexto da IA (usando fallback):', ctxErr?.message);
                systemContext = 'Você é o assistente de IA do sistema ERP Exito System, especializado em engenharia elétrica. Responda em português brasileiro. Você tem acesso a ferramentas para consultar dados do sistema.';
            }

            const openai = new OpenAI({ apiKey });

            const messages: any[] = [
                { role: 'system', content: systemContext },
                ...history.map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message },
            ];

            // Loop de function calling (máx 5 iterações para evitar loop infinito)
            let totalUsage: any = null;
            for (let iteration = 0; iteration < 5; iteration++) {
                const response = await openai.chat.completions.create({
                    model,
                    messages,
                    tools: AI_TOOLS,
                    tool_choice: 'auto',
                    temperature: 0.7,
                    max_tokens: 3000,
                } as any);

                totalUsage = response.usage;
                const choice = response.choices[0];
                const msg = choice.message as any;

                // Se a IA quer chamar ferramentas
                if (choice.finish_reason === 'tool_calls' && msg.tool_calls) {
                    // Adicionar a mensagem do assistente com as tool_calls
                    messages.push(msg);

                    // Executar cada tool call
                    for (const toolCall of msg.tool_calls) {
                        const fnName = toolCall.function?.name || toolCall.name;
                        const fnArgs = toolCall.function?.arguments || '{}';
                        console.log(`🔧 AI calling tool: ${fnName}(${fnArgs})`);
                        let result: string;
                        try {
                            const args = JSON.parse(fnArgs);
                            result = await this.executeTool(fnName, args);
                        } catch (err: any) {
                            result = JSON.stringify({ error: err?.message || 'Erro ao executar ferramenta' });
                        }

                        // Devolver resultado da tool para a conversa
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: result,
                        });
                    }
                    // Continua o loop para que a IA processe os resultados
                    continue;
                }

                // Resposta final (sem mais tool calls)
                return {
                    message: msg?.content || 'Sem resposta.',
                    usage: totalUsage,
                };
            }

            // Se saiu do loop sem resposta final
            return { message: 'Desculpe, não consegui processar sua solicitação. Tente reformular a pergunta.', usage: totalUsage };

        } catch (error: any) {
            console.error('❌ Erro no AI chat:', error?.message, error?.status, error?.code);
            if (error?.status === 401 || error?.code === 'invalid_api_key') {
                throw new BadRequestException('Chave de API inválida. Verifique nas configurações.');
            }
            if (error?.status === 429) {
                throw new BadRequestException('Limite de requisições da API atingido. Aguarde alguns minutos.');
            }
            if (error?.code === 'insufficient_quota') {
                throw new BadRequestException('Sem créditos na conta OpenAI. Recarregue em platform.openai.com.');
            }
            throw new BadRequestException(`Erro na IA: ${error?.message || 'Erro desconhecido'}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXECUTOR DE FERRAMENTAS
    // ═══════════════════════════════════════════════════════════════

    private async executeTool(name: string, args: any): Promise<string> {
        switch (name) {
            case 'buscar_contratos': return this.toolBuscarContratos(args);
            case 'buscar_propostas': return this.toolBuscarPropostas(args);
            case 'buscar_obras': return this.toolBuscarObras(args);
            case 'buscar_clientes': return this.toolBuscarClientes(args);
            case 'buscar_produtos': return this.toolBuscarProdutos(args);
            case 'resumo_financeiro': return this.toolResumoFinanceiro();
            default: return JSON.stringify({ error: `Ferramenta "${name}" não encontrada` });
        }
    }

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
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum contrato encontrado', resultados: [] });

        return JSON.stringify({
            total: rows.length,
            contratos: rows.map(r => ({
                numero: r.contractNumber,
                titulo: r.title,
                status: r.status,
                tipo: r.type,
                valorOriginal: Number(r.originalValue),
                valorAditivos: Number(r.addendumValue),
                valorFinal: Number(r.finalValue),
                inicio: r.startDate,
                fim: r.endDate,
                cliente: r.clientName,
                documentoCliente: r.clientDocument,
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
        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhuma proposta encontrada', resultados: [] });

        // Buscar itens das propostas encontradas
        const proposalIds = rows.map(r => r.id);
        let items: any[] = [];
        if (proposalIds.length > 0) {
            try {
                items = await this.dataSource.query(
                    `SELECT pi."proposalId", pi.description, pi.quantity, pi.unit, pi."unitPrice", pi."totalPrice"
                     FROM proposal_items pi WHERE pi."proposalId" = ANY($1) ORDER BY pi."sortOrder"`,
                    [proposalIds],
                );
            } catch { items = []; }
        }

        const itemsByProposal: Record<string, any[]> = {};
        items.forEach(i => {
            if (!itemsByProposal[i.proposalId]) itemsByProposal[i.proposalId] = [];
            itemsByProposal[i.proposalId].push({
                descricao: i.description,
                quantidade: Number(i.quantity),
                unidade: i.unit,
                precoUnitario: Number(i.unitPrice),
                precoTotal: Number(i.totalPrice),
            });
        });

        return JSON.stringify({
            total: rows.length,
            propostas: rows.map(r => ({
                numero: r.proposalNumber,
                titulo: r.title,
                status: r.status,
                subtotal: Number(r.subtotal),
                desconto: Number(r.discount),
                total: Number(r.total),
                validadeAte: r.validUntil,
                escopo: r.scope,
                prazo: r.deadline,
                condicoesPagamento: r.paymentConditions,
                cliente: r.clientName,
                itens: itemsByProposal[r.id] || [],
            })),
        });
    }

    private async toolBuscarObras(args: { busca: string }): Promise<string> {
        const rows = await this.dataSource.query(
            `SELECT w.id, w.title, w.status, w."workType", w."estimatedValue",
                    w."startDate", w."endDate", w.address, w.city, w.state,
                    cl.name AS "clientName"
             FROM works w
             LEFT JOIN clients cl ON cl.id = w."clientId"
             WHERE w."deletedAt" IS NULL
               AND (w.title ILIKE $1 OR cl.name ILIKE $1)
             ORDER BY w."createdAt" DESC LIMIT 10`,
            [`%${args.busca}%`],
        );

        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhuma obra encontrada', resultados: [] });

        return JSON.stringify({
            total: rows.length,
            obras: rows.map((r: any) => ({
                titulo: r.title,
                status: r.status,
                tipo: r.workType,
                valorEstimado: Number(r.estimatedValue || 0),
                inicio: r.startDate,
                fim: r.endDate,
                endereco: [r.address, r.city, r.state].filter(Boolean).join(', '),
                cliente: r.clientName,
            })),
        });
    }

    private async toolBuscarClientes(args: { busca: string }): Promise<string> {
        const rows = await this.dataSource.query(
            `SELECT c.id, c.name, c.document, c.email, c.phone, c.type,
                    c.address, c.city, c.state
             FROM clients c
             WHERE c."deletedAt" IS NULL
               AND (c.name ILIKE $1 OR c.document ILIKE $1 OR c.email ILIKE $1)
             ORDER BY c.name ASC LIMIT 10`,
            [`%${args.busca}%`],
        );

        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum cliente encontrado', resultados: [] });

        return JSON.stringify({
            total: rows.length,
            clientes: rows.map((r: any) => ({
                nome: r.name,
                documento: r.document,
                email: r.email,
                telefone: r.phone,
                tipo: r.type,
                endereco: [r.address, r.city, r.state].filter(Boolean).join(', '),
            })),
        });
    }

    private async toolBuscarProdutos(args: { busca: string; tipo?: string }): Promise<string> {
        let query = `
            SELECT ci.id, ci.name, ci.sku, ci."externalCode", ci.unit, ci.type,
                   ci."unitPrice", ci."costPrice", ci."currentStock",
                   cc.name AS "categoryName"
            FROM catalog_items ci
            LEFT JOIN catalog_categories cc ON cc.id = ci."categoryId"
            WHERE ci."deletedAt" IS NULL
              AND (ci.name ILIKE $1 OR ci.sku ILIKE $1 OR ci."externalCode" ILIKE $1)`;
        const params: any[] = [`%${args.busca}%`];

        if (args.tipo) {
            query += ` AND ci.type = $2`;
            params.push(args.tipo);
        }

        query += ` ORDER BY ci.name ASC LIMIT 15`;
        const rows = await this.dataSource.query(query, params);

        if (rows.length === 0) return JSON.stringify({ mensagem: 'Nenhum produto encontrado', resultados: [] });

        return JSON.stringify({
            total: rows.length,
            produtos: rows.map((r: any) => ({
                nome: r.name,
                sku: r.sku,
                codigoExterno: r.externalCode,
                unidade: r.unit,
                tipo: r.type,
                precoVenda: Number(r.unitPrice || 0),
                precoCusto: Number(r.costPrice || 0),
                estoque: Number(r.currentStock || 0),
                categoria: r.categoryName,
            })),
        });
    }

    private async toolResumoFinanceiro(): Promise<string> {
        const [contractStats] = await this.dataSource.query(
            `SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'active') as ativos,
                    COALESCE(SUM("finalValue") FILTER (WHERE status = 'active'), 0) as "valorAtivos",
                    COALESCE(SUM("finalValue"), 0) as "valorTotal"
             FROM contracts WHERE "deletedAt" IS NULL`,
        );

        const [proposalStats] = await this.dataSource.query(
            `SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'accepted') as aceitas,
                    COUNT(*) FILTER (WHERE status = 'draft') as rascunhos,
                    COUNT(*) FILTER (WHERE status = 'sent') as enviadas,
                    COALESCE(SUM(total) FILTER (WHERE status = 'accepted'), 0) as "valorAceitas",
                    COALESCE(SUM(total), 0) as "valorTotal"
             FROM proposals WHERE "deletedAt" IS NULL`,
        );

        const [workStats] = await this.dataSource.query(
            `SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as "emAndamento",
                    COUNT(*) FILTER (WHERE status = 'completed') as concluidas,
                    COALESCE(SUM("estimatedValue"), 0) as "valorEstimado"
             FROM works WHERE "deletedAt" IS NULL`,
        );

        const [clientStats] = await this.dataSource.query(
            `SELECT COUNT(*) as total FROM clients WHERE "deletedAt" IS NULL`,
        );

        const [catalogStats] = await this.dataSource.query(
            `SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE type = 'material') as materiais,
                    COUNT(*) FILTER (WHERE type = 'service') as servicos
             FROM catalog_items WHERE "deletedAt" IS NULL`,
        );

        return JSON.stringify({
            contratos: {
                total: Number(contractStats.total),
                ativos: Number(contractStats.ativos),
                valorAtivos: Number(contractStats.valorAtivos),
                valorTotal: Number(contractStats.valorTotal),
            },
            propostas: {
                total: Number(proposalStats.total),
                aceitas: Number(proposalStats.aceitas),
                rascunhos: Number(proposalStats.rascunhos),
                enviadas: Number(proposalStats.enviadas),
                valorAceitas: Number(proposalStats.valorAceitas),
                valorTotal: Number(proposalStats.valorTotal),
            },
            obras: {
                total: Number(workStats.total),
                emAndamento: Number(workStats.emAndamento),
                concluidas: Number(workStats.concluidas),
                valorEstimado: Number(workStats.valorEstimado),
            },
            clientes: { total: Number(clientStats.total) },
            catalogo: {
                total: Number(catalogStats.total),
                materiais: Number(catalogStats.materiais),
                servicos: Number(catalogStats.servicos),
            },
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
                    content: `Você é um assistente de engenharia elétrica especializado em identificar materiais.
Analise a lista de materiais fornecida pelo usuário e faça matching com o catálogo existente.

CATÁLOGO DISPONÍVEL:
${catalogList}

Para cada item da lista do usuário, retorne um JSON array com:
[
  {
    "originalDescription": "descrição original do fornecedor",
    "matchedCatalogId": "UUID se encontrou match ou null",
    "matchedName": "nome do item no catálogo ou null",
    "confidence": "alta|media|baixa",
    "quantity": número,
    "unit": "UN|M|KG|etc",
    "suggestedAction": "vincular|cadastrar_novo|revisar"
  }
]

Retorne APENAS o JSON, sem texto adicional.`
                },
                { role: 'user', content: text },
            ],
            temperature: 0.3,
            max_tokens: 3000,
        });

        const content = response.choices[0]?.message?.content || '[]';

        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const results = JSON.parse(cleaned);
            return { results, usage: response.usage };
        } catch {
            return { results: [], rawResponse: content, usage: response.usage };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTEXTO DO SISTEMA
    // ═══════════════════════════════════════════════════════════════

    private async buildSystemContext(): Promise<string> {
        const [catalogCount, supplierCount, structureCount, markupCount] = await Promise.all([
            this.catalogRepo.count(),
            this.supplierRepo.count(),
            this.structureRepo.count(),
            this.markupRepo.count(),
        ]);

        return `Você é o assistente de IA do sistema ERP Exito System, especializado em engenharia elétrica.

SOBRE O SISTEMA:
- ERP para empresa de engenharia elétrica
- Gerencia: obras, clientes, propostas, contratos, ordens de serviço, fornecedores, catálogo de materiais, estruturas elétricas, documentos, financeiro
- Segue normas ABNT NBR e normas operacionais de concessionárias (Neoenergia, CEMIG, ENEL, etc.)

DADOS ATUAIS:
- ${catalogCount} itens no catálogo
- ${supplierCount} fornecedores
- ${structureCount} templates de estrutura
- ${markupCount} regras de markup

FERRAMENTAS DISPONÍVEIS:
Você possui ferramentas para consultar dados REAIS do sistema. USE-AS sempre que o usuário perguntar sobre:
- Contratos (valores, status, datas) → use buscar_contratos
- Propostas (valores, itens, condições) → use buscar_propostas
- Obras (status, endereço, cliente) → use buscar_obras
- Clientes (dados, contato) → use buscar_clientes
- Produtos/Materiais (preços, estoque) → use buscar_produtos
- Resumo financeiro geral → use resumo_financeiro

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. SEMPRE use as ferramentas para buscar dados quando perguntarem sobre registros específicos
3. Nunca invente dados — se não encontrar, diga que não foi encontrado
4. Formate valores monetários como R$ X.XXX,XX
5. Para materiais, sempre mencione preços e unidades
6. Sugira otimizações de custo e processos quando pertinente
7. Forneça respostas práticas e acionáveis, como um engenheiro consultor
8. Quando fizer cálculos de custo, mostre o detalhamento`;
    }
}
