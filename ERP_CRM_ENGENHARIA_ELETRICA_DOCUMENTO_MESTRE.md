# ERP/CRM VERTICAL - ENGENHARIA ELÉTRICA & SOLAR
## Documento Mestre: Arquitetura, Produto, Negócio e Automação

**Versão:** 1.0  
**Data:** 2025-01-21  
**Status:** Documento Completo para Implementação  

---

# PARTE 1: VISÃO GERAL DO PRODUTO

## 1.1 O Que É Este Sistema

SaaS ERP/CRM **vertical especializado** para empresas de engenharia elétrica credenciadas no Brasil. O sistema integra:

- **Captação de leads** (portal + WhatsApp)
- **Gestão comercial completa** (CRM, propostas, contratos)
- **Execução operacional** (processos, checklists, documentos)
- **Integração com concessionárias** (protocolos, SLAs, pendências)
- **Automação inteligente** (n8n, regras de negócio)
- **Motor de cross-sell/up-sell** (aumento automático de ticket)

## 1.2 O Princípio Central: VENDER MELHOR AUTOMATICAMENTE

Este não é apenas um sistema de gestão. É uma **máquina de aumentar ticket médio**.

### Como Funciona

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOTOR DE UPGRADE/CROSS-SELL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CONTEXTO DO CLIENTE          →        RECOMENDAÇÃO INTELIGENTE           │
│                                                                             │
│   • Tipo de obra (PDE, rede, solar)    →    Pacotes complementares         │
│   • Tensão (BT/MT/AT)                  →    SPDA obrigatório               │
│   • Carga/potência estimada            →    Dimensionamento adequado       │
│   • Segmento (res/com/ind)             →    Manutenção recorrente          │
│   • Concessionária envolvida           →    Documentação específica        │
│   • Risco/localização                  →    Segurança premium              │
│   • Histórico do cliente               →    Renovação automática           │
│                                                                             │
│   RESULTADO: Sugestões pré-selecionadas na proposta + follow-up automático │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mecanismos de Aumento de Ticket

| Mecanismo | Como Funciona | Impacto Esperado |
|-----------|---------------|------------------|
| **Recomendações na Proposta** | Itens sugeridos já pré-selecionados | +15-25% ticket |
| **Pacotes Inteligentes** | Bundles otimizados por contexto | +20-30% conversão |
| **Follow-up Automático** | Sequências por inatividade | +10% fechamento |
| **Pós-venda Automatizado** | Ofertas no momento certo | +30% recorrência |
| **Alertas de Renovação** | Contato antes do vencimento | +40% retenção |

## 1.3 Catálogo de Pacotes (Ofertas Prontas)

### PACOTE 1 — "Conexão Segura"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | Projeto elétrico + Laudo + Ajustes de conformidade + checklist documentação |
| **Preço Referência** | R$ 2.500 - 8.000 (varia por complexidade) |
| **Regra de Indicação** | Sugerir SEMPRE que houver: ligação nova, aumento de carga, conexão, PDE |
| **Mensagem de Venda** | *"Garanta que sua instalação passe na primeira vistoria. Nosso pacote Conexão Segura inclui projeto, laudo e todos os ajustes necessários para aprovação imediata."* |

### PACOTE 2 — "PDE Completo"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | PDE BT/AT + ART + memorial + acompanhamento até aprovação |
| **Preço Referência** | R$ 3.500 - 15.000 (BT: 3,5-6k / AT: 8-15k) |
| **Regra de Indicação** | Sugerir quando cliente pedir: padrão, entrada, ligação nova |
| **Mensagem de Venda** | *"Deixe seu Padrão de Entrada com quem entende. Cuidamos de todo o projeto, documentação e acompanhamos até a ligação de energia."* |

### PACOTE 3 — "Rede e Doação (Concessionária)"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | Projeto de rede + obra + dossiê de doação + acompanhamento incorporação/conexão |
| **Preço Referência** | R$ 8.000 - 50.000 (varia por metragem e complexidade) |
| **Regra de Indicação** | Sugerir quando houver: ampliação, obra particular que será doada |
| **Mensagem de Venda** | *"Obra particular que será doada? Cuidamos de todo o processo: projeto, execução e documentação para incorporação pela concessionária."* |

### PACOTE 4 — "SPDA e Aterramento Premium"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | Projeto SPDA + medição/relatório + adequações |
| **Preço Referência** | R$ 1.500 - 12.000 (varia por área e nível de proteção) |
| **Regra de Indicação** | Sugerir para: comercial, condomínio, industrial OU quando houver risco |
| **Mensagem de Venda** | *"Proteja seu patrimônio. SPDA conforme NBR 5419 com medição de aterramento e laudo técnico inclusos."* |

### PACOTE 5 — "Monitoramento & Manutenção (Recorrência)"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | Inspeção periódica + laudos anuais + revisões + relatórios |
| **Preço Referência** | R$ 150-500/mês (contrato anual) |
| **Regra de Indicação** | Sugerir pós-entrega para gerar receita recorrente |
| **Mensagem de Venda** | *"Mantenha sua instalação sempre em dia. Contrato de manutenção com inspeções periódicas, laudos atualizados e prioridade no atendimento."* |

### PACOTE 6 — "Solar + Adequação Elétrica"
| Aspecto | Descrição |
|---------|-----------|
| **Inclui** | Estudo solar + projeto + adequação de entrada/carga + documentação |
| **Preço Referência** | R$ 5.000 - 25.000 (varia por kWp) |
| **Regra de Indicação** | Sugerir quando consumo estimado for alto e infraestrutura suportar |
| **Mensagem de Venda** | *"Reduza sua conta de energia em até 95%. Fazemos o estudo completo, projeto solar e todas as adequações elétricas necessárias."* |

---

# PARTE 2: FLUXOS PONTA A PONTA

## 2.1 FLUXO 1: PROJETO ELÉTRICO BT/MT/AT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - PROJETO ELÉTRICO BT/MT/AT                   │
└─────────────────────────────────────────────────────────────────────────────────┘

FASE 1: PRÉ-VENDA                    FASE 2: PROJETO
┌─────────────────┐                  ┌─────────────────┐
│ Lead Novo       │ ────────────────→│ Kickoff         │
│ (Portal/WA)     │   Qualificação   │ Levantamento    │
└────────┬────────┘                  │ Dimensionamento │
         │                          │ Plantas         │
         ▼                          │ Memorial        │
┌─────────────────┐                  │ Revisão interna │
│ Visita Técnica  │ ────────────────→│ ART + Entrega   │
│ (48h)           │   Proposta       │ Submissão       │
└────────┬────────┘   Aprovada      │ Concessionária  │
         │                          └────────┬────────┘
         ▼                                   │
┌─────────────────┐                          ▼
│ Proposta        │                  ┌─────────────────┐
│ (sugestões      │                  │ Aprovação       │
│  automáticas)   │                  │ Concessionária  │
└────────┬────────┘                  │ (SLA variável)  │
         │                          └────────┬────────┘
         ▼                                   │
┌─────────────────┐                          ▼
│ Contrato        │                  ┌─────────────────┐
│ Assinado        │                  │ Aprovado?       │
└─────────────────┘                  │ SIM → Execução  │
                                     │ NÃO → Ajustes   │
                                     └─────────────────┘
