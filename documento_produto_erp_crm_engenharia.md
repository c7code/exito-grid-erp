# Documento de Produto: ERP/CRM Vertical - Engenharia Elétrica/Solar

## Visão Geral do Produto

**Nome do Produto:** ElectraFlow (sugestão)  
**Segmento:** Engenharia Elétrica e Energia Solar - B2B/B2C  
**Modelo:** SaaS com pacotes de serviços  
**Princípio Central:** *Vender Melhor Automaticamente*

---

## 1. BACKLOG MVP PRIORIZADO (MoSCoW)

### Legenda de Prioridade
- **P1-P10:** Must Have (crítico para lançamento)
- **P11-P20:** Should Have (importante, mas não bloqueante)
- **P21-P30:** Could Have (desejável)
- **Wont:** Won't Have (futuro)

### Legenda Story Points (Fibonacci)
| Pontos | Complexidade | Exemplo |
|--------|--------------|---------|
| 1 | Trivial | Ajuste de campo |
| 2 | Simples | CRUD básico |
| 3 | Moderado | Integração simples |
| 5 | Complexo | Workflow multi-etapas |
| 8 | Muito Complexo | Motor de regras |
| 13 | Épico | Módulo completo |

---

### 1.1 MUST HAVE (P1-P10) - Core do MVP

#### P1 - Portal de Solicitação Público
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-001 |
| **Funcionalidade** | Portal público para solicitação de orçamento com formulário inteligente |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Formulário com campos: nome, email, telefone, tipo de serviço (dropdown), descrição, upload de documentos (PDF, JPG, PNG até 10MB)<br>2. Validação de campos obrigatórios<br>3. Geração automática de lead no CRM<br>4. Envio de confirmação por email/WhatsApp<br>5. URL pública acessível sem login<br>6. Responsivo mobile |
| **Valor de Negócio** | Canal de aquisição primário - entrada de leads |

#### P2 - Integração WhatsApp (Entrada)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-002 |
| **Funcionalidade** | Recebimento de solicitações via WhatsApp Business API |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Integração com WhatsApp Business API<br>2. Recebimento de mensagens e mídia<br>3. Criação automática de lead se número não existir<br>4. Vinculação a lead existente<br>5. Notificação no dashboard de novas mensagens<br>6. Histórico de conversa vinculado ao lead |
| **Valor de Negócio** | Canal preferido do cliente brasileiro - 70%+ das solicitações |

#### P3 - CRM Pipeline Visual
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-003 |
| **Funcionalidade** | Kanban de pipeline com estágios configuráveis |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Visualização Kanban com drag-and-drop<br>2. Estágios padrão: Lead Novo → Qualificação → Visita → Proposta → Negociação → Fechado → Execução → Concluído<br>3. Cards com: nome, valor estimado, data, prioridade, tags<br>4. Filtros por estágio, responsável, data<br>5. Contador de oportunidades por estágio<br>6. Visualização de alertas (prazos, inatividade) |
| **Valor de Negócio** | Controle visual do funil de vendas - core do CRM |

#### P4 - Cadastro e Gestão de Leads/Oportunidades
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-004 |
| **Funcionalidade** | CRUD completo de leads com campos específicos do setor |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Campos: nome, empresa, CPF/CNPJ, telefone, email, endereço completo<br>2. Tipo de cliente: residencial, comercial, industrial<br>3. Classificação: A (alto valor), B (médio), C (baixo)<br>4. Fonte do lead: portal, WhatsApp, indicação, prospecção<br>5. Histórico de interações<br>6. Conversão lead → oportunidade |
| **Valor de Negócio** | Base de dados de clientes potenciais |

#### P5 - Motor de Processos - Estrutura Base
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-005 |
| **Funcionalidade** | Criação de processos operacionais com etapas e checklists |
| **MoSCoW** | Must |
| **Story Points** | 13 |
| **Critérios de Aceitação** | 1. Templates de processo por tipo de serviço<br>2. Etapas sequenciais com dependências<br>3. Checklist de tarefas por etapa<br>4. Responsável por etapa<br>5. Status: pendente, em andamento, concluído, bloqueado<br>6. Timeline visual do processo<br>7. Geração automática ao fechar oportunidade |
| **Valor de Negócio** | Padronização operacional - redução de erros |

