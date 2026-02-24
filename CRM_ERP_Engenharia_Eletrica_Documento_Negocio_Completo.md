# DOCUMENTO DE NEGÓCIO - CRM/ERP ENGENHARIA ELÉTRICA
## Sistema Integrado para Gestão de Projetos Elétricos, PDE, Obras de Rede e Energia Solar

**Versão:** 1.0  
**Data:** 2025  
**Setor:** Engenharia Elétrica / Energia Solar / Concessionárias de Energia  
**Princípio Central:** VENDER MELHOR AUTOMATICAMENTE

---

## SUMÁRIO EXECUTIVO

Este documento define a arquitetura completa de um sistema CRM/ERP especializado para empresas de engenharia elétrica credenciadas no Brasil. O sistema foi projetado com o princípio central de **"Vender Melhor Automaticamente"**, utilizando um motor de regras inteligente que detecta contextos e sugere serviços adicionais, pacotes e oportunidades de cross-sell de forma automatizada.

---

## 1. FLUXOS PONTA A PONTA DETALHADOS

### 1.1 FLUXO 1: PROJETO ELÉTRICO BT/MT/AT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - PROJETO ELÉTRICO BT/MT/AT                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### FASE 1: PRÉ-VENDA (Lead → Proposta)

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 1.1 | Recepção do lead (site, indicação, telefone) | Comercial/Recepção | Lead cadastrado no CRM | 2h | - |
| 1.2 | Qualificação inicial | Comercial | Formulário de qualificação preenchido | 4h | Gate 1: Lead qualificado? |
| 1.3 | Análise de viabilidade técnica | Engenheiro/Projetista | Parecer técnico prévio | 24h | Gate 2: Viável tecnicamente? |
| 1.4 | Agendamento de visita técnica | Comercial | Visita agendada no sistema | 4h | - |
| 1.5 | Visita técnica/levantamento | Engenheiro | Memorial descritivo, fotos, croqui | 48h | Gate 3: Escopo definido? |
| 1.6 | Elaboração de proposta | Comercial/Engenharia | Proposta técnica-comercial | 48h | - |
| 1.7 | Apresentação e negociação | Comercial | Proposta aprovada/rejeitada | 72h | Gate 4: Proposta aprovada? |

**Documentos Obrigatórios Fase 1:**
- [ ] Formulário de qualificação do cliente
- [ ] Documentos do cliente (RG, CPF/CNPJ, contrato social se PJ)
- [ ] Conta de energia atual (últimos 3 meses)
- [ ] ART do responsável técnico anterior (se houver)
- [ ] Croqui/fotos do local
- [ ] Parecer técnico de viabilidade
- [ ] Proposta assinada

#### FASE 2: PROJETO E APROVAÇÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 2.1 | Kickoff do projeto | Engenheiro | ATA de kickoff | 24h | Gate 5: Projeto autorizado? |
| 2.2 | Levantamento detalhado | Projetista | Planilha de cargas completa | 48h | - |
| 2.3 | Dimensionamento elétrico | Projetista | Memória de cálculo | 24h | - |
| 2.4 | Elaboração das plantas | Projetista CAD | Plantas em PDF/DWG | 72h | - |
| 2.5 | Memorial descritivo | Engenheiro | Memorial completo | 24h | - |
| 2.6 | Lista de materiais (BOM) | Projetista | Planilha BOM detalhada | 24h | - |
| 2.7 | Revisão técnica interna | Engenheiro Senior | Checklist de revisão OK | 24h | Gate 6: Revisão aprovada? |
| 2.8 | Emissão da ART | Engenheiro | ART emitida no CREA | 48h | - |
| 2.9 | Entrega ao cliente | Comercial/Engenharia | Protocolo de entrega assinado | 24h | Gate 7: Cliente aceitou? |
| 2.10 | Submissão à concessionária (se aplicável) | Projetista | Protocolo de entrada | 48h | - |
| 2.11 | Acompanhamento de aprovação | Projetista | Parecer da concessionária | Variável | Gate 8: Aprovado pela concessionária? |
| 2.12 | Ajustes e reenvio (se necessário) | Projetista | Nova versão do projeto | 48h | - |

**Documentos Obrigatórios Fase 2:**
- [ ] Memorial descritivo completo
- [ ] Plantas baixas (DWG + PDF)
- [ ] Diagramas unifilares
- [ ] Detalhes construtivos
- [ ] Memória de cálculo de cargas
- [ ] Memória de cálculo de curto-circuito (MT/AT)
- [ ] Lista de materiais (BOM)
- [ ] Especificações técnicas de equipamentos
- [ ] ART emitida
- [ ] Protocolo de entrega ao cliente
- [ ] Protocolo de entrada na concessionária
- [ ] Parecer de aprovação da concessionária

#### FASE 3: EXECUÇÃO (Quando aplicável)

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 3.1 | Cotação de materiais | Compras | Orçamento de fornecedores | 48h | - |
| 3.2 | Aprovação de compra | Gestor/Cliente | Pedido de compra aprovado | 24h | Gate 9: Compra autorizada? |
| 3.3 | Aquisição de materiais | Compras | Notas fiscais de entrada | 72h | - |
| 3.4 | Programação da equipe | Produção | Escala de trabalho | 24h | - |
| 3.5 | Execução da obra | Equipe de campo | Fotos diárias, relatórios | Variável | - |
| 3.6 | Inspeção intermediária | Engenheiro | Relatório de inspeção | 24h | Gate 10: Execução conforme projeto? |
| 3.7 | Testes e comissionamento | Equipe técnica | Protocolos de teste | 48h | - |
| 3.8 | Laudo de instalação | Engenheiro | Laudo técnico assinado | 24h | Gate 11: Instalação aprovada? |

#### FASE 4: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 4.1 | Documentação as built | Projetista | Plantas as built | 48h | - |
| 4.2 | Treinamento do cliente | Engenheiro | ATA de treinamento | 24h | - |
| 4.3 | Entrega documental final | Comercial | Checklist de entrega | 24h | Gate 12: Entrega completa? |
| 4.4 | Emissão de nota fiscal | Financeiro | NF emitida | 24h | - |
| 4.5 | Solicitação de avaliação | Comercial | Pesquisa de satisfação | 72h | - |
| 4.6 | Ativação de monitoramento | Sistema | Alerta de manutenção programada | 30 dias | - |
| 4.7 | Contato de pós-venda | Comercial | Registro de contato | 90 dias | - |

---

### 1.2 FLUXO 2: PDE (PADRÃO DE ENTRADA) BT/AT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - PDE BT/AT                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### FASE 1: PRÉ-VENDA E QUALIFICAÇÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 1.1 | Recepção do lead PDE | Comercial | Lead qualificado | 2h | - |
| 1.2 | Identificação da concessionária | Sistema/Comercial | Concessionária mapeada | Automático | - |
| 1.3 | Consulta de normas específicas | Projetista | Normas da concessionária | 4h | - |
| 1.4 | Análise de carga e tensão | Engenheiro | Dimensionamento prévio | 24h | Gate 1: BT ou AT? |
| 1.5 | Verificação de disponibilidade de rede | Projetista | Consulta prévia na concessionária | 48h | Gate 2: Rede disponível? |
| 1.6 | Visita técnica ao local | Engenheiro | Memorial de visita | 48h | - |
| 1.7 | Definição de escopo (BT monofásico/trifásico ou AT) | Engenheiro | Escopo definido | 24h | Gate 3: Escopo aprovado? |
| 1.8 | Elaboração de proposta | Comercial | Proposta com escopo PDE | 48h | - |
| 1.9 | Aprovação comercial | Cliente | Contrato assinado | 72h | Gate 4: Contrato fechado? |

#### FASE 2: PROJETO DO PDE

**Para PDE BT:**

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 2.1 | Coleta de documentos do cliente | Comercial | Pasta documental completa | 48h | - |
| 2.2 | Levantamento topográfico | Topógrafo/Projetista | Croqui com medidas | 24h | - |
| 2.3 | Dimensionamento do padrão | Projetista | Especificação técnica | 24h | - |
| 2.4 | Elaboração do projeto executivo | Projetista | Projeto completo | 48h | - |
| 2.5 | Memorial descritivo PDE | Engenheiro | Memorial específico | 24h | - |
| 2.6 | ART de projeto | Engenheiro | ART emitida | 24h | - |
| 2.7 | Revisão técnica | Engenheiro Senior | Checklist OK | 24h | Gate 5: Projeto aprovado internamente? |
| 2.8 | Submissão à concessionária | Projetista | Protocolo de entrada | 24h | - |

**Para PDE AT:**

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 2.1 | Coleta de documentos do cliente | Comercial | Pasta documental completa | 48h | - |
| 2.2 | Levantamento topográfico detalhado | Topógrafo | Planta topográfica | 48h | - |
| 2.3 | Estudo de carga e demanda | Engenheiro | Estudo completo | 48h | - |
| 2.4 | Dimensionamento do transformador | Engenheiro | Especificação do trafo | 24h | - |
| 2.5 | Projeto da subestação | Projetista | Projeto de SE completo | 72h | - |
| 2.6 | Diagramas unifilares e trifilares | Projetista | Diagramas completos | 48h | - |
| 2.7 | Memorial descritivo AT | Engenheiro | Memorial detalhado | 48h | - |
| 2.8 | Cálculos elétricos (curto, queda, seletividade) | Engenheiro | Memórias de cálculo | 48h | - |
| 2.9 | ART de projeto AT | Engenheiro | ART emitida | 24h | - |
| 2.10 | Revisão técnica especializada | Engenheiro Senior | Laudo de revisão | 48h | Gate 5: Projeto aprovado internamente? |
| 2.11 | Submissão à concessionária | Projetista | Protocolo de entrada | 24h | - |

#### FASE 3: ACOMPANHAMENTO DE APROVAÇÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 3.1 | Acompanhamento de protocolo | Projetista | Status atualizado no CRM | Diário | - |
| 3.2 | Resposta às exigências | Projetista | Ajustes realizados | 48h | Gate 6: Exigências atendidas? |
| 3.3 | Aprovação final da concessionária | Concessionária | Parecer de aprovação | Variável | Gate 7: PDE aprovado? |
| 3.4 | Liberação para execução | Engenheiro | Ordem de serviço liberada | 24h | - |

#### FASE 4: EXECUÇÃO DO PDE

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 4.1 | Cotação de materiais do padrão | Compras | Orçamentos | 48h | - |
| 4.2 | Aprovação de compra | Cliente/Gestor | Pedido aprovado | 24h | Gate 8: Compra autorizada? |
| 4.3 | Aquisição de materiais | Compras | Notas fiscais | 72h | - |
| 4.4 | Agendamento com concessionária | Projetista | Data de ligação agendada | 48h | - |
| 4.5 | Execução da obra do padrão | Equipe de campo | Fotos, relatórios diários | Variável | - |
| 4.6 | Vistoria da concessionária | Concessionária | Relatório de vistoria | Agendado | Gate 9: Vistoria aprovada? |
| 4.7 | Ligação de energia | Concessionária | Energia liberada | Agendado | Gate 10: Energia liberada? |
| 4.8 | ART de execução | Engenheiro | ART de execução emitida | 48h | - |

#### FASE 5: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 5.1 | Documentação as built | Projetista | Plantas atualizadas | 48h | - |
| 5.2 | Entrega de manuais | Comercial | Manuais de equipamentos | 24h | - |
| 5.3 | Treinamento de operação | Engenheiro | ATA de treinamento | 24h | Gate 11: Entrega aceita? |
| 5.4 | Emissão de NF | Financeiro | Nota fiscal | 24h | - |
| 5.5 | Ativação de suporte | Sistema | Canal de suporte ativo | Imediato | - |
| 5.6 | Lembrete de manutenção preventiva | Sistema | Alerta programado | 180 dias | - |

**Documentos Específicos PDE:**

**Documentos do Cliente:**
- [ ] RG/CPF ou CNPJ do responsável
- [ ] Contrato social (se PJ)
- [ ] Matrícula do imóvel ou escritura
- [ ] IPTU atualizado
- [ ] Conta de energia de vizinho (para ligação nova)
- [ ] Certidão negativa de débitos com a concessionária

**Documentos Técnicos PDE BT:**
- [ ] Projeto executivo do padrão
- [ ] Memorial descritivo
- [ ] Especificação de materiais
- [ ] ART de projeto
- [ ] ART de execução
- [ ] Laudo de instalação elétrica

**Documentos Técnicos PDE AT:**
- [ ] Projeto de subestação completo
- [ ] Diagramas unifilares e trifilares
- [ ] Memorial descritivo detalhado
- [ ] Cálculos de curto-circuito
- [ ] Cálculos de queda de tensão
- [ ] Estudo de seletividade
- [ ] Especificação de equipamentos
- [ ] ART de projeto
- [ ] ART de execução
- [ ] Laudo técnico de subestação

---

### 1.3 FLUXO 3: DOAÇÃO DE REDE + INCORPORAÇÃO + CONEXÃO + COMISSIONAMENTO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│     FLUXO COMPLETO - DOAÇÃO DE REDE + INCORPORAÇÃO + CONEXÃO + COMISSIONAMENTO  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Este é o fluxo mais complexo, envolvendo múltiplas etapas regulatórias e interação com concessionárias.

#### FASE 1: PRÉ-VENDA E QUALIFICAÇÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 1.1 | Recepção do lead | Comercial | Lead cadastrado | 2h | - |
| 1.2 | Identificação do tipo de obra | Comercial | Tipo classificado | 4h | Gate 1: Doação ou obra particular? |
| 1.3 | Análise de viabilidade técnica | Engenheiro | Parecer técnico | 24h | Gate 2: Viável tecnicamente? |
| 1.4 | Consulta prévia à concessionária | Projetista | Disponibilidade de rede | 48h | Gate 3: Concessionária aceita? |
| 1.5 | Visita técnica detalhada | Engenheiro | Memorial de visita | 48h | - |
| 1.6 | Definição de escopo completo | Engenheiro | Escopo detalhado | 24h | Gate 4: Escopo aprovado? |
| 1.7 | Elaboração de proposta | Comercial | Proposta completa | 72h | - |
| 1.8 | Negociação e fechamento | Comercial | Contrato assinado | 72h | Gate 5: Contrato fechado? |

#### FASE 2: PROJETO DE REDE

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 2.1 | Levantamento topográfico | Topógrafo | Planta topográfica | 48h | - |
| 2.2 | Estudo de carga e demanda | Engenheiro | Estudo completo | 48h | - |
| 2.3 | Dimensionamento da rede | Engenheiro | Especificação técnica | 48h | - |
| 2.4 | Projeto executivo de rede | Projetista | Projeto completo | 72h | - |
| 2.5 | Memorial descritivo de obra | Engenheiro | Memorial detalhado | 48h | - |
| 2.6 | Plano de execução da obra | Engenheiro | Cronograma físico | 24h | - |
| 2.7 | ART de projeto | Engenheiro | ART emitida | 24h | - |
| 2.8 | Revisão técnica interna | Engenheiro Senior | Laudo de revisão | 48h | Gate 6: Projeto aprovado? |

#### FASE 3: DOSSIÊ DE DOAÇÃO (Se aplicável)

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 3.1 | Preparação do dossiê de doação | Projetista | Dossiê completo | 72h | - |
| 3.2 | Documentação legal da obra | Comercial/Advogado | Documentos legais | 48h | - |
| 3.3 | Memorial de doação | Engenheiro | Memorial específico | 24h | - |
| 3.4 | ART de doação | Engenheiro | ART específica | 24h | - |
| 3.5 | Submissão do dossiê à concessionária | Projetista | Protocolo de entrada | 24h | Gate 7: Dossiê submetido? |
| 3.6 | Acompanhamento de análise | Projetista | Status atualizado | Diário | - |
| 3.7 | Resposta a exigências | Projetista | Ajustes realizados | 48h | Gate 8: Exigências atendidas? |
| 3.8 | Aprovação da doação | Concessionária | Termo de doação aprovado | Variável | Gate 9: Doação aprovada? |

**CHECKLIST DOSSIÊ DE DOAÇÃO:**
- [ ] Requerimento de doação (formulário da concessionária)
- [ ] Projeto executivo aprovado
- [ ] Memorial descritivo de doação
- [ ] ART de doação
- [ ] Documentação do doador (RG, CPF/CNPJ)
- [ ] Documentação do imóvel (matrícula/escritura)
- [ ] Laudo técnico de viabilidade
- [ ] Cronograma de execução
- [ ] Orçamento detalhado da obra
- [ ] Garantia de execução (se exigido)
- [ ] Termo de responsabilidade
- [ ] Planta de situação
- [ ] Detalhes construtivos

#### FASE 4: EXECUÇÃO DA OBRA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 4.1 | Cotação de materiais e serviços | Compras | Orçamentos | 72h | - |
| 4.2 | Aprovação de compra | Cliente/Gestor | Pedido aprovado | 48h | Gate 10: Compra autorizada? |
| 4.3 | Aquisição de materiais | Compras | Notas fiscais | 72h | - |
| 4.4 | Licenças e autorizações | Comercial | Licenças obtidas | Variável | - |
| 4.5 | Mobilização da equipe | Produção | Equipe mobilizada | 24h | - |
| 4.6 | Execução da obra de rede | Equipe de campo | Fotos, relatórios diários | Variável | - |
| 4.7 | Acompanhamento técnico | Engenheiro | Visitas de acompanhamento | Semanal | Gate 11: Obra conforme projeto? |
| 4.8 | Testes e ensaios | Equipe técnica | Protocolos de teste | 48h | - |
| 4.9 | ART de execução | Engenheiro | ART emitida | 48h | - |

#### FASE 5: INCORPORAÇÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 5.1 | Preparação do dossiê de incorporação | Projetista | Dossiê completo | 72h | - |
| 5.2 | Memorial de incorporação | Engenheiro | Memorial específico | 24h | - |
| 5.3 | ART de incorporação | Engenheiro | ART específica | 24h | - |
| 5.4 | Submissão à concessionária | Projetista | Protocolo de entrada | 24h | Gate 12: Dossiê submetido? |
| 5.5 | Acompanhamento de análise | Projetista | Status atualizado | Diário | - |
| 5.6 | Vistoria de incorporação | Concessionária | Relatório de vistoria | Agendado | Gate 13: Vistoria aprovada? |
| 5.7 | Aprovação da incorporação | Concessionária | Termo de incorporação | Variável | Gate 14: Incorporação aprovada? |