```

### FASE 1: PRÉ-VENDA (Lead → Proposta)

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 1.1 | Recepção do lead | Sistema/Comercial | 2h | - |
| 1.2 | Qualificação inicial | Comercial | 4h | Gate 1: Lead qualificado? |
| 1.3 | Análise de viabilidade técnica | Engenheiro | 24h | Gate 2: Viável tecnicamente? |
| 1.4 | Agendamento de visita técnica | Comercial | 4h | - |
| 1.5 | Visita técnica/levantamento | Engenheiro | 48h | Gate 3: Escopo definido? |
| 1.6 | Elaboração de proposta | Comercial/Engenharia | 48h | - |
| 1.7 | Apresentação e negociação | Comercial | 72h | Gate 4: Proposta aprovada? |

**Documentos Obrigatórios Fase 1:**
- [ ] Formulário de qualificação do cliente
- [ ] Documentos do cliente (RG, CPF/CNPJ, contrato social se PJ)
- [ ] Conta de energia atual (últimos 3 meses)
- [ ] Croqui/fotos do local
- [ ] Parecer técnico de viabilidade
- [ ] Proposta assinada

### FASE 2: PROJETO E APROVAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 2.1 | Kickoff do projeto | Engenheiro | 24h | Gate 5: Projeto autorizado? |
| 2.2 | Levantamento detalhado | Projetista | 48h | - |
| 2.3 | Dimensionamento elétrico | Projetista | 24h | - |
| 2.4 | Elaboração das plantas | Projetista CAD | 72h | - |
| 2.5 | Memorial descritivo | Engenheiro | 24h | - |
| 2.6 | Lista de materiais (BOM) | Projetista | 24h | - |
| 2.7 | Revisão técnica interna | Engenheiro Senior | 24h | Gate 6: Revisão aprovada? |
| 2.8 | Emissão da ART | Engenheiro | 48h | - |
| 2.9 | Entrega ao cliente | Comercial/Engenharia | 24h | Gate 7: Cliente aceitou? |
| 2.10 | Submissão à concessionária | Projetista | 48h | - |
| 2.11 | Acompanhamento de aprovação | Projetista | Variável | Gate 8: Aprovado pela concessionária? |
| 2.12 | Ajustes e reenvio (se necessário) | Projetista | 48h | - |

### FASE 3: EXECUÇÃO (Quando aplicável)

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 3.1 | Cotação de materiais | Compras | 48h | - |
| 3.2 | Aprovação de compra | Gestor/Cliente | 24h | Gate 9: Compra autorizada? |
| 3.3 | Aquisição de materiais | Compras | 72h | - |
| 3.4 | Programação da equipe | Produção | 24h | - |
| 3.5 | Execução da obra | Equipe de campo | Variável | - |
| 3.6 | Inspeção intermediária | Engenheiro | 24h | Gate 10: Execução conforme projeto? |
| 3.7 | Testes e comissionamento | Equipe técnica | 48h | - |
| 3.8 | Laudo de instalação | Engenheiro | 24h | Gate 11: Instalação aprovada? |

### FASE 4: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 4.1 | Documentação as built | Projetista | 48h | - |
| 4.2 | Treinamento do cliente | Engenheiro | 24h | - |
| 4.3 | Entrega documental final | Comercial | 24h | Gate 12: Entrega completa? |
| 4.4 | Emissão de nota fiscal | Financeiro | 24h | - |
| 4.5 | Solicitação de avaliação | Sistema | 72h | - |
| 4.6 | Ativação de monitoramento | Sistema | 30 dias | - |
| 4.7 | Contato de pós-venda | Comercial | 90 dias | - |

---

## 2.2 FLUXO 2: PDE (PADRÃO DE ENTRADA) BT/AT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - PDE BT/AT                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

FASE 1: PRÉ-VENDA                    FASE 2: PROJETO PDE
┌─────────────────┐                  ┌─────────────────┐
│ Lead PDE        │                  │ Coleta docs     │
│ Identificar     │ ────────────────→│ Levantamento    │
│ Concessionária  │   BT ou AT?      │ Dimensionamento │
└────────┬────────┘                  │ Projeto         │
         │                          │ Memorial        │
         ▼                          │ ART + Revisão   │
┌─────────────────┐                  │ Submissão       │
│ Análise Carga   │ ────────────────→│ Protocolo       │
│ Verificar Rede  │   Escopo         └────────┬────────┘
└────────┬────────┘   Aprovado                │
         │                                    ▼
         ▼                           ┌─────────────────┐
┌─────────────────┐                  │ Acompanhamento  │
│ Visita Técnica  │                  │ Status diário   │
│ Proposta        │                  │ Resposta        │
│ Contrato        │                  │ Exigências      │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Aprovado?       │
                                     │ SIM → Execução  │
                                     │ NÃO → Ajustes   │
                                     └─────────────────┘
```

### FASE 1: PRÉ-VENDA E QUALIFICAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 1.1 | Recepção do lead PDE | Comercial | 2h | - |
| 1.2 | Identificação da concessionária | Sistema/Comercial | Automático | - |
| 1.3 | Consulta de normas específicas | Projetista | 4h | - |
| 1.4 | Análise de carga e tensão | Engenheiro | 24h | Gate 1: BT ou AT? |
| 1.5 | Verificação de disponibilidade de rede | Projetista | 48h | Gate 2: Rede disponível? |
| 1.6 | Visita técnica ao local | Engenheiro | 48h | - |
| 1.7 | Definição de escopo | Engenheiro | 24h | Gate 3: Escopo aprovado? |
| 1.8 | Elaboração de proposta | Comercial | 48h | - |
| 1.9 | Aprovação comercial | Cliente | 72h | Gate 4: Contrato fechado? |

### FASE 2: PROJETO DO PDE (BT)

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 2.1 | Coleta de documentos do cliente | Comercial | 48h | - |
| 2.2 | Levantamento topográfico | Topógrafo/Projetista | 24h | - |
| 2.3 | Dimensionamento do padrão | Projetista | 24h | - |
| 2.4 | Elaboração do projeto executivo | Projetista | 48h | - |
| 2.5 | Memorial descritivo PDE | Engenheiro | 24h | - |
| 2.6 | ART de projeto | Engenheiro | 24h | - |
| 2.7 | Revisão técnica | Engenheiro Senior | 24h | Gate 5: Projeto aprovado internamente? |
| 2.8 | Submissão à concessionária | Projetista | 24h | - |

### FASE 3: ACOMPANHAMENTO DE APROVAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 3.1 | Acompanhamento de protocolo | Projetista | Diário | - |
| 3.2 | Resposta às exigências | Projetista | 48h | Gate 6: Exigências atendidas? |
| 3.3 | Aprovação final da concessionária | Concessionária | Variável | Gate 7: PDE aprovado? |
| 3.4 | Liberação para execução | Engenheiro | 24h | - |

### FASE 4: EXECUÇÃO DO PDE

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 4.1 | Cotação de materiais do padrão | Compras | 48h | - |
| 4.2 | Aprovação de compra | Cliente/Gestor | 24h | Gate 8: Compra autorizada? |
| 4.3 | Aquisição de materiais | Compras | 72h | - |
| 4.4 | Agendamento com concessionária | Projetista | 48h | - |
| 4.5 | Execução da obra do padrão | Equipe de campo | Variável | - |
| 4.6 | Vistoria da concessionária | Concessionária | Agendado | Gate 9: Vistoria aprovada? |
| 4.7 | Ligação de energia | Concessionária | Agendado | Gate 10: Energia liberada? |
| 4.8 | ART de execução | Engenheiro | 48h | - |

---

## 2.3 FLUXO 3: DOAÇÃO DE REDE + INCORPORAÇÃO + CONEXÃO + COMISSIONAMENTO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│         FLUXO COMPLETO - DOAÇÃO DE REDE E PROCESSOS CONCESSIONÁRIA              │
└─────────────────────────────────────────────────────────────────────────────────┘

FASE 1: QUALIFICAÇÃO                 FASE 2: PROJETO DE REDE
┌─────────────────┐                  ┌─────────────────┐
│ Lead Doação     │                  │ Levantamento    │
│ Identificar     │ ────────────────→│ Topográfico     │
│ Tipo Obra       │   Escopo         │ Georreferenciado│
└────────┬────────┘   Definido       │ Projeto Executivo
         │                          │ Memorial        │
         ▼                          │ Cálculos        │
┌─────────────────┐                  │ ART + Revisão   │
│ Verificação     │                  └────────┬────────┘
│ Viabilidade     │                           │
│ Concessionária  │                           ▼
└────────┬────────┘                  ┌─────────────────┐
         │                          │ Aprovação       │
         ▼                          │ Concessionária  │
┌─────────────────┐                  │ (Projeto)       │
│ Proposta        │                  └────────┬────────┘
│ Contrato        │                           │
└─────────────────┘                           ▼
                                     ┌─────────────────┐
                                     │ Aprovado?       │
                                     │ SIM → Execução  │
                                     │ NÃO → Ajustes   │
                                     └─────────────────┘