#### P6 - Templates de Propostas e Contratos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-006 |
| **Funcionalidade** | Geração de propostas e contratos a partir de templates |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Templates por pacote de serviço<br>2. Variáveis dinâmicas: {{cliente_nome}}, {{valor}}, {{prazo}}, etc.<br>3. Editor visual (rich text)<br>4. Geração PDF<br>5. Envio por email/WhatsApp<br>6. Status: rascunho, enviada, aceita, recusada<br>7. Histórico de versões |
| **Valor de Negócio** | Agilidade comercial - padronização |

#### P7 - Gestão de Tarefas e Prazos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-007 |
| **Funcionalidade** | Sistema de tarefas com notificações e alertas |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Criação de tarefas vinculadas a processos/oportunidades<br>2. Prazos com alertas (3 dias, 1 dia, vencido)<br>3. Prioridade: alta, média, baixa<br>4. Responsável e observadores<br>5. Notificações: email, WhatsApp, in-app<br>6. Dashboard de tarefas pendentes<br>7. Tarefas recorrentes |
| **Valor de Negócio** | Controle de SLAs - não perder prazos |

#### P8 - Upload e Versionamento de Documentos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-008 |
| **Funcionalidade** | Repositório de documentos com versionamento |
| **MoSCoW** | Must |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Upload múltiplo de arquivos<br>2. Categorias: projeto, laudo, ART, memorial, foto, contrato<br>3. Versionamento automático<br>4. Visualização de versões anteriores<br>5. Download e preview<br>6. Permissões por usuário<br>7. Vinculação a cliente/processos |
| **Valor de Negócio** | Rastreabilidade documental - compliance |

#### P9 - Financeiro Básico - Contas a Receber
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-009 |
| **Funcionalidade** | Controle de medições e contas a receber |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Cadastro de parcelas por processo<br>2. Status: pendente, parcial, pago, atrasado<br>3. Data de vencimento e pagamento<br>4. Valor e observações<br>5. Alertas de vencimento<br>6. Relatório de inadimplência<br>7. Exportação para planilha |
| **Valor de Negócio** | Controle de caixa - saúde financeira |

#### P10 - Rules Engine Simples (Cross-sell Base)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-010 |
| **Funcionalidade** | Motor de regras para sugestões de serviços adicionais |
| **MoSCoW** | Must |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Regras baseadas em: tipo de serviço, tensão, carga, risco<br>2. Sugestões automáticas na proposta<br>3. Exemplo: "PDE BT" → sugere "Laudo de Instalações"<br>4. Configuração de regras via interface<br>5. Score de relevância<br>6. Histórico de sugestões aceitas |
| **Valor de Negócio** | Vender melhor automaticamente - aumento de ticket |

---

### 1.2 SHOULD HAVE (P11-P20) - Importantes para V1

#### P11 - Dashboard Executivo
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-011 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Pipeline: total, por estágio, conversão<br>2. Financeiro: a receber, inadimplência<br>3. Processos: ativos, concluídos, atrasados<br>4. Atalhos rápidos para ações<br>5. Atualização em tempo real |

#### P12 - Gestão de Concessionárias e Protocolos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-012 |
| **MoSCoW** | Should |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Cadastro de concessionárias (Neoenergia, etc.)<br>2. Protocolos de atendimento por processo<br>3. Status de protocolos: aberto, em análise, aprovado, pendência<br>4. Prazos estimados por tipo<br>5. Alertas de protocolos parados<br>6. Histórico de interações |

#### P13 - Calendário de Visitas e Compromissos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-013 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Calendário visual mensal/semanal<br>2. Agendamento de visitas técnicas<br>3. Vinculação a oportunidade<br>4. Lembretes automáticos<br>5. Integração com Google Calendar (opcional) |

