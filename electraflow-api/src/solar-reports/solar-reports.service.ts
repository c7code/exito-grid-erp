import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SolarMonthlyReport } from './solar-monthly-report.entity';

@Injectable()
export class SolarReportsService {
    constructor(
        @InjectRepository(SolarMonthlyReport)
        private reportRepo: Repository<SolarMonthlyReport>,
        private dataSource: DataSource,
    ) {
        this.ensureTable();
    }

    private async ensureTable() {
        try {
            await this.dataSource.query(`
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
                );
            `);
            // Indices
            await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_smr_usina ON solar_monthly_reports("usinaId")`).catch(() => {});
            await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_smr_cliente ON solar_monthly_reports("clienteId")`).catch(() => {});
            await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_smr_mes ON solar_monthly_reports("mesReferencia")`).catch(() => {});
        } catch (e) {
            console.warn('solar_monthly_reports table check:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CRUD
    // ═══════════════════════════════════════════════════════════════════

    async findAll(filters?: { usinaId?: string; clienteId?: string; status?: string; mesReferencia?: string }) {
        const qb = this.reportRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.usina', 'usina')
            .leftJoinAndSelect('r.cliente', 'cliente')
            .where('r.deletedAt IS NULL')
            .orderBy('r.mesReferencia', 'DESC');

        if (filters?.usinaId) qb.andWhere('r.usinaId = :usinaId', { usinaId: filters.usinaId });
        if (filters?.clienteId) qb.andWhere('r.clienteId = :clienteId', { clienteId: filters.clienteId });
        if (filters?.status) qb.andWhere('r.status = :status', { status: filters.status });
        if (filters?.mesReferencia) qb.andWhere('r.mesReferencia = :mesReferencia', { mesReferencia: filters.mesReferencia });

        return qb.getMany();
    }

    async findOne(id: string) {
        const report = await this.reportRepo.findOne({
            where: { id },
            relations: ['usina', 'cliente'],
        });
        if (!report) throw new NotFoundException('Relatório não encontrado');
        return report;
    }

    async create(data: Partial<SolarMonthlyReport>) {
        // Se usinaId fornecido, buscar dados automáticos
        if (data.usinaId) {
            const usina = await this.dataSource.query(
                `SELECT u.*, c.name as "clienteName", c.document as "clienteDocument", c.email as "clienteEmail", c.phone as "clientePhone"
                 FROM oem_usinas u LEFT JOIN clients c ON u."clienteId" = c.id WHERE u.id = $1`,
                [data.usinaId]
            );
            if (usina.length > 0) {
                const u = usina[0];
                data.clienteId = data.clienteId || u.clienteId;
                data.geracaoEsperadaKwh = data.geracaoEsperadaKwh || Number(u.geracaoMensalEsperadaKwh || 0);

                // Snapshot da usina no momento
                data.usinaSnapshot = JSON.stringify({
                    nome: u.nome,
                    potenciaKwp: Number(u.potenciaKwp),
                    qtdModulos: u.qtdModulos,
                    modeloModulos: u.modeloModulos,
                    qtdInversores: u.qtdInversores,
                    modeloInversores: u.modeloInversores,
                    marcaInversor: u.marcaInversor,
                    endereco: u.endereco,
                    geracaoMensalEsperadaKwh: Number(u.geracaoMensalEsperadaKwh || 0),
                    tarifaEnergiaRsKwh: Number(u.tarifaEnergiaRsKwh || 0.75),
                    valorEstimadoUsina: Number(u.valorEstimadoUsina || 0),
                    clienteName: u.clienteName,
                    clienteDocument: u.clienteDocument,
                    clienteEmail: u.clienteEmail,
                    clientePhone: u.clientePhone,
                });
            }
        }

        const report = this.reportRepo.create(data);
        const saved = await this.reportRepo.save(report);
        return this.calculateAndSave(saved.id);
    }

    async update(id: string, data: Partial<SolarMonthlyReport>) {
        const report = await this.findOne(id);
        Object.assign(report, data);
        await this.reportRepo.save(report);
        return this.calculateAndSave(id);
    }

    async remove(id: string) {
        const report = await this.findOne(id);
        report.deletedAt = new Date();
        return this.reportRepo.save(report);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MOTOR DE CÁLCULO
    // ═══════════════════════════════════════════════════════════════════

    async calculateAndSave(id: string): Promise<SolarMonthlyReport> {
        const report = await this.findOne(id);
        let snapshot: any = {};
        try { snapshot = report.usinaSnapshot ? JSON.parse(report.usinaSnapshot) : {}; } catch { snapshot = {}; }

        const geracaoReal = Number(report.geracaoRealKwh || 0);
        const geracaoEsperada = Number(report.geracaoEsperadaKwh || snapshot.geracaoMensalEsperadaKwh || 0);
        const tarifa = Number(report.tarifaPraticadaRsKwh || snapshot.tarifaEnergiaRsKwh || 0.75);
        const potenciaKwp = Number(snapshot.potenciaKwp || 0);

        // Performance Ratio
        const pr = geracaoEsperada > 0 && geracaoReal > 0
            ? +((geracaoReal / geracaoEsperada) * 100).toFixed(2)
            : null;

        // Perda de geração
        const perdaKwh = geracaoEsperada > 0 && geracaoReal > 0
            ? +(geracaoEsperada - geracaoReal).toFixed(2)
            : null;

        // Perda financeira
        const perdaFinanceira = perdaKwh && perdaKwh > 0
            ? +(perdaKwh * tarifa).toFixed(2)
            : null;

        // Economia gerada
        const economia = geracaoReal > 0
            ? +(geracaoReal * tarifa).toFixed(2)
            : null;

        // HSP médio
        const mesRef = new Date(report.mesReferencia);
        const diasNoMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0).getDate();
        const hsp = potenciaKwp > 0 && geracaoReal > 0
            ? +(geracaoReal / potenciaKwp / diasNoMes).toFixed(2)
            : null;

        // Dias sem geração (da array diária)
        let diasSemGeracao = 0;
        try {
            const diaria = report.geracaoDiariaKwh ? JSON.parse(report.geracaoDiariaKwh) : [];
            diasSemGeracao = diaria.filter((d: any) => Number(d.kwh || d) === 0).length;
        } catch { diasSemGeracao = 0; }

        // Tarifa praticada (calcular se tiver dados da conta)
        const tarifaCalc = Number(report.consumoConcessionariaKwh || 0) > 0 && Number(report.valorContaRs || 0) > 0
            ? +(Number(report.valorContaRs) / Number(report.consumoConcessionariaKwh)).toFixed(4)
            : tarifa;

        // Variação vs mês anterior
        let variacaoAnterior: number | null = null;
        try {
            const anterior = await this.dataSource.query(
                `SELECT "geracaoRealKwh" FROM solar_monthly_reports
                 WHERE "usinaId" = $1 AND "mesReferencia" < $2 AND "deletedAt" IS NULL
                 ORDER BY "mesReferencia" DESC LIMIT 1`,
                [report.usinaId, report.mesReferencia]
            );
            if (anterior.length > 0 && Number(anterior[0].geracaoRealKwh) > 0 && geracaoReal > 0) {
                const geracaoAnterior = Number(anterior[0].geracaoRealKwh);
                variacaoAnterior = +(((geracaoReal - geracaoAnterior) / geracaoAnterior) * 100).toFixed(2);
            }
        } catch { /* ignore */ }

        // Status de desempenho
        let statusDesempenho = 'bom';
        if (pr !== null) {
            if (pr >= 90) statusDesempenho = 'bom';
            else if (pr >= 70) statusDesempenho = 'atencao';
            else statusDesempenho = 'critico';
        }

        // Resumo automático
        const usinaNome = snapshot.nome || 'Usina';
        const mesLabel = mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        let resumoAutomatico = '';
        const fmtNum = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtCurrency = (n: number) => `R$ ${fmtNum(n)}`;

        if (statusDesempenho === 'bom') {
            resumoAutomatico = `A usina ${usinaNome} apresentou excelente desempenho em ${mesLabel}, gerando ${fmtNum(geracaoReal)} kWh (${pr}% da meta esperada). `
                + (economia ? `A economia estimada no período foi de ${fmtCurrency(economia)}. ` : '')
                + `Nenhuma ação corretiva é necessária no momento. O sistema opera dentro dos parâmetros normais de eficiência.`;
        } else if (statusDesempenho === 'atencao') {
            resumoAutomatico = `A usina ${usinaNome} apresentou desempenho abaixo do esperado em ${mesLabel}, com ${pr}% da meta de geração. `
                + (perdaKwh && perdaKwh > 0 ? `Foram perdidos ${fmtNum(perdaKwh)} kWh` : '')
                + (perdaFinanceira && perdaFinanceira > 0 ? `, representando ~${fmtCurrency(perdaFinanceira)} em geração não realizada. ` : '. ')
                + `Recomenda-se verificação técnica dos equipamentos, análise de sombreamento e limpeza dos módulos.`;
        } else {
            resumoAutomatico = `⚠️ ALERTA: A usina ${usinaNome} teve desempenho crítico em ${mesLabel}, atingindo apenas ${pr}% da capacidade esperada. `
                + (perdaFinanceira && perdaFinanceira > 0 ? `A perda estimada é de ${fmtCurrency(perdaFinanceira)}/mês. ` : '')
                + `Uma inspeção técnica urgente é recomendada para identificar possíveis falhas nos inversores, sombreamento, degradação dos módulos ou problemas na rede.`
                + (diasSemGeracao > 0 ? ` Foram detectados ${diasSemGeracao} dia(s) sem geração no período.` : '');
        }

        // Salvar cálculos
        await this.reportRepo.update(id, {
            performanceRatio: pr,
            perdaGeracaoKwh: perdaKwh && perdaKwh > 0 ? perdaKwh : null,
            perdaFinanceiraRs: perdaFinanceira && perdaFinanceira > 0 ? perdaFinanceira : null,
            economiaGeradaRs: economia,
            hspMedio: hsp,
            diasSemGeracao,
            variacaoMesAnterior: variacaoAnterior,
            statusDesempenho: geracaoReal > 0 ? statusDesempenho : null,
            tarifaPraticadaRsKwh: tarifaCalc,
            resumoAutomatico,
        });

        return this.findOne(id);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PARSER CSV DE GERAÇÃO (Growatt / Sungrow / Genérico)
    // ═══════════════════════════════════════════════════════════════════

    parseGenerationCsv(csvContent: string): { totalKwh: number; diaria: { dia: number; kwh: number }[]; picoKw: number; fonte: string } {
        const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new BadRequestException('CSV vazio ou com formato inválido');

        const header = lines[0].toLowerCase();
        let totalKwh = 0;
        const diaria: { dia: number; kwh: number }[] = [];
        let picoKw = 0;
        let fonte = 'csv';

        // Detectar formato
        if (header.includes('energy') || header.includes('e_total') || header.includes('etoday')) {
            // Formato Growatt / Sungrow: date, energy(kwh), ...
            fonte = 'csv_growatt';
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''));
                if (cols.length < 2) continue;

                // Tentar encontrar coluna de energia
                const dateStr = cols[0];
                let kwh = 0;
                for (let j = 1; j < cols.length; j++) {
                    const val = parseFloat(cols[j].replace(',', '.'));
                    if (!isNaN(val) && val > 0 && val < 500) { // Max 500kWh/dia razoável
                        kwh = val;
                        break;
                    }
                }

                // Extrair dia
                const dateMatch = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
                const dia = dateMatch ? parseInt(dateMatch[1]) || parseInt(dateMatch[2]) : i;

                diaria.push({ dia, kwh: +kwh.toFixed(2) });
                totalKwh += kwh;

                // Pico (se houver coluna de potência)
                for (let j = 1; j < cols.length; j++) {
                    const val = parseFloat(cols[j].replace(',', '.'));
                    if (!isNaN(val) && val > picoKw && val < 100) { // Max 100kW razoável
                        picoKw = val;
                    }
                }
            }
        } else {
            // Formato genérico: tentar detectar colunas numéricas
            fonte = 'csv_generico';
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''));
                const nums = cols.map(c => parseFloat(c.replace(',', '.'))).filter(n => !isNaN(n) && n >= 0);
                if (nums.length > 0) {
                    const kwh = nums[0] < 500 ? nums[0] : 0;
                    diaria.push({ dia: i, kwh: +kwh.toFixed(2) });
                    totalKwh += kwh;
                }
            }
        }

        return {
            totalKwh: +totalKwh.toFixed(2),
            diaria,
            picoKw: +picoKw.toFixed(2),
            fonte,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PARSER PDF DA CONTA (concessionária genérica)
    // ═══════════════════════════════════════════════════════════════════

    parseBillText(text: string): {
        consumoKwh: number | null;
        injetadaKwh: number | null;
        creditosKwh: number | null;
        valorContaRs: number | null;
        numeroUC: string | null;
        concessionaria: string | null;
        confidence: number;
    } {
        const extractNum = (pattern: RegExp): number | null => {
            const match = text.match(pattern);
            if (!match) return null;
            return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        };

        // Detectar concessionária
        let concessionaria: string | null = null;
        const providers = [
            { name: 'CELPE', patterns: [/celpe/i, /neoenergia.*pernambuco/i] },
            { name: 'ENERGISA', patterns: [/energisa/i] },
            { name: 'CEMIG', patterns: [/cemig/i] },
            { name: 'ENEL', patterns: [/enel/i] },
            { name: 'CPFL', patterns: [/cpfl/i] },
            { name: 'LIGHT', patterns: [/light\s/i] },
            { name: 'COELBA', patterns: [/coelba/i] },
            { name: 'COSERN', patterns: [/cosern/i] },
            { name: 'EQUATORIAL', patterns: [/equatorial/i] },
            { name: 'NEOENERGIA', patterns: [/neoenergia/i] },
            { name: 'COPEL', patterns: [/copel/i] },
            { name: 'CELESC', patterns: [/celesc/i] },
        ];
        for (const p of providers) {
            if (p.patterns.some(rx => rx.test(text))) { concessionaria = p.name; break; }
        }

        // Patterns genéricos (funciona para maioria das concessionárias brasileiras)
        const consumoKwh = extractNum(/(?:consumo|energia\s*ativa|kwh\s*consumid)[^\d]*?([\d.,]+)\s*kwh/i)
            || extractNum(/kWh\s*[\s\S]{0,30}?([\d.,]+)/i);
        const injetadaKwh = extractNum(/(?:energia\s*injetada|injeção|geração\s*injetada)[^\d]*?([\d.,]+)/i);
        const creditosKwh = extractNum(/(?:saldo|crédito)[^\d]*?([\d.,]+)\s*kwh/i);
        const valorContaRs = extractNum(/(?:total\s*a\s*pagar|valor\s*total|total\s*fatura)[^\d]*?R?\$?\s*([\d.,]+)/i)
            || extractNum(/R\$\s*([\d.,]+)/i);
        const numeroUC = text.match(/(?:unidade\s*consumidora|UC|instalação)[^\d]*?(\d{5,15})/i)?.[1] || null;

        // Confiança baseada em quantos campos foram extraídos
        const fields = [consumoKwh, injetadaKwh, creditosKwh, valorContaRs, numeroUC];
        const found = fields.filter(f => f !== null).length;
        const confidence = Math.round((found / fields.length) * 100);

        return { consumoKwh, injetadaKwh, creditosKwh, valorContaRs, numeroUC, concessionaria, confidence };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HISTÓRICO POR USINA (para gráfico comparativo)
    // ═══════════════════════════════════════════════════════════════════

    async getHistory(usinaId: string, limit = 12) {
        return this.dataSource.query(
            `SELECT id, "mesReferencia", "geracaoRealKwh", "geracaoEsperadaKwh",
                    "performanceRatio", "statusDesempenho", "economiaGeradaRs",
                    "perdaGeracaoKwh", "perdaFinanceiraRs", "hspMedio",
                    "consumoConcessionariaKwh", "valorContaRs", status
             FROM solar_monthly_reports
             WHERE "usinaId" = $1 AND "deletedAt" IS NULL
             ORDER BY "mesReferencia" DESC
             LIMIT $2`,
            [usinaId, limit]
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PUBLICAR (mudar status)
    // ═══════════════════════════════════════════════════════════════════

    async publish(id: string) {
        await this.reportRepo.update(id, { status: 'publicado' });
        return this.findOne(id);
    }
}