```

### FASE 1: QUALIFICAÇÃO E VIABILIDADE

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 1.1 | Recepção do lead (doação de rede) | Comercial | 2h | - |
| 1.2 | Identificação do tipo de obra | Engenheiro | 4h | Gate 1: Tipo de obra definido? |
| 1.3 | Consulta prévia na concessionária | Projetista | 48h | Gate 2: Viável tecnicamente? |
| 1.4 | Análise de viabilidade econômica | Comercial | 24h | Gate 3: Viável economicamente? |
| 1.5 | Definição de escopo completo | Engenheiro | 24h | Gate 4: Escopo aprovado? |
| 1.6 | Elaboração de proposta | Comercial | 48h | - |
| 1.7 | Negociação e fechamento | Comercial | 72h | Gate 5: Contrato assinado? |

### FASE 2: PROJETO DE REDE

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 2.1 | Levantamento topográfico detalhado | Topógrafo | 72h | - |
| 2.2 | Levantamento georreferenciado | Topógrafo | 48h | - |
| 2.3 | Dimensionamento da rede | Engenheiro | 48h | - |
| 2.4 | Elaboração do projeto executivo | Projetista | 5 dias | - |
| 2.5 | Memorial descritivo de rede | Engenheiro | 24h | - |
| 2.6 | Cálculos elétricos (queda, curto) | Engenheiro | 48h | - |
| 2.7 | ART de projeto de rede | Engenheiro | 24h | - |
| 2.8 | Revisão técnica interna | Engenheiro Senior | 48h | Gate 6: Projeto aprovado internamente? |
| 2.9 | Submissão à concessionária | Projetista | 24h | - |

### FASE 3: ACOMPANHAMENTO DE APROVAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 3.1 | Protocolo de entrada | Projetista | 24h | - |
| 3.2 | Acompanhamento de status | Projetista | Diário | - |
| 3.3 | Resposta às exigências | Projetista | 48h | Gate 7: Exigências atendidas? |
| 3.4 | Aprovação do projeto | Concessionária | Variável | Gate 8: Projeto aprovado? |
| 3.5 | Liberação para execução | Engenheiro | 24h | - |

### FASE 4: EXECUÇÃO DA OBRA

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 4.1 | Cotação de materiais | Compras | 48h | - |
| 4.2 | Aprovação de compra | Gestor/Cliente | 24h | Gate 9: Compra autorizada? |
| 4.3 | Aquisição de materiais | Compras | 5 dias | - |
| 4.4 | Programação da equipe | Produção | 24h | - |
| 4.5 | Execução da obra de rede | Equipe de campo | Variável | - |
| 4.6 | Inspeções intermediárias | Engenheiro | Semanal | Gate 10: Execução conforme projeto? |
| 4.7 | Testes e medições | Equipe técnica | 48h | - |
| 4.8 | Laudo de execução | Engenheiro | 48h | Gate 11: Obra aprovada internamente? |

### FASE 5: DOSSIÊ DE DOAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 5.1 | Documentação as built | Projetista | 48h | - |
| 5.2 | Memorial de doação | Engenheiro | 24h | - |
| 5.3 | ART de doação | Engenheiro | 24h | - |
| 5.4 | Dossiê completo de doação | Projetista | 48h | Gate 12: Dossiê completo? |
| 5.5 | Submissão do dossiê | Projetista | 24h | - |
| 5.6 | Acompanhamento de incorporação | Projetista | Semanal | Gate 13: Rede incorporada? |

### FASE 6: CONEXÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 6.1 | Solicitação de conexão | Projetista | 24h | - |
| 6.2 | Acompanhamento de protocolo | Projetista | Diário | - |
| 6.3 | Atendimento de exigências | Projetista | 48h | Gate 14: Exigências atendidas? |
| 6.4 | Aprovação de conexão | Concessionária | Variável | Gate 15: Conexão aprovada? |
| 6.5 | Agendamento de energização | Concessionária | Agendado | - |
| 6.6 | Energização | Concessionária | Agendado | Gate 16: Energia liberada? |

### FASE 7: COMISSIONAMENTO (Se aplicável)

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 7.1 | Testes de comissionamento | Equipe técnica | 48h | - |
| 7.2 | Protocolos de teste | Engenheiro | 24h | - |
| 7.3 | Laudo de comissionamento | Engenheiro | 48h | Gate 17: Comissionamento aprovado? |
| 7.4 | Entrega documental final | Comercial | 24h | - |

### FASE 8: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 8.1 | Entrega de documentação final | Comercial | 24h | Gate 18: Entrega completa? |
| 8.2 | Treinamento de operação | Engenheiro | 24h | - |
| 8.3 | Emissão de NF | Financeiro | 24h | - |
| 8.4 | Pesquisa de satisfação | Sistema | 72h | - |
| 8.5 | Ativação de suporte | Sistema | Imediato | - |
| 8.6 | Lembrete de manutenção | Sistema | 180 dias | - |

---

## 2.4 FLUXO 4: LAUDO E SPDA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - LAUDO E SPDA                                │
└─────────────────────────────────────────────────────────────────────────────────┘

FASE 1: SOLICITAÇÃO                  FASE 2: INSPEÇÃO/PROJETO
┌─────────────────┐                  ┌─────────────────┐
│ Solicitação     │                  │ Agendamento     │
│ Laudo/SPDA      │ ────────────────→│ Inspeção        │
│ (Portal/WA)     │   Qualificação   │ (fotos,         │
└────────┬────────┘                  │  medições)      │
         │                          └────────┬────────┘
         ▼                                   │
┌─────────────────┐                          ▼
│ Qualificação    │                  ┌─────────────────┐
│ Tipo de Laudo   │                  │ Elaboração      │
│ Prazo exigido   │                  │ Laudo/Projeto   │
└─────────────────┘                  │ SPDA            │
                                     │ ART             │
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Revisão         │
                                     │ Aprovação       │
                                     │ Interna         │
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Entrega         │
                                     │ Cliente         │
                                     │ NF              │
                                     └─────────────────┘
```

### FASE 1: SOLICITAÇÃO E QUALIFICAÇÃO

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 1.1 | Recepção da solicitação | Sistema/Comercial | 2h | - |
| 1.2 | Identificação do tipo de laudo | Comercial | 4h | Gate 1: Tipo de laudo definido? |
| 1.3 | Verificação de prazo exigido | Comercial | 2h | Gate 2: Prazo factível? |
| 1.4 | Coleta de informações prévias | Comercial | 24h | - |
| 1.5 | Elaboração de proposta | Comercial | 24h | - |
| 1.6 | Aprovação comercial | Cliente | 48h | Gate 3: Contrato fechado? |

### FASE 2: INSPEÇÃO/PROJETO SPDA

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 2.1 | Agendamento de inspeção | Comercial | 24h | - |
| 2.2 | Inspeção técnica no local | Engenheiro | Agendado | - |
| 2.3 | Fotos documentais | Engenheiro | Durante inspeção | - |
| 2.4 | Medições (aterramento, SPDA) | Engenheiro | Durante inspeção | - |
| 2.5 | Elaboração do laudo/projeto | Engenheiro | 48h | - |
| 2.6 | ART de laudo/SPDA | Engenheiro | 24h | - |
| 2.7 | Revisão técnica interna | Engenheiro Senior | 24h | Gate 4: Laudo aprovado internamente? |

### FASE 3: ENTREGA E ADEQUAÇÕES (Se aplicável)

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 3.1 | Entrega do laudo ao cliente | Comercial | 24h | Gate 5: Cliente aceitou? |
| 3.2 | Apresentação de não conformidades | Engenheiro | 24h | - |
| 3.3 | Proposta de adequações (se necessário) | Comercial | 48h | Gate 6: Adequações aprovadas? |
| 3.4 | Execução de adequações | Equipe técnica | Variável | Gate 7: Adequações concluídas? |
| 3.5 | Reinspeção e novo laudo | Engenheiro | 48h | Gate 8: Laudo final aprovado? |

### FASE 4: PÓS-VENDA

| Etapa | Atividade | Responsável | SLA | Gate |
|-------|-----------|-------------|-----|------|
| 4.1 | Emissão de NF | Financeiro | 24h | - |
| 4.2 | Pesquisa de satisfação | Sistema | 72h | - |
| 4.3 | Agendamento de renovação | Sistema | 11 meses | - |
| 4.4 | Contato de pós-venda | Comercial | 90 dias | - |

---

# PARTE 3: BACKLOG MVP PRIORIZADO (MoSCoW)

## 3.1 Legenda de Prioridade

| Código | Significado | Critério |
|--------|-------------|----------|
| **P1-P10** | Must Have | Crítico para lançamento - sem isso, não funciona |
| **P11-P20** | Should Have | Importante, mas não bloqueante |
| **P21-P30** | Could Have | Desejável, pode esperar |
| **Wont** | Won't Have | Futuro, fora do escopo atual |

## 3.2 Story Points (Fibonacci)

| Pontos | Complexidade | Exemplo |
|--------|--------------|---------|
| 1 | Trivial | Ajuste de campo |
| 2 | Simples | CRUD básico |
| 3 | Moderado | Integração simples |
| 5 | Complexo | Workflow multi-etapas |
| 8 | Muito Complexo | Motor de regras |
| 13 | Épico | Módulo completo |

---

## 3.3 MUST HAVE (P1-P10) - Core do MVP

### P1 - Portal de Solicitação Público
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-001 |
| **Funcionalidade** | Portal público para solicitação de orçamento com formulário inteligente |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Formulário com campos: nome, email, telefone, tipo de serviço (dropdown), descrição, upload de documentos (PDF, JPG, PNG até 10MB)<br>2. Validação de campos obrigatórios<br>3. Geração automática de lead no CRM<br>4. Envio de confirmação por email/WhatsApp<br>5. URL pública acessível sem login<br>6. Responsivo mobile |
| **Valor de Negócio** | Canal de aquisição primário - entrada de leads |

### P2 - Integração WhatsApp (Entrada)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-002 |
| **Funcionalidade** | Recebimento de solicitações via WhatsApp Business API |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Integração com WhatsApp Business API<br>2. Recebimento de mensagens e mídia<br>3. Criação automática de lead se número não existir<br>4. Vinculação a lead existente<br>5. Notificação no dashboard de novas mensagens<br>6. Histórico de conversa vinculado ao lead |
| **Valor de Negócio** | Canal preferido do cliente brasileiro - 70%+ das solicitações |