#### P14 - Gestão de Fornecedores e Compras
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-014 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Cadastro de fornecedores<br>2. Registro de cotações<br>3. Comparativo de preços<br>4. Vinculação a processos |

#### P15 - Histórico de Cliente (Timeline)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-015 |
| **MoSCoW** | Should |
| **Story Points** | 3 |
| **Critérios de Aceitação** | 1. Timeline cronológica de todas interações<br>2. Filtros por tipo: ligação, email, visita, proposta<br>3. Visualização unificada do cliente |

#### P16 - Campos Técnicos Específicos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-016 |
| **MoSCoW** | Should |
| **Story Points** | 3 |
| **Critérios de Aceitação** | 1. Campos: tensão (V), carga (kW), tipo de ligação<br>2. Área do imóvel<br>3. Consumo médio (kWh)<br>4. Concessionária atual<br>5. Tipo de ramal |

#### P17 - Relatórios Básicos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-017 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Pipeline por período<br>2. Oportunidades ganhas/perdidas<br>3. Processos por status<br>4. Exportação PDF/Excel |

#### P18 - Gestão de Usuários e Permissões
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-018 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Perfis: admin, comercial, técnico, financeiro<br>2. Permissões por módulo<br>3. Cadastro e inativação de usuários |

#### P19 - Notificações WhatsApp (Envio)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-019 |
| **MoSCoW** | Should |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Templates de mensagens<br>2. Envio automático: proposta, lembrete, status<br>3. Confirmação de leitura |

#### P20 - Busca Global
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-020 |
| **MoSCoW** | Should |
| **Story Points** | 3 |
| **Critérios de Aceitação** | 1. Busca por cliente, processo, documento<br>2. Resultados categorizados<br>3. Acesso rápido |

---

### 1.3 COULD HAVE (P21-P30) - Diferenciais

#### P21 - Assinatura Digital de Contratos
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-021 |
| **MoSCoW** | Could |
| **Story Points** | 5 |
| **Critérios de Aceitação** | Integração com DocuSign ou similar para assinatura digital |

#### P22 - App Mobile Básico (PWA)
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-022 |
| **MoSCoW** | Could |
| **Story Points** | 8 |
| **Critérios de Aceitação** | 1. Acesso a tarefas<br>2. Check-in em visitas<br>3. Upload de fotos<br>4. Offline parcial |

#### P23 - Gestão de Equipamentos/Materiais
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-023 |
| **MoSCoW** | Could |
| **Story Points** | 5 |
| **Critérios de Aceitação** | 1. Cadastro de materiais<br>2. Vinculação a processos<br>3. Controle de estoque básico |

#### P24 - Indicadores de Desempenho Individual
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-024 |
| **MoSCoW** | Could |
| **Story Points** | 3 |
| **Critérios de Aceitação** | Dashboard individual: propostas enviadas, taxa de conversão, tarefas |

#### P25 - Importação de Leads em Lote
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-025 |
| **MoSCoW** | Could |
| **Story Points** | 3 |
| **Critérios de Aceitação** | Upload de planilha CSV/Excel para importação massiva |

#### P26 - Automação de Follow-up
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-026 |
| **MoSCoW** | Could |
| **Story Points** | 5 |
| **Critérios de Aceitação** | Sequência automática de mensagens para leads sem resposta |

#### P27 - Kanban de Produção/Execução
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-027 |
| **MoSCoW** | Could |
| **Story Points** | 5 |
| **Critérios de Aceitação** | Pipeline visual específico para etapas de execução técnica |

#### P28 - Chat Interno
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-028 |
| **MoSCoW** | Could |
| **Story Points** | 5 |
| **Critérios de Aceitação** | Comunicação interna vinculada a processos |

#### P29 - Integração com Google Drive
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-029 |
| **MoSCoW** | Could |
| **Story Points** | 3 |
| **Critérios de Aceitação** | Sincronização de documentos com Google Drive |

