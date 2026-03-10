import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import OpenAI from 'openai';

// Import dos repositórios para contexto do sistema
import { CatalogItem } from '../catalog/catalog.entity';
import { Supplier } from '../supply/supply.entity';
import { StructureTemplate } from '../structure-templates/structure-template.entity';
import { MarkupConfig } from '../markup/markup.entity';

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
    // CHAT — Assistente com contexto completo do sistema
    // ═══════════════════════════════════════════════════════════════

    async chat(message: string, history: { role: string; content: string }[] = []) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada. Vá em Configurações → IA.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';
        const enabled = await this.getConfig('ai_enabled');
        if (enabled === 'false') throw new BadRequestException('IA está desabilitada nas configurações.');

        // Buscar contexto do sistema
        const systemContext = await this.buildSystemContext();

        const openai = new OpenAI({ apiKey });

        const messages: any[] = [
            { role: 'system', content: systemContext },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message },
        ];

        try {
            const response = await openai.chat.completions.create({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 2000,
            });

            return {
                message: response.choices[0]?.message?.content || 'Sem resposta.',
                usage: response.usage,
            };
        } catch (error: any) {
            if (error?.status === 401) throw new BadRequestException('Chave de API inválida. Verifique nas configurações.');
            throw new BadRequestException(`Erro na IA: ${error?.message || 'Erro desconhecido'}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISE DE LISTA DE MATERIAIS
    // ═══════════════════════════════════════════════════════════════

    async analyzeMaterialList(text: string) {
        const apiKey = await this.getConfig('ai_api_key');
        if (!apiKey) throw new BadRequestException('Chave de API não configurada.');

        const model = (await this.getConfig('ai_model')) || 'gpt-4o-mini';

        // Buscar catálogo atual para matching
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
            // Tentar parsear o JSON da resposta
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const results = JSON.parse(cleaned);
            return { results, usage: response.usage };
        } catch {
            return { results: [], rawResponse: content, usage: response.usage };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTEXTO DO SISTEMA — Dados reais para a IA
    // ═══════════════════════════════════════════════════════════════

    private async buildSystemContext(): Promise<string> {
        // Stats do sistema
        const [catalogCount, supplierCount, structureCount, markupCount] = await Promise.all([
            this.catalogRepo.count(),
            this.supplierRepo.count(),
            this.structureRepo.count(),
            this.markupRepo.count(),
        ]);

        // Amostra de dados reais
        const topCatalogItems = await this.catalogRepo.find({ take: 30, order: { name: 'ASC' } });
        const suppliers = await this.supplierRepo.find({ take: 20, order: { name: 'ASC' } });
        const structures = await this.structureRepo.find({ take: 15, relations: ['items'], order: { code: 'ASC' } });
        const markups = await this.markupRepo.find({ where: { isActive: true }, order: { priority: 'DESC' } });

        const catalogSummary = topCatalogItems.map(c =>
            `- ${c.name} (SKU: ${c.sku || '-'}) | Custo: R$${c.costPrice} | Un: ${c.unit}`
        ).join('\n');

        const supplierSummary = suppliers.map(s =>
            `- ${s.name} | CNPJ: ${s.cnpj || '-'} | Tipo: ${(s as any).supplierType || '-'} | Segmento: ${s.segment || '-'}`
        ).join('\n');

        const structureSummary = structures.map(s =>
            `- ${s.code}: ${s.name} | Conc: ${s.concessionaria || '-'} | Tensão: ${s.tensionLevel || '-'} | Itens: ${s.items?.length || 0}`
        ).join('\n');

        const markupSummary = markups.map(m =>
            `- ${m.name} | Escopo: ${m.scope} | Multiplicador: x${m.markupMultiplier} | %: ${m.markupPercentage}%`
        ).join('\n');

        return `Você é o assistente de IA do sistema ERP Exito System, especializado em engenharia elétrica.

SOBRE O SISTEMA:
- ERP para empresa de engenharia elétrica
- Gerencia: obras, clientes, propostas, contratos, ordens de serviço, fornecedores, catálogo de materiais, estruturas elétricas, documentos, financeiro
- Segue normas ABNT NBR e normas operacionais de concessionárias (Neoenergia, CEMIG, ENEL, etc.)

DADOS ATUAIS DO SISTEMA:
- ${catalogCount} itens no catálogo
- ${supplierCount} fornecedores
- ${structureCount} templates de estrutura
- ${markupCount} regras de markup

CATÁLOGO (amostra):
${catalogSummary || 'Nenhum item cadastrado'}

FORNECEDORES:
${supplierSummary || 'Nenhum fornecedor cadastrado'}

ESTRUTURAS ELÉTRICAS:
${structureSummary || 'Nenhuma estrutura cadastrada'}

REGRAS DE MARKUP:
${markupSummary || 'Nenhuma regra configurada'}

INSTRUÇÕES:
1. Responda sempre em português brasileiro
2. Use dados reais do sistema quando relevante
3. Para materiais, sempre mencione preços e fornecedores quando disponíveis
4. Para estruturas, cite os materiais necessários e custos
5. Sugira otimizações de custo e processos quando pertinente
6. Se perguntarem sobre normas, forneça informações técnicas precisas
7. Para criação de propostas, considere as regras de markup cadastradas
8. Forneça respostas práticas e acionáveis, como um engenheiro consultor
9. Quando fizer cálculos de custo, mostre o detalhamento
10. Ajude com planejamento de obras, dimensionamento, e tomada de decisão`;
    }
}