### P3 - CRM Pipeline Visual
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-003 |
| **Funcionalidade** | Kanban de pipeline com estágios configuráveis |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Visualização Kanban com drag-and-drop<br>2. Estágios padrão: Lead Novo → Qualificação → Visita → Proposta → Negociação → Fechado → Execução → Concluído<br>3. Cards com: nome, valor estimado, data, prioridade, tags<br>4. Filtros por estágio, responsável, data<br>5. Contador de oportunidades por estágio<br>6. Visualização de alertas (prazos, inatividade) |
| **Valor de Negócio** | Controle visual do funil de vendas - core do CRM |

### P4 - Cadastro e Gestão de Leads/Oportunidades
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-004 |
| **Funcionalidade** | CRUD completo de leads com campos específicos do setor |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Campos: nome, empresa, CPF/CNPJ, telefone, email, endereço completo<br>2. Tipo de cliente: residencial, comercial, industrial<br>3. Classificação: A (alto valor), B (médio), C (baixo)<br>4. Fonte do lead: portal, WhatsApp, indicação, prospecção<br>5. Histórico de interações<br>6. Conversão lead → oportunidade |
| **Valor de Negócio** | Base de dados de clientes potenciais |

### P5 - Motor de Processos - Estrutura Base
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-005 |
| **Funcionalidade** | Criação de processos operacionais com etapas e checklists |
| **MoSCoW** | Must |
| **Story Points** | 13 |
| **Critérios de Aceitação** | 1. Templates de processo por tipo de serviço<br>2. Etapas sequenciais com dependências<br>3. Checklist de tarefas por etapa<br>4. Responsável por etapa<br>5. Status: pendente, em andamento, concluído, bloqueado<br>6. Timeline visual do processo<br>7. Geração automática ao fechar oportunidade |
| **Valor de Negócio** | Padronização operacional - redução de erros |

### P6 - Templates de Propostas e Contratos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-006 |
| **Funcionalidade** | Geração de propostas e contratos a partir de templates |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Templates por pacote de serviço<br>2. Variáveis dinâmicas: {{cliente_nome}}, {{valor}}, {{prazo}}, etc.<br>3. Editor visual (rich text)<br>4. Geração PDF<br>5. Envio por email/WhatsApp<br>6. Status: rascunho, enviada, aceita, recusada<br>7. Histórico de versões |
| **Valor de Negócio** | Agilidade comercial - padronização |

### P7 - Gestão de Tarefas e Prazos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-007 |
| **Funcionalidade** | Sistema de tarefas com notificações e alertas |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Criação de tarefas vinculadas a processos/oportunidades<br>2. Prazos com alertas (3 dias, 1 dia, vencido)<br>3. Prioridade: alta, média, baixa<br>4. Responsável e observadores<br>5. Notificações: email, WhatsApp, in-app<br>6. Dashboard de tarefas pendentes<br>7. Tarefas recorrentes |
| **Valor de Negócio** | Controle de SLAs - não perder prazos |

### P8 - Upload e Versionamento de Documentos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-008 |
| **Funcionalidade** | Repositório de documentos com versionamento |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Upload múltiplo de arquivos<br>2. Categorias: projeto, laudo, ART, memorial, foto, contrato<br>3. Versionamento automático<br>4. Visualização de versões anteriores<br>5. Download e preview<br>6. Permissões por usuário<br>7. Vinculação a cliente/processos |
| **Valor de Negócio** | Rastreabilidade documental - compliance |

### P9 - Financeiro Básico - Contas a Receber
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-009 |
| **Funcionalidade** | Controle de medições e contas a receber |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Cadastro de parcelas por processo<br>2. Status: pendente, parcial, pago, atrasado<br>3. Data de vencimento e pagamento<br>4. Valor e observações<br>5. Alertas de vencimento<br>6. Relatório de inadimplência<br>7. Exportação para planilha |
| **Valor de Negócio** | Controle de caixa - saúde financeira |

### P10 - Rules Engine Simples (Cross-sell Base)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-010 |
| **Funcionalidade** | Motor de regras para sugestões de serviços adicionais |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Regras baseadas em: tipo de serviço, tensão, carga, risco<br>2. Sugestões automáticas na proposta<br>3. Exemplo: "PDE BT" → sugere "Laudo de Instalações"<br>4. Configuração de regras via interface<br>5. Score de relevância<br>6. Histórico de sugestões aceitas |
| **Valor de Negócio** | Vender melhor automaticamente - aumento de ticket |

---

## 3.4 SHOULD HAVE (P11-P20)

| ID | Funcionalidade | Story Points | Descrição Resumida |
|----|----------------|--------------|-------------------|
| P11 | Dashboard Executivo | 5 | Pipeline, financeiro, processos, alertas |
| P12 | Gestão de Concessionárias e Protocolos | 8 | Cadastro, protocolos, SLAs, alertas |
| P13 | Calendário de Visitas e Compromissos | 5 | Agendamento, lembretes, Google Calendar |
| P14 | Gestão de Fornecedores e Compras | 5 | Cadastro, cotações, comparativo |
| P15 | Histórico de Cliente (Timeline) | 3 | Timeline cronológica de interações |
| P16 | Campos Técnicos Específicos | 3 | Tensão, carga, consumo, concessionária |
| P17 | Relatórios Básicos | 5 | Pipeline, oportunidades, processos |
| P18 | Gestão de Usuários e Permissões | 5 | Perfis, permissões por módulo |
| P19 | Notificações Multi-canal | 5 | Email, WhatsApp, in-app configuráveis |
| P20 | Busca e Filtros Avançados | 3 | Filtros combinados, busca global |

---

## 3.5 COULD HAVE (P21-P30)

| ID | Funcionalidade | Story Points | Descrição Resumida |
|----|----------------|--------------|-------------------|
| P21 | Integração Google Calendar | 3 | Sincronização bidirecional |
| P22 | Integração Google Drive | 5 | Pastas automáticas, backup |
| P23 | Assinatura Digital | 8 | DocuSign/ClickSign integrado |
| P24 | Chat Interno | 5 | Comunicação entre equipe |
| P25 | Kanban de Tarefas | 3 | Visualização alternativa |
| P26 | Importação/Exportação CSV | 3 | Bulk operations |
| P27 | Templates de Email | 3 | Editor de templates |
| P28 | Log de Auditoria | 5 | Quem fez o quê e quando |
| P29 | API Pública | 8 | Documentação Swagger |
| P30 | Mobile App Básico | 13 | App para consulta simples |

---

## 3.6 Resumo do Backlog MVP

| Categoria | Itens | Story Points |
|-----------|-------|--------------|
| **Must Have (P1-P10)** | 10 funcionalidades | 71 pts |
| **Should Have (P11-P20)** | 10 funcionalidades | 50 pts |
| **Could Have (P21-P30)** | 10 funcionalidades | 38 pts |
| **Total MVP** | 30 funcionalidades | **159 pts** |

**Estimativa de Tempo:** 14-16 semanas (1 sprint = 1 semana, 10-12 pts/sprint)

---

# PARTE 4: REGRAS DO RULES ENGINE (Mínimo 20 Regras)

## 4.1 Regras de Cross-sell Obrigatório

### R001: PDE BT/AT → Sugere Conexão Segura
```
IF: tipo_servico IN ('pde_bt', 'pde_at')
THEN: 
  - Sugerir pacote "Conexão Segura"
  - Criar tarefa comercial "Apresentar benefícios do pacote"
  - Enviar WhatsApp: "Seu PDE inclui laudo técnico? Garanta aprovação de primeira!"
PRIORIDADE: Alta
```

### R002: Laudo Elétrico sem SPDA → Sugere SPDA
```
IF: tipo_servico = 'laudo_eletrico' AND cliente.spda_vigente = false
THEN:
  - Sugerir pacote "SPDA e Aterramento Premium"
  - Adicionar item na proposta: "Projeto SPDA + medição"
  - Enviar WhatsApp: "Você sabia que instalações sem SPDA podem ter problemas na vistoria?"
PRIORIDADE: Alta
```

### R003: Doação de Rede → Sugere SPDA + Checklist
```
IF: tipo_servico IN ('doacao_rede', 'obra_rede_concessionaria')
THEN:
  - Sugerir pacote "SPDA e Aterramento Premium"
  - Criar checklist "Dossiê de Doação"
  - Criar tarefa "Validar documentação com cliente"
  - Enviar WhatsApp: "Obras doadas exigem documentação específica. Podemos cuidar de tudo!"
PRIORIDADE: Alta
```

### R004: Aumento de Carga → Sugere PDE Completo + Conexão Segura
```
IF: tipo_servico = 'aumento_carga'
THEN:
  - Sugerir pacote "PDE Completo"
  - Sugerir pacote "Conexão Segura"
  - Disparar WhatsApp com mini-explicação do porquê
  - Criar tarefa "Agendar visita técnica"
PRIORIDADE: Alta
```