#### P30 - Personalização de Cores/Logo
| Atributo | Descrição |
|----------|-----------|
| **ID** | MVP-030 |
| **MoSCoW** | Could |
| **Story Points** | 2 |
| **Critérios de Aceitação** | White-label básico: logo, cores primárias |

---

### 1.4 WON'T HAVE (Fase 2+)

| ID | Funcionalidade | Justificativa |
|----|----------------|---------------|
| F2-001 | Contas a Pagar Completo | Foco em receita primeiro |
| F2-002 | Folha de Pagamento | Não é core do negócio |
| F2-003 | NF-e Integrada | Usar sistema fiscal existente |
| F2-004 | BI Avançado/Power BI | Relatórios básicos atendem MVP |
| F2-005 | App Nativo iOS/Android | PWA atende necessidade inicial |
| F2-006 | Inteligência Artificial Avançada | Rules engine simples é suficiente |
| F2-007 | Portal do Cliente | WhatsApp atende comunicação |
| F2-008 | Multi-empresa/Multi-filial | Escopo inicial é single-tenant |
| F2-009 | API Pública | Integrações pontuais primeiro |
| F2-010 | Marketplace de Integrações | Foco em core |

---

## 2. BACKLOG V2 (EVOLUÇÃO)

### 2.1 Módulo Financeiro Completo

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Contas a Pagar | Controle de despesas e fornecedores | Alta |
| Fluxo de Caixa | Projeção financeira | Alta |
| DRE Automatizado | Fechamento mensal | Média |
| Conciliação Bancária | Reduzir trabalho manual | Média |
| Centros de Custo | Análise por projeto/tipo | Média |

### 2.2 Inteligência de Vendas

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Scoring de Leads | Priorizar melhores oportunidades | Alta |
| Previsão de Vendas (ML) | Prever receita | Média |
| Análise de Perda | Entender por que perde | Alta |
| Recomendação Inteligente | Cross-sell baseado em ML | Média |
| Segmentação Automática | Campanhas direcionadas | Média |

### 2.3 Gestão de Campanhas

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Disparo de Email Marketing | Nutrição de leads | Média |
| Campanhas WhatsApp | Recorrência e pós-venda | Alta |
| Landing Pages | Captação direcionada | Média |
| Tracking de Fontes | ROI por canal | Alta |

### 2.4 Operações Avançadas

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Gestão de Equipes de Campo | Otimizar deslocamento | Alta |
| Checklist Digital Avançado | Fotos obrigatórias, assinatura | Alta |
| Roteirização | Otimizar visitas | Média |
| Geolocalização | Validar presença | Média |
| Estoque Completo | Controle de materiais | Média |

### 2.5 Concessionárias e Compliance

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Integração API Neoenergia | Automatizar protocolos | Alta |
| Monitoramento de Prazos | Alertas inteligentes | Alta |
| Gestão de Pendências | Não perder prazos críticos | Alta |
| Base de Normas Técnicas | Consulta rápida | Baixa |

### 2.6 Pós-Venda e Recorrência

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Contratos de Manutenção | Receita recorrente | Alta |
| Agendamento de Visitas Periódicas | SLA de manutenção | Alta |
| Renovação Automática | Retenção | Alta |
| NPS e Pesquisa | Satisfação do cliente | Média |

### 2.7 Portal do Cliente

| Funcionalidade | Justificativa de Negócio | Prioridade |
|----------------|--------------------------|------------|
| Acompanhamento de Processos | Reduzir chamados | Média |
| Download de Documentos | Autosserviço | Média |
| Pagamento Online | Agilidade | Alta |
| Chat com Atendimento | Comunicação | Média |

---

## 3. PLANO DE MÉTRICAS (KPIs)