**CHECKLIST DOSSIÊ DE INCORPORAÇÃO:**
- [ ] Requerimento de incorporação
- [ ] Projeto executivo as built
- [ ] Memorial de incorporação
- [ ] ART de incorporação
- [ ] ART de execução
- [ ] Laudo técnico de instalação
- [ ] Protocolos de testes e ensaios
- [ ] Relatório fotográfico completo
- [ ] Documentação de materiais utilizados
- [ ] Manuais de equipamentos
- [ ] Termo de doação (se aplicável)
- [ ] Certidões negativas

#### FASE 6: CONEXÃO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 6.1 | Preparação do dossiê de conexão | Projetista | Dossiê completo | 48h | - |
| 6.2 | Memorial de conexão | Engenheiro | Memorial específico | 24h | - |
| 6.3 | Submissão à concessionária | Projetista | Protocolo de entrada | 24h | Gate 15: Dossiê submetido? |
| 6.4 | Acompanhamento de análise | Projetista | Status atualizado | Diário | - |
| 6.5 | Aprovação da conexão | Concessionária | Parecer de conexão | Variável | Gate 16: Conexão aprovada? |

**CHECKLIST DOSSIÊ DE CONEXÃO:**
- [ ] Requerimento de conexão
- [ ] Termo de incorporação (se aplicável)
- [ ] Memorial de conexão
- [ ] Diagrama unifilar atualizado
- [ ] Especificação de cargas
- [ ] Documentação do cliente
- [ ] Certidão negativa de débitos

#### FASE 7: COMISSIONAMENTO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 7.1 | Preparação do dossiê de comissionamento | Projetista | Dossiê completo | 48h | - |
| 7.2 | Memorial de comissionamento | Engenheiro | Memorial específico | 24h | - |
| 7.3 | ART de comissionamento | Engenheiro | ART específica | 24h | - |
| 7.4 | Submissão à concessionária | Projetista | Protocolo de entrada | 24h | Gate 17: Dossiê submetido? |
| 7.5 | Agendamento de comissionamento | Concessionária | Data agendada | Agendado | - |
| 7.6 | Vistoria de comissionamento | Concessionária | Relatório de vistoria | Agendado | Gate 18: Vistoria aprovada? |
| 7.7 | Ligação definitiva | Concessionária | Energia liberada | Agendado | Gate 19: Energia liberada? |

**CHECKLIST DOSSIÊ DE COMISSIONAMENTO:**
- [ ] Requerimento de comissionamento
- [ ] Termo de conexão
- [ ] Memorial de comissionamento
- [ ] ART de comissionamento
- [ ] Laudo técnico final
- [ ] Protocolos de testes finais
- [ ] Relatório fotográfico final
- [ ] Treinamento de operação realizado
- [ ] Manuais entregues
- [ ] Termo de entrega assinado

#### FASE 8: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 8.1 | Documentação final as built | Projetista | Documentação completa | 72h | - |
| 8.2 | Entrega de manuais e documentos | Comercial | Checklist de entrega | 48h | - |
| 8.3 | Treinamento final | Engenheiro | ATA de treinamento | 24h | Gate 20: Entrega aceita? |
| 8.4 | Emissão de NF final | Financeiro | Nota fiscal | 24h | - |
| 8.5 | Ativação de suporte | Sistema | Canal de suporte ativo | Imediato | - |
| 8.6 | Proposta de manutenção | Comercial | Proposta de PMOC/laudos | 30 dias | - |

---

### 1.4 FLUXO 4: LAUDO TÉCNICO E SPDA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - LAUDO TÉCNICO E SPDA                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### FASE 1: PRÉ-VENDA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 1.1 | Recepção do lead | Comercial | Lead cadastrado | 2h | - |
| 1.2 | Identificação do tipo de laudo | Comercial | Tipo classificado | 4h | Gate 1: Tipo de laudo definido? |
| 1.3 | Coleta de informações prévias | Comercial | Formulário preenchido | 24h | - |
| 1.4 | Análise de documentação existente | Engenheiro | Análise documental | 24h | - |
| 1.5 | Agendamento de visita | Comercial | Visita agendada | 24h | - |
| 1.6 | Visita técnica/inspeção | Engenheiro | Checklist de inspeção | 48h | Gate 2: Inspeção realizada? |
| 1.7 | Elaboração de proposta | Comercial | Proposta enviada | 48h | - |
| 1.8 | Aprovação comercial | Cliente | Contrato assinado | 72h | Gate 3: Contrato fechado? |

#### FASE 2: LAUDO TÉCNICO

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 2.1 | Coleta de documentação | Comercial | Pasta documental | 48h | - |
| 2.2 | Análise de projeto existente | Engenheiro | Análise técnica | 24h | - |
| 2.3 | Inspeção detalhada | Engenheiro | Checklist detalhado | 48h | - |
| 2.4 | Medições elétricas | Técnico | Protocolos de medição | 24h | - |
| 2.5 | Análise de resultados | Engenheiro | Análise completa | 24h | - |
| 2.6 | Elaboração do laudo | Engenheiro | Laudo técnico | 72h | - |
| 2.7 | Revisão técnica | Engenheiro Senior | Laudo revisado | 24h | Gate 4: Laudo aprovado? |
| 2.8 | Emissão de ART | Engenheiro | ART emitida | 24h | - |
| 2.9 | Entrega do laudo | Comercial | Protocolo de entrega | 24h | Gate 5: Laudo entregue? |

**TIPOS DE LAUDO E DOCUMENTOS:**

**Laudo de Instalações Elétricas:**
- [ ] Laudo técnico de instalações elétricas
- [ ] ART específica
- [ ] Protocolos de medição (resistência de isolamento, continuidade, etc.)
- [ ] Fotos das instalações
- [ ] Checklist de conformidade com NBR 5410
- [ ] Parecer técnico

**Laudo de SPDA:**
- [ ] Laudo técnico de SPDA
- [ ] ART específica de SPDA
- [ ] Protocolos de medição de aterramento
- [ ] Fotos do SPDA existente
- [ ] Checklist de conformidade com NBR 5419
- [ ] Parecer técnico

**Laudo de Instalações em Áreas Classificadas:**
- [ ] Laudo técnico específico
- [ ] ART específica
- [ ] Protocolos de medição
- [ ] Checklist de conformidade com normas específicas
- [ ] Parecer técnico

#### FASE 3: SPDA (PROJETO + EXECUÇÃO)

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 3.1 | Análise de risco (NBR 5419) | Engenheiro | Análise de risco | 24h | - |
| 3.2 | Dimensionamento do SPDA | Engenheiro | Especificação técnica | 24h | - |
| 3.3 | Projeto executivo SPDA | Projetista | Projeto completo | 48h | - |
| 3.4 | Memorial descritivo SPDA | Engenheiro | Memorial específico | 24h | - |
| 3.5 | ART de projeto SPDA | Engenheiro | ART emitida | 24h | Gate 6: Projeto aprovado? |
| 3.6 | Cotação de materiais | Compras | Orçamento | 48h | - |
| 3.7 | Aprovação de compra | Cliente | Pedido aprovado | 24h | Gate 7: Compra autorizada? |
| 3.8 | Aquisição de materiais | Compras | Notas fiscais | 72h | - |
| 3.9 | Execução do SPDA | Equipe de campo | Fotos, relatórios | Variável | - |
| 3.10 | Medições de aterramento | Técnico | Protocolos de medição | 24h | Gate 8: Medições OK? |
| 3.11 | ART de execução SPDA | Engenheiro | ART emitida | 24h | - |
| 3.12 | Laudo final SPDA | Engenheiro | Laudo técnico final | 48h | Gate 9: SPDA aprovado? |

**CHECKLIST SPDA:**
- [ ] Análise de risco conforme NBR 5419
- [ ] Projeto executivo SPDA
- [ ] Memorial descritivo
- [ ] ART de projeto
- [ ] Especificação de materiais
- [ ] ART de execução
- [ ] Protocolos de medição de aterramento
- [ ] Laudo técnico final
- [ ] Certificado de conformidade
- [ ] Manuais de manutenção

#### FASE 4: ENTREGA E PÓS-VENDA

| Etapa | Atividade | Responsável | Documentos/Outputs | SLA | Gate |
|-------|-----------|-------------|-------------------|-----|------|
| 4.1 | Entrega de documentação | Comercial | Checklist de entrega | 24h | - |
| 4.2 | Treinamento de manutenção | Engenheiro | ATA de treinamento | 24h | Gate 10: Entrega aceita? |
| 4.3 | Emissão de NF | Financeiro | Nota fiscal | 24h | - |
| 4.4 | Agendamento de inspeção periódica | Sistema | Alerta programado | 11 meses | - |
| 4.5 | Proposta de renovação de laudo | Comercial | Proposta enviada | 11 meses | - |

---

## 2. TEMPLATES DE ETAPAS E CHECKLISTS

### 2.1 CHECKLIST MASTER POR SERVIÇO

#### CHECKLIST - PROJETO ELÉTRICO BT/MT/AT

**FASE 1: PRÉ-VENDA**
- [ ] Lead qualificado no sistema
- [ ] Documentos do cliente coletados
- [ ] Formulário de qualificação preenchido
- [ ] Parecer de viabilidade emitido
- [ ] Visita técnica realizada
- [ ] Memorial de visita registrado
- [ ] Fotos do local anexadas
- [ ] Proposta aprovada e assinada

**FASE 2: PROJETO**
- [ ] Kickoff realizado
- [ ] Levantamento de cargas completo
- [ ] Dimensionamento elétrico finalizado
- [ ] Plantas executivas elaboradas
- [ ] Diagramas unifilares prontos
- [ ] Memorial descritivo completo
- [ ] BOM (lista de materiais) finalizada
- [ ] Revisão técnica aprovada
- [ ] ART emitida
- [ ] Projeto entregue ao cliente

**FASE 3: APROVAÇÃO**
- [ ] Projeto submetido à concessionária
- [ ] Protocolo de entrada registrado
- [ ] Acompanhamento diário realizado
- [ ] Exigências atendidas
- [ ] Aprovação obtida

**FASE 4: EXECUÇÃO (Se aplicável)**
- [ ] Materiais cotados
- [ ] Compra aprovada
- [ ] Materiais adquiridos
- [ ] Equipe programada
- [ ] Obra executada
- [ ] Inspeção intermediária aprovada
- [ ] Testes realizados
- [ ] Laudo de instalação emitido

**FASE 5: ENTREGA**
- [ ] Documentação as built entregue
- [ ] Treinamento realizado
- [ ] Checklist de entrega assinado
- [ ] NF emitida
- [ ] Pesquisa de satisfação enviada

---

#### CHECKLIST - PDE BT

**DOCUMENTOS CLIENTE**
- [ ] RG/CPF do responsável
- [ ] CNPJ e contrato social (se PJ)
- [ ] Matrícula do imóvel ou escritura
- [ ] IPTU atualizado
- [ ] Conta de energia de vizinho
- [ ] Certidão negativa de débitos

**PROJETO**
- [ ] Levantamento topográfico
- [ ] Dimensionamento do padrão
- [ ] Projeto executivo completo
- [ ] Memorial descritivo
- [ ] Especificação de materiais
- [ ] ART de projeto
- [ ] Projeto aprovado internamente

**APROVAÇÃO CONCESSIONÁRIA**
- [ ] Projeto submetido
- [ ] Protocolo registrado
- [ ] Acompanhamento realizado
- [ ] Exigências atendidas
- [ ] Aprovação obtida

**EXECUÇÃO**
- [ ] Materiais cotados e comprados
- [ ] Equipe mobilizada
- [ ] Obra executada
- [ ] Vistoria da concessionária aprovada
- [ ] Ligação de energia realizada
- [ ] ART de execução emitida

**ENTREGA**
- [ ] Documentação as built
- [ ] Manuais entregues
- [ ] Treinamento realizado
- [ ] Entrega aceita pelo cliente

---

#### CHECKLIST - PDE AT

**DOCUMENTOS CLIENTE**
- [ ] Todos os documentos do PDE BT
- [ ] Estudo de carga e demanda detalhado
- [ ] Planta de layout industrial/comercial
- [ ] Lista de equipamentos

**PROJETO**
- [ ] Levantamento topográfico detalhado
- [ ] Estudo de carga e demanda
- [ ] Dimensionamento do transformador
- [ ] Projeto de subestação completo
- [ ] Diagramas unifilares e trifilares
- [ ] Cálculos elétricos (curto, queda, seletividade)
- [ ] Memorial descritivo detalhado
- [ ] Especificação de equipamentos
- [ ] ART de projeto
- [ ] Revisão técnica especializada

**APROVAÇÃO CONCESSIONÁRIA**
- [ ] Projeto submetido
- [ ] Protocolo registrado
- [ ] Acompanhamento realizado
- [ ] Exigências atendidas
- [ ] Aprovação obtida

**EXECUÇÃO**
- [ ] Materiais e equipamentos cotados
- [ ] Compra aprovada e realizada
- [ ] Licenças obtidas
- [ ] Equipe mobilizada
- [ ] Obra executada
- [ ] Testes e ensaios realizados
- [ ] Vistoria da concessionária aprovada
- [ ] Ligação de energia realizada
- [ ] ART de execução emitida

**ENTREGA**
- [ ] Documentação as built completa
- [ ] Manuais de equipamentos entregues
- [ ] Treinamento de operação realizado
- [ ] Entrega aceita pelo cliente

---

#### CHECKLIST - DOAÇÃO DE REDE

**DOSSIÊ DE DOAÇÃO**
- [ ] Requerimento de doação
- [ ] Projeto executivo aprovado
- [ ] Memorial descritivo de doação
- [ ] ART de doação
- [ ] Documentação do doador
- [ ] Documentação do imóvel
- [ ] Laudo técnico de viabilidade
- [ ] Cronograma de execução
- [ ] Orçamento detalhado
- [ ] Termo de responsabilidade
- [ ] Planta de situação
- [ ] Dossiê submetido
- [ ] Doação aprovada pela concessionária

**DOSSIÊ DE INCORPORAÇÃO**
- [ ] Requerimento de incorporação
- [ ] Projeto executivo as built
- [ ] Memorial de incorporação
- [ ] ART de incorporação
- [ ] ART de execução
- [ ] Laudo técnico de instalação
- [ ] Protocolos de testes
- [ ] Relatório fotográfico completo
- [ ] Documentação de materiais
- [ ] Manuais de equipamentos
- [ ] Termo de doação
- [ ] Dossiê submetido
- [ ] Vistoria aprovada
- [ ] Incorporação aprovada

**DOSSIÊ DE CONEXÃO**
- [ ] Requerimento de conexão
- [ ] Termo de incorporação
- [ ] Memorial de conexão
- [ ] Diagrama unifilar atualizado
- [ ] Especificação de cargas
- [ ] Documentação do cliente
- [ ] Certidão negativa de débitos
- [ ] Dossiê submetido
- [ ] Conexão aprovada

**DOSSIÊ DE COMISSIONAMENTO**
- [ ] Requerimento de comissionamento
- [ ] Termo de conexão
- [ ] Memorial de comissionamento
- [ ] ART de comissionamento
- [ ] Laudo técnico final
- [ ] Protocolos de testes finais
- [ ] Relatório fotográfico final
- [ ] Treinamento realizado
- [ ] Manuais entregues
- [ ] Termo de entrega assinado
- [ ] Dossiê submetido
- [ ] Vistoria de comissionamento aprovada
- [ ] Ligação definitiva realizada

---

#### CHECKLIST - LAUDO TÉCNICO

**DOCUMENTOS**
- [ ] Documentação do cliente
- [ ] Projeto existente (se houver)
- [ ] ART anterior (se houver)
- [ ] Histórico de manutenção

**INSPEÇÃO**
- [ ] Inspeção visual realizada
- [ ] Medições elétricas realizadas
- [ ] Fotos documentais tiradas
- [ ] Checklist de inspeção preenchido

**LAUDO**
- [ ] Análise técnica completa
- [ ] Laudo técnico elaborado
- [ ] Revisão técnica realizada
- [ ] ART emitida
- [ ] Laudo entregue ao cliente

---

#### CHECKLIST - SPDA

**PROJETO**
- [ ] Análise de risco (NBR 5419)
- [ ] Dimensionamento do SPDA
- [ ] Projeto executivo SPDA
- [ ] Memorial descritivo
- [ ] ART de projeto

**EXECUÇÃO**
- [ ] Materiais adquiridos
- [ ] SPDA executado
- [ ] Medições de aterramento realizadas
- [ ] ART de execução emitida

**LAUDO**
- [ ] Laudo técnico SPDA elaborado
- [ ] Certificado de conformidade emitido
- [ ] Manuais de manutenção entregues

---

### 2.2 SLAs POR ETAPA