### R005: Laudo Vencido (>12 meses) → Renovação
```
IF: tipo_servico = 'laudo_eletrico' AND ultimo_laudo.data < (hoje - 12 meses)
THEN:
  - Sugerir "Renovação de Laudo"
  - Oferecer desconto de 10% para renovação
  - Criar oportunidade automática
  - Enviar WhatsApp: "Seu laudo vence em breve. Renove com antecedência e ganhe desconto!"
PRIORIDADE: Média
```

## 4.2 Regras por Segmento e Porte

### R006: Cliente Condomínio → Sugere Manutenção Recorrente
```
IF: cliente.segmento = 'condominio' AND processo.status = 'concluido'
THEN:
  - Sugerir pacote "Monitoramento & Manutenção"
  - Oferecer contrato anual com mensalidade
  - Enviar WhatsApp: "Condomínios precisam de manutenção periódica. Que tal um contrato de cuidado contínuo?"
  - Criar tarefa comercial para follow-up em 30 dias
PRIORIDADE: Alta
```

### R007: Cliente Industrial → Sugere PMOC + Manutenção
```
IF: cliente.segmento = 'industrial'
THEN:
  - Sugerir "PMOC - Plano de Manutenção"
  - Sugerir pacote "Monitoramento & Manutenção"
  - Destacar conformidade com NR-10
  - Enviar WhatsApp: "Indústrias precisam estar em dia com NR-10. Oferecemos PMOC completo."
PRIORIDADE: Alta
```

### R008: Cliente Comercial Grande → Sugere Contrato Anual
```
IF: cliente.segmento = 'comercial' AND cliente.porte = 'grande'
THEN:
  - Sugerir contrato de manutenção anual
  - Oferecer prioridade no atendimento
  - Enviar WhatsApp: "Empresas grandes não podem parar. Contrato de manutenção garante sua operação."
PRIORIDADE: Média
```

### R009: Loteamento/Condomínio Novo → Sugere Padronização
```
IF: obra.tipo = 'loteamento' OR obra.unidades > 10
THEN:
  - Sugerir "Padronização de Documentação"
  - Oferecer pacote para todas as unidades
  - Criar proposta em lote
  - Enviar WhatsApp: "Para empreendimentos com muitas unidades, oferecemos preços especiais."
PRIORIDADE: Média
```

## 4.3 Regras por Consumo e Solar

### R010: Alto Consumo (>1000 kWh) → Sugere Solar
```
IF: cliente.consumo_medio > 1000 AND obra.infraestrutura_suporta_solar = true
THEN:
  - Sugerir pacote "Solar + Adequação Elétrica"
  - Oferecer estudo solar gratuito
  - Enviar WhatsApp: "Sua conta de luz está alta? Economize até 95% com energia solar!"
  - Criar tarefa "Agendar visita para estudo solar"
PRIORIDADE: Alta
```

### R011: Projeto Elétrico + Alto Consumo → Bundle Solar
```
IF: tipo_servico = 'projeto_eletrico' AND cliente.consumo_medio > 500
THEN:
  - Sugerir bundle: "Projeto Elétrico + Estudo Solar"
  - Oferecer desconto de 15% no bundle
  - Adicionar ambos na proposta
  - Enviar WhatsApp: "Aproveite e já inclua o estudo solar no seu projeto!"
PRIORIDADE: Média
```

## 4.4 Regras por Concessionária

### R012: Neoenergia → Documentação Específica
```
IF: cliente.concessionaria = 'neoenergia'
THEN:
  - Adicionar checklist "Documentos Neoenergia"
  - Incluir itens específicos: certidão negativa, ART específica
  - Ajustar SLA para 15 dias úteis
  - Enviar WhatsApp: "Trabalhamos frequentemente com Neoenergia e conhecemos todos os requisitos."
PRIORIDADE: Média
```

### R013: Cemig → Processo Específico
```
IF: cliente.concessionaria = 'cemig'
THEN:
  - Adicionar checklist "Documentos Cemig"
  - Ajustar SLA para 20 dias úteis
  - Criar tarefa "Verificar disponibilidade de rede"
PRIORIDADE: Média
```

### R014: Enel → Requisitos Específicos
```
IF: cliente.concessionaria = 'enel'
THEN:
  - Adicionar checklist "Documentos Enel"
  - Ajustar SLA para 18 dias úteis
  - Incluir requisito de memorial específico
PRIORIDADE: Média
```

## 4.5 Regras de Pipeline e Follow-up

### R015: Lead Parado (>48h) → Follow-up Automático
```
IF: lead.status = 'novo' AND lead.data_criacao < (hoje - 48h) AND lead.sem_interacao = true
THEN:
  - Enviar WhatsApp: "Olá! Vi que solicitou orçamento. Posso tirar alguma dúvida?"
  - Criar tarefa comercial "Qualificar lead parado"
  - Aumentar prioridade para "Alta"
PRIORIDADE: Alta
```

### R016: Proposta Enviada sem Resposta (>72h) → Follow-up
```
IF: proposta.status = 'enviada' AND proposta.data_envio < (hoje - 72h)
THEN:
  - Enviar WhatsApp: "Oi! Enviamos sua proposta. Alguma dúvida? Estou aqui para ajudar!"
  - Criar tarefa "Ligar para cliente"
  - Adicionar nota: "Cliente não respondeu em 72h"
PRIORIDADE: Alta
```

### R017: Proposta Visualizada → Notificar Comercial
```
IF: proposta.visualizada = true AND proposta.notificacao_enviada = false
THEN:
  - Notificar comercial: "Cliente visualizou a proposta!"
  - Criar tarefa "Aguardar contato ou fazer follow-up em 24h"
  - Marcar proposta como "quente"
PRIORIDADE: Média
```

### R018: Cliente Pediu Desconto → Defender Valor
```
IF: proposta.negociacao.desconto_solicitado = true
THEN:
  - Criar tarefa "Defender valor - mostrar comparativo"
  - Enviar email com comparativo de mercado
  - Oferecer condição de pagamento melhor (ao invés de desconto)
  - Agendar call de negociação
PRIORIDADE: Média
```

## 4.6 Regras de Documentação

### R019: Documentos Pendentes (>24h) → Lembrete
```
IF: lead.documentos_pendentes > 0 AND lead.ultimo_lembrete < (hoje - 24h)
THEN:
  - Enviar WhatsApp: "Falta apenas alguns documentos para prosseguirmos. Pode enviar?"
  - Listar documentos faltantes
  - Criar tarefa "Cobrar documentos"
PRIORIDADE: Média
```

### R020: ART Pendente → Alerta
```
IF: processo.etapa = 'aguardando_art' AND processo.data_inicio_etapa < (hoje - 24h)
THEN:
  - Notificar engenheiro responsável
  - Escalar para gestor se > 48h
  - Atualizar status no dashboard
PRIORIDADE: Alta
```

## 4.7 Regras de Segurança

### R021: Tensão AT → SPDA Obrigatório
```
IF: obra.tensao = 'AT' AND cliente.spda_vigente = false
THEN:
  - Obrigar inclusão de SPDA na proposta
  - Bloquear avanço sem SPDA (configurável)
  - Enviar WhatsApp: "Instalações AT exigem SPDA conforme norma. Incluímos no projeto."
PRIORIDADE: Alta
```

### R022: Área > 1000m² → SPDA Recomendado
```
IF: obra.area > 1000 AND cliente.spda_vigente = false
THEN:
  - Sugerir fortemente SPDA
  - Explicar riscos de não ter
  - Oferecer parcelamento
PRIORIDADE: Média
```

### R023: Comercial/Industrial → Aterramento Reforçado
```
IF: cliente.segmento IN ('comercial', 'industrial')
THEN:
  - Sugerir "Aterramento Reforçado + Medições"
  - Destacar conformidade com NBR 5410
  - Adicionar como item opcional na proposta
PRIORIDADE: Média
```

## 4.8 Regras de Receita Recorrente

### R024: Pós-Entrega → Oferecer Manutenção
```
IF: processo.status = 'concluido' AND processo.data_conclusao = hoje
THEN:
  - Enviar WhatsApp: "Parabéns! Obra concluída. Que tal um contrato de manutenção?"
  - Sugerir pacote "Monitoramento & Manutenção"
  - Criar oportunidade para daqui 30 dias
  - Agendar follow-up
PRIORIDADE: Alta
```

### R025: 11 Meses Após Laudo → Renovação
```
IF: laudo.data_emissao = (hoje - 11 meses)
THEN:
  - Criar oportunidade "Renovação Laudo"
  - Enviar WhatsApp: "Seu laudo vence em 1 mês. Renove agora e garanta desconto!"
  - Notificar comercial
PRIORIDADE: Alta
```

## 4.9 Regras de Automação

### R026: Novo Lead → Sequência de Boas-vindas
```
IF: lead.status = 'novo' AND lead.origem = 'portal'
THEN:
  - Enviar WhatsApp imediato: "Obrigado pelo contato! Em breve nossa equipe entra em contato."
  - Enviar email com informações da empresa
  - Criar tarefa de qualificação
  - Agendar lembrete para 24h
PRIORIDADE: Alta
```