### 3.1 Métricas de Negócio (Business Metrics)

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **Taxa de Conversão (Lead → Cliente)** | (Clientes / Leads) × 100 | 15% | 25% | Mensal |
| **Taxa de Conversão por Estágio** | (Próx. estágio / Estágio atual) × 100 | Ver tabela | Ver tabela | Semanal |
| **Ticket Médio** | Receita Total / Número de Vendas | R$ 8.000 | R$ 12.000 | Mensal |
| **Cross-sell Rate** | Vendas com upsell / Total vendas | 30% | 50% | Mensal |
| **Receita Média por Cliente (ARPU)** | Receita Total / Clientes Ativos | R$ 15.000 | R$ 25.000 | Trimestral |
| **CAC (Custo de Aquisição)** | Gastos Marketing/Vendas / Novos Clientes | < R$ 500 | < R$ 400 | Mensal |
| **LTV (Lifetime Value)** | Ticket Médio × Compras × Margem | > 3x CAC | > 5x CAC | Trimestral |
| **Margem Bruta por Projeto** | (Receita - Custos) / Receita | 40% | 45% | Por projeto |
| **Taxa de Recompra** | Clientes recorrentes / Total | 20% | 35% | Anual |

#### Taxas de Conversão por Estágio (Benchmark)

| Estágio → Estágio | Taxa Esperada |
|-------------------|---------------|
| Lead → Qualificado | 60% |
| Qualificado → Visita | 50% |
| Visita → Proposta | 70% |
| Proposta → Negociação | 60% |
| Negociação → Fechado | 40% |
| **Lead → Fechado (Global)** | **5%** |

### 3.2 Métricas Operacionais (Operational Metrics)

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **Tempo de Ciclo (Lead → Entrega)** | Dias entre entrada e conclusão | 45 dias | 30 dias | Por projeto |
| **Tempo por Estágio** | Média de dias em cada estágio | Ver tabela | Ver tabela | Semanal |
| **SLA de Resposta a Leads** | % respondidos em < 2h | 90% | 95% | Diário |
| **SLA de Protocolos Concessionária** | % dentro do prazo estimado | 80% | 90% | Semanal |
| **Taxa de Atraso em Processos** | Processos atrasados / Total | < 15% | < 10% | Semanal |
| **Tempo Médio de Proposta** | Dias visita → proposta enviada | 2 dias | 1 dia | Mensal |
| **Taxa de Eficiência de Visitas** | Visitas que viram proposta | 80% | 85% | Mensal |
| **Pendências Críticas > 5 dias** | Quantidade | < 5 | < 3 | Diário |
| **Taxa de Retrabalho** | Processos com correções / Total | < 10% | < 5% | Mensal |

#### Tempos de Ciclo Esperados por Tipo

| Tipo de Serviço | Tempo MVP | Tempo V2 |
|-----------------|-----------|----------|
| Conexão Segura | 20 dias | 15 dias |
| PDE Completo | 45 dias | 30 dias |
| Rede e Doação | 60 dias | 45 dias |
| SPDA Premium | 15 dias | 10 dias |
| Monitoramento | 5 dias | 3 dias |
| Solar + Adequação | 90 dias | 60 dias |

### 3.3 Métricas de Produto (Product Metrics)

| KPI | Fórmula | Meta MVP | Meta V2 | Frequência |
|-----|---------|----------|---------|------------|
| **NPS (Net Promoter Score)** | % Promotores - % Detratores | > 40 | > 50 | Trimestral |
| **CSAT (Satisfação)** | Nota média (1-5) | > 4.0 | > 4.5 | Por entrega |
| **Churn Rate** | Clientes perdidos / Total | < 10% | < 5% | Anual |
| **Taxa de Ativação** | Usuários ativos / Usuários totais | 80% | 90% | Mensal |
| **Feature Adoption** | % usando recursos principais | 70% | 85% | Mensal |
| **Tempo de Onboarding** | Dias até primeiro uso completo | < 7 | < 3 | Por usuário |
| **DAU/MAU Ratio** | Usuários diários / mensais | 60% | 70% | Mensal |
| **Support Tickets por Usuário** | Tickets / Usuários ativos | < 2 | < 1 | Mensal |
| **Tempo de Resolução de Tickets** | Média em horas | < 24h | < 12h | Semanal |

### 3.4 Dashboards Recomendados