| Serviço | Etapa | SLA Padrão | SLA Urgente | Observações |
|---------|-------|------------|-------------|-------------|
| **Projeto BT** | Qualificação | 4h | 1h | - |
| | Viabilidade técnica | 24h | 8h | - |
| | Visita técnica | 48h | 24h | Após aprovação |
| | Elaboração projeto | 48h | 24h | - |
| | Revisão técnica | 24h | 12h | - |
| | Submissão | 24h | 12h | - |
| **Projeto MT** | Qualificação | 4h | 1h | - |
| | Viabilidade técnica | 48h | 24h | - |
| | Visita técnica | 72h | 48h | - |
| | Elaboração projeto | 72h | 48h | - |
| | Revisão técnica | 48h | 24h | - |
| | Submissão | 48h | 24h | - |
| **PDE BT** | Qualificação | 4h | 1h | - |
| | Viabilidade técnica | 24h | 8h | - |
| | Elaboração projeto | 48h | 24h | - |
| | Aprovação interna | 24h | 12h | - |
| | Submissão | 24h | 12h | - |
| | Acompanhamento | Diário | Diário | Até aprovação |
| **PDE AT** | Qualificação | 4h | 1h | - |
| | Viabilidade técnica | 48h | 24h | - |
| | Elaboração projeto | 72h | 48h | - |
| | Revisão técnica | 48h | 24h | - |
| | Submissão | 48h | 24h | - |
| | Acompanhamento | Diário | Diário | Até aprovação |
| **Doação de Rede** | Qualificação | 8h | 4h | - |
| | Viabilidade técnica | 48h | 24h | - |
| | Consulta concessionária | 72h | 48h | - |
| | Elaboração projeto | 72h | 48h | - |
| | Dossiê doação | 72h | 48h | - |
| | Acompanhamento | Diário | Diário | Cada etapa |
| **Laudo Técnico** | Qualificação | 4h | 1h | - |
| | Agendamento visita | 24h | 12h | - |
| | Visita técnica | 48h | 24h | - |
| | Elaboração laudo | 72h | 48h | - |
| | Revisão técnica | 24h | 12h | - |
| | Entrega | 24h | 12h | - |
| **SPDA** | Qualificação | 4h | 1h | - |
| | Análise de risco | 24h | 12h | - |
| | Elaboração projeto | 48h | 24h | - |
| | Execução | Variável | Variável | Conforme escopo |
| | Laudo final | 48h | 24h | - |

---

### 2.3 GATES DE APROVAÇÃO

| Gate | Nome | Critérios de Aprovação | Aprovador | Ação se Rejeitado |
|------|------|----------------------|-----------|-------------------|
| G1 | Lead Qualificado | Documentos OK, interesse confirmado, viabilidade inicial | Comercial | Arquivar lead |
| G2 | Viabilidade Técnica | Tecnicamente viável, não há impedimentos | Engenheiro | Informar cliente |
| G3 | Escopo Definido | Escopo claro, cliente concorda | Engenheiro/Cliente | Revisar escopo |
| G4 | Proposta Aprovada | Proposta assinada, pagamento inicial | Cliente | Renegociar |
| G5 | Projeto Autorizado | Contrato assinado, kickoff realizado | Gestor | - |
| G6 | Revisão Técnica | Projeto conforme normas, revisado | Engenheiro Senior | Corrigir projeto |
| G7 | Cliente Aceitou | Cliente aprovou projeto | Cliente | Ajustar projeto |
| G8 | Aprovado Concessionária | Parecer positivo da concessionária | Concessionária | Atender exigências |
| G9 | Compra Autorizada | Orçamento aprovado, PO emitida | Cliente/Gestor | Revisar orçamento |
| G10 | Execução Conforme | Obra conforme projeto | Engenheiro | Corrigir execução |
| G11 | Instalação Aprovada | Testes OK, laudo positivo | Engenheiro | Corrigir instalação |
| G12 | Entrega Completa | Todos documentos entregues | Cliente | Completar entrega |
| G13 | Dossiê Submetido | Dossiê completo, protocolado | Projetista | Completar dossiê |
| G14 | Exigências Atendidas | Todas exigências respondidas | Concessionária | Atender exigências |
| G15 | Doação Aprovada | Termo de doação assinado | Concessionária | Recorrer/ajustar |
| G16 | Incorporação Aprovada | Termo de incorporação assinado | Concessionária | Recorrer/ajustar |
| G17 | Conexão Aprovada | Parecer de conexão positivo | Concessionária | Recorrer/ajustar |
| G18 | Vistoria Aprovada | Vistoria de comissionamento OK | Concessionária | Corrigir pendências |
| G19 | Energia Liberada | Ligação definitiva realizada | Concessionária | Resolver pendências |
| G20 | Entrega Aceita | Cliente aceitou entrega | Cliente | Resolver pendências |



---

## 3. REGRAS DO RULES ENGINE (MOTOR DE REGRAS)

### 3.1 ARQUITETURA DO RULES ENGINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA DO RULES ENGINE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │
│   │   EVENTOS    │───▶│   REGRAS     │───▶│    AÇÕES     │                     │
│   │   (Trigger)  │    │  (IF/THEN)   │    │  (Output)    │                     │
│   └──────────────┘    └──────────────┘    └──────────────┘                     │
│          │                   │                   │                             │
│          ▼                   ▼                   ▼                             │
│   • Novo lead         • Condições          • Sugerir pacotes                  │
│   • Mudança status    • Operadores         • Criar tarefas                    │
│   • Documento add     • Prioridades        • Gerar itens proposta             │
│   • Data atingida     • Agrupamento        • Enviar mensagens                 │
│   • Valor calculado                              • Abrir checklists           │
│                                                  • Pedir documentos           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 VARIÁVEIS DISPONÍVEIS PARA REGRAS

**Dados do Cliente:**
- `cliente.tipo` (PF/PJ)
- `cliente.segmento` (residencial, comercial, industrial, condominio, loteamento)
- `cliente.porte` (pequeno, medio, grande)
- `cliente.localizacao` (cidade, estado)
- `cliente.concessionaria` (neoenergia, enel, cpfl, etc.)
- `cliente.historico_compras` (array de serviços anteriores)
- `cliente.data_ultimo_laudo`
- `cliente.laudo_vigente` (boolean)
- `cliente.tem_spda` (boolean)
- `cliente.data_ultimo_contato`

**Dados da Oportunidade/Serviço:**
- `servico.tipo` (projeto_bt, projeto_mt, projeto_at, pde_bt, pde_at, doacao_rede, obra_rede, laudo, spda, solar)
- `servico.tensao` (127V, 220V, 380V, 13.8kV, 34.5kV, etc.)
- `servico.potencia` (kW)
- `servico.carga` (valor estimado)
- `servico.doacao` (boolean)
- `servico.comissionamento` (boolean)
- `servico.envolve_concessionaria` (boolean)
- `servico.numero_unidades` (quantidade)
- `servico.tipo_imovel` (casa, predio, galpao, loteamento)
- `servico.risco_raio` (alto, medio, baixo)
- `servico.area_construida`
- `servico.consumo_estimado` (kWh/mês)

**Dados do Pipeline:**
- `oportunidade.etapa` (lead, qualificacao, visita, proposta, negociacao, fechado, execucao, concluido)
- `oportunidade.valor`
- `oportunidade.probabilidade`
- `oportunidade.data_prevista_fechamento`
- `oportunidade.dias_na_etapa`

### 3.3 REGRAS DO RULES ENGINE (30 REGRAS)

#### GRUPO 1: REGRAS DE CROSS-SELL OBRIGATÓRIO

---

**REGRA R001 - PDE Sugere Conexão Segura**

```yaml
Nome: PDE_Sugere_Conexao_Segura
Prioridade: 10 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['pde_bt', 'pde_at']
    - oportunidade.etapa IN ['qualificacao', 'visita', 'proposta']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Conexao Segura"
    mensagem: |
      🎯 RECOMENDAÇÃO ESPECIAL
      
      Para garantir uma conexão segura e sem surpresas, recomendamos adicionar:
      
      📋 PACOTE "CONEXÃO SEGURA"
      ✓ Projeto elétrico complementar
      ✓ Laudo técnico de instalação
      ✓ Ajustes e adequações necessárias
      ✓ Checklist completo de conformidade
      
      💰 Investimento adicional: A partir de R$ 1.500,00
      ⏱️ Prazo adicional: +2 dias úteis
      
      Garanta sua ligação na primeira tentativa!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Apresentar Pacote Conexão Segura"
    prazo: 24h
  
  - tipo: adicionar_item_proposta
    item: "Laudo Técnico de Instalação"
    valor_sugerido: 1500
```

---

**REGRA R002 - Ligação Nova Sugere PDE Completo**

```yaml
Nome: Ligacao_Nova_Sugere_PDE
Prioridade: 10 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['ligacao_nova', 'aumento_carga', 'conexao']
    - oportunidade.etapa IN ['qualificacao', 'visita']

Acoes:
  - tipo: sugerir_pacote
    pacote: "PDE Completo"
    mensagem: |
      ⚡ PADRÃO DE ENTRADA - OBRIGATÓRIO
      
      Detectamos que você precisa de um Padrão de Entrada:
      
      📋 PACOTE "PDE COMPLETO"
      ✓ Projeto de Padrão de Entrada (BT ou AT)
      ✓ ART de projeto
      ✓ Memorial descritivo completo
      ✓ Acompanhamento até aprovação
      ✓ Acompanhamento até ligação
      
      💡 Por que é necessário?
      A concessionária exige projeto aprovado para realizar a ligação de energia.
      
      💰 Investimento: A partir de R$ 2.500,00 (BT) / R$ 8.000,00 (AT)
      
      Clique para adicionar à proposta!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Confirmar necessidade de PDE"
    prazo: 4h
  
  - tipo: enviar_whatsapp
    template: "pde_obrigatorio"
```

---

**REGRA R003 - Doação de Rede Sugere SPDA Premium**

```yaml
Nome: Doacao_Sugere_SPDA
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['doacao_rede', 'obra_rede']
    - servico.envolve_concessionaria = true

Acoes:
  - tipo: sugerir_pacote
    pacote: "SPDA e Aterramento Premium"
    mensagem: |
      🛡️ PROTEÇÃO OBRIGATÓRIA PARA OBRAS DE REDE
      
      Obras que serão incorporadas à rede da concessionária precisam atender 
      às normas técnicas rigorosas de proteção contra descargas atmosféricas.
      
      📋 PACOTE "SPDA E ATERRAMENTO PREMIUM"
      ✓ Projeto SPDA conforme NBR 5419
      ✓ Medições de aterramento
      ✓ Adequações necessárias
      ✓ Laudo técnico de SPDA
      ✓ Certificado de conformidade
      
      ⚠️ Sem SPDA aprovado, a concessionária pode recusar a incorporação!
      
      💰 Investimento: A partir de R$ 3.500,00
  
  - tipo: criar_checklist
    nome: "Dossiê de Doação de Rede"
    itens:
      - "Requerimento de doação"
      - "Projeto executivo aprovado"
      - "ART de doação"
      - "Cronograma de execução"
  
  - tipo: criar_tarefa
    responsavel: projetista
    titulo: "Validar documentação de doação"
    prazo: 48h
```

---

**REGRA R004 - Cliente sem SPDA Sugere SPDA**

```yaml
Nome: Cliente_Sem_SPDA_Sugere
Prioridade: 8 (Média)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['laudo', 'projeto_bt', 'projeto_mt']
    - cliente.tem_spda = false
    - cliente.segmento IN ['comercial', 'industrial', 'condominio']

Acoes:
  - tipo: sugerir_pacote
    pacote: "SPDA e Aterramento Premium"
    mensagem: |
      ⚠️ ATENÇÃO: SPDA NÃO DETECTADO
      
      Identificamos que sua instalação pode não possuir SPDA adequado ou 
      atualizado conforme a NBR 5419.
      
      🛡️ POR QUE INSTALAR UM SPDA?
      ✓ Proteção de equipamentos e instalações
      ✓ Segurança de pessoas
      ✓ Redução de risco de incêndio
      ✓ Conformidade com normas técnicas
      ✓ Possível redução no seguro
      
      📋 PACOTE "SPDA E ATERRAMENTO PREMIUM"
      ✓ Análise de risco conforme NBR 5419
      ✓ Projeto executivo completo
      ✓ Execução com materiais certificados
      ✓ Medições de aterramento
      ✓ Laudo técnico e ART
      ✓ Certificado de conformidade
      
      💰 Investimento: A partir de R$ 2.800,00
      
      🔒 Proteja seu patrimônio!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Agendar inspeção de SPDA"
    prazo: 48h
```

---

**REGRA R005 - Laudo Vencido Sugere Renovação**

```yaml
Nome: Laudo_Vencido_Sugere_Renovacao
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.laudo_vigente = true
    - cliente.data_ultimo_laudo < (hoje - 365 dias)
    - cliente.segmento IN ['industrial', 'comercial_grande']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Monitoramento & Manutenção"
    mensagem: |
      ⏰ RENOVE SEU LAUDO TÉCNICO
      
      Seu laudo técnico venceu há {{dias_vencido}} dias!
      
      ⚠️ RISCOS DE LAUDO VENCIDO:
      ✗ Multas do corpo de bombeiros
      ✗ Problemas com seguros
      ✗ Responsabilidade civil em caso de acidentes
      ✗ Impedimento de renovação de alvarás
      
      📋 PACOTE "MONITORAMENTO & MANUTENÇÃO"
      ✓ Inspeção periódica anual
      ✓ Laudo técnico atualizado
      ✓ ART renovada
      ✓ Relatório de conformidade
      ✓ Sugestões de melhorias
      
      💰 Investimento: A partir de R$ 1.200,00/ano
      
      🔄 Mantenha-se em conformidade!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Contatar cliente sobre laudo vencido"
    prazo: 24h
    urgente: true
  
  - tipo: enviar_email
    assunto: "Seu laudo técnico venceu - Ação necessária"
    template: "laudo_vencido"
```

---

#### GRUPO 2: REGRAS DE SEGMENTO E PORTE

---

**REGRA R006 - Condomínio Sugere Manutenção Recorrente**

```yaml
Nome: Condominio_Sugere_Manutencao
Prioridade: 7 (Média)
Ativo: true

Condicoes:
  AND:
    - cliente.segmento = 'condominio'
    - servico.tipo IN ['projeto_bt', 'pde_bt', 'laudo']
    - oportunidade.etapa = 'concluido'

Acoes:
  - tipo: sugerir_pacote
    pacote: "Monitoramento & Manutenção"
    mensagem: |
      🏢 PROGRAMA DE MANUTENÇÃO PARA CONDOMÍNIOS
      
      Condomínios precisam de atenção especial com a manutenção elétrica:
      
      📋 PACOTE "MONITORAMENTO & MANUTENÇÃO"
      ✓ Inspeção trimestral das instalações
      ✓ Laudo técnico anual
      ✓ ART de manutenção
      ✓ Relatório de conformidade
      ✓ Prioridade em atendimentos
      ✓ Desconto em serviços adicionais
      
      💰 Investimento: A partir de R$ 3.600,00/ano
      📅 Parcelamento: 12x sem juros
      
      🏆 Benefícios:
      • Prevenção de acidentes
      • Redução de custos com emergências
      • Conformidade com normas
      • Tranquilidade para o síndico
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Apresentar contrato de manutenção"
    prazo: 7 dias
    agendamento: pos_entrega
  
  - tipo: adicionar_lembrete
    data: (data_conclusao + 30 dias)
    mensagem: "Enviar proposta de manutenção"
```

---

**REGRA R007 - Industrial Sugere PMOC e Laudos Periódicos**

```yaml
Nome: Industrial_Sugere_PMOC
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.segmento = 'industrial'
    - servico.tipo IN ['projeto_mt', 'projeto_at', 'pde_at']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Monitoramento & Manutenção Industrial"
    mensagem: |
      🏭 MANUTENÇÃO INDUSTRIAL - OBRIGATÓRIO
      
      Instalações industriais exigem manutenção rigorosa conforme NR-10:
      
      📋 PACOTE "MONITORAMENTO & MANUTENÇÃO INDUSTRIAL"
      ✓ Inspeção mensal das instalações
      ✓ Laudo técnico semestral
      ✓ ART de manutenção
      ✓ Relatório de conformidade NR-10
      ✓ Treinamento de equipe (NR-10)
      ✓ Plano de manutenção preventiva
      ✓ Prioridade em atendimentos 24h
      
      💰 Investimento: A partir de R$ 8.000,00/ano
      
      ⚠️ EVITE:
      • Multas do MTE
      • Paradas não programadas
      • Acidentes de trabalho
      • Perda de produtividade
  
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Elaborar plano de manutenção industrial"
    prazo: 48h
  
  - tipo: adicionar_item_proposta
    item: "Treinamento NR-10"
    valor_sugerido: 3500
```

---

**REGRA R008 - Loteamento Sugere Padronização**

```yaml
Nome: Loteamento_Sugere_Padronizacao
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['doacao_rede', 'obra_rede']
    - servico.numero_unidades > 10

Acoes:
  - tipo: sugerir_pacote
    pacote: "Rede e Doação"
    mensagem: |
      🏘️ PROJETO DE LOTEAMENTO/CONDOMÍNIO
      
      Detectamos um projeto com {{servico.numero_unidades}} unidades!
      
      📋 SUGESTÃO DE PADRONIZAÇÃO
      ✓ Projeto padronizado de PDE para todas as unidades
      ✓ Economia de escala
      ✓ Agilidade na aprovação
      ✓ Facilidade na execução
      
      💰 BENEFÍCIOS:
      • Desconto de 20% no projeto de cada unidade
      • Processo único na concessionária
      • Acompanhamento integrado
      • Entrega padronizada
      
      📞 Vamos conversar sobre as vantagens?
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Apresentar proposta de padronização"
    prazo: 24h
  
  - tipo: adicionar_item_proposta
    item: "Projeto Padronizado de PDE"
    quantidade: "{{servico.numero_unidades}}"
    desconto: 20
```

---

**REGRA R009 - Comércio Grande Sugere SPDA**

```yaml
Nome: Comercio_Grande_Sugere_SPDA
Prioridade: 7 (Média)
Ativo: true

Condicoes:
  AND:
    - cliente.segmento = 'comercial'
    - cliente.porte = 'grande'
    - cliente.tem_spda = false
    - servico.area_construida > 500

Acoes:
  - tipo: sugerir_pacote
    pacote: "SPDA e Aterramento Premium"
    mensagem: |
      🏪 PROTEÇÃO PARA SEU NEGÓCIO
      
      Comércios de grande porte precisam de proteção reforçada:
      
      📋 PACOTE "SPDA E ATERRAMENTO PREMIUM"
      ✓ Projeto SPDA conforme NBR 5419
      ✓ Sistema de proteção completo
      ✓ Aterramento adequado
      ✓ Laudo técnico
      ✓ Certificado de conformidade
      
      💰 Investimento: A partir de R$ 4.500,00
      
      🛡️ BENEFÍCIOS:
      • Proteção de equipamentos
      • Segurança de clientes e funcionários
      • Redução de risco de incêndio
      • Conformidade com normas
      • Possível redução no seguro patrimonial
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Agendar visita para avaliação de SPDA"
    prazo: 48h
```