### R027: Proposta Aprovada → Onboarding Automático
```
IF: proposta.status = 'aceita'
THEN:
  - Criar processo operacional automaticamente
  - Criar pastas no Drive
  - Gerar checklist inicial
  - Enviar WhatsApp de onboarding: "Parabéns! Agora vamos cuidar de tudo para você."
  - Agendar kickoff
PRIORIDADE: Alta
```

### R028: SLA de Concessionária → Alerta
```
IF: protocolo.sla_percentual > 80 AND protocolo.status != 'concluido'
THEN:
  - Notificar gestor
  - Escalar para diretoria se > 100%
  - Enviar WhatsApp para cliente: "Estamos acompanhando seu processo diariamente."
PRIORIDADE: Alta
```

### R029: Cliente VIP → Atendimento Prioritário
```
IF: cliente.classificacao = 'A' OR cliente.segmento = 'industrial'
THEN:
  - Marcar todas as tarefas como "Alta Prioridade"
  - Notificar gestor em todas as etapas
  - Oferecer atendimento exclusivo
  - Reduzir SLAs em 50%
PRIORIDADE: Média
```

### R030: Indicação Recebida → Recompensa
```
IF: lead.origem = 'indicacao' AND lead.indicador_id != null
THEN:
  - Notificar indicador: "Obrigado pela indicação!"
  - Criar voucher de desconto para indicador
  - Se fechar negócio → gerar comissão
  - Enviar WhatsApp de agradecimento
PRIORIDADE: Baixa
```

---

# PARTE 5: AUTOMAÇÕES N8N ESSENCIAIS

## 5.1 Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CANAIS DE ENTRADA                                  │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│  Portal Web     │   WhatsApp      │     E-mail      │    Painel Admin       │
│  (Formulários)  │   (API Oficial) │   (SMTP/IMAP)   │    (CRM Interno)      │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         └─────────────────┴────────┬────────┴────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │         n8n (Core)            │
                    │   ┌─────────────────────┐     │
                    │   │  Webhook Listener   │     │
                    │   │  Schedule Triggers  │     │
                    │   │  Event Processors   │     │
                    │   └─────────────────────┘     │
                    └───────────────┬───────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────▼────────┐    ┌────────────▼────────────┐   ┌─────────▼──────────┐
│  COMUNICAÇÃO    │    │      DADOS/ARMAZENAMENTO │   │    SERVIÇOS        │
├─────────────────┤    ├─────────────────────────┤   ├────────────────────┤
│ • WhatsApp API  │    │ • PostgreSQL (ERP/CRM)  │   │ • Google Calendar  │
│ • SendGrid SMTP │    │ • Redis (Cache/Filas)   │   │ • Google Drive     │
│ • SMS (Zenvia)  │    │ • S3/MinIO (Documentos) │   │ • Emissor NF       │
└─────────────────┘    └─────────────────────────┘   └────────────────────┘
```

---

## 5.2 WORKFLOW A: Novo Lead

### Trigger
```json
{
  "name": "Webhook - Novo Lead",
  "type": "n8n-nodes-base.webhook",
  "httpMethod": "POST",
  "path": "webhook/novo-lead",
  "authentication": "headerAuth",
  "headerName": "X-API-Key"
}
```

### Fluxo Completo

| Ordem | Node | Ação | Configuração |
|-------|------|------|--------------|
| 1 | Webhook | Receber payload do lead | POST /webhook/novo-lead |
| 2 | Function | Validar dados obrigatórios | nome, telefone, tipo_obra |
| 3 | HTTP Request | Enriquecer dados | API de CEP, segmento |
| 4 | PostgreSQL | Criar lead no CRM | INSERT INTO leads |
| 5 | Function | Determinar segmento | Residencial/Comercial/Industrial |
| 6 | PostgreSQL | Criar tarefa de qualificação | INSERT INTO tasks |
| 7 | WhatsApp | Enviar confirmação | Mensagem de boas-vindas |
| 8 | Schedule | Agendar lembrete 24h | Wait node + condition |
| 9 | SendGrid | Notificar comercial | Email com dados do lead |

### Mensagem WhatsApp - Confirmação
```
Olá {{lead.nome}}! 👋

Obrigado por entrar em contato com a [NOME_EMPRESA]!

Recebemos sua solicitação de {{lead.tipo_obra}} e nossa equipe já está analisando.

⏰ *Prazo de resposta:* Em até 4 horas úteis

📋 *Próximos passos:*
1. Nosso time vai analisar sua solicitação
2. Entraremos em contato para entender melhor sua necessidade
3. Prepararemos uma proposta personalizada

*Documentos que podemos precisar:*
- CPF/CNPJ
- Conta de energia recente
- Fotos do local (se aplicável)

Qualquer dúvida, é só responder aqui! 💡
```

### Mensagem WhatsApp - Lembrete 24h (se não qualificado)
```
Olá {{lead.nome}}!

Notamos que você solicitou um orçamento, mas ainda não conseguimos falar com você.

Posso ajudar com alguma dúvida? Estamos prontos para atender você! ⚡

👉 *Responda aqui ou ligue: [TELEFONE]*
```

---

## 5.3 WORKFLOW B: Proposta Enviada

### Trigger
```json
{
  "name": "Trigger - Proposta Enviada",
  "type": "n8n-nodes-base.postgresTrigger",
  "table": "proposals",
  "event": "UPDATE",
  "condition": "status = 'enviada'"
}
```

### Fluxo Completo

| Ordem | Node | Ação | Timing |
|-------|------|------|--------|
| 1 | Postgres Trigger | Detectar proposta enviada | Imediato |
| 2 | Function | Gerar link de tracking | UUID único |
| 3 | SendGrid | Enviar proposta por email | Imediato |
| 4 | WhatsApp | Notificar cliente | Imediato |
| 5 | Schedule | Agendar follow-up D+1 | +24h |
| 6 | Schedule | Agendar follow-up D+3 | +72h |
| 7 | Schedule | Agendar follow-up D+7 | +7 dias |
| 8 | PostgreSQL | Atualizar status proposta | Após cada ação |

### Sequência de Follow-up

**D+1 - Primeiro Contato**
```
Olá {{cliente.nome}}!

Você recebeu nossa proposta para {{obra.tipo}}? 📄

*Valor:* R$ {{proposta.valor}}
*Prazo:* {{proposta.prazo}} dias úteis

Posso tirar alguma dúvida? Estou aqui para ajudar! 😊

👉 *Para aceitar, basta responder "APROVO"*
```

**D+3 - Segundo Contato**
```
Oi {{cliente.nome}}!

Vi que você ainda não respondeu à nossa proposta.

*Lembrando:* R$ {{proposta.valor}} para {{obra.tipo}}

*Diferenciais incluídos:*
✅ {{diferencial_1}}
✅ {{diferencial_2}}
✅ {{diferencial_3}}

Posso fazer algum ajuste para você? 💡
```

**D+7 - Último Contato**
```
Olá {{cliente.nome}}!

Nossa proposta para {{obra.tipo}} ainda está disponível! 🎯

*Valor:* R$ {{proposta.valor}}

Esta é uma oportunidade especial. Posso ligar para conversarmos?

👉 *Responda SIM para receber uma ligação*
```

---

## 5.4 WORKFLOW C: Fechado/Ganhou

### Trigger
```json
{
  "name": "Trigger - Contrato Assinado",
  "type": "n8n-nodes-base.postgresTrigger",
  "table": "opportunities",
  "event": "UPDATE",
  "condition": "status = 'fechado_ganho'"
}
```

### Fluxo Completo

| Ordem | Node | Ação | Saída |
|-------|------|------|-------|
| 1 | Postgres Trigger | Detectar fechamento | - |
| 2 | PostgreSQL | Buscar template de workflow | workflow_template_id |
| 3 | PostgreSQL | Criar processo operacional | process_order_id |
| 4 | PostgreSQL | Criar etapas do processo | stage_instances |
| 5 | PostgreSQL | Criar checklists | checklist_instances |
| 6 | HTTP Request | Criar pastas no Google Drive | folder_id |
| 7 | PostgreSQL | Criar tarefas da equipe | tasks |
| 8 | Function | Agendar vistoria (se necessário) | event_date |
| 9 | WhatsApp | Enviar onboarding do cliente | Mensagem de boas-vindas |
| 10 | SendGrid | Enviar email de confirmação | Email detalhado |
| 11 | PostgreSQL | Atualizar pipeline | Mover para "Execução" |

### Mensagem WhatsApp - Onboarding
```
Parabéns {{cliente.nome}}! 🎉

Sua contratação foi confirmada e já estamos começando!

*O que acontece agora:*

📋 *Fase 1: Documentação*
- Vamos solicitar alguns documentos
- Prazo: 48 horas

🔍 *Fase 2: Levantamento*
- Agendaremos visita técnica
- Prazo: 5 dias úteis

📐 *Fase 3: Projeto*
- Elaboração e aprovação
- Prazo: {{prazo_projeto}} dias