#### Dashboard Executivo (Daily)
- Pipeline: valor total, por estágio, conversão do dia
- Alertas: prazos críticos, protocolos parados
- Financeiro: a receber hoje, inadimplentes
- Leads: novos, fontes, conversão

#### Dashboard Comercial (Weekly)
- Performance por vendedor
- Taxa de conversão por estágio
- Propostas pendentes por tempo
- Follow-ups pendentes
- Top oportunidades

#### Dashboard Operacional (Daily)
- Processos ativos por status
- Tarefas atrasadas por responsável
- Protocolos com concessionária
- Visitas agendadas
- Documentos pendentes

#### Dashboard Financeiro (Monthly)
- Receita prevista vs realizada
- Inadimplência por período
- Ticket médio por tipo
- Custos por projeto
- Projeção de caixa

#### Dashboard de Cliente (Por cliente)
- Timeline completa
- Processos ativos e histórico
- Documentos
- Pagamentos
- Interações

---

## 4. ROADMAP DE LANÇAMENTO

### 4.1 Visão Geral das Fases

```
Fase 1 (Semanas 1-4):    Fundação + Core CRM
Fase 2 (Semanas 5-8):    Processos + Documentos  
Fase 3 (Semanas 9-12):   Financeiro + Automação
Fase 4 (Semanas 13-14):  Testes + Ajustes
Fase 5 (Semana 15):      Go-Live (Soft Launch)
Fase 6 (Semanas 16-20):  Hard Launch + Otimização
```

### 4.2 Detalhamento por Fase

#### FASE 1: FUNDAÇÃO (Semanas 1-4)
**Objetivo:** Base técnica e core do CRM

| Sprint | Entregáveis | Story Points | Itens do Backlog |
|--------|-------------|--------------|------------------|
| S1 | Setup, Auth, DB | 13 | Infraestrutura base |
| S2 | Portal Solicitação | 8 | MVP-001 |
| S3 | WhatsApp Entrada | 8 | MVP-002 |
| S4 | CRM Pipeline + Leads | 13 | MVP-003, MVP-004 |

**Milestone M1:** Sistema recebe leads e exibe pipeline

#### FASE 2: PROCESSOS (Semanas 5-8)
**Objetivo:** Operação padronizada

| Sprint | Entregáveis | Story Points | Itens do Backlog |
|--------|-------------|--------------|------------------|
| S5 | Motor de Processos | 13 | MVP-005 |
| S6 | Templates + Propostas | 8 | MVP-006 |
| S7 | Documentos + Tarefas | 10 | MVP-007, MVP-008 |
| S8 | Calendário + Permissões | 8 | MVP-013, MVP-018 |

**Milestone M2:** Processo completo do lead à execução

#### FASE 3: FINANCEIRO E AUTOMAÇÃO (Semanas 9-12)
**Objetivo:** Fechamento do ciclo comercial

| Sprint | Entregáveis | Story Points | Itens do Backlog |
|--------|-------------|--------------|------------------|
| S9 | Financeiro Básico | 8 | MVP-009 |
| S10 | Rules Engine | 8 | MVP-010 |
| S11 | Concessionárias | 8 | MVP-012 |
| S12 | Dashboard + Relatórios | 8 | MVP-011, MVP-017 |

**Milestone M3:** Sistema completo para operação

#### FASE 4: TESTES E AJUSTES (Semanas 13-14)
**Objetivo:** Qualidade e estabilidade

| Sprint | Atividades |
|--------|------------|
| S13 | Testes integrados, correção de bugs, ajustes UX |
| S14 | Testes com usuários piloto, treinamento, documentação |

**Milestone M4:** Sistema pronto para produção

#### FASE 5: SOFT LAUNCH (Semana 15)
**Objetivo:** Lançamento controlado

- 5-10 clientes iniciais
- Acompanhamento diário
- Coleta de feedback
- Ajustes rápidos

**Milestone M5:** Primeiros clientes ativos

#### FASE 6: HARD LAUNCH (Semanas 16-20)
**Objetivo:** Escala e otimização