---

#### GRUPO 3: REGRAS DE CONSUMO E ENERGIA SOLAR

---

**REGRA R010 - Alto Consumo Sugere Solar**

```yaml
Nome: Alto_Consumo_Sugere_Solar
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.consumo_estimado > 500
    - cliente.localizacao IN ['SP', 'MG', 'RJ', 'BA', 'CE', 'RN', 'PE']
    - servico.tipo IN ['pde_bt', 'projeto_bt']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Solar + Adequação Elétrica"
    mensagem: |
      ☀️ QUE TAL REDUZIR SUA CONTA DE LUZ?
      
      Detectamos um consumo estimado de {{servico.consumo_estimado}} kWh/mês!
      
      📋 PACOTE "SOLAR + ADEQUAÇÃO ELÉTRICA"
      ✓ Estudo de viabilidade solar
      ✓ Dimensionamento do sistema
      ✓ Projeto fotovoltaico completo
      ✓ Adequação elétrica necessária
      ✓ Acompanhamento até aprovação
      
      💰 ECONOMIA ESTIMADA:
      • Redução de até 95% na conta de luz
      • Payback em 3-5 anos
      • Valorização do imóvel
      • Energia limpa e sustentável
      
      💡 INVESTIMENTO:
      A partir de R$ 15.000,00 (financiamento disponível)
      
      🌱 Faça parte da revolução solar!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Agendar visita para estudo solar"
    prazo: 48h
  
  - tipo: adicionar_item_proposta
    item: "Estudo de Viabilidade Solar"
    valor_sugerido: 0
    observacao: "Gratuito para clientes PDE"
```

---

**REGRA R011 - Área do Telhado Sugere Solar**

```yaml
Nome: Area_Telhado_Sugere_Solar
Prioridade: 6 (Baixa)
Ativo: true

Condicoes:
  AND:
    - servico.area_telhado > 50
    - cliente.segmento IN ['residencial', 'comercial']
    - servico.tipo IN ['projeto_bt', 'pde_bt']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Solar + Adequação Elétrica"
    mensagem: |
      ☀️ SEU TELHADO PODE GERAR ECONOMIA!
      
      Identificamos que você possui {{servico.area_telhado}}m² de área disponível 
      no telhado - ideal para instalação de placas solares!
      
      📋 PACOTE "SOLAR + ADEQUAÇÃO ELÉTRICA"
      ✓ Estudo de viabilidade gratuito
      ✓ Projeto fotovoltaico completo
      ✓ Adequação elétrica
      ✓ Acompanhamento até ligação
      
      💰 ECONOMIA:
      • Redução de até 95% na conta de luz
      • Financiamento em até 72x
      • Garantia de 25 anos nos painéis
      
      🌞 Aproveite o sol da {{cliente.localizacao}}!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Oferecer estudo solar gratuito"
    prazo: 72h
```

---

#### GRUPO 4: REGRAS DE CONCESSIONÁRIA

---

**REGRA R012 - Neoenergia Requer Documentação Específica**

```yaml
Nome: Neoenergia_Documentacao_Especifica
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.concessionaria = 'neoenergia'
    - servico.tipo IN ['pde_bt', 'pde_at', 'doacao_rede']

Acoes:
  - tipo: pedir_documento
    documentos:
      - "Certidão negativa de débitos Neoenergia"
      - "Cópia da última conta de energia"
      - "Documento do imóvel atualizado"
  
  - tipo: criar_checklist
    nome: "Documentos Neoenergia"
    itens:
      - "Certidão negativa de débitos"
      - "RG/CPF do responsável"
      - "Matrícula do imóvel"
      - "IPTU atualizado"
      - "Conta de energia de vizinho (se ligação nova)"
  
  - tipo: enviar_whatsapp
    template: "documentos_neoenergia"
    mensagem: |
      📋 DOCUMENTOS NECESSÁRIOS - NEOENERGIA
      
      Para agilizar seu processo, precisamos dos seguintes documentos:
      
      ✓ Certidão negativa de débitos com a Neoenergia
      ✓ RG e CPF do responsável
      ✓ Matrícula do imóvel ou escritura
      ✓ IPTU atualizado
      ✓ Conta de energia de vizinho (para ligação nova)
      
      📎 Envie os documentos respondendo esta mensagem!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Solicitar documentos específicos Neoenergia"
    prazo: 24h
```

---

**REGRA R013 - Enel Requer Formulários Específicos**

```yaml
Nome: Enel_Formularios_Especificos
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.concessionaria = 'enel'
    - servico.tipo IN ['pde_bt', 'pde_at']

Acoes:
  - tipo: pedir_documento
    documentos:
      - "Formulário Enel preenchido"
      - "Declaração de carga"
      - "Planta de situação"
  
  - tipo: criar_checklist
    nome: "Documentos Enel"
    itens:
      - "Formulário de solicitação Enel"
      - "Declaração de carga assinada"
      - "Planta de situação do imóvel"
      - "Documentação do responsável"
      - "Documentação do imóvel"
  
  - tipo: enviar_email
    assunto: "Formulários Enel - Preenchimento necessário"
    template: "formularios_enel"
  
  - tipo: criar_tarefa
    responsavel: projetista
    titulo: "Baixar formulários atualizados Enel"
    prazo: 24h
```

---

**REGRA R014 - Aumento de Carga Requer Estudo**

```yaml
Nome: Aumento_Carga_Requer_Estudo
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo = 'aumento_carga'
    - servico.potencia > 50

Acoes:
  - tipo: sugerir_pacote
    pacote: "PDE Completo"
    mensagem: |
      ⚡ AUMENTO DE CARGA - ESTUDO NECESSÁRIO
      
      Aumentos de carga acima de 50kW requerem estudo técnico detalhado:
      
      📋 SERVIÇOS NECESSÁRIOS:
      ✓ Estudo de carga e demanda
      ✓ Verificação da rede existente
      ✓ Dimensionamento do novo padrão
      ✓ Projeto de adequação
      ✓ Submissão à concessionária
      
      ⚠️ SEM ESTUDO:
      • Concessionária pode recusar o aumento
      • Risco de sobrecarga na rede
      • Problemas de qualidade de energia
      
      💰 Investimento: A partir de R$ 2.000,00
  
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Realizar estudo de carga e demanda"
    prazo: 48h
  
  - tipo: adicionar_item_proposta
    item: "Estudo de Carga e Demanda"
    valor_sugerido: 2000
```

---

#### GRUPO 5: REGRAS DE PIPELINE E FOLLOW-UP

---

**REGRA R015 - Lead Parado na Qualificação**

```yaml
Nome: Lead_Parado_Qualificacao
Prioridade: 7 (Média)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'qualificacao'
    - oportunidade.dias_na_etapa > 3

Acoes:
  - tipo: enviar_whatsapp
    template: "follow_up_qualificacao"
    mensagem: |
      👋 Olá {{cliente.nome}}!
      
      Estamos aguardando alguns documentos para prosseguir com seu projeto.
      
      📋 Documentos pendentes:
      {{documentos_pendentes}}
      
      💬 Posso ajudar com algo?
      
      Responda aqui ou ligue: {{telefone_comercial}}
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Follow-up lead parado na qualificação"
    prazo: 24h
  
  - tipo: adicionar_lembrete
    data: (hoje + 3 dias)
    mensagem: "Novo follow-up se não houver resposta"
```

---

**REGRA R016 - Proposta Enviada sem Resposta**

```yaml
Nome: Proposta_Sem_Resposta
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'proposta'
    - oportunidade.dias_na_etapa > 5

Acoes:
  - tipo: enviar_email
    assunto: "Sua proposta está esperando - Dúvidas?"
    template: "follow_up_proposta"
  
  - tipo: enviar_whatsapp
    template: "follow_up_proposta_whats"
    mensagem: |
      👋 Olá {{cliente.nome}}!
      
      Enviamos sua proposta há {{oportunidade.dias_na_etapa}} dias.
      
      💬 Tem alguma dúvida? Podemos:
      • Esclarecer qualquer ponto
      • Ajustar o escopo
      • Negociar condições
      • Agendar uma reunião
      
      📞 Ligue: {{telefone_comercial}}
      💬 Responda aqui!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Ligar para cliente sobre proposta"
    prazo: 24h
    urgente: true
```

---

**REGRA R017 - Negociação Parada**

```yaml
Nome: Negociacao_Parada
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'negociacao'
    - oportunidade.dias_na_etapa > 7

Acoes:
  - tipo: enviar_whatsapp
    template: "urgente_negociacao"
    mensagem: |
      🎯 {{cliente.nome}}, não perca esta oportunidade!
      
      Sua proposta está em negociação há {{oportunidade.dias_na_etapa}} dias.
      
      💡 QUE TAL UM DESCONTO ESPECIAL?
      
      Se fechar até {{data_limite}}, oferecemos:
      ✓ 5% de desconto no valor total
      ✓ OU parcelamento em 12x sem juros
      
      ⏰ Válido por 48h!
      
      💬 Responda SIM para aproveitar!
  
  - tipo: criar_tarefa
    responsavel: gestor
    titulo: "Avaliar desconto para fechamento"
    prazo: 24h
```

---

**REGRA R018 - Pós-Venda - Solicitar Indicação**

```yaml
Nome: Pos_Venda_Indicacao
Prioridade: 6 (Baixa)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'concluido'
    - oportunidade.dias_na_etapa > 7
    - cliente.avaliacao >= 4

Acoes:
  - tipo: enviar_whatsapp
    template: "pedir_indicacao"
    mensagem: |
      🌟 {{cliente.nome}}, obrigado pela confiança!
      
      Ficamos felizes em saber que você ficou satisfeito com nosso serviço.
      
      💬 CONHECE ALGUÉM QUE PRECISA?
      
      Indique amigos, familiares ou empresas que precisem de:
      ✓ Projetos elétricos
      ✓ Padrão de entrada
      ✓ Laudos técnicos
      ✓ SPDA
      ✓ Energia solar
      
      🎁 GANHE R$ 200,00 para cada indicação fechada!
      
      📞 {{telefone_comercial}}
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Agradecer e pedir indicação"
    prazo: 7 dias
    agendamento: pos_entrega
```

---

#### GRUPO 6: REGRAS DE DOCUMENTAÇÃO

---

**REGRA R019 - Documentos Pendentes Bloqueiam Pipeline**

```yaml
Nome: Documentos_Pendentes_Bloqueio
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa IN ['qualificacao', 'visita']
    - documentos_pendentes.count > 0
    - oportunidade.dias_na_etapa > 5

Acoes:
  - tipo: bloquear_avanco
    mensagem: "Documentos pendentes impedem avanço"
  
  - tipo: enviar_email
    assunto: "URGENTE: Documentos pendentes"
    template: "documentos_pendentes_urgente"
  
  - tipo: enviar_whatsapp
    template: "documentos_pendentes_whats"
    mensagem: |
      ⚠️ {{cliente.nome}}, precisamos de você!
      
      Seu projeto está aguardando documentos há {{oportunidade.dias_na_etapa}} dias.
      
      📋 Documentos pendentes:
      {{documentos_pendentes}}
      
      ⏰ Sem esses documentos, não conseguimos prosseguir.
      
      💬 Pode nos enviar?
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Contato urgente sobre documentos"
    prazo: 24h
    urgente: true
```

---

**REGRA R020 - ART Pendente Alerta Engenheiro**

```yaml
Nome: ART_Pendente_Alerta
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'execucao'
    - art.status = 'pendente'
    - oportunidade.dias_na_etapa > 2

Acoes:
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Emitir ART pendente"
    prazo: 24h
    urgente: true
  
  - tipo: enviar_email
    destinatario: "engenheiro@empresa.com"
    assunto: "ART Pendente - {{cliente.nome}}"
    template: "alerta_art"
  
  - tipo: notificacao_sistema
    mensagem: "ART pendente para {{cliente.nome}}"
    destinatario: engenheiro
```

---

#### GRUPO 7: REGRAS DE SEGURANÇA E CONFORMIDADE

---

**REGRA R021 - Tensão AT Requer SPDA**

```yaml
Nome: Tensao_AT_Requer_SPDA
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tensao IN ['13.8kV', '34.5kV', '69kV', '138kV']
    - cliente.tem_spda = false

Acoes:
  - tipo: sugerir_pacote
    pacote: "SPDA e Aterramento Premium"
    mensagem: |
      ⚡⚠️ ATENÇÃO: INSTALAÇÃO EM ALTA TENSÃO
      
      Instalações em alta tensão exigem proteção reforçada contra raios!
      
      📋 SPDA OBRIGATÓRIO PARA AT
      ✓ Projeto SPDA específico para AT
      ✓ Sistema de proteção completo
      ✓ Aterramento de baixa impedância
      ✓ Laudo técnico especializado
      ✓ Certificado de conformidade
      
      ⚠️ SEM SPDA:
      • Risco de danos catastróficos
      • Não conformidade com normas
      • Problemas com seguros
      • Risco de acidentes graves
      
      💰 Investimento: A partir de R$ 8.000,00
  
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Avaliar necessidade de SPDA para AT"
    prazo: 24h
  
  - tipo: adicionar_item_proposta
    item: "Projeto SPDA para AT"
    obrigatorio: true
    valor_sugerido: 8000
```

---

**REGRA R022 - Área Classificada Requer Laudo Específico**

```yaml
Nome: Area_Classificada_Laudo
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  AND:
    - servico.tipo IN ['projeto_mt', 'projeto_at']
    - cliente.segmento = 'industrial'
    - servico.area_classificada = true

Acoes:
  - tipo: sugerir_pacote
    pacote: "Laudo de Instalações em Áreas Classificadas"
    mensagem: |
      ⚠️ ÁREA CLASSIFICADA DETECTADA
      
      Sua instalação possui áreas classificadas que exigem laudo específico!
      
      📋 LAUDO OBRIGATÓRIO
      ✓ Inspeção de áreas classificadas
      ✓ Verificação de equipamentos à prova de explosão
      ✓ Análise de conformidade com normas
      ✓ Laudo técnico específico
      ✓ ART especializada
      
      ⚠️ SEM LAUDO:
      • Multas do corpo de bombeiros
      • Interdição da instalação
      • Problemas com seguros
      • Risco de acidentes
      
      💰 Investimento: A partir de R$ 3.500,00
  
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Avaliar áreas classificadas"
    prazo: 24h
  
  - tipo: adicionar_item_proposta
    item: "Laudo de Áreas Classificadas"
    obrigatorio: true
    valor_sugerido: 3500
```

---

**REGRA R023 - Condomínio sem Laudo Anual**

```yaml
Nome: Condominio_Sem_Laudo_Anual
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.segmento = 'condominio'
    - cliente.laudo_vigente = false
    - cliente.data_ultimo_laudo < (hoje - 395 dias)

Acoes:
  - tipo: sugerir_pacote
    pacote: "Monitoramento & Manutenção"
    mensagem: |
      🏢 CONDOMÍNIO: LAUDO ANUAL VENCIDO
      
      Seu condomínio está com o laudo técnico vencido há mais de 30 dias!
      
      ⚠️ RISCOS:
      • Multas do corpo de bombeiros
      • Problemas com seguro condomínio
      • Responsabilidade civil do síndico
      • Risco de acidentes
      
      📋 PACOTE "MONITORAMENTO & MANUTENÇÃO"
      ✓ Laudo técnico anual
      ✓ ART de manutenção
      ✓ Relatório de conformidade
      ✓ Prioridade em atendimentos
      
      💰 Investimento: A partir de R$ 2.400,00/ano
      
      🏆 Proteja seu condomínio e seus moradores!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Contatar síndico sobre laudo vencido"
    prazo: 24h
    urgente: true
  
  - tipo: enviar_email
    assunto: "URGENTE: Laudo técnico vencido - {{cliente.nome}}"
    template: "laudo_condominio_vencido"
```

---

#### GRUPO 8: REGRAS DE RECEITA RECORRENTE

---

**REGRA R024 - Pós-Entrega Sugere Manutenção**

```yaml
Nome: Pos_Entrega_Manutencao
Prioridade: 6 (Baixa)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'concluido'
    - oportunidade.dias_na_etapa = 30
    - cliente.segmento IN ['comercial', 'industrial', 'condominio']

Acoes:
  - tipo: sugerir_pacote
    pacote: "Monitoramento & Manutenção"
    mensagem: |
      🎯 SEU PROJETO FOI ENTREGUE!
      
      Parabéns! Seu projeto foi concluído com sucesso.
      
      💡 QUE TAL GARANTIR A DURABILIDADE?
      
      📋 PACOTE "MONITORAMENTO & MANUTENÇÃO"
      ✓ Inspeções periódicas
      ✓ Laudos técnicos anuais
      ✓ Manutenção preventiva
      ✓ Prioridade em atendimentos
      ✓ Descontos em serviços
      
      💰 A partir de R$ 200,00/mês
      
      🔧 Prevenção é sempre mais barato que reparo!
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Apresentar contrato de manutenção"
    prazo: 7 dias
```

---

**REGRA R025 - Cliente com Múltiplas Unidades Sugere Contrato**

```yaml
Nome: Multiplas_Unidades_Contrato
Prioridade: 7 (Média)
Ativo: true

Condicoes:
  AND:
    - servico.numero_unidades > 5
    - oportunidade.etapa = 'concluido'

Acoes:
  - tipo: sugerir_pacote
    pacote: "Contrato Corporativo"
    mensagem: |
      🏢 CONTRATO CORPORATIVO
      
      Detectamos que você tem {{servico.numero_unidades}} unidades!
      
      📋 BENEFÍCIOS DO CONTRATO CORPORATIVO:
      ✓ Atendimento prioritário
      ✓ Desconto de 15% em todos os serviços
      ✓ Gestão centralizada
      ✓ Relatórios consolidados
      ✓ Atendimento 24h
      ✓ Gestor de conta dedicado
      
      💰 Investimento: Sob consulta
      
      📞 Vamos conversar?
  
  - tipo: criar_tarefa
    responsavel: gestor
    titulo: "Apresentar proposta corporativa"
    prazo: 7 dias
```

