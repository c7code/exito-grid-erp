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
                    observacoes TEXT,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    "deletedAt" TIMESTAMP
                )
            `);
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
            preventiva: 'manutencao_preventiva',
            preditiva: 'manutencao_preditiva',
            corretiva: 'manutencao_corretiva',
        };

        // Gerar número da proposta
        const count = await this.dataSource.query(`SELECT COUNT(*) as total FROM proposals`);
        const num = (parseInt(count[0]?.total || '0') + 1).toString().padStart(4, '0');
        const proposalNumber = `OEM-${new Date().getFullYear()}-${num}`;

        // Criar itens da proposta a partir do checklist
        const checklist = servico.checklist ? (typeof servico.checklist === 'string' ? JSON.parse(servico.checklist) : servico.checklist) : [];
        const activeItems = checklist.filter((c: any) => c.checked !== false);
        const valorTotal = Number(servico.valorEstimado || servico.valorFinal || 0);

        // Detectar displayMode global (todos os itens compartilham o mesmo)
        const globalDisplayMode = activeItems.length > 0 ? (activeItems[0].displayMode || 'com_valor') : 'com_valor';
        const showPrices = globalDisplayMode === 'com_valor';

        // Separar itens de valor direto e de percentual
        const directItems = activeItems.filter((c: any) => c.inputMode === 'valor');
        const percentItems = activeItems.filter((c: any) => c.inputMode !== 'valor');
        const somaDirectos = directItems.reduce((sum: number, c: any) => sum + (Number(c.valorDireto) || 0), 0);
        const valorRestante = Math.max(0, valorTotal - somaDirectos);
        const somaPercentuais = percentItems.reduce((sum: number, c: any) => sum + (Number(c.percentual) || 0), 0);

        // Distribuir valor
        let acumuladoPercent = 0;
        const items = activeItems.map((c: any, i: number) => {
            let itemPrice = 0;

            if (c.inputMode === 'valor') {
                // Valor direto digitado pelo usuário
                itemPrice = Number(c.valorDireto) || 0;
            } else if (valorRestante > 0) {
                // Distribuir valor restante por percentual
                if (somaPercentuais > 0) {
                    const pct = (Number(c.percentual) || 0) / somaPercentuais;
                    itemPrice = +(valorRestante * pct).toFixed(2);
                } else if (percentItems.length > 0) {
                    itemPrice = +(valorRestante / percentItems.length).toFixed(2);
                }
                acumuladoPercent += itemPrice;
                // Último item percentual absorve arredondamento
                const percentIdx = percentItems.indexOf(c);
                if (percentIdx === percentItems.length - 1 && valorRestante > 0) {
                    itemPrice = +(itemPrice + (valorRestante - acumuladoPercent)).toFixed(2);
                }
            }

            return {
                description: c.item,
                unit: 'sv',
                serviceType: 'service',
                unitPrice: showPrices ? itemPrice : 0,
                quantity: 1,
                total: showPrices ? itemPrice : 0,
                showDetailedPrices: showPrices,
            };
        });

        // Escopo detalhado com dados técnicos da usina
        const scope = [
            `${tipoLabel[servico.tipo]} para usina ${usina.nome} (${usina.potenciaKwp} kWp).`,
            ``,
            `DADOS TÉCNICOS DO SISTEMA:`,
            `• Potência: ${usina.potenciaKwp} kWp`,
            `• Módulos: ${usina.qtdModulos} unidades${usina.modeloModulos ? ` — ${usina.modeloModulos}` : ''}`,
            `• Inversores: ${usina.qtdInversores || 1} unidade(s)${usina.modeloInversores ? ` — ${usina.modeloInversores}` : ''}${usina.marcaInversor ? ` (${usina.marcaInversor})` : ''}`,
            usina.tipoTelhado ? `• Tipo de telhado: ${usina.tipoTelhado}` : null,
            usina.dataInstalacao ? `• Data de instalação: ${String(usina.dataInstalacao).split('T')[0]}` : null,
            ``,
            `Endereço: ${usina.endereco}`,
        ].filter(Boolean).join('\n');

        const workDescription = servico.descricao
            ? servico.descricao
            : `Serviço de ${tipoLabel[servico.tipo]} para usina fotovoltaica ${usina.nome}, contemplando as atividades listadas na prestação de serviços.`;

        // Criar proposta via SQL
        const result = await this.dataSource.query(`
            INSERT INTO proposals (
                "proposalNumber", "title", "clientId", "status",
                "subtotal", "discount", "total",
                "activityType", "objectiveType", "scope",
                "workDescription", "notes",
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING id
        `, [
            proposalNumber,
            `${tipoLabel[servico.tipo] || 'Manutenção'} — ${usina.nome}`,
            servico.clienteId,
            'draft',
            valorTotal,
            0,
            valorTotal,
            activityTypeMap[servico.tipo] || 'manutencao_preventiva',
            'service_only',
            scope,
            workDescription,
            servico.observacoes || null,
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

        const result = await this.dataSource.query(`
            INSERT INTO proposals (
                "proposalNumber", "title", "clientId", "status",
                "subtotal", "discount", "total",
                "activityType", "objectiveType", "scope",
                "workDescription",
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
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
            `Contrato de O&M — Plano ${plano.nome}\nUsina: ${usina.nome} (${usina.potenciaKwp} kWp)\nFrequência: ${plano.frequenciaPreventiva}\nValor mensal: R$ ${Number(contrato.valorMensal).toFixed(2)}`,
            `Plano de Operação & Manutenção ${plano.nome} para usina fotovoltaica`,
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
