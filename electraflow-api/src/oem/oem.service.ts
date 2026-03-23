import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OemUsina } from './oem-usina.entity';
import { OemPlano } from './oem-plano.entity';
import { OemContrato } from './oem-contrato.entity';

@Injectable()
export class OemService {
    constructor(
        @InjectRepository(OemUsina)
        private usinaRepo: Repository<OemUsina>,
        @InjectRepository(OemPlano)
        private planoRepo: Repository<OemPlano>,
        @InjectRepository(OemContrato)
        private contratoRepo: Repository<OemContrato>,
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
        // Auto-calculate price if not explicitly set
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

        // Calculate with volume tiers if available
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
        const [contratos, usinas, planos] = await Promise.all([
            this.contratoRepo.find({ relations: ['usina', 'plano', 'cliente'] }),
            this.usinaRepo.find(),
            this.planoRepo.find(),
        ]);
        const ativos = contratos.filter(c => c.status === 'ativo');
        const mrr = ativos.reduce((sum, c) => sum + Number(c.valorMensal || 0), 0);
        const totalKwp = usinas.reduce((sum, u) => sum + Number(u.potenciaKwp || 0), 0);

        return {
            contratosAtivos: ativos.length,
            totalContratos: contratos.length,
            totalUsinas: usinas.length,
            totalPlanos: planos.length,
            mrr,
            arr: mrr * 12,
            totalKwpGerenciado: totalKwp,
            contratosRecentes: ativos.slice(0, 5),
        };
    }

    // ═══ UTILS ════════════════════════════════════════════════════════
    private sanitizeUuids(data: any, fields: string[]) {
        for (const f of fields) {
            if (data[f] === '' || data[f] === 'none') data[f] = null;
        }
    }
}