---

#### GRUPO 9: REGRAS DE AUTOMATION

---

**REGRA R026 - Novo Lead Dispara Sequência**

```yaml
Nome: Novo_Lead_Sequencia
Prioridade: 10 (Alta)
Ativo: true

Condicoes:
  - evento = 'novo_lead_criado'

Acoes:
  - tipo: enviar_whatsapp
    delay: 5 minutos
    template: "boas_vindas"
    mensagem: |
      👋 Olá {{cliente.nome}}!
      
      Bem-vindo à {{empresa.nome}}!
      
      Recebemos seu contato sobre {{servico.tipo}}.
      
      💬 Em breve nossa equipe entrará em contato.
      
      ⏱️ Prazo de resposta: 4 horas úteis
      
      📞 {{telefone_comercial}}
      🌐 {{site}}
  
  - tipo: criar_tarefa
    responsavel: comercial
    titulo: "Qualificar novo lead"
    prazo: 4h
  
  - tipo: adicionar_lembrete
    data: (hoje + 1 dia)
    mensagem: "Follow-up se não houver resposta"
```

---

**REGRA R027 - Proposta Aprovada Dispara Execução**

```yaml
Nome: Proposta_Aprovada_Execucao
Prioridade: 10 (Alta)
Ativo: true

Condicoes:
  - evento = 'proposta_aprovada'

Acoes:
  - tipo: mudar_etapa
    nova_etapa: 'execucao'
  
  - tipo: enviar_whatsapp
    template: "proposta_aprovada"
    mensagem: |
      🎉 Ótima notícia, {{cliente.nome}}!
      
      Sua proposta foi aprovada!
      
      📋 PRÓXIMOS PASSOS:
      ✓ Vamos iniciar o projeto
      ✓ Nossa equipe entrará em contato em 24h
      ✓ Acompanhamento em tempo real
      
      💬 Dúvidas? Estamos aqui!
  
  - tipo: criar_tarefa
    responsavel: engenheiro
    titulo: "Iniciar projeto - Kickoff"
    prazo: 24h
  
  - tipo: notificacao_sistema
    mensagem: "Nova obra iniciada: {{cliente.nome}}"
    destinatario: todos
```

---

**REGRA R028 - Exigência da Concessionária Alerta Cliente**

```yaml
Nome: Exigencia_Concessionaria_Alerta
Prioridade: 9 (Alta)
Ativo: true

Condicoes:
  - evento = 'exigencia_concessionaria'

Acoes:
  - tipo: enviar_whatsapp
    template: "exigencia_concessionaria"
    mensagem: |
      ⚠️ {{cliente.nome}}, a concessionária solicitou ajustes.
      
      📋 EXIGÊNCIAS:
      {{exigencias}}
      
      ⏱️ Prazo para resposta: 10 dias úteis
      
      💰 Custo dos ajustes: {{valor_exigencia}}
      
      💬 Precisa de esclarecimentos?
  
  - tipo: criar_tarefa
    responsavel: projetista
    titulo: "Atender exigências da concessionária"
    prazo: 48h
    urgente: true
  
  - tipo: adicionar_item_proposta
    item: "Ajustes por exigência da concessionária"
    valor_sugerido: "{{valor_exigencia}}"
```

---

**REGRA R029 - Obra Atrasada Alerta Gestão**

```yaml
Nome: Obra_Atrasada_Alerta
Prioridade: 8 (Alta)
Ativo: true

Condicoes:
  AND:
    - oportunidade.etapa = 'execucao'
    - obra.percentual_atraso > 10

Acoes:
  - tipo: notificacao_sistema
    mensagem: "Obra atrasada: {{cliente.nome}} - {{obra.percentual_atraso}}%"
    destinatario: gestor
    urgente: true
  
  - tipo: criar_tarefa
    responsavel: gestor
    titulo: "Analisar atraso na obra"
    prazo: 24h
    urgente: true
  
  - tipo: enviar_email
    destinatario: "gestor@empresa.com"
    assunto: "ALERTA: Obra atrasada - {{cliente.nome}}"
    template: "alerta_atraso"
```

---

**REGRA R030 - Cliente VIP Recebe Atendimento Prioritário**

```yaml
Nome: Cliente_VIP_Prioritario
Prioridade: 10 (Alta)
Ativo: true

Condicoes:
  AND:
    - cliente.segmento IN ['industrial', 'condominio']
    - cliente.porte = 'grande'
    - cliente.historico_valor_total > 50000

Acoes:
  - tipo: marcar_prioridade
    nivel: 'VIP'
  
  - tipo: atribuir_gestor_conta
    gestor: 'gerente_comercial'
  
  - tipo: enviar_whatsapp
    template: "atendimento_vip"
    mensagem: |
      🌟 {{cliente.nome}}, você é cliente VIP!
      
      Agora você tem:
      ✓ Atendimento prioritário
      ✓ Gestor de conta dedicado
      ✓ Descontos especiais
      ✓ Atendimento 24h
      
      💬 Seu gestor: {{gestor.nome}}
      📞 {{gestor.telefone}}
  
  - tipo: criar_tarefa
    responsavel: gerente_comercial
    titulo: "Contato de boas-vindas VIP"
    prazo: 24h
```

---

### 3.4 TABELA RESUMO DAS REGRAS

| Código | Nome | Prioridade | Gatilho | Ação Principal |
|--------|------|------------|---------|----------------|
| R001 | PDE Sugere Conexão Segura | 10 | servico.tipo = PDE | Sugerir pacote Conexão Segura |
| R002 | Ligação Nova Sugere PDE | 10 | servico.tipo = ligação | Sugerir pacote PDE Completo |
| R003 | Doação Sugere SPDA | 9 | servico.tipo = doação | Sugerir SPDA Premium |
| R004 | Cliente sem SPDA | 8 | cliente.tem_spda = false | Sugerir SPDA |
| R005 | Laudo Vencido | 9 | laudo_vencido > 365d | Sugerir renovação |
| R006 | Condomínio Manutenção | 7 | segmento = condomínio | Sugerir manutenção |
| R007 | Industrial PMOC | 8 | segmento = industrial | Sugerir PMOC |
| R008 | Loteamento Padronização | 8 | unidades > 10 | Sugerir padronização |
| R009 | Comércio SPDA | 7 | porte = grande | Sugerir SPDA |
| R010 | Alto Consumo Solar | 8 | consumo > 500kWh | Sugerir solar |
| R011 | Área Telhado Solar | 6 | area_telhado > 50m² | Sugerir solar |
| R012 | Neoenergia Docs | 9 | concessionária = Neoenergia | Pedir docs específicos |
| R013 | Enel Formulários | 9 | concessionária = Enel | Pedir formulários |
| R014 | Aumento Carga | 8 | aumento > 50kW | Sugerir estudo |
| R015 | Lead Parado | 7 | etapa = qualificação > 3d | Follow-up |
| R016 | Proposta Sem Resposta | 8 | etapa = proposta > 5d | Follow-up |
| R017 | Negociação Parada | 8 | etapa = negociação > 7d | Oferecer desconto |
| R018 | Pós-Venda Indicação | 6 | etapa = concluído > 7d | Pedir indicação |
| R019 | Docs Pendentes | 9 | docs_pendentes > 5d | Alerta urgente |
| R020 | ART Pendente | 8 | ART pendente > 2d | Alerta engenheiro |
| R021 | Tensão AT SPDA | 9 | tensão = AT | SPDA obrigatório |
| R022 | Área Classificada | 9 | area_classificada = true | Laudo obrigatório |
| R023 | Condomínio Laudo | 8 | condomínio + laudo vencido | Alerta síndico |
| R024 | Pós-Entrega Manutenção | 6 | etapa = concluído = 30d | Sugerir manutenção |
| R025 | Múltiplas Unidades | 7 | unidades > 5 | Contrato corporativo |
| R026 | Novo Lead | 10 | evento = novo_lead | Sequência boas-vindas |
| R027 | Proposta Aprovada | 10 | evento = proposta_aprovada | Iniciar execução |
| R028 | Exigência Concessionária | 9 | evento = exigência | Alerta cliente |
| R029 | Obra Atrasada | 8 | atraso > 10% | Alerta gestão |
| R030 | Cliente VIP | 10 | valor_total > 50k | Atendimento VIP |



---

## 4. CATÁLOGO DE SERVIÇOS COMPLETO

### 4.1 ESTRUTURA DO CATÁLOGO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CATÁLOGO DE SERVIÇOS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CATEGORIA 1: PROJETOS ELÉTRICOS                                               │
│  ├── Projeto Elétrico Baixa Tensão (BT)                                        │
│  ├── Projeto Elétrico Média Tensão (MT)                                        │
│  └── Projeto Elétrico Alta Tensão (AT)                                         │
│                                                                                 │
│  CATEGORIA 2: PADRÃO DE ENTRADA (PDE)                                          │
│  ├── PDE BT Monofásico                                                         │
│  ├── PDE BT Bifásico                                                           │
│  ├── PDE BT Trifásico                                                          │
│  └── PDE AT (Subestação)                                                       │
│                                                                                 │
│  CATEGORIA 3: OBRAS DE REDE                                                    │
│  ├── Doação de Rede                                                            │
│  ├── Incorporação de Rede                                                      │
│  ├── Conexão                                                                   │
│  └── Comissionamento                                                           │
│                                                                                 │
│  CATEGORIA 4: LAUDOS TÉCNICOS                                                  │
│  ├── Laudo de Instalações Elétricas                                            │
│  ├── Laudo de SPDA                                                             │
│  ├── Laudo de Instalações em Áreas Classificadas                               │
│  ├── Laudo de Aterramento                                                      │
│  └── Laudo de Instalações de Combate a Incêndio                                │
│                                                                                 │
│  CATEGORIA 5: SPDA E ATERRAMENTO                                               │
│  ├── Projeto SPDA                                                              │
│  ├── Execução SPDA                                                             │
│  ├── Medições de Aterramento                                                   │
│  └── Adequações SPDA                                                           │
│                                                                                 │
│  CATEGORIA 6: ENERGIA SOLAR                                                    │
│  ├── Estudo de Viabilidade Solar                                               │
│  ├── Projeto Fotovoltaico                                                      │
│  ├── Adequação Elétrica para Solar                                             │
│  └── Consultoria Solar                                                         │
│                                                                                 │
│  CATEGORIA 7: MANUTENÇÃO E MONITORAMENTO                                       │
│  ├── Contrato de Manutenção Preventiva                                         │
│  ├── Inspeção Periódica                                                        │
│  ├── Laudo Anual                                                               │
│  └── Treinamento NR-10                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 SERVIÇOS DETALHADOS

#### CATEGORIA 1: PROJETOS ELÉTRICOS

---

**SERVIÇO 1.1: PROJETO ELÉTRICO BT**

| Campo | Descrição |
|-------|-----------|
| **Código** | PROJ-BT-001 |
| **Nome** | Projeto Elétrico Baixa Tensão |
| **Descrição** | Elaboração completa de projeto elétrico para instalações em baixa tensão (127V, 220V, 380V), conforme NBR 5410 |
| **Escopo** | Levantamento de cargas, dimensionamento, plantas baixas, diagramas unifilares, memorial descritivo, especificação de materiais |
| **Entregáveis** | Plantas DWG/PDF, diagramas, memorial, BOM, ART |
| **SLA** | 5 dias úteis |
| **Preço Base** | R$ 2.500,00 |
| **Preço por m²** | R$ 8,00/m² |
| **Unidade** | Projeto |

**Tabela de Preços BT:**

| Tipo de Obra | Área | Preço |
|--------------|------|-------|
| Residencial pequena | até 150m² | R$ 2.500,00 |
| Residencial média | 150-300m² | R$ 3.500,00 |
| Residencial grande | 300-500m² | R$ 5.000,00 |
| Comercial pequeno | até 200m² | R$ 3.000,00 |
| Comercial médio | 200-500m² | R$ 5.000,00 |
| Comercial grande | 500-1000m² | R$ 8.000,00 |
| Industrial leve | até 1000m² | R$ 10.000,00 |
| Industrial médio | 1000-3000m² | R$ 18.000,00 |
| Industrial grande | acima 3000m² | Sob consulta |

**Dependências:** Nenhuma  
**Serviços Relacionados:** Laudo de instalações, SPDA, Adequação  
**Pacotes:** Conexão Segura

---

**SERVIÇO 1.2: PROJETO ELÉTRICO MT**

| Campo | Descrição |
|-------|-----------|
| **Código** | PROJ-MT-001 |
| **Nome** | Projeto Elétrico Média Tensão |
| **Descrição** | Elaboração de projeto elétrico para instalações em média tensão (13.8kV, 34.5kV) |
| **Escopo** | Estudo de carga, dimensionamento, projeto de subestação, diagramas, cálculos elétricos |
| **Entregáveis** | Projeto completo, diagramas, cálculos, memorial, ART |
| **SLA** | 10 dias úteis |
| **Preço Base** | R$ 15.000,00 |
| **Unidade** | Projeto |

**Tabela de Preços MT:**

| Potência | Tensão | Preço |
|----------|--------|-------|
| até 500kVA | 13.8kV | R$ 15.000,00 |
| 500-1000kVA | 13.8kV | R$ 22.000,00 |
| 1000-2500kVA | 13.8kV | R$ 35.000,00 |
| até 500kVA | 34.5kV | R$ 20.000,00 |
| 500-1000kVA | 34.5kV | R$ 28.000,00 |
| 1000-2500kVA | 34.5kV | R$ 45.000,00 |
| acima 2500kVA | Qualquer | Sob consulta |

**Dependências:** Levantamento de carga e demanda  
**Serviços Relacionados:** SPDA para MT, Laudo técnico, PMOC  
**Pacotes:** Conexão Segura

---

**SERVIÇO 1.3: PROJETO ELÉTRICO AT**

| Campo | Descrição |
|-------|-----------|
| **Código** | PROJ-AT-001 |
| **Nome** | Projeto Elétrico Alta Tensão |
| **Descrição** | Elaboração de projeto elétrico para instalações em alta tensão (69kV, 138kV) |
| **Escopo** | Estudo completo, projeto de subestação, SEAT, diagramas, cálculos detalhados |
| **Entregáveis** | Projeto executivo completo, todos os documentos técnicos, ART |
| **SLA** | 20 dias úteis |
| **Preço Base** | R$ 50.000,00 |
| **Unidade** | Projeto |

**Tabela de Preços AT:**

| Potência | Tensão | Preço |
|----------|--------|-------|
| até 5MVA | 69kV | R$ 50.000,00 |
| 5-10MVA | 69kV | R$ 75.000,00 |
| 10-20MVA | 69kV | R$ 120.000,00 |
| até 5MVA | 138kV | R$ 65.000,00 |
| 5-10MVA | 138kV | R$ 95.000,00 |
| 10-20MVA | 138kV | R$ 150.000,00 |
| acima 20MVA | Qualquer | Sob consulta |

**Dependências:** Estudo de carga e demanda detalhado  
**Serviços Relacionados:** SPDA para AT, Laudo técnico especializado  
**Pacotes:** Conexão Segura

---

#### CATEGORIA 2: PADRÃO DE ENTRADA (PDE)

---

**SERVIÇO 2.1: PDE BT MONOFÁSICO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PDE-BT-MONO |
| **Nome** | Padrão de Entrada BT Monofásico |
| **Descrição** | Projeto de padrão de entrada monofásico para ligação nova ou aumento de carga |
| **Escopo** | Levantamento, projeto, memorial, ART, acompanhamento até ligação |
| **Entregáveis** | Projeto aprovado, ART, memorial, protocolos |
| **SLA** | 7 dias úteis (aprovação) |
| **Preço** | R$ 2.500,00 |
| **Unidade** | Projeto |

**Inclui:**
- Projeto executivo do padrão
- Memorial descritivo
- ART de projeto
- Acompanhamento até aprovação
- Acompanhamento até ligação

**Não inclui:**
- Materiais de construção
- Mão de obra de execução
- Taxas da concessionária

**Dependências:** Documentação do cliente completa  
**Serviços Relacionados:** Execução PDE, Conexão Segura  
**Pacotes:** PDE Completo

---

**SERVIÇO 2.2: PDE BT BIFÁSICO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PDE-BT-BI |
| **Nome** | Padrão de Entrada BT Bifásico |
| **Descrição** | Projeto de padrão de entrada bifásico |
| **Escopo** | Projeto completo com acompanhamento |
| **Entregáveis** | Projeto aprovado, ART, memorial |
| **SLA** | 7 dias úteis |
| **Preço** | R$ 2.800,00 |
| **Unidade** | Projeto |

**Dependências:** Documentação do cliente  
**Pacotes:** PDE Completo

---

**SERVIÇO 2.3: PDE BT TRIFÁSICO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PDE-BT-TRI |
| **Nome** | Padrão de Entrada BT Trifásico |
| **Descrição** | Projeto de padrão de entrada trifásico |
| **Escopo** | Projeto completo com acompanhamento |
| **Entregáveis** | Projeto aprovado, ART, memorial |
| **SLA** | 10 dias úteis |
| **Preço** | R$ 3.500,00 |
| **Unidade** | Projeto |

**Dependências:** Documentação do cliente  
**Pacotes:** PDE Completo

---

**SERVIÇO 2.4: PDE AT (SUBESTAÇÃO)**

| Campo | Descrição |
|-------|-----------|
| **Código** | PDE-AT-001 |
| **Nome** | Padrão de Entrada AT - Subestação |
| **Descrição** | Projeto completo de subestação para alta tensão |
| **Escopo** | Estudo, projeto de SE, diagramas, cálculos, acompanhamento completo |
| **Entregáveis** | Projeto completo, todos os documentos, ART |
| **SLA** | 20 dias úteis |
| **Preço Base** | R$ 12.000,00 |
| **Unidade** | Projeto |

