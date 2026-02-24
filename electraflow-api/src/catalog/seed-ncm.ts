import { DataSource } from 'typeorm';
import { NcmCode } from './ncm.entity';

// ═══════════════════════════════════════════════════════════════
// Seed NCM — Códigos mais comuns para busca rápida
// ═══════════════════════════════════════════════════════════════

const NCM_DATA: { code: string; description: string }[] = [
    // ── ELÉTRICA / ELETRÔNICOS ──
    { code: '85444900', description: 'Outros condutores elétricos, para tensão não superior a 1.000V' },
    { code: '85444200', description: 'Condutores elétricos, para tensão não superior a 1.000V, munidos de peças de conexão' },
    { code: '85352100', description: 'Disjuntores, para tensão superior a 72,5kV' },
    { code: '85362000', description: 'Disjuntores automáticos' },
    { code: '85361000', description: 'Fusíveis e corta-circuitos de fusíveis' },
    { code: '85363000', description: 'Outros aparelhos para proteção de circuitos elétricos' },
    { code: '85369090', description: 'Outros aparelhos para interrupção, seccionamento, proteção, derivação, ligação ou conexão de circuitos elétricos' },
    { code: '85371099', description: 'Outros quadros, painéis, consoles, para tensão não superior a 1.000V' },
    { code: '85381000', description: 'Quadros, painéis, consoles, mesas, armários (cabinas) e suportes, para tensão > 1.000V' },
    { code: '85044090', description: 'Outros conversores estáticos' },
    { code: '85043400', description: 'Outros transformadores, de potência superior a 500kVA' },
    { code: '85043300', description: 'Outros transformadores, de potência 16kVA a 500kVA' },
    { code: '85015200', description: 'Outros motores de corrente alternada, polifásicos, de potência superior a 750W mas não superior a 75kW' },
    { code: '85030090', description: 'Outras partes para motores/geradores elétricos' },
    { code: '85340000', description: 'Circuitos impressos' },

    // ── CONSTRUÇÃO / MATERIAIS ──
    { code: '72142000', description: 'Barras de ferro ou aço, com nervuras, obtidas por laminagem a quente' },
    { code: '72131000', description: 'Fio-máquina de ferro ou aço, com entalhes' },
    { code: '73030000', description: 'Tubos e perfis ocos, de ferro fundido' },
    { code: '73066190', description: 'Outros tubos e perfis ocos, soldados, de seção quadrada ou retangular' },
    { code: '73083000', description: 'Portas, janelas e seus caixilhos, alizares e soleiras de ferro ou aço' },
    { code: '73084000', description: 'Material de andaimes, cofragens, escoras de ferro ou aço' },
    { code: '73089090', description: 'Outras construções e partes delas, de ferro ou aço' },
    { code: '73181500', description: 'Outros parafusos e pinos, de ferro ou aço' },
    { code: '73182200', description: 'Outras arruelas, de ferro ou aço' },
    { code: '73269090', description: 'Outras obras de ferro ou aço' },
    { code: '68109900', description: 'Outras obras de cimento, concreto ou pedra artificial' },
    { code: '25232900', description: 'Outros cimentos Portland' },
    { code: '69072300', description: 'Ladrilhos e placas (lajes) de cerâmica' },
    { code: '39251000', description: 'Reservatórios, cisternas, cubas e recipientes análogos, capacidade > 300l, de plásticos' },
    { code: '39221000', description: 'Banheiras, boxes e lavatórios, de plásticos' },

    // ── TINTAS / QUÍMICOS ──
    { code: '32091000', description: 'Tintas e vernizes à base de polímeros acrílicos' },
    { code: '32089090', description: 'Outras tintas e vernizes, à base de polímeros sintéticos' },
    { code: '38099190', description: 'Outros agentes de acabamento, aceleradores de tingimento' },

    // ── EQUIPAMENTOS / MÁQUINAS ──
    { code: '84261200', description: 'Pórticos sobre pneumáticos e pontes-guindastes' },
    { code: '84264900', description: 'Outros guindastes e gruas' },
    { code: '84271000', description: 'Empilhadeiras autopropulsadas, de motor elétrico' },
    { code: '84272000', description: 'Outras empilhadeiras autopropulsadas' },
    { code: '84291900', description: 'Outros bulldozers e angledozers' },
    { code: '84295200', description: 'Escavadoras com superestrutura giratória 360°' },
    { code: '87042190', description: 'Veículos para transporte de mercadorias, diesel, peso bruto <= 5t' },
    { code: '87041000', description: 'Dumpers para uso fora da rodovia' },
    { code: '84314990', description: 'Outras partes para máquinas e aparelhos de terraplanagem' },
    { code: '84812990', description: 'Outras válvulas para transmissões oleo-hidráulicas ou pneumáticas' },
    { code: '84131900', description: 'Outras bombas com dispositivo de medição' },
    { code: '84137099', description: 'Outras bombas centrífugas' },
    { code: '84818099', description: 'Outros dispositivos/torneiras, válvulas e semelhantes' },

    // ── FERRAMENTAS ──
    { code: '82032000', description: 'Alicates, tenazes, pinças e ferramentas semelhantes' },
    { code: '82041100', description: 'Chaves de porcas, manuais (de boca fixa)' },
    { code: '82055900', description: 'Outras ferramentas manuais' },
    { code: '82060000', description: 'Ferramentas de pelo menos duas das posições 82.02 a 82.05, em sortidos' },

    // ── TUBOS / CONEXÕES ──
    { code: '39172300', description: 'Tubos rígidos de polímeros de cloreto de vinila (PVC)' },
    { code: '39174000', description: 'Acessórios (conexões) de tubos, de plásticos' },
    { code: '73072300', description: 'Acessórios para tubos, de aço inoxidável' },
    { code: '73079900', description: 'Outros acessórios para tubos, de ferro ou aço' },

    // ── COMBUSTÍVEIS / ENERGIA ──
    { code: '27101259', description: 'Outros óleos diesel' },
    { code: '27101921', description: 'Óleos lubrificantes, sem aditivos' },
    { code: '27111300', description: 'Butanos liquefeitos' },

    // ── SEGURANÇA / EPI ──
    { code: '65061000', description: 'Capacetes de proteção' },
    { code: '40151100', description: 'Luvas de borracha para cirurgia' },
    { code: '40151900', description: 'Outras luvas, mitenes e semelhantes, de borracha vulcanizada' },
    { code: '62101020', description: 'Vestuário de proteção, de tecidos das pos. 56.02 ou 56.03' },
    { code: '90049090', description: 'Outros óculos de proteção ou correção' },

    // ── CABOS / CORDAS ──
    { code: '73121000', description: 'Cabos, de ferro ou aço, não isolados para uso elétrico' },
    { code: '56079000', description: 'Outros cordéis, cordas e cabos de fibras sintéticas' },

    // ── MEDIÇÃO / INSTRUMENTOS ──
    { code: '90303390', description: 'Outros instrumentos para medida de tensão, corrente, resistência' },
    { code: '90318099', description: 'Outros instrumentos de medida ou controle' },
    { code: '90141000', description: 'Bússolas e outros instrumentos de navegação' },

    // ── SERVIÇOS (NFS-e) ──
    { code: '00000000', description: 'Serviços em geral (NFS-e - sem NCM)' },

    // ── ILUMINAÇÃO ──
    { code: '94054090', description: 'Outros aparelhos de iluminação elétrica' },
    { code: '85395200', description: 'Módulos de LEDs' },
    { code: '85395100', description: 'Módulos de diodos emissores de luz (LED)' },

    // ── SOLDAGEM ──
    { code: '83112000', description: 'Fios/varetas revestidos para soldar, de metal comum' },
    { code: '84682000', description: 'Máquinas e aparelhos a gás, para soldagem' },
    { code: '85152900', description: 'Outras máquinas e aparelhos para soldadura de metais por resistência' },

    // ── HIDRÁULICA ──
    { code: '84122900', description: 'Outros motores hidráulicos' },
    { code: '84131100', description: 'Bombas para distribuição de combustíveis ou lubrificantes' },
    { code: '84133090', description: 'Outras bombas para combustíveis, lubrificantes ou líquidos de arrefecimento' },

    // ── ISOLAMENTO ──
    { code: '39191000', description: 'Chapas, folhas, tiras autoadesivas de plásticos, em rolos, largura <= 20cm' },
    { code: '85461000', description: 'Isoladores de vidro' },
    { code: '85462000', description: 'Isoladores de cerâmica' },

    // ── TELHAS / COBERTURAS ──
    { code: '76109000', description: 'Outras construções e partes delas, de alumínio; chapas, barras, perfis, tubos e semelhantes' },
    { code: '73089010', description: 'Torres e pórticos, de ferro fundido, ferro ou aço' },

    // ── TRANSPORTE ──
    { code: '87032310', description: 'Automóveis de passageiros, 1.500cm³ a 3.000cm³' },
    { code: '87019490', description: 'Outros tratores de potência > 130HP' },
    { code: '87163900', description: 'Outros reboques e semi-reboques para transporte de mercadorias' },

    // ── COMPRESSORES ──
    { code: '84143011', description: 'Compressores de ar, estacionários, de pistão' },
    { code: '84148090', description: 'Outros compressores de ar/gases' },

    // ── GERADORES ──
    { code: '85021390', description: 'Outros grupos eletrogêneos, de motor de pistão de diesel, potência > 375kVA' },
    { code: '85023100', description: 'Outros grupos eletrogêneos, de energia eólica' },

    // ── INFORMÁTICA ──
    { code: '84713012', description: 'Computadores portáteis (laptops, notebooks)' },
    { code: '84715010', description: 'Unidades de processamento de dados' },
    { code: '84717012', description: 'Unidades de memória (discos rígidos)' },
    { code: '84718000', description: 'Outras unidades de máquinas automáticas para processamento de dados' },
    { code: '85176299', description: 'Outros aparelhos para recepção/conversão de dados' },
];

export async function seedNcm(dataSource: DataSource): Promise<void> {
    const repo = dataSource.getRepository(NcmCode);

    const count = await repo.count();
    if (count > 0) {
        console.log(`NCM table already seeded with ${count} records. Skipping.`);
        return;
    }

    console.log(`Seeding ${NCM_DATA.length} NCM codes...`);

    const entities = NCM_DATA.map((item) => {
        const entity = new NcmCode();
        entity.code = item.code;
        entity.description = item.description;
        entity.chapter = item.code.substring(0, 2);
        return entity;
    });

    await repo.save(entities, { chunk: 50 });
    console.log(`✅ ${entities.length} NCM codes seeded successfully.`);
}