| Sprint | Foco |
|--------|------|
| S16 | Onboarding em massa, automação de migração |
| S17 | Performance, otimizações |
| S18 | Features Could-Have prioritárias |
| S19 | Integrações adicionais |
| S20 | Planejamento V2 |

**Milestone M6:** Sistema em produção estável

---

### 4.3 Dependências Críticas

```
[Infra] → [Auth] → [CRM Base]
                ↓
[WhatsApp API] → [Leads] → [Pipeline]
                          ↓
                    [Processos] → [Tarefas]
                          ↓
                    [Propostas] → [Financeiro]
                          ↓
                    [Rules Engine] → [Cross-sell]
```

| Dependência | Bloqueia | Mitigação |
|-------------|----------|-----------|
| WhatsApp Business API | MVP-002, MVP-019 | Ter conta aprovada antes |
| Aprovação Concessionária | MVP-012 | Usar cadastro manual inicial |
| Servidor/Cloud | Tudo | Definir e provisionar na S1 |
| Domínio/SSL | Portal | Comprar no início |

### 4.4 Riscos e Contingências

| Risco | Probabilidade | Impacto | Contingência |
|-------|---------------|---------|--------------|
| Atraso na API WhatsApp | Média | Alto | Usar webhook temporário |
| Complexidade Rules Engine | Média | Médio | Simplificar para V1 |
| Resistência usuários | Média | Alto | Treinamento intensivo |
| Performance com volume | Baixa | Alto | Otimizar na Fase 6 |

---

## 5. ESTRUTURA DE PACOTES E PRICING (Referência)

### 5.1 Estrutura de Pacotes de Serviço

| Pacote | Serviços Incluídos | Público-Alvo | Preço Referência |
|--------|-------------------|--------------|------------------|
| **Conexão Segura** | Projeto + Laudo + Ajustes + Checklist | Residencial | R$ 2.500 - 5.000 |
| **PDE Completo** | PDE BT/AT + ART + memorial + acompanhamento | Comercial | R$ 5.000 - 15.000 |
| **Rede e Doação** | Projeto de rede + obra + dossiê + incorporação | Construtoras | R$ 20.000 - 100.000 |
| **SPDA Premium** | Projeto SPDA + medições + adequações | Industrial | R$ 8.000 - 25.000 |
| **Monitoramento** | Inspeção periódica + laudos anuais | Todos | R$ 500 - 2.000/mês |
| **Solar + Adequação** | Estudo solar + projeto + adequação | Residencial/Comercial | R$ 15.000 - 80.000 |

### 5.2 Sugestão de Pricing do SaaS

| Plano | Usuários | Funcionalidades | Preço Mensal |
|-------|----------|-----------------|--------------|
| **Starter** | 3 | CRM básico, tarefas | R$ 297 |
| **Pro** | 10 | + Processos, documentos | R$ 597 |
| **Enterprise** | Ilimitado | + Financeiro, API, suporte | R$ 1.297 |

---

## 6. SUMÁRIO EXECUTIVO

### Escopo do MVP (Must + Should Have)

| Categoria | Itens | Story Points |
|-----------|-------|--------------|
| Must Have (P1-P10) | 10 | 71 |
| Should Have (P11-P20) | 10 | 50 |
| **Total MVP** | **20** | **121** |

### Estimativa de Esforço

| Fase | Semanas | Story Points |
|------|---------|--------------|
| Fundação | 4 | 42 |
| Processos | 4 | 39 |
| Financeiro/Automação | 4 | 32 |
| Testes | 2 | - |
| **Total até Go-Live** | **14** | **113** |

### Métricas de Sucesso do Lançamento

| Métrica | Meta |
|---------|------|
| Leads processados (mês 1) | 50+ |
| Oportunidades criadas | 30+ |
| Propostas enviadas | 15+ |
| Processos ativos | 10+ |
| NPS dos primeiros usuários | > 30 |
| Tempo médio de adoção | < 7 dias |

---

*Documento produzido em: {data_atual}*  
*Versão: 1.0*  
*Próxima revisão: Após validação do MVP*