**Tabela de Preços PDE AT:**

| Potência | Tensão | Preço |
|----------|--------|-------|
| até 500kVA | 13.8kV | R$ 12.000,00 |
| 500-1000kVA | 13.8kV | R$ 18.000,00 |
| 1000-2500kVA | 13.8kV | R$ 28.000,00 |
| até 500kVA | 34.5kV | R$ 15.000,00 |
| 500-1000kVA | 34.5kV | R$ 22.000,00 |
| 1000-2500kVA | 34.5kV | R$ 35.000,00 |
| acima 2500kVA | Qualquer | Sob consulta |

**Dependências:** Estudo de carga e demanda  
**Serviços Relacionados:** Projeto MT/AT, SPDA para AT, Laudo técnico  
**Pacotes:** PDE Completo

---

#### CATEGORIA 3: OBRAS DE REDE

---

**SERVIÇO 3.1: DOAÇÃO DE REDE**

| Campo | Descrição |
|-------|-----------|
| **Código** | REDE-DOA-001 |
| **Nome** | Doação de Rede Elétrica |
| **Descrição** | Elaboração de dossiê e acompanhamento de doação de obra particular para concessionária |
| **Escopo** | Projeto de rede, dossiê de doação, acompanhamento até aprovação |
| **Entregáveis** | Projeto, dossiê completo, termo de doação |
| **SLA** | 30 dias úteis (aprovação) |
| **Preço Base** | R$ 8.000,00 |
| **Unidade** | Processo |

**Inclui:**
- Projeto executivo de rede
- Dossiê de doação completo
- ART de doação
- Acompanhamento na concessionária
- Atendimento a exigências

**Não inclui:**
- Execução da obra
- Materiais
- Taxas da concessionária

**Dependências:** Projeto de rede aprovado  
**Serviços Relacionados:** Incorporação, Conexão, Comissionamento  
**Pacotes:** Rede e Doação

---

**SERVIÇO 3.2: INCORPORAÇÃO DE REDE**

| Campo | Descrição |
|-------|-----------|
| **Código** | REDE-INC-001 |
| **Nome** | Incorporação de Rede |
| **Descrição** | Dossiê e acompanhamento de incorporação de obra de rede à concessionária |
| **Escopo** | Dossiê completo, vistoria, aprovação |
| **Entregáveis** | Dossiê, termo de incorporação |
| **SLA** | 20 dias úteis |
| **Preço** | R$ 5.000,00 |
| **Unidade** | Processo |

**Dependências:** Obra executada, doação aprovada (se aplicável)  
**Pacotes:** Rede e Doação

---

**SERVIÇO 3.3: CONEXÃO**

| Campo | Descrição |
|-------|-----------|
| **Código** | REDE-CON-001 |
| **Nome** | Processo de Conexão |
| **Descrição** | Dossiê e acompanhamento de conexão à rede da concessionária |
| **Escopo** | Dossiê de conexão, acompanhamento até aprovação |
| **Entregáveis** | Dossiê, parecer de conexão |
| **SLA** | 15 dias úteis |
| **Preço** | R$ 3.000,00 |
| **Unidade** | Processo |

**Dependências:** Incorporação aprovada (se aplicável)  
**Pacotes:** Rede e Doação

---

**SERVIÇO 3.4: COMISSIONAMENTO**

| Campo | Descrição |
|-------|-----------|
| **Código** | REDE-COM-001 |
| **Nome** | Comissionamento |
| **Descrição** | Dossiê e acompanhamento de comissionamento e ligação definitiva |
| **Escopo** | Dossiê de comissionamento, vistoria, ligação |
| **Entregáveis** | Dossiê, termo de comissionamento, energia liberada |
| **SLA** | 15 dias úteis |
| **Preço** | R$ 4.000,00 |
| **Unidade** | Processo |

**Dependências:** Conexão aprovada  
**Pacotes:** Rede e Doação

---

**SERVIÇO 3.5: PACOTE REDE COMPLETO**

| Campo | Descrição |
|-------|-----------|
| **Código** | REDE-PAC-COMPLETO |
| **Nome** | Pacote Rede Completo |
| **Descrição** | Todos os processos de rede (doação + incorporação + conexão + comissionamento) |
| **Escopo** | Todos os dossiês e acompanhamentos |
| **Entregáveis** | Todos os documentos, energia liberada |
| **SLA** | 60 dias úteis |
| **Preço** | R$ 18.000,00 |
| **Unidade** | Pacote |

**Desconto:** 15% em relação aos serviços avulsos  
**Pacotes:** Rede e Doação

---

#### CATEGORIA 4: LAUDOS TÉCNICOS

---

**SERVIÇO 4.1: LAUDO DE INSTALAÇÕES ELÉTRICAS**

| Campo | Descrição |
|-------|-----------|
| **Código** | LAUDO-INST-001 |
| **Nome** | Laudo de Instalações Elétricas |
| **Descrição** | Laudo técnico completo de instalações elétricas conforme NBR 5410 |
| **Escopo** | Inspeção, medições, análise, laudo, ART |
| **Entregáveis** | Laudo técnico, protocolos de medição, ART |
| **SLA** | 5 dias úteis |
| **Preço Base** | R$ 1.500,00 |
| **Unidade** | Laudo |

**Tabela de Preços:**

| Tipo | Área/Potência | Preço |
|------|---------------|-------|
| Residencial | até 300m² | R$ 1.500,00 |
| Residencial | 300-500m² | R$ 2.000,00 |
| Comercial | até 500m² | R$ 2.500,00 |
| Comercial | 500-1000m² | R$ 3.500,00 |
| Industrial | até 1000m² | R$ 4.500,00 |
| Industrial | 1000-3000m² | R$ 6.500,00 |
| Industrial | acima 3000m² | Sob consulta |

**Dependências:** Acesso à instalação  
**Serviços Relacionados:** Adequações elétricas  
**Pacotes:** Conexão Segura

---

**SERVIÇO 4.2: LAUDO DE SPDA**

| Campo | Descrição |
|-------|-----------|
| **Código** | LAUDO-SPDA-001 |
| **Nome** | Laudo Técnico de SPDA |
| **Descrição** | Laudo técnico de Sistema de Proteção contra Descargas Atmosféricas |
| **Escopo** | Inspeção, medições de aterramento, análise, laudo, ART |
| **Entregáveis** | Laudo técnico, protocolos, ART, certificado |
| **SLA** | 5 dias úteis |
| **Preço Base** | R$ 1.800,00 |
| **Unidade** | Laudo |

**Tabela de Preços:**

| Tipo | Área/Altura | Preço |
|------|-------------|-------|
| Residencial | até 300m² | R$ 1.800,00 |
| Comercial | até 500m² | R$ 2.500,00 |
| Comercial | 500-1000m² | R$ 3.500,00 |
| Industrial | até 1000m² | R$ 4.000,00 |
| Torre/Edifício | acima 30m | Sob consulta |

**Dependências:** Acesso à instalação  
**Serviços Relacionados:** Projeto SPDA, Execução SPDA  
**Pacotes:** SPDA e Aterramento Premium

---

**SERVIÇO 4.3: LAUDO DE ÁREAS CLASSIFICADAS**

| Campo | Descrição |
|-------|-----------|
| **Código** | LAUDO-AC-001 |
| **Nome** | Laudo de Instalações em Áreas Classificadas |
| **Descrição** | Laudo técnico específico para instalações em áreas classificadas |
| **Escopo** | Inspeção especializada, análise de conformidade, laudo |
| **Entregáveis** | Laudo técnico, ART especializada |
| **SLA** | 7 dias úteis |
| **Preço Base** | R$ 4.500,00 |
| **Unidade** | Laudo |

**Dependências:** Acesso à instalação, projeto existente  
**Pacotes:** Monitoramento & Manutenção Industrial

---

**SERVIÇO 4.4: LAUDO DE ATERRAMENTO**

| Campo | Descrição |
|-------|-----------|
| **Código** | LAUDO-ATERR-001 |
| **Nome** | Laudo de Aterramento |
| **Descrição** | Laudo técnico de sistema de aterramento com medições |
| **Escopo** | Medições, análise, laudo, ART |
| **Entregáveis** | Laudo, protocolos de medição, ART |
| **SLA** | 3 dias úteis |
| **Preço** | R$ 1.200,00 |
| **Unidade** | Laudo |

**Dependências:** Acesso aos pontos de aterramento  
**Pacotes:** SPDA e Aterramento Premium

---

#### CATEGORIA 5: SPDA E ATERRAMENTO

---

**SERVIÇO 5.1: PROJETO SPDA**

| Campo | Descrição |
|-------|-----------|
| **Código** | SPDA-PROJ-001 |
| **Nome** | Projeto de SPDA |
| **Descrição** | Elaboração de projeto de SPDA conforme NBR 5419 |
| **Escopo** | Análise de risco, dimensionamento, projeto executivo, memorial |
| **Entregáveis** | Projeto completo, ART |
| **SLA** | 5 dias úteis |
| **Preço Base** | R$ 2.500,00 |
| **Unidade** | Projeto |

**Tabela de Preços:**

| Tipo | Área | Preço |
|------|------|-------|
| Residencial | até 300m² | R$ 2.500,00 |
| Comercial | até 500m² | R$ 3.500,00 |
| Comercial | 500-1000m² | R$ 5.000,00 |
| Industrial | até 1000m² | R$ 6.000,00 |
| Industrial | 1000-3000m² | R$ 9.000,00 |

**Dependências:** Levantamento da instalação  
**Pacotes:** SPDA e Aterramento Premium

---

**SERVIÇO 5.2: EXECUÇÃO SPDA**

| Campo | Descrição |
|-------|-----------|
| **Código** | SPDA-EXEC-001 |
| **Nome** | Execução de SPDA |
| **Descrição** | Execução completa do sistema de SPDA conforme projeto aprovado |
| **Escopo** | Fornecimento de materiais, mão de obra, instalação completa |
| **Entregáveis** | SPDA instalado, testado, ART de execução |
| **SLA** | 10 dias úteis |
| **Preço Base** | R$ 8.000,00 |
| **Unidade** | Execução |

**Tabela de Preços:**

| Tipo | Área | Preço |
|------|------|-------|
| Residencial | até 300m² | R$ 8.000,00 |
| Comercial | até 500m² | R$ 12.000,00 |
| Comercial | 500-1000m² | R$ 18.000,00 |
| Industrial | até 1000m² | R$ 25.000,00 |

**Dependências:** Projeto SPDA aprovado  
**Pacotes:** SPDA e Aterramento Premium

---

**SERVIÇO 5.3: PACOTE SPDA COMPLETO**

| Campo | Descrição |
|-------|-----------|
| **Código** | SPDA-PAC-COMPLETO |
| **Nome** | Pacote SPDA Completo |
| **Descrição** | Projeto + Execução + Laudo + ART completa |
| **Escopo** | Todos os serviços de SPDA |
| **Entregáveis** | SPDA completo, todos os documentos, certificado |
| **SLA** | 15 dias úteis |
| **Preço Base** | R$ 12.000,00 |
| **Unidade** | Pacote |

**Tabela de Preços:**

| Tipo | Área | Preço |
|------|------|-------|
| Residencial | até 300m² | R$ 12.000,00 |
| Comercial | até 500m² | R$ 18.000,00 |
| Comercial | 500-1000m² | R$ 28.000,00 |
| Industrial | até 1000m² | R$ 38.000,00 |

**Desconto:** 15% em relação aos serviços avulsos  
**Pacotes:** SPDA e Aterramento Premium

---

#### CATEGORIA 6: ENERGIA SOLAR

---

**SERVIÇO 6.1: ESTUDO DE VIABILIDADE SOLAR**

| Campo | Descrição |
|-------|-----------|
| **Código** | SOLAR-ESTUDO-001 |
| **Nome** | Estudo de Viabilidade Solar |
| **Descrição** | Análise completa de viabilidade técnica e econômica de sistema fotovoltaico |
| **Escopo** | Análise de consumo, inspeção do telhado, simulação, proposta |
| **Entregáveis** | Relatório de viabilidade, proposta de sistema |
| **SLA** | 3 dias úteis |
| **Preço** | GRATUITO |
| **Unidade** | Estudo |

**Condição:** Gratuito para clientes de PDE ou projeto elétrico  
**Pacotes:** Solar + Adequação Elétrica

---

**SERVIÇO 6.2: PROJETO FOTOVOLTAICO**

| Campo | Descrição |
|-------|-----------|
| **Código** | SOLAR-PROJ-001 |
| **Nome** | Projeto Fotovoltaico |
| **Descrição** | Elaboração completa de projeto de sistema fotovoltaico |
| **Escopo** | Dimensionamento, projeto executivo, memorial, especificação |
| **Entregáveis** | Projeto completo, ART |
| **SLA** | 7 dias úteis |
| **Preço Base** | R$ 3.500,00 |
| **Preço por kWp** | R$ 350,00/kWp |
| **Unidade** | Projeto |

**Tabela de Preços:**

| Potência | Preço Projeto |
|----------|---------------|
| até 5kWp | R$ 3.500,00 |
| 5-10kWp | R$ 5.000,00 |
| 10-20kWp | R$ 8.000,00 |
| 20-50kWp | R$ 15.000,00 |
| 50-100kWp | R$ 25.000,00 |
| acima 100kWp | Sob consulta |

**Dependências:** Estudo de viabilidade aprovado  
**Pacotes:** Solar + Adequação Elétrica

---

**SERVIÇO 6.3: ADEQUAÇÃO ELÉTRICA PARA SOLAR**

| Campo | Descrição |
|-------|-----------|
| **Código** | SOLAR-ADEQ-001 |
| **Nome** | Adequação Elétrica para Sistema Solar |
| **Descrição** | Adequações necessárias na instalação elétrica para receber sistema solar |
| **Escopo** | Projeto de adequação, materiais, execução |
| **Entregáveis** | Instalação adequada, laudo, ART |
| **SLA** | 5 dias úteis |
| **Preço Base** | R$ 2.500,00 |
| **Unidade** | Serviço |

**Dependências:** Projeto solar aprovado  
**Pacotes:** Solar + Adequação Elétrica

---

#### CATEGORIA 7: MANUTENÇÃO E MONITORAMENTO

---

**SERVIÇO 7.1: CONTRATO DE MANUTENÇÃO PREVENTIVA**

| Campo | Descrição |
|-------|-----------|
| **Código** | MANUT-CONT-001 |
| **Nome** | Contrato de Manutenção Preventiva |
| **Descrição** | Contrato anual de manutenção preventiva de instalações elétricas |
| **Escopo** | Inspeções periódicas, manutenção preventiva, laudos, atendimento prioritário |
| **Entregáveis** | Manutenções programadas, laudos, relatórios |
| **SLA** | 12 meses |
| **Preço Base** | R$ 3.600,00/ano |
| **Unidade** | Ano |

**Tabela de Preços:**

| Tipo | Área/Potência | Preço/Ano |
|------|---------------|-----------|
| Residencial | até 500m² | R$ 2.400,00 |
| Comercial | até 1000m² | R$ 4.800,00 |
| Comercial | 1000-3000m² | R$ 9.600,00 |
| Industrial | até 1000kVA | R$ 12.000,00 |
| Industrial | 1000-2500kVA | R$ 24.000,00 |
| Condomínio | até 50 unidades | R$ 6.000,00 |
| Condomínio | 50-100 unidades | R$ 10.000,00 |

**Inclui:**
- Inspeções periódicas (frequência conforme contrato)
- Laudo técnico anual
- ART de manutenção
- Atendimento prioritário
- Desconto de 10% em serviços adicionais

**Pacotes:** Monitoramento & Manutenção

---

**SERVIÇO 7.2: INSPEÇÃO PERIÓDICA**

| Campo | Descrição |
|-------|-----------|
| **Código** | MANUT-INSP-001 |
| **Nome** | Inspeção Periódica |
| **Descrição** | Inspeção técnica periódica de instalações elétricas |
| **Escopo** | Inspeção visual, testes, medições, relatório |
| **Entregáveis** | Relatório de inspeção |
| **SLA** | 2 dias úteis |
| **Preço** | R$ 800,00 |
| **Unidade** | Inspeção |

**Pacotes:** Monitoramento & Manutenção

---

**SERVIÇO 7.3: TREINAMENTO NR-10**

| Campo | Descrição |
|-------|-----------|
| **Código** | TREINO-NR10-001 |
| **Nome** | Treinamento NR-10 |
| **Descrição** | Treinamento de segurança em instalações elétricas conforme NR-10 |
| **Escopo** | Treinamento teórico e prático, material, certificado |
| **Entregáveis** | Certificado de conclusão |
| **SLA** | 1 dia |
| **Preço** | R$ 3.500,00 |
| **Unidade** | Turma (até 20 pessoas) |

**Pacotes:** Monitoramento & Manutenção Industrial

---

### 4.3 PACOTES PRÉ-MONTADOS

---

**PACOTE 1: CONEXÃO SEGURA**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-CONEXAO-SEGURA |
| **Nome** | Conexão Segura |
| **Descrição** | Pacote completo para garantir conexão segura e aprovada |
| **Serviços Incluídos** | Projeto elétrico + Laudo técnico + Ajustes + Checklist |
| **Preço** | A partir de R$ 4.500,00 |
| **Desconto** | 10% em relação aos serviços avulsos |
| **Público-Alvo** | Ligação nova, aumento de carga, conexão, PDE |

**Quando Sugerir:**
- Cliente solicitando ligação nova
- Aumento de carga
- Conexão à rede
- Qualquer serviço de PDE

---

**PACOTE 2: PDE COMPLETO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-PDE-COMPLETO |
| **Nome** | PDE Completo |
| **Descrição** | Pacote completo de Padrão de Entrada com acompanhamento total |
| **Serviços Incluídos** | PDE BT/AT + ART + Memorial + Acompanhamento até ligação |
| **Preço BT** | A partir de R$ 3.500,00 |
| **Preço AT** | A partir de R$ 15.000,00 |
| **Desconto** | Incluso acompanhamento |
| **Público-Alvo** | Clientes que precisam de padrão/entrada/ligação |