*Responsável pelo seu projeto:*
👤 {{engenheiro.nome}}
📞 {{engenheiro.telefone}}
📧 {{engenheiro.email}}

*Acompanhe tudo em:*
{{link_portal}}

Dúvidas? Estamos aqui! 💡
```

---

## 5.5 WORKFLOW D: Pendência Concessionária

### Trigger
```json
{
  "name": "Trigger - Pendência Concessionária",
  "type": "n8n-nodes-base.postgresTrigger",
  "table": "stage_instances",
  "event": "UPDATE",
  "condition": "status = 'aguardando_concessionaria'"
}
```

### Fluxo Completo

| Ordem | Node | Ação | Frequência |
|-------|------|------|------------|
| 1 | Postgres Trigger | Detectar etapa bloqueada | Imediato |
| 2 | PostgreSQL | Buscar SLA da concessionária | sla_dias |
| 3 | PostgreSQL | Criar protocolo | protocol_id |
| 4 | Schedule | Lembrete semanal | A cada 7 dias |
| 5 | Function | Calcular SLA percentual | % concluído |
| 6 | IF | SLA > 80%? | Condição |
| 7 | SendGrid | Notificar gestor (se > 80%) | Email alerta |
| 8 | IF | SLA > 100%? | Condição |
| 9 | WhatsApp | Notificar cliente (se > 100%) | Mensagem status |
| 10 | PostgreSQL | Escalar ticket | priority = 'high' |

### SLA por Concessionária

| Concessionária | SLA Padrão | Alerta 80% | Escalação 100% |
|----------------|------------|------------|----------------|
| Neoenergia | 15 dias úteis | 12 dias | 15 dias |
| Cemig | 20 dias úteis | 16 dias | 20 dias |
| Enel | 18 dias úteis | 14 dias | 18 dias |
| CPFL | 15 dias úteis | 12 dias | 15 dias |
| Outras | 20 dias úteis | 16 dias | 20 dias |

### Mensagem WhatsApp - Status para Cliente (SLA > 100%)
```
Olá {{cliente.nome}}!

Passando para atualizar sobre o andamento do seu projeto. 📋

*Status:* Aguardando retorno da {{concessionaria.nome}}

*Protocolo:* {{protocolo.numero}}
*Data de abertura:* {{protocolo.data}}

Sabemos que o prazo está apertado e estamos *cobrando diariamente* um posicionamento da concessionária.

*Nossa ação:*
✅ Protocolo de cobrança formal enviado
✅ Contato diário com o setor de análise
✅ Gestor acompanhando pessoalmente

*Assim que tivermos retorno, avisamos imediatamente!*

Agradecemos a paciência. Estamos do seu lado! 💪
```

---

## 5.6 WORKFLOW E: Entrega Concluída (Up-sell)

### Trigger
```json
{
  "name": "Trigger - Processo Concluído",
  "type": "n8n-nodes-base.postgresTrigger",
  "table": "process_orders",
  "event": "UPDATE",
  "condition": "status = 'concluido'"
}
```

### Fluxo Completo

| Ordem | Node | Ação | Timing |
|-------|------|------|--------|
| 1 | Postgres Trigger | Detectar conclusão | Imediato |
| 2 | Function | Rodar Rules Engine | Sugestões |
| 3 | PostgreSQL | Criar oportunidades de up-sell | opportunities |
| 4 | WhatsApp | Oferecer manutenção | Imediato |
| 5 | Schedule | Follow-up 30 dias | +30 dias |
| 6 | WhatsApp | Solicitar indicação | +7 dias |
| 7 | PostgreSQL | Criar campanha de indicação | campaign_id |
| 8 | SendGrid | Email de satisfação | Imediato |

### Mensagem WhatsApp - Oferta de Manutenção
```
Parabéns {{cliente.nome}}! 🎉

Sua obra foi concluída com sucesso!

*Agora, que tal garantir que tudo continue funcionando perfeitamente?*

🔧 *Plano de Manutenção [NOME_EMPRESA]*

✅ Inspeções periódicas
✅ Laudos anuais atualizados
✅ Prioridade no atendimento
✅ Descontos em serviços adicionais

*A partir de R$ 150/mês*

👉 *Quer saber mais? Responda MANUTENÇÃO*
```

### Mensagem WhatsApp - Solicitação de Indicação
```
Oi {{cliente.nome}}!

Espero que esteja tudo bem com sua instalação! 😊

*Você conhece alguém que precisa de serviços elétricos?*

Indique e ganhe *R$ 200* para cada negócio fechado!

👉 *Responda INDIQUE para receber seu link*

Agradecemos a confiança! 💡
```

---

## 5.7 WORKFLOW F: Renovação/Recorrência

### Trigger
```json
{
  "name": "Schedule - Renovação",
  "type": "n8n-nodes-base.scheduleTrigger",
  "rule": {
    "interval": [{
      "field": "day",
      "expression": "0 9 * * *"
    }]
  }
}
```

### Fluxo Completo

| Ordem | Node | Ação | Condição |
|-------|------|------|----------|
| 1 | Schedule | Executar diariamente às 9h | - |
| 2 | PostgreSQL | Buscar laudos com 11 meses | data_emissao = hoje - 11 meses |
| 3 | PostgreSQL | Criar oportunidade "Renovação" | opportunity_id |
| 4 | WhatsApp | Enviar oferta de renovação | Mensagem personalizada |
| 5 | PostgreSQL | Notificar comercial | task_id |
| 6 | Schedule | Lembrete 30 dias | +30 dias |
| 7 | Schedule | Lembrete 15 dias | +45 dias |
| 8 | IF | Cliente não respondeu? | Condição |
| 9 | WhatsApp | Último lembrete | +60 dias |

### Mensagem WhatsApp - Renovação de Laudo
```
Olá {{cliente.nome}}!

Passando para lembrar que seu *laudo técnico* vence em aproximadamente 1 mês. 📋

*Renove agora e garanta:*
✅ 10% de desconto na renovação antecipada
✅ Prioridade na agenda
✅ Sem interrupção na validade

*Laudo atual:* {{laudo.tipo}}
*Data de vencimento:* {{laudo.vencimento}}

👉 *Quer renovar? Responda RENOVO*

Evite problemas com a concessionária! ⚡
```

---

## 5.8 Configuração do Ambiente n8n

### Docker Compose
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}/
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

volumes:
  n8n_data:
  postgres_data:
  redis_data:
```

### Variáveis de Ambiente
```bash
# n8n
N8N_HOST=automation.suaempresa.com.br
N8N_PASSWORD=senha_segura_aqui

# Banco de Dados
DB_PASSWORD=senha_postgres_aqui

# APIs
API_KEY_WEBHOOK=webhook_secret_key
API_URL_ERP=https://api.suaempresa.com.br

# WhatsApp
WHATSAPP_API_URL=https://api.evolution.com.br
WHATSAPP_API_KEY=evolution_api_key

# Email
SENDGRID_API_KEY=SG.xxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=sendgrid_key

# Google
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://automation.suaempresa.com.br/google/callback
```

---

# PARTE 6: ARQUITETURA TÉCNICA RESUMIDA

## 6.1 Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Next.js + Tailwind | SSR, SEO, performance |
| **Backend** | NestJS (Node.js) | Modular, TypeScript, cloud-native |
| **Banco de Dados** | PostgreSQL | ACID, JSONB, full-text search |
| **Cache** | Redis | Sessions, cache, filas |
| **Storage** | AWS S3 | Documentos, backups |
| **Fila** | BullMQ (Redis) | Jobs assíncronos |
| **Automação** | n8n | Workflows visuais |
| **WhatsApp** | Evolution API | API oficial |
| **Email** | SendGrid | Deliverability |
| **Auth** | JWT + RBAC | Segurança |
| **Infra** | Docker + AWS ECS | Escalabilidade |

