import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OemUsina } from './oem-usina.entity';
import { OemPlano } from './oem-plano.entity';
import { OemContrato } from './oem-contrato.entity';
import { OemServico } from './oem-servico.entity';

@Injectable()
export class OemService {
    constructor(
        @InjectRepository(OemUsina)
        private usinaRepo: Repository<OemUsina>,
        @InjectRepository(OemPlano)
        private planoRepo: Repository<OemPlano>,
        @InjectRepository(OemContrato)
        private contratoRepo: Repository<OemContrato>,
        @InjectRepository(OemServico)
        private servicoRepo: Repository<OemServico>,
        private dataSource: DataSource,
    ) {
        this.ensureTables();
    }

    private async ensureTables() {
        try {
            await this.dataSource.query(`
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
                    status VARCHAR DEFAULT 'ativa',
                    observacoes TEXT,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    "deletedAt" TIMESTAMP
                )
            `);
            // ── Colunas de precificação para oem_usinas ──
            try { await this.dataSource.query(`ALTER TABLE oem_usinas ADD COLUMN IF NOT EXISTS "valorEstimadoUsina" DECIMAL(14,2)`); } catch { /* exists */ }
            try { await this.dataSource.query(`ALTER TABLE oem_usinas ADD COLUMN IF NOT EXISTS "percentualManutencao" DECIMAL(5,2) DEFAULT 10`); } catch { /* exists */ }
            await this.dataSource.query(`
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
                    ativo BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                )
            `);
            // ── Colunas adicionais para oem_planos (migração incremental) ──
            const planoColumns = [
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tipoPlano" VARCHAR DEFAULT 'standard'`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tempoRespostaSlaHoras" INTEGER DEFAULT 48`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "tempoRespostaUrgenteHoras" INTEGER DEFAULT 4`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "atendimentoHorario" VARCHAR DEFAULT 'comercial'`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "coberturaMaxAnual" DECIMAL(10,2)`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "limiteCorretivas" INTEGER`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "abrangenciaKm" INTEGER`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "incluiSeguro" BOOLEAN DEFAULT false`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "incluiRelatorio" BOOLEAN DEFAULT true`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "frequenciaRelatorio" VARCHAR DEFAULT 'trimestral'`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "termosDuracaoMeses" INTEGER DEFAULT 12`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "descontoAnualPercent" DECIMAL(5,2) DEFAULT 0`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "exclusoes" TEXT`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "penalidades" TEXT`,
                `ALTER TABLE oem_planos ADD COLUMN IF NOT EXISTS "beneficios" TEXT`,
            ];
            for (const sql of planoColumns) {
                try { await this.dataSource.query(sql); } catch { /* column may already exist */ }
            }
            await this.dataSource.query(`
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
            await this.dataSource.query(`
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
                    observacoes TEXT,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    "deletedAt" TIMESTAMP
                )
            `);
            // ── Colunas de proposta para oem_servicos (migração incremental) ──
            const servicoColumns = [
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "materiaisUtilizados" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "proposalTitle" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "proposalValidUntil" VARCHAR`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "proposalMode" VARCHAR DEFAULT 'servico'`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "sectionToggles" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "oemMateriais" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "incluirMateriaisNoTotal" BOOLEAN DEFAULT false`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "totalServicos" DECIMAL(12,2)`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "totalMateriais" DECIMAL(12,2)`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "oemProposalId" VARCHAR`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "oemExtraItems" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "oemItemDisplayMode" VARCHAR`,
                // Textos editáveis da proposta O&M
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "paymentConditions" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "contractorObligations" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "clientObligations" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "generalProvisions" TEXT`,
                `ALTER TABLE oem_servicos ADD COLUMN IF NOT EXISTS "complianceText" TEXT`,
            ];
            for (const sql of servicoColumns) {
                try { await this.dataSource.query(sql); } catch { /* column may already exist */ }
            }
        } catch (e) {
            console.warn('OeM tables migration:', e?.message);
        }
    }

    // ═══ USINAS ══════════════════════════════════════════════════════
    async findAllUsinas(clienteId?: string): Promise<OemUsina[]> {
        const where: any = {};
        if (clienteId) where.clienteId = clienteId;
        return this.usinaRepo.find({ where, relations: ['cliente', 'empresa'], order: { createdAt: 'DESC' } });
    }

    async findOneUsina(id: string): Promise<OemUsina> {
        const u = await this.usinaRepo.findOne({ where: { id }, relations: ['cliente', 'empresa', 'projetoSolar'] });
        if (!u) throw new NotFoundException('Usina não encontrada');
        return u;
    }

    async createUsina(data: any): Promise<OemUsina> {
        this.sanitizeUuids(data, ['clienteId', 'empresaId', 'projetoSolarId']);
        return this.usinaRepo.save(this.usinaRepo.create(data)) as any as Promise<OemUsina>;
    }

    async updateUsina(id: string, data: any): Promise<OemUsina> {
        const u = await this.findOneUsina(id);
        this.sanitizeUuids(data, ['clienteId', 'empresaId', 'projetoSolarId']);
        Object.assign(u, data);
        return this.usinaRepo.save(u);
    }

    async removeUsina(id: string): Promise<void> {
        await this.usinaRepo.softDelete(id);
    }

    async importFromSolar(projectId: string): Promise<OemUsina> {
        const project = await this.dataSource.query(
            `SELECT * FROM solar_projects WHERE id = $1 LIMIT 1`, [projectId]
        );
        if (!project.length) throw new NotFoundException('Projeto solar não encontrado');
        const p = project[0];
        const modules = p.equipment ? (typeof p.equipment === 'string' ? JSON.parse(p.equipment) : p.equipment) : [];
        const moduleItem = modules.find((e: any) => e.type === 'module');
        const inverterItem = modules.find((e: any) => e.type === 'inverter');

        return this.createUsina({
            clienteId: p.clientId,
            projetoSolarId: p.id,
            nome: p.title || `Usina — ${p.code}`,
            potenciaKwp: p.systemPowerKwp || 0,
            qtdModulos: p.moduleCount || 0,
            modeloModulos: moduleItem ? `${moduleItem.brand || ''} ${moduleItem.model || ''}`.trim() : null,
            qtdInversores: inverterItem?.quantity || 1,
            modeloInversores: inverterItem ? `${inverterItem.brand || ''} ${inverterItem.model || ''}`.trim() : null,
            marcaInversor: inverterItem?.brand || null,
            dataInstalacao: new Date().toISOString().split('T')[0],
            endereco: p.propertyAddress || p.propertyCity || 'A definir',
            geracaoMensalEsperadaKwh: p.monthlyGenerationKwh || null,
            status: 'ativa',
        });
    }

    // ═══ PLANOS ══════════════════════════════════════════════════════
    async findAllPlanos(): Promise<OemPlano[]> {
        return this.planoRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findOnePlano(id: string): Promise<OemPlano> {
        const p = await this.planoRepo.findOne({ where: { id } });
        if (!p) throw new NotFoundException('Plano não encontrado');
        return p;
    }

    async createPlano(data: any): Promise<OemPlano> {
        return this.planoRepo.save(this.planoRepo.create(data)) as any as Promise<OemPlano>;
    }

    async updatePlano(id: string, data: any): Promise<OemPlano> {
        const p = await this.findOnePlano(id);
        Object.assign(p, data);
        return this.planoRepo.save(p);
    }

    async removePlano(id: string): Promise<void> {
        await this.planoRepo.delete(id);
    }

    // ═══ CONTRATOS ═══════════════════════════════════════════════════
    async findAllContratos(status?: string): Promise<OemContrato[]> {
        const where: any = {};
        if (status) where.status = status;
        return this.contratoRepo.find({ where, relations: ['cliente', 'usina', 'plano'], order: { createdAt: 'DESC' } });
    }

    async findOneContrato(id: string): Promise<OemContrato> {
        const c = await this.contratoRepo.findOne({ where: { id }, relations: ['cliente', 'usina', 'plano'] });
        if (!c) throw new NotFoundException('Contrato não encontrado');
        return c;
    }

    async createContrato(data: any): Promise<OemContrato> {
        this.sanitizeUuids(data, ['clienteId', 'usinaId', 'planoId', 'parceiroId']);
        if (!data.valorMensal && data.usinaId && data.planoId) {
            const calc = await this.calculatePrice(data.usinaId, data.planoId);
            data.valorMensal = calc.valorMensal;
            data.calculoDetalhado = calc;
        }
        return this.contratoRepo.save(this.contratoRepo.create(data)) as any as Promise<OemContrato>;
    }

    async updateContrato(id: string, data: any): Promise<OemContrato> {
        const c = await this.findOneContrato(id);
        this.sanitizeUuids(data, ['clienteId', 'usinaId', 'planoId', 'parceiroId']);
        Object.assign(c, data);
        return this.contratoRepo.save(c);
    }

    async removeContrato(id: string): Promise<void> {
        await this.contratoRepo.softDelete(id);
    }

    // ═══ SERVIÇOS (Preventiva / Preditiva / Corretiva) ═══════════════
    async findAllServicos(filters?: { tipo?: string; status?: string; usinaId?: string; clienteId?: string }): Promise<OemServico[]> {
        const where: any = {};
        if (filters?.tipo) where.tipo = filters.tipo;
        if (filters?.status) where.status = filters.status;
        if (filters?.usinaId) where.usinaId = filters.usinaId;
        if (filters?.clienteId) where.clienteId = filters.clienteId;
        return this.servicoRepo.find({ where, relations: ['usina', 'cliente'], order: { createdAt: 'DESC' } });
    }

    async findOneServico(id: string): Promise<OemServico> {
        const s = await this.servicoRepo.findOne({ where: { id }, relations: ['usina', 'cliente'] });
        if (!s) throw new NotFoundException('Serviço não encontrado');
        return s;
    }

    async createServico(data: any): Promise<OemServico> {
        this.sanitizeUuids(data, ['usinaId', 'clienteId', 'proposalId']);

        // Auto-preencher checklist padrão se não vier preenchido
        if (!data.checklist && data.tipo) {
            data.checklist = JSON.stringify(this.getDefaultChecklist(data.tipo));
        }

        return this.servicoRepo.save(this.servicoRepo.create(data)) as any as Promise<OemServico>;
    }

    async updateServico(id: string, data: any): Promise<OemServico> {
        const s = await this.findOneServico(id);
        this.sanitizeUuids(data, ['usinaId', 'clienteId', 'proposalId']);

        // Limpar relações eagerly-loaded para que TypeORM
        // use os FKs atualizados pelo Object.assign (fix: cliente não persistia)
        delete (s as any).usina;
        delete (s as any).cliente;

        Object.assign(s, data);
        return this.servicoRepo.save(s);
    }

    async removeServico(id: string): Promise<void> {
        await this.servicoRepo.softDelete(id);
    }

    async concluirServico(id: string, data: { diagnostico?: string; solucao?: string; valorFinal?: number; recomendacoes?: string; relatorioTecnico?: string }): Promise<OemServico> {
        const s = await this.findOneServico(id);
        s.status = 'concluido';
        s.dataConclusao = new Date() as any;
        if (data.diagnostico) s.diagnostico = data.diagnostico;
        if (data.solucao) s.solucao = data.solucao;
        if (data.valorFinal) s.valorFinal = data.valorFinal;
        if (data.recomendacoes) s.recomendacoes = data.recomendacoes;
        if (data.relatorioTecnico) s.relatorioTecnico = data.relatorioTecnico;
        return this.servicoRepo.save(s);
    }

    // Gerar proposta a partir de um serviço O&M
    async gerarPropostaFromServico(id: string): Promise<any> {
        const servico = await this.findOneServico(id);
        const usina = await this.findOneUsina(servico.usinaId);

        const tipoLabel: Record<string, string> = {
            preventiva: 'Manutenção Preventiva',
            preditiva: 'Manutenção Preditiva',
            corretiva: 'Manutenção Corretiva',
        };

        const activityTypeMap: Record<string, string> = {
            preventiva: 'plano_oem',
            preditiva: 'plano_oem',
            corretiva: 'plano_oem',
        };

        // Gerar número da proposta
        const count = await this.dataSource.query(`SELECT COUNT(*) as total FROM proposals`);
        const num = (parseInt(count[0]?.total || '0') + 1).toString().padStart(4, '0');
        const proposalNumber = `OEM-${new Date().getFullYear()}-${num}`;

        // Criar itens da proposta a partir do checklist
        const checklist = servico.checklist ? (typeof servico.checklist === 'string' ? JSON.parse(servico.checklist) : servico.checklist) : [];
        const activeItems = checklist.filter((c: any) => c.checked !== false);

        // ── VALOR DA USINA (referência informativa, NÃO é o preço do serviço) ──
        // valorEstimadoUsina = investimento original da usina ("tabela FIPE")
        // percentualManutencao = % que representa o custo de manutenção
        // valorEstimado no serviço = valor de referência para cálculos percentuais dos itens
        const valorEstimadoUsina = Number(usina.valorEstimadoUsina || 0);
        const percentualManutencao = Number(usina.percentualManutencao || 10);
        const valorBaseManutencao = valorEstimadoUsina > 0 
            ? +(valorEstimadoUsina * percentualManutencao / 100).toFixed(2) 
            : 0;
        // valorEstimado do serviço é usado APENAS como base para cálculos percentuais dos itens
        // Se o serviço tem um valor manual, usa ele; senão, usa o valorBaseManutencao calculado
        const valorBaseParaCalculo = Number(servico.valorEstimado || servico.valorFinal || valorBaseManutencao || 0);

        // displayMode global — controla apenas se a coluna de preço aparece no PDF
        const globalDisplayMode = activeItems.length > 0 ? (activeItems[0].displayMode || 'com_valor') : 'com_valor';
        const showPrices = globalDisplayMode === 'com_valor';

        // ── Calcular preço real de cada item ──
        // Itens com inputMode=valor usam valorDireto; os demais usam percentual do valorBaseParaCalculo
        const directItems = activeItems.filter((c: any) => c.inputMode === 'valor');
        const percentItems = activeItems.filter((c: any) => c.inputMode !== 'valor');
        const somaDirectos = directItems.reduce((sum: number, c: any) => sum + (Number(c.valorDireto) || 0), 0);
        const valorRestanteParaPercent = Math.max(0, valorBaseParaCalculo - somaDirectos);
        const somaPercentuais = percentItems.reduce((sum: number, c: any) => sum + (Number(c.percentual) || 0), 0);

        let acumuladoPercent = 0;
        let somaItens = 0;
        const items = activeItems.map((c: any, i: number) => {
            let itemPrice = 0;

            if (c.inputMode === 'valor') {
                // Valor direto digitado pelo usuário
                itemPrice = Number(c.valorDireto) || 0;
            } else if (somaPercentuais > 0 && valorBaseParaCalculo > 0) {
                // Percentual da base de manutenção (NÃO do valor da usina inteira)
                const pct = (Number(c.percentual) || 0) / 100;
                itemPrice = +(valorBaseParaCalculo * pct).toFixed(2);
            } else if (percentItems.length > 0 && valorRestanteParaPercent > 0) {
                // Sem percentuais definidos — distribuir igualmente
                itemPrice = +(valorRestanteParaPercent / percentItems.length).toFixed(2);
            }

            // Ajuste de arredondamento no último item percentual
            if (c.inputMode !== 'valor') {
                acumuladoPercent += itemPrice;
                const percentIdx = percentItems.indexOf(c);
                if (percentIdx === percentItems.length - 1) {
                    const somaEsperada = somaPercentuais > 0
                        ? +(valorBaseParaCalculo * (somaPercentuais / 100)).toFixed(2)
                        : valorRestanteParaPercent;
                    const diff = +(somaEsperada - acumuladoPercent).toFixed(2);
                    if (Math.abs(diff) < 1) itemPrice = +(itemPrice + diff).toFixed(2);
                }
            }

            somaItens += itemPrice;

            return {
                description: c.item,
                unit: 'sv',
                serviceType: 'service',
                unitPrice: itemPrice,
                quantity: 1,
                total: itemPrice,
                showDetailedPrices: showPrices,
            };
        });

        // ── TOTAL DA PROPOSTA — 3 cenários ──
        // 1) Itens do checklist marcados e precificados → total = soma dos itens
        // 2) Nenhum item marcado mas operador definiu valorEstimado → total = valorEstimado (preço global do serviço)
        // 3) Nada preenchido → total = 0
        const totalProposta = somaItens > 0
            ? +somaItens.toFixed(2)
            : Number(servico.valorEstimado || servico.valorFinal || 0);

        // ── Escopo detalhado com dados técnicos da usina ──
        const scope = [
            `${tipoLabel[servico.tipo]} para usina ${usina.nome} (${usina.potenciaKwp} kWp).`,
            ``,
            `DADOS TÉCNICOS DO SISTEMA:`,
            `• Potência: ${usina.potenciaKwp} kWp`,
            `• Módulos: ${usina.qtdModulos} unidades${usina.modeloModulos ? ` — ${usina.modeloModulos}` : ''}`,
            `• Inversores: ${usina.qtdInversores || 1} unidade(s)${usina.modeloInversores ? ` — ${usina.modeloInversores}` : ''}${usina.marcaInversor ? ` (${usina.marcaInversor})` : ''}`,
            usina.tipoTelhado ? `• Tipo de telhado: ${usina.tipoTelhado}` : null,
            usina.dataInstalacao ? `• Data de instalação: ${String(usina.dataInstalacao).split('T')[0]}` : null,
            usina.geracaoMensalEsperadaKwh ? `• Geração mensal esperada: ${Number(usina.geracaoMensalEsperadaKwh).toFixed(0)} kWh` : null,
            ``,
            `LOCALIZAÇÃO:`,
            `• ${usina.endereco}`,
            // ── Referência informativa do investimento (NÃO é o preço do serviço) ──
            valorEstimadoUsina > 0 ? `` : null,
            valorEstimadoUsina > 0 ? `REFERÊNCIA DO INVESTIMENTO:` : null,
            valorEstimadoUsina > 0 ? `• Valor estimado da usina: R$ ${valorEstimadoUsina.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
            valorEstimadoUsina > 0 ? `• Custo estimado de manutenção (${percentualManutencao}%): R$ ${valorBaseManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
            valorEstimadoUsina > 0 ? `• A ausência de manutenção adequada pode comprometer significativamente o retorno sobre o investimento e a vida útil dos equipamentos.` : null,
        ].filter(Boolean).join('\n');

        const workDescription = servico.descricao
            ? servico.descricao
            : `Serviço de ${tipoLabel[servico.tipo]} para usina fotovoltaica ${usina.nome}, contemplando as atividades listadas na prestação de serviços.`;

        // Mapear displayMode do OeM para itemVisibilityMode do template PDF
        const visibilityModeMap: Record<string, string> = {
            com_valor: 'grouping',
            sem_valor: 'summary',
            texto: 'text_only',
        };
        const itemVisibilityMode = visibilityModeMap[globalDisplayMode] || 'grouping';

        // ── Validade da proposta (30 dias) ──
        const validUntilDate = new Date();
        validUntilDate.setDate(validUntilDate.getDate() + 30);
        const validUntil = validUntilDate.toISOString().split('T')[0];

        // ── Condições de pagamento ──
        const paymentConditions = 'O pagamento será realizado mediante apresentação de Nota Fiscal, por meio de boleto bancário, PIX ou transferência, com vencimento em até 10 (dez) dias úteis após a conclusão dos serviços e emissão do relatório técnico.';

        // ── Prazo de execução ──
        const workDeadlineDays = servico.tipo === 'corretiva' ? 5 : 15;
        const workDeadlineText = `Os serviços deverão ser executados no prazo de até ${workDeadlineDays} (${workDeadlineDays === 5 ? 'cinco' : 'quinze'}) dias úteis, contados a partir da aprovação desta proposta e liberação de acesso ao local.`;

        // ── Obrigações da CONTRATADA ──
        const contractorObligations = [
            '1. Executar os serviços com pessoal técnico qualificado, devidamente treinado e habilitado conforme NR-10 e NR-35.',
            '2. Fornecer todos os equipamentos de proteção individual (EPIs) e coletiva (EPCs) necessários à execução segura dos serviços.',
            '3. Utilizar ferramentas, instrumentos de medição e equipamentos adequados, calibrados e em perfeito estado de funcionamento.',
            '4. Emitir relatório técnico detalhado ao final de cada intervenção, contendo diagnóstico, ações realizadas, registro fotográfico e recomendações.',
            '5. Manter sigilo sobre informações técnicas e comerciais do CONTRATANTE.',
            '6. Comunicar imediatamente ao CONTRATANTE qualquer irregularidade ou risco identificado durante a execução dos serviços.',
        ].join('\n');

        // ── Obrigações do CONTRATANTE ──
        const clientObligations = [
            '1. Garantir o acesso seguro e desimpedido ao local da usina fotovoltaica na data agendada para a execução dos serviços.',
            '2. Disponibilizar ponto de energia elétrica e água quando necessário para a realização dos procedimentos de limpeza e testes.',
            '3. Fornecer informações técnicas relevantes sobre o sistema, incluindo projeto as-built, histórico de manutenções e credenciais de monitoramento, quando solicitado.',
            '4. Efetuar o pagamento nos termos e prazos estabelecidos nesta proposta.',
            '5. Informar previamente sobre quaisquer restrições de acesso, horários especiais ou normas internas do local.',
        ].join('\n');

        // ── Disposições gerais ──
        const generalProvisions = [
            `• Vigência: Esta proposta é válida por 30 (trinta) dias corridos a contar da data de emissão.`,
            `• Materiais de reposição: Caso sejam identificados componentes defeituosos que necessitem substituição, os custos de peças e materiais serão orçados separadamente, não estando incluídos no valor desta proposta.`,
            `• Cancelamento: Em caso de cancelamento pelo CONTRATANTE após o agendamento, será cobrada taxa de mobilização no valor de 20% do total da proposta.`,
            `• Garantia dos serviços: Os serviços executados possuem garantia de 90 (noventa) dias sobre a mão de obra, contados a partir da data de conclusão.`,
            `• Foro: Fica eleito o foro da Comarca de Recife/PE para dirimir eventuais litígios.`,
        ].join('\n');

        // ── Conformidade normativa ──
        const complianceText = [
            'Todos os serviços são executados em estrita conformidade com as normas técnicas vigentes:',
            '',
            '▸ NBR 16690 — Instalações elétricas de arranjos fotovoltaicos — Requisitos de projeto',
            '▸ NBR 5410 — Instalações elétricas de baixa tensão',
            '▸ NR-10 — Segurança em Instalações e Serviços em Eletricidade',
            '▸ NR-35 — Trabalho em Altura',
            '▸ IEC 62446 — Sistemas fotovoltaicos conectados à rede — Requisitos mínimos de documentação, ensaios de comissionamento e inspeção',
            '▸ IEC 61215 — Módulos fotovoltaicos de silício cristalino — Qualificação de projeto e homologação de tipo',
            '',
            'A equipe técnica mantém certificações atualizadas e segue protocolos de segurança rigorosos em todas as intervenções.',
        ].join('\n');

        // ── Endereço da usina ──
        const workAddress = usina.endereco || null;

        // ── Dados bancários da empresa (genérico, pode ser customizado) ──
        const paymentBank = 'Dados para pagamento serão informados na Nota Fiscal.';

        // ── Deadline textual ──
        const deadline = `${workDeadlineDays} dias úteis`;

        // ── PRICING ENGINE DATA (snapshot para o template) ──
        const geracaoEsperada = Number(usina.geracaoMensalEsperadaKwh || 0);
        const geracaoAtual = Number(usina.geracaoMensalAtualKwh || 0);
        const tarifaEnergia = Number(usina.tarifaEnergiaRsKwh || 0.60);
        const perdaKwh = geracaoEsperada > 0 && geracaoAtual > 0 ? +(geracaoEsperada - geracaoAtual).toFixed(2) : 0;
        const perdaPercentual = geracaoEsperada > 0 && geracaoAtual > 0 ? +((perdaKwh / geracaoEsperada) * 100).toFixed(1) : 0;
        const perdaFinanceiraEstimada = perdaKwh > 0 ? +(perdaKwh * tarifaEnergia).toFixed(2) : 0;

        const pricingEngineData = JSON.stringify({
            valorEstimadoUsina,
            percentualManutencao,
            valorBaseManutencao,
            geracaoEsperadaKwh: geracaoEsperada || null,
            geracaoAtualKwh: geracaoAtual || null,
            tarifaEnergiaRsKwh: tarifaEnergia,
            perdaKwh: perdaKwh || null,
            perdaPercentual: perdaPercentual || null,
            perdaFinanceiraEstimada: perdaFinanceiraEstimada || null,
            totalServico: totalProposta,
            itensPrecificados: items.map(it => ({ descricao: it.description, valor: it.total })),
        });

        // Criar proposta via SQL — agora com todos os campos enriquecidos
        const result = await this.dataSource.query(`
            INSERT INTO proposals (
                "proposalNumber", "title", "clientId", "status",
                "subtotal", "discount", "total",
                "activityType", "objectiveType", "scope",
                "workDescription", "notes",
                "itemVisibilityMode",
                "paymentConditions", "contractorObligations", "clientObligations",
                "generalProvisions", "complianceText",
                "validUntil", "deadline", "workAddress",
                "workDeadlineDays", "workDeadlineText",
                "paymentBank", "pricingEngineData",
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW())
            RETURNING id
        `, [
            proposalNumber,
            `${tipoLabel[servico.tipo] || 'Manutenção'} — ${usina.nome}`,
            servico.clienteId,
            'draft',
            totalProposta,
            0,
            totalProposta,
            activityTypeMap[servico.tipo] || 'manutencao_preventiva',
            'service_only',
            scope,
            workDescription,
            servico.observacoes || null,
            itemVisibilityMode,
            paymentConditions,
            contractorObligations,
            clientObligations,
            generalProvisions,
            complianceText,
            validUntil,
            deadline,
            workAddress,
            workDeadlineDays,
            workDeadlineText,
            paymentBank,
            pricingEngineData,
        ]);

        const proposalId = result[0].id;

        // Inserir itens
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            await this.dataSource.query(`
                INSERT INTO proposal_items (
                    "proposalId", "description", "unit", "serviceType",
                    "unitPrice", "quantity", "total", "showDetailedPrices",
                    "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [proposalId, it.description, it.unit, it.serviceType, it.unitPrice, it.quantity, it.total, it.showDetailedPrices]);
        }

        // Vincular proposta ao serviço
        servico.proposalId = proposalId;
        servico.status = 'agendado';
        await this.servicoRepo.save(servico);

        return { proposalId, proposalNumber, message: 'Proposta gerada com sucesso!' };
    }

    // ═══ LOOKUP REVERSO: serviço → proposta ═══════════════════════════
    async findServicoByProposalId(proposalId: string): Promise<any> {
        const servico = await this.servicoRepo.findOne({
            where: { proposalId },
            relations: ['usina', 'cliente'],
        });
        return servico || null;
    }

    // Gerar proposta a partir de um contrato/plano recorrente
    async gerarPropostaFromContrato(id: string): Promise<any> {
        const contrato = await this.findOneContrato(id);
        const usina = await this.findOneUsina(contrato.usinaId);
        const plano = await this.findOnePlano(contrato.planoId);

        const count = await this.dataSource.query(`SELECT COUNT(*) as total FROM proposals`);
        const num = (parseInt(count[0]?.total || '0') + 1).toString().padStart(4, '0');
        const proposalNumber = `OEM-PL-${new Date().getFullYear()}-${num}`;

        // Montar serviços do plano como itens
        const servicosIncluidos: string[] = [];
        if (plano.incluiLimpeza) servicosIncluidos.push('Limpeza dos módulos fotovoltaicos');
        if (plano.incluiInspecaoVisual) servicosIncluidos.push('Inspeção visual completa');
        if (plano.incluiTermografia) servicosIncluidos.push('Termografia infravermelha');
        if (plano.incluiTesteString) servicosIncluidos.push('Teste de string (curva I-V)');
        if (plano.incluiMonitoramentoRemoto) servicosIncluidos.push('Monitoramento remoto da geração');
        if (plano.incluiCorretivaPrioritaria) servicosIncluidos.push('Manutenção corretiva prioritária');

        // ── Escopo com dados do plano e SLA ──
        const slaHoras = Number(plano.tempoRespostaSlaHoras) || 48;
        const slaUrgente = Number(plano.tempoRespostaUrgenteHoras) || 4;
        const horarioAtend = plano.atendimentoHorario || 'comercial';
        const horarioLabel: Record<string, string> = { comercial: 'Horário Comercial', estendido: 'Horário Estendido', '24x7': '24 horas / 7 dias' };
        const duracaoMeses = Number(plano.termosDuracaoMeses) || 12;
        const frequencia = plano.frequenciaPreventiva || 'semestral';

        const scope = [
            `Contrato de O&M — Plano ${plano.nome}`,
            ``,
            `DADOS DO SISTEMA:`,
            `• Usina: ${usina.nome} (${usina.potenciaKwp} kWp)`,
            `• Módulos: ${usina.qtdModulos} unidades${usina.modeloModulos ? ` — ${usina.modeloModulos}` : ''}`,
            `• Inversores: ${usina.qtdInversores || 1} unidade(s)${usina.modeloInversores ? ` — ${usina.modeloInversores}` : ''}`,
            ``,
            `PARÂMETROS DO PLANO:`,
            `• Tipo: ${(plano.tipoPlano || 'standard').charAt(0).toUpperCase() + (plano.tipoPlano || 'standard').slice(1)}`,
            `• Frequência preventiva: ${frequencia}`,
            `• Duração do contrato: ${duracaoMeses} meses`,
            `• Valor mensal: R$ ${Number(contrato.valorMensal).toFixed(2)}`,
            ``,
            `SLA:`,
            `• Tempo de resposta normal: ${slaHoras}h`,
            `• Tempo de resposta urgente: ${slaUrgente}h`,
            `• Atendimento: ${horarioLabel[horarioAtend] || horarioAtend}`,
            plano.coberturaMaxAnual ? `• Cobertura máxima anual: R$ ${Number(plano.coberturaMaxAnual).toFixed(2)}` : null,
            plano.limiteCorretivas ? `• Corretivas incluídas: até ${plano.limiteCorretivas}/ano` : null,
            plano.abrangenciaKm ? `• Raio de atendimento: ${plano.abrangenciaKm} km` : null,
        ].filter(Boolean).join('\n');

        // ── Validade ──
        const validUntilDate = new Date();
        validUntilDate.setDate(validUntilDate.getDate() + 30);
        const validUntil = validUntilDate.toISOString().split('T')[0];

        // ── Condições de pagamento do plano ──
        const paymentConditions = `O pagamento será realizado mensalmente, até o dia 10 de cada mês subsequente ao da prestação dos serviços, por meio de boleto bancário, PIX ou transferência bancária. Valor mensal: R$ ${Number(contrato.valorMensal).toFixed(2)}.`;

        // ── Obrigações da CONTRATADA ──
        const contractorObligations = [
            '1. Executar os serviços com pessoal técnico qualificado, devidamente treinado e habilitado conforme NR-10 e NR-35.',
            '2. Fornecer todos os EPIs e EPCs necessários à execução segura dos serviços.',
            '3. Realizar as manutenções preventivas na frequência estipulada pelo plano contratado.',
            `4. Garantir tempo de resposta de até ${slaHoras}h para chamados normais e ${slaUrgente}h para chamados urgentes.`,
            '5. Emitir relatório técnico detalhado ao final de cada intervenção.',
            '6. Manter monitoramento remoto da geração (quando incluído no plano).',
            '7. Comunicar imediatamente ao CONTRATANTE qualquer irregularidade identificada.',
        ].join('\n');

        // ── Obrigações do CONTRATANTE ──
        const clientObligations = [
            '1. Garantir o acesso seguro ao local da usina nas datas agendadas.',
            '2. Disponibilizar ponto de energia elétrica e água quando necessário.',
            '3. Fornecer credenciais de acesso ao sistema de monitoramento.',
            '4. Efetuar o pagamento mensal nos termos e prazos estabelecidos.',
            '5. Informar previamente sobre restrições de acesso ou horários especiais.',
        ].join('\n');

        // ── Disposições gerais ──
        const generalProvisions = [
            `• Vigência: ${duracaoMeses} meses a contar da data de assinatura do contrato.`,
            `• Renovação: Automática por períodos iguais, salvo manifestação em contrário com 30 dias de antecedência.`,
            `• Reajuste: Anual pelo índice IGPM (FGV), aplicado na data de aniversário do contrato.`,
            `• Materiais de reposição: Peças e componentes defeituosos serão orçados separadamente.`,
            plano.exclusoes ? `• Exclusões: ${plano.exclusoes}` : null,
            `• Garantia dos serviços: 90 dias sobre mão de obra.`,
            `• Foro: Comarca de Recife/PE.`,
        ].filter(Boolean).join('\n');

        // ── Conformidade normativa ──
        const complianceText = [
            'Serviços executados em conformidade com:',
            '▸ NBR 16690 — Instalações elétricas de arranjos fotovoltaicos',
            '▸ NBR 5410 — Instalações elétricas de baixa tensão',
            '▸ NR-10 — Segurança em Instalações e Serviços em Eletricidade',
            '▸ NR-35 — Trabalho em Altura',
            '▸ IEC 62446 — Comissionamento e inspeção de sistemas FV',
            '▸ IEC 61215 — Módulos fotovoltaicos — Qualificação',
        ].join('\n');

        const result = await this.dataSource.query(`
            INSERT INTO proposals (
                "proposalNumber", "title", "clientId", "status",
                "subtotal", "discount", "total",
                "activityType", "objectiveType", "scope",
                "workDescription",
                "paymentConditions", "contractorObligations", "clientObligations",
                "generalProvisions", "complianceText",
                "validUntil", "deadline", "workAddress",
                "workDeadlineDays", "workDeadlineText",
                "paymentBank", "notes",
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
            RETURNING id
        `, [
            proposalNumber,
            `Plano O&M ${plano.nome} — ${usina.nome}`,
            contrato.clienteId,
            'draft',
            contrato.valorMensal,
            0,
            contrato.valorMensal,
            'plano_oem',
            'service_only',
            scope,
            `Plano de Operação & Manutenção ${plano.nome} para usina fotovoltaica`,
            paymentConditions,
            contractorObligations,
            clientObligations,
            generalProvisions,
            complianceText,
            validUntil,
            `${duracaoMeses} meses (contrato recorrente)`,
            usina.endereco || null,
            duracaoMeses * 30,
            `Contrato com vigência de ${duracaoMeses} meses, com manutenções preventivas na frequência ${frequencia}.`,
            'Dados para pagamento serão informados na Nota Fiscal.',
            plano.beneficios || null,
        ]);

        const proposalId = result[0].id;

        for (const desc of servicosIncluidos) {
            await this.dataSource.query(`
                INSERT INTO proposal_items (
                    "proposalId", "description", "unit", "serviceType",
                    "unitPrice", "quantity", "total", "showDetailedPrices",
                    "createdAt", "updatedAt"
                ) VALUES ($1, $2, 'sv', 'service', 0, 1, 0, true, NOW(), NOW())
            `, [proposalId, desc]);
        }

        return { proposalId, proposalNumber, message: 'Proposta do plano gerada com sucesso!' };
    }

    // ═══ CHECKLISTS PADRÃO ═══════════════════════════════════════════
    getDefaultChecklist(tipo: string): { item: string; checked: boolean; percentual: number; displayMode: string }[] {
        const checklists: Record<string, { item: string; checked: boolean; percentual: number; displayMode: string }[]> = {
            preventiva: [
                { item: 'Limpeza dos módulos fotovoltaicos', checked: false, percentual: 15, displayMode: 'com_valor' },
                { item: 'Inspeção visual de módulos e estrutura metálica', checked: false, percentual: 12, displayMode: 'com_valor' },
                { item: 'Verificação de cabos e conectores MC4', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Reaperto de conexões elétricas', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Limpeza e inspeção do(s) inversor(es)', checked: false, percentual: 12, displayMode: 'com_valor' },
                { item: 'Verificação do quadro de proteção CC/CA', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Verificação do sistema de aterramento', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Conferência do sistema de monitoramento', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Teste de funcionamento geral do sistema', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Registro fotográfico da instalação', checked: false, percentual: 5, displayMode: 'sem_valor' },
            ],
            preditiva: [
                { item: 'Termografia infravermelha dos módulos', checked: false, percentual: 15, displayMode: 'com_valor' },
                { item: 'Termografia dos conectores e junction boxes', checked: false, percentual: 12, displayMode: 'com_valor' },
                { item: 'Teste de string (curva I-V)', checked: false, percentual: 15, displayMode: 'com_valor' },
                { item: 'Medição de tensão e corrente por string', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Análise de performance ratio (PR)', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Análise de dados de monitoramento (últimos 3 meses)', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Verificação de degradação dos módulos', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Análise de sombreamento e sujidade', checked: false, percentual: 7, displayMode: 'com_valor' },
                { item: 'Inspeção do inversor com dados de logger', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Elaboração de relatório técnico com recomendações', checked: false, percentual: 7, displayMode: 'sem_valor' },
            ],
            corretiva: [
                { item: 'Identificação e localização do defeito', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Diagnóstico técnico detalhado', checked: false, percentual: 15, displayMode: 'com_valor' },
                { item: 'Verificação de garantia do equipamento', checked: false, percentual: 5, displayMode: 'sem_valor' },
                { item: 'Substituição/reparo do componente defeituoso', checked: false, percentual: 25, displayMode: 'com_valor' },
                { item: 'Teste de isolamento elétrico', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Teste de funcionamento pós-reparo', checked: false, percentual: 10, displayMode: 'com_valor' },
                { item: 'Verificação da geração após intervenção', checked: false, percentual: 8, displayMode: 'com_valor' },
                { item: 'Registro fotográfico antes e depois', checked: false, percentual: 5, displayMode: 'sem_valor' },
                { item: 'Elaboração de relatório técnico', checked: false, percentual: 7, displayMode: 'sem_valor' },
                { item: 'Atualização do histórico de manutenção', checked: false, percentual: 5, displayMode: 'sem_valor' },
            ],
        };
        return checklists[tipo] || checklists.preventiva;
    }

    getChecklistEndpoint(tipo: string) {
        return this.getDefaultChecklist(tipo);
    }

    // ═══ CÁLCULO DE PREÇO ════════════════════════════════════════════
    async calculatePrice(usinaId: string, planoId: string): Promise<any> {
        const usina = await this.findOneUsina(usinaId);
        const plano = await this.findOnePlano(planoId);

        const kwp = Number(usina.potenciaKwp) || 0;
        const precoBase = Number(plano.precoBaseMensal) || 0;
        const kwpLimite = Number(plano.kwpLimiteBase) || 10;
        const precoExcedente = Number(plano.precoKwpExcedente) || 0;
        const custoMobilizacao = Number(plano.custoMobilizacao) || 0;

        const kwpExcedente = Math.max(0, kwp - kwpLimite);
        const valorExcedente = kwpExcedente * precoExcedente;
        const valorMensal = precoBase + valorExcedente;

        let valorFaixas = 0;
        if (plano.faixasPreco && plano.faixasPreco.length > 0) {
            const qtdRef = plano.unidadeCobranca === 'módulo' ? usina.qtdModulos : kwp;
            let remaining = qtdRef;
            const sortedTiers = [...plano.faixasPreco].sort((a, b) => a.min - b.min);
            for (const faixa of sortedTiers) {
                if (remaining <= 0) break;
                const rangeMax = faixa.max ? faixa.max - faixa.min + 1 : remaining;
                const qty = Math.min(remaining, rangeMax);
                valorFaixas += qty * faixa.precoUnitario;
                remaining -= qty;
            }
        }

        const frequenciaAnual = { mensal: 12, trimestral: 4, semestral: 2, anual: 1 }[plano.frequenciaPreventiva] || 2;
        const custoMobilizacaoAnual = custoMobilizacao * frequenciaAnual;

        return {
            precoBase,
            kwpUsina: kwp,
            kwpLimite,
            kwpExcedente,
            precoExcedente,
            valorExcedente,
            valorFaixas: valorFaixas || null,
            custoMobilizacao,
            frequencia: plano.frequenciaPreventiva,
            frequenciaAnual,
            custoMobilizacaoAnual,
            totalAnual: (valorMensal * 12) + custoMobilizacaoAnual,
            valorMensal: Math.round(((valorMensal * 12 + custoMobilizacaoAnual) / 12) * 100) / 100,
        };
    }

    // ═══ DASHBOARD ═══════════════════════════════════════════════════
    async getDashboard(): Promise<any> {
        const [contratos, usinas, planos, servicos] = await Promise.all([
            this.contratoRepo.find({ relations: ['usina', 'plano', 'cliente'] }),
            this.usinaRepo.find(),
            this.planoRepo.find(),
            this.servicoRepo.find({ relations: ['usina', 'cliente'], order: { createdAt: 'DESC' } }),
        ]);
        const ativos = contratos.filter(c => c.status === 'ativo');
        const mrr = ativos.reduce((sum, c) => sum + Number(c.valorMensal || 0), 0);
        const totalKwp = usinas.reduce((sum, u) => sum + Number(u.potenciaKwp || 0), 0);

        const servPendentes = servicos.filter(s => s.status === 'pendente' || s.status === 'agendado');
        const servAndamento = servicos.filter(s => s.status === 'em_andamento');
        const servConcluidos = servicos.filter(s => s.status === 'concluido');

        const serviçosPorTipo = {
            preventiva: servicos.filter(s => s.tipo === 'preventiva').length,
            preditiva: servicos.filter(s => s.tipo === 'preditiva').length,
            corretiva: servicos.filter(s => s.tipo === 'corretiva').length,
        };

        return {
            contratosAtivos: ativos.length,
            totalContratos: contratos.length,
            totalUsinas: usinas.length,
            totalPlanos: planos.length,
            mrr,
            arr: mrr * 12,
            totalKwpGerenciado: totalKwp,
            contratosRecentes: ativos.slice(0, 5),
            // Serviços
            totalServicos: servicos.length,
            servicosPendentes: servPendentes.length,
            servicosEmAndamento: servAndamento.length,
            servicosConcluidos: servConcluidos.length,
            servicosPorTipo: serviçosPorTipo,
            servicosRecentes: servicos.slice(0, 8),
            // Revenue de serviços pontuais
            receitaServicos: servConcluidos.reduce((sum, s) => sum + Number(s.valorFinal || s.valorEstimado || 0), 0),
        };
    }

    // ═══ UTILS ════════════════════════════════════════════════════════
    private sanitizeUuids(data: any, fields: string[]) {
        for (const f of fields) {
            if (data[f] === '' || data[f] === 'none') data[f] = null;
        }
    }
}