**Quando Sugerir:**
- Cliente pediu "padrão de entrada"
- Cliente pediu "ligação de energia"
- Construção nova
- Aumento de carga que requer novo padrão

---

**PACOTE 3: REDE E DOAÇÃO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-REDE-DOACAO |
| **Nome** | Rede e Doação |
| **Descrição** | Pacote completo para obras de rede com doação |
| **Serviços Incluídos** | Projeto de rede + Dossiê doação + Incorporação + Conexão + Comissionamento |
| **Preço** | A partir de R$ 25.000,00 |
| **Desconto** | 15% em relação aos serviços avulsos |
| **Público-Alvo** | Obras de rede, loteamentos, condomínios, ampliações |

**Quando Sugerir:**
- Obra particular que será doada
- Loteamento
- Ampliação de rede
- Construção com doação

---

**PACOTE 4: SPDA E ATERRAMENTO PREMIUM**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-SPDA-PREMIUM |
| **Nome** | SPDA e Aterramento Premium |
| **Descrição** | Pacote completo de proteção contra raios |
| **Serviços Incluídos** | Projeto SPDA + Execução + Medições + Laudo + ART |
| **Preço** | A partir de R$ 12.000,00 |
| **Desconto** | 15% em relação aos serviços avulsos |
| **Público-Alvo** | Comercial, condomínio, industrial, áreas de risco |

**Quando Sugerir:**
- Cliente comercial/industrial/condomínio
- Área de alto risco de raios
- Exigência de concessionária
- Cliente sem SPDA

---

**PACOTE 5: MONITORAMENTO & MANUTENÇÃO**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-MONITORAMENTO |
| **Nome** | Monitoramento & Manutenção |
| **Descrição** | Pacote de serviços recorrentes para manutenção |
| **Serviços Incluídos** | Inspeção periódica + Laudos anuais + ART + Atendimento prioritário |
| **Preço** | A partir de R$ 3.600,00/ano |
| **Desconto** | Incluso atendimento prioritário |
| **Público-Alvo** | Pós-entrega para receita recorrente |

**Quando Sugerir:**
- Após conclusão de qualquer obra
- Cliente comercial/industrial/condomínio
- Cliente com laudo vencido
- Preventivamente

---

**PACOTE 6: SOLAR + ADEQUAÇÃO ELÉTRICA**

| Campo | Descrição |
|-------|-----------|
| **Código** | PAC-SOLAR-ADEC |
| **Nome** | Solar + Adequação Elétrica |
| **Descrição** | Pacote completo para implantação de energia solar |
| **Serviços Incluídos** | Estudo solar + Projeto fotovoltaico + Adequação elétrica |
| **Preço** | A partir de R$ 6.000,00 |
| **Desconto** | Estudo gratuito |
| **Público-Alvo** | Clientes com alto consumo e infraestrutura adequada |

**Quando Sugerir:**
- Consumo estimado > 500kWh/mês
- Área de telhado > 50m²
- Local com boa insolação
- Cliente interessado em economia

---