## 6.2 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Web App     │  │  Mobile PWA  │  │  Portal      │  │  WhatsApp API   │ │
│  │  (Next.js)   │  │  (Next.js)   │  │  Cliente     │  │  (Evolution)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GATEWAY & CDN                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CloudFront / Cloudflare (CDN + WAF + Rate Limiting + SSL)             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Load Balancer (ALB/NGINX)                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │                                   ▼                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ API Pod 1   │  │ API Pod 2   │  │ API Pod 3   │  │ API Pod N   │  │ │
│  │  │ (NestJS)    │  │ (NestJS)    │  │ (NestJS)    │  │ (NestJS)    │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │                    Auto-scaling (HPA/KEDA)                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│   DATA LAYER        │  │   MESSAGE QUEUE     │  │   AUTOMATION LAYER      │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────────┤
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────────┐ │
│ │ PostgreSQL      │ │  │ │ Redis           │ │  │ │ n8n Workflow Engine │ │
│ │ (Primary)       │ │  │ │ (Cache/Sessions)│ │  │ │                     │ │
│ └─────────────────┘ │  │ └─────────────────┘ │  │ └─────────────────────┘ │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────────┐ │
│ │ PostgreSQL      │ │  │ │ BullMQ          │ │  │ │ Scheduled Jobs      │ │
│ │ (Read Replica)  │ │  │ │ (Async Tasks)   │ │  │ │ (BullMQ/Cron)       │ │
│ └─────────────────┘ │  │ └─────────────────┘ │  │ └─────────────────────┘ │
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
```

## 6.3 Modelo de Dados Simplificado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODELO DE DADOS - ENTIDADES PRINCIPAIS              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    USER      │     │   CLIENT     │     │    LEAD      │     │ OPPORTUNITY  │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ email        │────→│ user_id (FK) │     │ client_id(FK)│────→│ lead_id (FK) │
│ name         │     │ name         │     │ source       │     │ stage_id     │
│ role_id (FK) │     │ document     │     │ status       │     │ value        │
│ active       │     │ segment      │     │ score        │     │ probability  │
└──────────────┘     │ phone        │     │ assigned_to  │     │ expected_date│
                     │ email        │     └──────────────┘     └──────────────┘
                     └──────────────┘              │
                                                   │
┌──────────────┐     ┌──────────────┐              │     ┌──────────────┐
│   PROPOSAL   │←────│    WORK      │←─────────────┘     │    STAGE     │
├──────────────┤     ├──────────────┤                    ├──────────────┤
│ id (PK)      │     │ id (PK)      │                    │ id (PK)      │
│ opp_id (FK)  │     │ opportunity  │                    │ pipeline_id  │
│ items (JSON) │     │   _id (FK)   │                    │ name         │
│ total_value  │     │ type         │                    │ order        │
│ status       │     │ status       │                    │ sla_days     │
│ sent_at      │     │ start_date   │                    └──────────────┘
└──────────────┘     │ end_date     │
                     └──────────────┘
```

---

# PARTE 7: PLANO DE MÉTRICAS (KPIs)

## 7.1 Métricas de Negócio

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **Taxa Conversão Lead→Cliente** | Clientes / Leads × 100 | 15% | 25% | Mensal |
| **Ticket Médio** | Receita Total / Nº Obras | R$ 8.000 | R$ 12.000 | Mensal |
| **Cross-sell Rate** | Obras com cross-sell / Total Obras × 100 | 30% | 50% | Mensal |
| **LTV/CAC Ratio** | Lifetime Value / Customer Acquisition Cost | > 3x | > 5x | Trimestral |
| **Taxa de Renovação** | Clientes renovados / Clientes elegíveis × 100 | 40% | 60% | Anual |

## 7.2 Métricas Operacionais

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **Tempo Ciclo (Lead→Entrega)** | Média de dias | 45 dias | 30 dias | Mensal |
| **SLA Resposta Leads** | Leads respondidos < 2h / Total × 100 | 90% | 95% | Diária |
| **Taxa Atraso Processos** | Processos atrasados / Total × 100 | < 15% | < 10% | Semanal |
| **Taxa Aprovação 1ª Vez** | Projetos aprovados sem ajuste / Total × 100 | 70% | 85% | Mensal |
| **Tempo Médio Proposta** | Horas entre solicitação e envio | 48h | 24h | Semanal |

## 7.3 Métricas de Produto

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **NPS** | Pesquisa de satisfação | > 40 | > 50 | Trimestral |
| **Churn Rate** | Clientes perdidos / Total × 100 | < 10% | < 5% | Mensal |
| **Ativação** | Usuários ativos / Total cadastrados × 100 | 80% | 90% | Semanal |
| **Feature Adoption** | Uso de funcionalidades-chave | 60% | 80% | Mensal |
| **Tempo de Onboarding** | Dias até primeiro uso completo | < 7 | < 3 | Mensal |

## 7.4 Dashboard Executivo (Visão)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD EXECUTIVO                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Leads Mês    │  │ Conversão    │  │ Ticket Médio │  │ Receita Mês  │    │
│  │     45       │  │    18%       │  │  R$ 8.500    │  │ R$ 127.500   │    │
│  │   ↑ 12%      │  │   ↑ 3%       │  │   ↑ 6%       │  │   ↑ 15%      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │      PIPELINE KANBAN            │  │      PROCESSOS ATIVOS           │   │
│  │  ┌─────┐┌─────┐┌─────┐┌─────┐  │  │  ⚠️ 3 processos com SLA > 80%   │   │
│  │  │Lead ││Visi-││Pro- ││Fecha│  │  │  📋 12 tarefas vencidas         │   │
│  │  │ 12  ││ta 8 ││posta││do 5 │  │  │  ✅ 8 entregas esta semana      │   │
│  │  └─────┘└─────┘└─────┘└─────┘  │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ALERTAS E SUGESTÕES                              │   │
│  │  🔥 2 leads quentes aguardando proposta                             │   │
│  │  ⚡ 3 oportunidades de cross-sell detectadas                        │   │
│  │  📞 5 follow-ups pendentes                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PARTE 8: ROADMAP DE IMPLEMENTAÇÃO

## 8.1 Fases do Projeto

| Fase | Período | Foco | Milestone | Entregáveis |
|------|---------|------|-----------|-------------|
| **F1: Fundação** | Sem 1-4 | Portal, WhatsApp, CRM Base | M1: Recebe leads | P1, P2, P3, P4 |
| **F2: Processos** | Sem 5-8 | Motor processos, propostas, docs | M2: Lead→Execução | P5, P6, P7, P8 |
| **F3: Financeiro** | Sem 9-12 | Financeiro, Rules Engine, Dashboard | M3: Operação completa | P9, P10, P11, P12 |
| **F4: Testes** | Sem 13-14 | QA, usuários piloto | M4: Pronto produção | Bug fixes, ajustes |
| **F5: Soft Launch** | Sem 15 | 5-10 clientes | M5: Primeiros ativos | Validação real |
| **F6: Hard Launch** | Sem 16-20 | Escala, otimização | M6: Produção estável | Marketing, vendas |

## 8.2 Dependências Críticas

| Dependência | Prazo | Risco | Mitigação |
|-------------|-------|-------|-----------|
| WhatsApp Business API | Sem 2 | Alto | Aprovação prévia Meta |
| Servidor/Cloud | Sem 1 | Baixo | Provisionar imediatamente |
| Domínio/SSL | Sem 1 | Baixo | Registrar antecipadamente |
| Equipe de Desenvolvimento | Sem 1 | Médio | Contratar/Alocar |
| Dados de Teste | Sem 3 | Baixo | Criar dataset realista |

## 8.3 Checklist de Lançamento

### Pré-Lançamento (Sem 14)
- [ ] Todos os testes passando
- [ ] Documentação completa
- [ ] Treinamento da equipe
- [ ] Dados de produção migrados
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Plano de rollback pronto

### Lançamento (Sem 15)
- [ ] Deploy em produção
- [ ] Clientes piloto ativos
- [ ] Suporte dedicado
- [ ] Coleta de feedback
- [ ] Métricas sendo coletadas

### Pós-Lançamento (Sem 16-20)
- [ ] Ajustes baseados em feedback
- [ ] Correção de bugs
- [ ] Otimização de performance
- [ ] Campanha de marketing
- [ ] Expansão de base de clientes

---

# ANEXOS

## A. Estrutura de Permissões (RBAC)

| Papel | Leads | Propostas | Processos | Financeiro | Admin |
|-------|-------|-----------|-----------|------------|-------|
| **Admin** | CRUD | CRUD | CRUD | CRUD | CRUD |
| **Comercial** | CRUD | CRUD | Ver | Ver | - |
| **Engenheiro** | Ver | Ver | CRUD | - | - |
| **Financeiro** | Ver | Ver | Ver | CRUD | - |
| **Cliente** | - | Ver* | Ver* | Ver* | - |

*Apenas seus próprios dados

## B. Categorias de Documentos

| Categoria | Extensões | Tamanho Máx | Retenção |
|-----------|-----------|-------------|----------|
| Projeto | DWG, PDF | 50MB | 10 anos |
| Laudo | PDF | 20MB | 10 anos |
| ART | PDF | 5MB | 10 anos |
| Memorial | PDF, DOC | 20MB | 10 anos |
| Foto | JPG, PNG | 10MB | 5 anos |
| Contrato | PDF | 10MB | 10 anos |
| Nota Fiscal | PDF | 5MB | 5 anos |

## C. Checklist de Compliance LGPD

- [ ] Termo de consentimento no cadastro
- [ ] Política de privacidade publicada
- [ ] Dados criptografados em trânsito e repouso
- [ ] Logs de acesso a dados pessoais
- [ ] Processo de anonimização
- [ ] Canal para exercício de direitos
- [ ] DPO designado (se aplicável)
- [ ] Contratos com operadores
- [ ] Relatório de impacto (se aplicável)

---

**FIM DO DOCUMENTO**

*Documento gerado em 2025-01-21 - Versão 1.0*
*Este documento é uma especificação completa para implementação do ERP/CRM Vertical para Engenharia Elétrica e Solar*