### 4.4 MATRIZ DE DEPENDÊNCIAS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MATRIZ DE DEPENDÊNCIAS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SERVIÇO                    │ DEPENDE DE                    │ LIBERA            │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Projeto BT                 │ -                             │ Execução BT       │
│  Projeto MT                 │ Estudo carga/demanda          │ Execução MT       │
│  Projeto AT                 │ Estudo carga/demanda          │ Execução AT       │
│  PDE BT                     │ Documentação cliente          │ Execução PDE      │
│  PDE AT                     │ Estudo carga/demanda          │ Execução PDE AT   │
│  Doação de Rede             │ Projeto de rede               │ Incorporação      │
│  Incorporação               │ Doação aprovada + Obra exec.  │ Conexão           │
│  Conexão                    │ Incorporação aprovada         │ Comissionamento   │
│  Comissionamento            │ Conexão aprovada              │ Energia liberada  │
│  Laudo                      │ Acesso à instalação           │ Adequações        │
│  Projeto SPDA               │ Levantamento                  │ Execução SPDA     │
│  Execução SPDA              │ Projeto SPDA aprovado         │ Laudo SPDA        │
│  Estudo Solar               │ Dados de consumo              │ Projeto Solar     │
│  Projeto Solar              │ Estudo aprovado               │ Adequação + Exec. │
│  Manutenção                 │ Obra concluída                │ Renovação         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```



---

## 5. WIREFRAMES TEXTUAIS DAS TELAS MVP

### 5.1 DASHBOARD EXECUTIVO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  DASHBOARD EXECUTIVO                    [Notificações] [Perfil] [Sair]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  FILTROS: [Hoje ▼] [Todas Unidades ▼] [Atualizar]                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   LEADS     │  │  PROPOSTAS  │  │   OBRAS     │  │  FATURAMENTO│           │
│  │             │  │             │  │             │  │             │           │
│  │    12       │  │     8       │  │    15       │  │  R$ 125K    │           │
│  │   ↑ 20%     │  │   ↑ 15%     │  │   → 0%      │  │   ↑ 12%     │           │
│  │  vs mês ant.│  │  vs mês ant.│  │  vs mês ant.│  │  vs mês ant.│           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │    PIPELINE DE VENDAS       │  │         OBRAS EM ANDAMENTO              │  │
│  │                             │  │                                         │  │
│  │  [Gráfico de funil]         │  │  [Lista de obras com status e %]        │  │
│  │                             │  │                                         │  │
│  │  Lead: 12                   │  │  ▓▓▓▓▓▓▓░░░ PDE Residencial Silva  70%  │  │
│  │  Qualificação: 8            │  │  ▓▓▓▓▓░░░░░ Rede Condomínio Verde  50%  │  │
│  │  Visita: 5                  │  │  ▓▓▓▓▓▓▓▓▓░ Laudo Industrial XYZ   90%  │  │
│  │  Proposta: 6                │  │  ▓▓▓░░░░░░░ SPDA Comercial ABC     30%  │  │
│  │  Negociação: 4              │  │                                         │  │
│  │  Fechado: 3                 │  │  [Ver todas →]                          │  │
│  └─────────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  ALERTAS E PENDÊNCIAS       │  │  PRÓXIMAS TAREFAS / AGENDA              │  │
│  │                             │  │                                         │  │
│  │  🔴 3 ARTs pendentes        │  │  Hoje 14:00 - Visita técnica Santos     │  │
│  │  🟡 5 Propostas vencendo    │  │  Hoje 16:00 - Reunião proposta ABC      │  │
│  │  🟠 2 Obras atrasadas       │  │  Amanhã 09:00 - Vistoria concessionária │  │
│  │  🔵 7 Leads não atendidos   │  │  Amanhã 14:00 - Entrega documental XYZ  │  │
│  │                             │  │                                         │  │
│  │  [Ver todos →]              │  │  [Ver agenda completa →]                │  │
│  └─────────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │              SUGESTÕES DO SISTEMA (RULES ENGINE)                        │   │
│  │                                                                         │   │
│  │  💡 Cliente "Silva" sem SPDA - Sugerir Pacote SPDA Premium              │   │
│  │  💡 Laudo do Condomínio Verde vence em 30 dias - Renovar                │   │
│  │  💡 Proposta da Indústria XYZ parada há 7 dias - Oferecer desconto      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 CLIENTES (CADASTRO + HISTÓRICO + CROSS-SELL)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  CLIENTES  >  LISTA                       [Buscar...] [+ Novo Cliente]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  FILTROS: [Todos os segmentos ▼] [Todas as cidades ▼] [Ativos ▼] [🔍]  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [☑] NOME          │ TIPO │ SEGMENTO    │ CIDADE    │ STATUS  │ AÇÕES │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  [☐] Silva Constr. │ PJ   │ Industrial  │ São Paulo │ Ativo   │ 👁 ✏ 🗑│   │
│  │  [☐] Cond. Verde   │ PJ   │ Condomínio  │ Campinas  │ Ativo   │ 👁 ✏ 🗑│   │
│  │  [☐] João Santos   │ PF   │ Residencial │ Santos    │ Ativo   │ 👁 ✏ 🗑│   │
│  │  [☐] Indústria XYZ │ PJ   │ Industrial  │ Sorocaba  │ Inativo │ 👁 ✏ 🗑│   │
│  │  [☐] Comercial ABC │ PJ   │ Comercial   │ São Paulo │ Ativo   │ 👁 ✏ 🗑│   │
│  │  ...                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [< Anterior] Página 1 de 5 [Próxima >]    Mostrando 1-10 de 45 clientes       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
                              TELA DE DETALHE DO CLIENTE
═══════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  CLIENTES  >  JOÃO SANTOS                      [Editar] [📞] [✉️] [🗑] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  👤 JOÃO DA SILVA SANTOS                    [Tag: VIP] [Tag: Solar]     │   │
│  │  📧 joao.santos@email.com                                               │   │
│  │  📞 (11) 98765-4321                                                     │   │
│  │  🏠 Rua das Flores, 123 - São Paulo/SP                                  │   │
│  │  🏢 Concessionária: Neoenergia                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Dados] [Histórico] [Obras] [Propostas] [Documentos] [Tarefas] [Cross-sell]   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           HISTÓRICO                                     │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  15/01/2025  Proposta #123 aprovada - PDE BT (R$ 3.500,00)              │   │
│  │  10/01/2025  Visita técnica realizada                                   │   │
│  │  05/01/2025  Lead qualificado - Interesse em PDE                        │   │
│  │  ...                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           OBRAS DO CLIENTE                              │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  #123 - PDE BT Residencial        │ Em execução  │ 70% │ R$ 3.500,00   │   │
│  │  #089 - Laudo Anual 2024          │ Concluído    │100% │ R$ 1.500,00   │   │
│  │  #045 - Projeto Elétrico 2023     │ Concluído    │100% │ R$ 2.800,00   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  💡 OPORTUNIDADES DE CROSS-SELL (RULES ENGINE)                          │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  🛡️ Cliente não possui SPDA - Sugerir Pacote SPDA (R$ 12.000,00)        │   │
│  │  ☀️ Consumo alto detectado - Sugerir Estudo Solar (GRÁTIS)              │   │
│  │  📋 Laudo anual vence em 3 meses - Sugerir renovação                    │   │
│  │                                                                         │   │
│  │  [Criar proposta com sugestões →]                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 OBRAS (CENTRALIZADO)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  OBRAS  >  LISTA                          [Buscar...] [+ Nova Obra]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  VISUALIZAÇÃO: [Lista ▼]  FILTROS: [Todas ▼] [Todos status ▼] [🔍]     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [KANBAN VIEW]                                                          │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ PROJETO     │  │ APROVAÇÃO   │  │ EXECUÇÃO    │  │ CONCLUÍDO   │    │   │
│  │  │ (5)         │  │ (3)         │  │ (8)         │  │ (12)        │    │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤    │   │
│  │  │ PDE #124    │  │ Rede #098   │  │ PDE #123    │  │ PDE #089    │    │   │
│  │  │ Silva       │  │ Cond.Verde  │  │ Santos      │  │ Oliveira    │    │   │
│  │  │ R$ 3.500    │  │ R$ 25.000   │  │ ▓▓▓▓▓▓▓░░░  │  │ ✓ Completo  │    │   │
│  │  │             │  │ Aguardando  │  │ 70%         │  │             │    │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤    │   │
│  │  │ Proj #125   │  │ PDE AT #087 │  │ SPDA #111   │  │ Laudo #076  │    │   │
│  │  │ Comercial   │  │ Indústria   │  │ Comercial   │  │ Condomínio  │    │   │
│  │  │ R$ 5.000    │  │ Aguardando  │  │ ▓▓▓▓▓▓▓▓▓░  │  │ ✓ Completo  │    │   │
│  │  │             │  │ docs        │  │ 90%         │  │             │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
                              TELA DE DETALHE DA OBRA
═══════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  OBRAS  >  #123 - PDE BT SANTOS               [Editar] [📄] [📊] [🗑]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  #123 - PDE BT RESIDENCIAL - JOÃO SANTOS                                │   │
│  │  Status: EM EXECUÇÃO (70%)                    [Tag: Urgente]            │   │
│  │  Valor: R$ 3.500,00     Previsão entrega: 20/01/2025                    │   │
│  │  Responsável: Eng. Carlos                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Visão Geral] [Etapas] [Checklists] [Documentos] [Protocolos] [Financeiro]    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ETAPAS DA OBRA                                  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  ✅ Pré-venda                    [Concluído - 05/01]                    │   │
│  │  ✅ Projeto                      [Concluído - 10/01]                    │   │
│  │  ✅ Aprovação Concessionária     [Concluído - 15/01]                    │   │
│  │  ▶️  Execução                    [Em andamento - 70%]                   │   │
│  │     └─> Vistoria agendada para 18/01                                    │   │
│  │  ⏸️ Entrega                      [Pendente]                             │   │
│  │  ⏸️ Pós-venda                    [Pendente]                             │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CHECKLIST ATUAL                                 │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  FASE: EXECUÇÃO                                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ☑️ Materiais adquiridos                                                │   │
│  │  ☑️ Equipe mobilizada                                                   │   │
│  │  ☑️ Obra iniciada                                                       │   │
│  │  ☑️ 50% da execução concluído                                           │   │
│  │  ☐ Vistoria intermediária                                               │   │
│  │  ☐ 100% da execução                                                     │   │
│  │  ☐ Testes realizados                                                    │   │
│  │  ☐ Vistoria da concessionária                                           │   │
│  │  ☐ Ligação de energia                                                   │   │
│  │  ☐ ART de execução                                                      │   │
│  │                                                                         │   │
│  │  [Ver checklist completo →]                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      PROTOCOLOS CONCESSIONÁRIA                          │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Protocolo  │ Tipo        │ Data       │ Status      │ Ações            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  #2025-001  │ Entrada     │ 05/01/2025 │ Aprovado    │ 👁 📄            │   │
│  │  #2025-045  │ Vistoria    │ 18/01/2025 │ Agendado    │ 👁 ✏ 🗑          │   │
│  │                                                                         │   │
│  │  [+ Novo protocolo]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 PIPELINE CRM (KANBAN)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  PIPELINE DE VENDAS                       [+ Nova Oportunidade] [📊]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  FILTROS: [Minhas oportunidades ▼] [Este mês ▼] [Todos segmentos ▼]    │   │
│  │  VALOR TOTAL NO PIPELINE: R$ 245.000,00                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │   │
│  │  │ LEAD NOVO     │ │ QUALIFICAÇÃO  │ │VISITA/LEVANT. │ │  PROPOSTA   │ │   │
│  │  │ (R$ 45K)      │ │ (R$ 68K)      │ │ (R$ 32K)      │ │ (R$ 85K)    │ │   │
│  │  │ 5 cards       │ │ 4 cards       │ │ 3 cards       │ │ 4 cards     │ │   │
│  │  ├───────────────┤ ├───────────────┤ ├───────────────┤ ├─────────────┤ │   │
│  │  │ Silva PDE     │ │ Santos Docs   │ │ Oliveira      │ │ Comercial   │ │   │
│  │  │ R$ 3.5K       │ │ R$ 3.5K       │ │ Visita        │ │ Proposta    │ │   │
│  │  │ [Mover ▼]     │ │ [Mover ▼]     │ │ R$ 5K         │ │ R$ 8K       │ │   │
│  │  ├───────────────┤ ├───────────────┤ ├───────────────┤ │ [Mover ▼]   │ │   │
│  │  │ Cond. Solar   │ │ Indústria     │ │ Residencial   │ ├─────────────┤ │   │
│  │  │ R$ 25K        │ │ MT R$ 18K     │ │ Projeto       │ │ Condomínio  │ │   │
│  │  │ [Mover ▼]     │ │ [Mover ▼]     │ │ R$ 4K         │ │ Laudo       │ │   │
│  │  ├───────────────┤ └───────────────┤ │ [Mover ▼]     │ │ R$ 12K      │ │   │
│  │  │ ...           │                 │ └───────────────┤ │ [Mover ▼]   │ │   │
│  │  └───────────────┘                 │                 │ ├─────────────┤ │   │
│  │                                    │                 │ │ ...         │ │   │
│  │                                    │                 │ │             │ │   │
│  │  ┌───────────────┐ ┌───────────────┐               │ └─────────────┘ │   │
│  │  │  NEGOCIAÇÃO   │ │   FECHADO     │               │                 │   │
│  │  │  (R$ 52K)     │ │   (R$ 125K)   │               │                 │   │
│  │  │  2 cards      │ │   3 cards     │               │                 │   │
│  │  ├───────────────┤ ├───────────────┤               │                 │   │
│  │  │ Loteamento    │ │ PDE Santos    │               │                 │   │
│  │  │ Rede R$ 35K   │ │ R$ 3.5K ✓     │               │                 │   │
│  │  │ [Mover ▼]     │ │               │               │                 │   │
│  │  ├───────────────┤ ├───────────────┤               │                 │   │
│  │  │ Comercial     │ │ Laudo Cond.   │               │                 │   │
│  │  │ SPDA R$ 17K   │ │ Verde R$ 2.4K │               │                 │   │
│  │  │ [Mover ▼]     │ │ ✓             │               │                 │   │
│  │  └───────────────┘ └───────────────┘               │                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Arraste os cards entre as colunas ou use o menu Mover]                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.5 PROPOSTAS (BUILDER + ITENS SUGERIDOS + PACOTES)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  PROPOSTAS  >  NOVA PROPOSTA                         [Salvar] [Enviar]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  CLIENTE: [João Santos ▼]          DATA: 15/01/2025                    │   │
│  │  VALIDADE: 30 dias                 VENDEDOR: [Carlos ▼]                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    💡 SUGESTÕES DO SISTEMA                              │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Baseado no perfil do cliente, sugerimos:                               │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ 🎯 PACOTE "PDE COMPLETO" - R$ 3.500,00                          │   │   │
│  │  │    PDE BT + ART + Memorial + Acompanhamento até ligação         │   │   │
│  │  │    [Adicionar à proposta]                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ 🛡️ PACOTE "CONEXÃO SEGURA" - R$ 4.500,00                        │   │   │
│  │  │    Projeto + Laudo + Ajustes + Checklist                        │   │   │
│  │  │    [Adicionar à proposta]                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  [Ver mais sugestões →]                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ITENS DA PROPOSTA                               │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  # │ DESCRIÇÃO                    │ QTD │ UNITÁRIO  │ TOTAL     │ ✗    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  1 │ PDE BT Trifásico             │ 1   │ R$ 3.500  │ R$ 3.500  │ [🗑] │   │
│  │  2 │ Acompanhamento Concessionária│ 1   │ R$ 500    │ R$ 500    │ [🗑] │   │
│  │  3 │                              │     │           │           │      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                           SUBTOTAL:     R$ 4.000,00     │   │
│  │                                           DESCONTO:     R$ 0,00         │   │
│  │                                           TOTAL:        R$ 4.000,00     │   │
│  │                                                                         │   │
│  │  [+ Adicionar item]  [+ Adicionar pacote]  [Aplicar desconto]          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CATÁLOGO DE SERVIÇOS                            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  [Todos] [PDE] [Projetos] [Laudos] [SPDA] [Rede] [Solar] [Manutenção]  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  PDE BT Monofásico ........................ R$ 2.500,00 [+ Adicionar]  │   │
│  │  PDE BT Bifásico .......................... R$ 2.800,00 [+ Adicionar]  │   │
│  │  PDE BT Trifásico ......................... R$ 3.500,00 [+ Adicionar]  │   │
│  │  PDE AT (até 500kVA) ...................... R$ 12.000,00 [+ Adicionar] │   │
│  │  Projeto Elétrico BT ...................... R$ 2.500,00 [+ Adicionar]  │   │
│  │  Laudo de Instalações ..................... R$ 1.500,00 [+ Adicionar]  │   │
│  │  ...                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CONDIÇÕES COMERCIAIS                            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  FORMA DE PAGAMENTO: [50% entrada + 50% na entrega ▼]                  │   │
│  │  PRAZO DE ENTREGA: 15 dias úteis                                       │   │
│  │  OBSERVAÇÕES: _________________________________________________        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.6 PROCESSO OPERACIONAL (ETAPAS, CHECKLISTS, PROTOCOLOS, EVIDÊNCIAS)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  OBRAS  >  #123  >  PROCESSO                                         📱  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [Timeline] [Checklists] [Protocolos] [Documentos] [Evidências] [Tarefas]      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         TIMELINE DA OBRA                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  ●────────────────●────────────────●──────────────○──────────────○      │   │
│  │  │                │                │              │              │       │   │
│  │  Lead         Qualificação    Projeto        Execução      Entrega      │   │
│  │  (05/01)      (06/01)         (10/01)        (15/01)       (20/01)      │   │
│  │  ✓            ✓               ✓              ▶ 70%         ⏸            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CHECKLIST - FASE: EXECUÇÃO                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Progresso: 70% (7/10 itens)                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  ☑️ Materiais adquiridos                                    [05/01]     │   │
│  │      └─> NF #12345 anexada                                              │   │
│  │  ☑️ Equipe mobilizada                                       [10/01]     │   │
│  │      └─> OS #456 emitida                                                │   │
│  │  ☑️ Obra iniciada                                           [12/01]     │   │
│  │      └─> Foto inicial anexada                                           │   │
│  │  ☑️ 50% da execução concluído                               [14/01]     │   │
│  │      └─> Fotos de acompanhamento anexadas                               │   │
│  │  ☐ Vistoria intermediária                                   [Aguardando]│   │
│  │      └─> [Agendar] [Anexar evidências]                                  │   │
│  │  ☐ 100% da execução concluída                               [Pendente]  │   │
│  │  ☐ Testes realizados                                        [Pendente]  │   │
│  │  ☐ Vistoria da concessionária                               [Agendado]  │   │
│  │      └─> Data: 18/01/2025 - Protocolo #2025-045                         │   │
│  │  ☐ Ligação de energia                                       [Pendente]  │   │
│  │  ☐ ART de execução emitida                                  [Pendente]  │   │
│  │                                                                         │   │
│  │  [+ Adicionar item]  [Salvar progresso]                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         EVIDÊNCIAS / ANEXOS                             │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  PASTA: Execução / 50% Concluído                                        │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  📷 IMG_20250114_143022.jpg        2.3 MB    14/01/2025  [👁] [⬇️] [🗑] │   │
│  │  📷 IMG_20250114_143045.jpg        2.1 MB    14/01/2025  [👁] [⬇️] [🗑] │   │
│  │  📷 IMG_20250114_143118.jpg        1.9 MB    14/01/2025  [👁] [⬇️] [🗑] │   │
│  │  📄 Relatorio_50percent.pdf        450 KB    14/01/2025  [👁] [⬇️] [🗑] │   │
│  │                                                                         │   │
│  │  [+ Anexar arquivo]  [Tirar foto]                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.7 DOCUMENTOS (PASTAS, VERSÕES, PERMISSÕES)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  OBRAS  >  #123  >  DOCUMENTOS                                    [📤]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📁 DOCUMENTOS DA OBRA #123 - PDE BT SANTOS                             │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  📁 01 - Documentos do Cliente/Contrato                                 │   │
│  │      📄 Contrato_assinado.pdf                                           │   │
│  │      📄 RG_CPF_Santos.pdf                                               │   │
│  │      📄 Matricula_imovel.pdf                                            │   │
│  │                                                                         │   │
│  │  📁 02 - Projeto (expandir ▼)                                           │   │
│  │      📁 02.1 - Versões                                                  │   │
│  │          📄 Projeto_v1.pdf (rejeitado)                                  │   │
│  │          📄 Projeto_v2.pdf (aprovado) ✓                                 │   │
│  │      📄 Memorial_descritivo.pdf                                         │   │
│  │      📄 ART_projeto.pdf                                                 │   │
│  │      📄 BOM_materiais.xlsx                                              │   │
│  │                                                                         │   │
│  │  📁 03 - Concessionária (expandir ▼)                                    │   │
│  │      📄 Protocolo_entrada_2025-001.pdf                                  │   │
│  │      📄 Parecer_aprovacao.pdf                                           │   │
│  │      📄 Exigencias_respondidas.pdf                                      │   │
│  │                                                                         │   │
│  │  📁 04 - Execução (expandir ▼)                                          │   │
│  │      📄 OS_execucao.pdf                                                 │   │
│  │      📄 ART_execucao.pdf                                                │   │
│  │      📄 Laudo_instalacao.pdf                                            │   │
│  │      📁 Fotos                                                           │   │
│  │                                                                         │   │
│  │  📁 05 - Entrega (expandir ▼)                                           │   │
│  │      📄 As_built.pdf                                                    │   │
│  │      📄 Manual_usuario.pdf                                              │   │
│  │      📄 Termo_entrega_assinado.pdf                                      │   │
│  │      📄 NF_servico.pdf                                                  │   │
│  │                                                                         │   │
│  │  [+ Nova pasta]  [📤 Upload]  [📥 Download pasta]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PERMISSÕES                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Pasta                    │ Admin │ Engenheiro │ Comercial │ Cliente   │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  01 - Documentos Cliente  │  ✓✍   │     ✓      │     ✓     │    ✓      │   │
│  │  02 - Projeto             │  ✓✍   │    ✓✍      │     ✓     │    ✓      │   │
│  │  03 - Concessionária      │  ✓✍   │    ✓✍      │     ✓     │    ☐      │   │
│  │  04 - Execução            │  ✓✍   │    ✓✍      │     ✓     │    ☐      │   │
│  │  05 - Entrega             │  ✓✍   │    ✓✍      │    ✓✍     │   ✓✍      │   │
│  │                                                                         │   │
│  │  ✓ = Visualizar  ✍ = Editar  ☐ = Sem acesso                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.8 TAREFAS/AGENDA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  TAREFAS / AGENDA                         [+ Nova Tarefa] [📅] [📋]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [Minhas tarefas] [Todas] [Por obra] [Por responsável] [Calendário]            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  FILTROS: [Pendentes ▼] [Todas prioridades ▼] [Este mês ▼] [🔍]        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  HOJE - 15/01/2025                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  ☐ 09:00  Revisar projeto PDE #124 (Silva)                    [Alta]   │   │
│  │     └─> Responsável: Eu        [Concluir] [Adiar] [Delegar]            │   │
│  │                                                                         │   │
│  │  ☑ 11:00  Ligação de follow-up - Proposta #089                [Média]  │   │
│  │     └─> ✓ Concluído - Cliente vai analisar                             │   │
│  │                                                                         │   │
│  │  ☐ 14:00  Visita técnica - Obra #123 (Santos)                 [Alta]   │   │
│  │     └─> Responsável: Eu        [Concluir] [Adiar] [Delegar]            │   │
│  │     └─> 📍 Rua das Flores, 123 - São Paulo/SP                          │   │
│  │                                                                         │   │
│  │  ☐ 16:00  Reunião de apresentação - Proposta Comercial ABC    [Alta]   │   │
│  │     └─> Responsável: Eu + Carlos   [Concluir] [Adiar]                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  AMANHÃ - 16/01/2025                                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ☐ 09:00  Vistoria concessionária - Rede #098 (Cond. Verde)   [Alta]   │   │
│  │  ☐ 14:00  Entrega documental - Laudo #076 (Condomínio Azul)   [Média]  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PRÓXIMA SEMANA                                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ☐ Seg 20/01  Entrega PDE #123 (Santos)                       [Alta]   │   │
│  │  ☐ Qua 22/01  Reunião kickoff - Projeto MT Indústria XYZ      [Alta]   │   │
│  │  ☐ Sex 24/01  Follow-up proposta - Loteamento Verde           [Média]  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         TAREFAS ATRASADAS                               │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ⚠️  2 tarefas atrasadas!                                               │   │
│  │  ☐ Emitir ART execução - Obra #111 (atraso: 2 dias)           [Urgente]│   │
│  │  ☐ Responder exigência - Protocolo #2025-032 (atraso: 1 dia)  [Urgente]│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.9 FINANCEIRO (MEDIÇÕES, RECEBÍVEIS)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  FINANCEIRO                               [+ Nova NF] [📊] [💰]         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [Dashboard] [Contas a Receber] [Contas a Pagar] [Relatórios] [Configurações]  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  RESUMO FINANCEIRO - JANEIRO/2025                                       │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   FATURADO  │  │  RECEBIDO   │  │   A RECEBER │  │  INADIMPL.  │    │   │
│  │  │             │  │             │  │             │  │             │    │   │
│  │  │  R$ 125.000 │  │  R$ 85.000  │  │  R$ 40.000  │  │  R$ 5.000   │    │   │
│  │  │             │  │    68%      │  │    32%      │  │    4%       │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      CONTAS A RECEBER                                   │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  NF │ Cliente           │ Obra    │ Valor     │ Vencimento │ Status    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  045│ Silva Construções │ #124    │ R$ 3.500  │ 15/01/2025 │ ✓ Pago    │   │
│  │  046│ Santos            │ #123    │ R$ 2.000  │ 20/01/2025 │ ⏳ Aberto │   │
│  │  047│ Cond. Verde       │ #098    │ R$ 12.500 │ 25/01/2025 │ ⏳ Aberto │   │
│  │  048│ Comercial ABC     │ #111    │ R$ 8.000  │ 10/01/2025 │ ⚠️ Atraso │   │
│  │  ...                                                                     │   │
│  │                                                                         │   │
│  │  [Receber] [Enviar boleto] [Enviar NF] [Cobrança]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      MEDIÇÕES DE OBRA                                   │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Obra           │ Cliente       │ Valor Total │ Medição Atual │ %       │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  #124 PDE Silva │ Silva Constr. │ R$ 3.500    │ R$ 1.750 (50%)│ ▓▓▓▓▓░░ │   │
│  │  #098 Rede Cond.│ Cond. Verde   │ R$ 25.000   │ R$ 10.000(40%)│ ▓▓▓▓░░░ │   │
│  │  #111 SPDA ABC  │ Comercial ABC │ R$ 12.000   │ R$ 3.600 (30%)│ ▓▓▓░░░░ │   │
│  │  ...                                                                     │   │
│  │                                                                         │   │
│  │  [+ Nova medição]  [Gerar NF de medição]                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      ALERTAS DE COBRANÇA                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  ⚠️ NF #048 - Comercial ABC - Atraso: 5 dias - R$ 8.000,00              │   │
│  │     └─> [Enviar cobrança] [Ligar] [Negociar]                            │   │
│  │  ⏰ NF #046 - Santos - Vence hoje - R$ 2.000,00                         │   │
│  │     └─> [Enviar lembrete]                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.10 CONFIGURAÇÕES ADMIN

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  CONFIGURAÇÕES                                                        ⚙️  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [Empresa] [Usuários] [Permissões] [Serviços] [Regras] [Integrações] [Logs]    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CONFIGURAÇÕES DA EMPRESA                        │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  RAZÃO SOCIAL: ________________________________________________        │   │
│  │  NOME FANTASIA: _______________________________________________        │   │
│  │  CNPJ: ___________________  INSCRIÇÃO ESTADUAL: _______________        │   │
│  │  ENDEREÇO: ____________________________________________________        │   │
│  │  TELEFONE: ___________________  EMAIL: ________________________        │   │
│  │                                                                         │   │
│  │  LOGO: [📷 Logo_atual.png]  [Alterar]                                   │   │
│  │                                                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  CONFIGURAÇÕES DE NOTIFICAÇÃO                                           │   │
│  │  ☑️ Email para novos leads                                              │   │
│  │  ☑️ WhatsApp para propostas aprovadas                                   │   │
│  │  ☑️ Alerta de tarefas atrasadas                                         │   │
│  │  ☐ Alerta de laudos vencendo                                            │   │
│  │                                                                         │   │
│  │  [Salvar alterações]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GERENCIAMENTO DE USUÁRIOS                       │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  NOME           │ EMAIL              │ PERFIL      │ STATUS  │ AÇÕES  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Admin          │ admin@empresa.com  │ Administrador│ Ativo  │ ✏ 🗑   │   │
│  │  Carlos Silva   │ carlos@empresa.com │ Engenheiro  │ Ativo   │ ✏ 🗑   │   │
│  │  Maria Santos   │ maria@empresa.com  │ Comercial   │ Ativo   │ ✏ 🗑   │   │
│  │  João Pereira   │ joao@empresa.com   │ Projetista  │ Ativo   │ ✏ 🗑   │   │
│  │  ...                                                                     │   │
│  │                                                                         │   │
│  │  [+ Novo usuário]                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         RULES ENGINE - REGRAS ATIVAS                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  #  │ NOME                    │ PRIOR. │ STATUS  │ ÚLTIMA EXEC. │ AÇÕES│   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  01 │ PDE Sugere Conexão      │ 10     │ ✅ Ativo│ Hoje 09:15   │ ✏ ⏸  │   │
│  │  02 │ Ligação Nova Sugere PDE │ 10     │ ✅ Ativo│ Hoje 10:30   │ ✏ ⏸  │   │
│  │  03 │ Doação Sugere SPDA      │ 9      │ ✅ Ativo│ Ontem 14:20  │ ✏ ⏸  │   │
│  │  04 │ Cliente sem SPDA        │ 8      │ ⏸️ Paus.│ -            │ ✏ ▶  │   │
│  │  ...                                                                     │   │
│  │                                                                         │   │
│  │  [+ Nova regra]  [Importar regras]  [Exportar regras]                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         INTEGRAÇÕES                                     │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  SERVIÇO          │ STATUS      │ CONFIGURAÇÃO              │ AÇÕES    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  WhatsApp API     │ ✅ Conect.  │ Número: (11) 99999-9999   │ ⚙️ 🔄   │   │
│  │  Email (SMTP)     │ ✅ Conect.  │ smtp.empresa.com          │ ⚙️ 🔄   │   │
│  │  Google Calendar  │ ⏸️ Descon.  │ -                         │ ⚙️ ▶️   │   │
│  │  Neoenergia API   │ ⏳ Em breve │ -                         │ -       │   │
│  │                                                                         │   │
│  │  [+ Nova integração]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. RESUMO E PRÓXIMOS PASSOS

### 6.1 RESUMO DOS ENTREGÁVEIS

Este documento apresenta a especificação completa de um sistema CRM/ERP para empresas de engenharia elétrica, incluindo:

1. **4 Fluxos Ponta a Ponta Detalhados:**
   - Projeto Elétrico BT/MT/AT
   - PDE BT/AT
   - Doação de Rede + Incorporação + Conexão + Comissionamento
   - Laudo Técnico e SPDA

2. **Templates de Etapas e Checklists:**
   - Checklists completos para cada serviço
   - Documentos obrigatórios por etapa
   - SLAs por etapa
   - Gates de aprovação

3. **30 Regras do Rules Engine:**
   - Regras com condições IF/THEN completas
   - Ações detalhadas
   - Mensagens de venda para cada regra
   - Prioridades definidas

4. **Catálogo de Serviços Completo:**
   - Todos os serviços da empresa
   - Precificação sugerida
   - Dependências entre serviços
   - 6 Pacotes pré-montados

5. **Wireframes Textuais das Telas MVP:**
   - 10 telas principais documentadas
   - Fluxos de navegação
   - Funcionalidades principais

### 6.2 PRÓXIMOS PASSOS RECOMENDADOS

1. **Validação de Negócio:**
   - Revisar precificação com a diretoria
   - Validar fluxos com a equipe operacional
   - Confirmar integrações necessárias

2. **Priorização de Desenvolvimento:**
   - Fase 1: Dashboard, Clientes, Pipeline
   - Fase 2: Obras, Propostas, Checklists
   - Fase 3: Rules Engine, Documentos, Financeiro
   - Fase 4: Integrações, Relatórios avançados

3. **Configuração Inicial:**
   - Cadastrar usuários e permissões
   - Configurar catálogo de serviços
   - Ativar regras do Rules Engine
   - Integrar WhatsApp e Email

---

**Documento elaborado para implementação de CRM/ERP de Engenharia Elétrica**
**Versão 1.0 - 2025**

