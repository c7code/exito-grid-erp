# Documento Técnico de Automação n8n
## ERP/CRM Vertical - Engenharia Elétrica & Solar

**Versão:** 1.0  
**Data:** 2024  
**Escopo:** 6 Workflows de Automação + Integrações + Mensagens

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Workflow A - Novo Lead](#2-workflow-a---novo-lead)
3. [Workflow B - Proposta Enviada](#3-workflow-b---proposta-enviada)
4. [Workflow C - Fechado/Ganhou](#4-workflow-c---fechadoganhou)
5. [Workflow D - Pendência Concessionária](#5-workflow-d---pendência-concessionária)
6. [Workflow E - Entrega Concluída (Up-sell)](#6-workflow-e---entrega-concluída-up-sell)
7. [Workflow F - Renovação/Recorrência](#7-workflow-f---renovaçãorecorrência)
8. [Integrações Necessárias](#8-integrações-necessárias)
9. [Mensagens Automáticas Prontas](#9-mensagens-automáticas-prontas)
10. [Estratégia de Filas e Processamento](#10-estratégia-de-filas-e-processamento)
11. [Configuração do n8n](#11-configuração-do-n8n)
12. [JSON dos Workflows](#12-json-dos-workflows)

---

## 1. Visão Geral da Arquitetura

### Diagrama de Integrações

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

### Estrutura de Dados - Lead

```json
{
  "lead": {
    "id": "uuid",
    "origem": "portal|whatsapp|email|indicacao",
    "nome": "string",
    "telefone": "+55XXXXXXXXXXX",
    "email": "string",
    "cidade": "string",
    "estado": "string",
    "segmento": "residencial|comercial|industrial",
    "tipo_obra": "solar|pde_bt|pde_at|rede|spda|laudo",
    "concessionaria": "neoenergia|cemig|outra",
    "descricao": "text",
    "status": "novo|qualificando|proposta|negociacao|fechado|perdido",
    "data_criacao": "timestamp",
    "data_atualizacao": "timestamp",
    "documentos_recebidos": ["rg", "cpf", "contrato_social"],
    "responsavel_comercial": "user_id"
  }
}
```

---

## 2. Workflow A - Novo Lead

### 2.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW A: NOVO LEAD                              │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Webhook Lead Criado]
           │
           ▼
[Node: Validate Payload]
           │
     ┌─────┴─────┐
     │  Válido?  │
     └─────┬─────┘
    NÃO    │    SIM
     │     │     │
     ▼     │     ▼
[Log Error]│  [Node: Enriquecer Dados]
           │           │
           │     ┌─────┴─────┐
           │     │Segmento?  │
           │     └─────┬─────┘
           │   ┌───────┼───────┐
           │   ▼       ▼       ▼
           │ [Res]  [Com]   [Ind]
           │   │       │       │
           │   └───────┴───────┘
           │           │
           ▼           ▼
    [Node: Criar Tarefa Qualificação]
           │
           ▼
    [Node: Enviar WhatsApp Confirmação]
           │
           ▼
    [Node: Agendar Lembrete 24h]
           │
           ▼
    [Node: Notificar Comercial (Email)]
           │
           ▼
    [Node: Atualizar CRM Status]
           │
           ▼
    [END]
```

### 2.2 Configuração dos Nodes

#### Trigger: Webhook "Lead Criado"

```json
{
  "name": "Webhook - Novo Lead",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "novo-lead-webhook",
  "path": "webhook/novo-lead",
  "responseMode": "responseNode",
  "httpMethod": "POST",
  "authentication": "headerAuth",
  "headerName": "X-API-Key",
  "expectedHeaderValue": "{{$env.API_KEY_WEBHOOK}}"
}
```

#### Node: Validate Payload (Function)

```javascript
// Node: Validate Lead Payload
const required = ['nome', 'telefone', 'tipo_obra'];
const payload = $input.first().json.body;

const missing = required.filter(field => !payload[field]);

if (missing.length > 0) {
  return [{
    json: {
      valid: false,
      error: `Campos obrigatórios faltando: ${missing.join(', ')}`,
      payload
    }
  }];
}

// Normalizar telefone
let telefone = payload.telefone.replace(/\D/g, '');
if (telefone.length === 11) {
  telefone = `55${telefone}`;
} else if (telefone.length === 10) {
  telefone = `55${telefone}`;
}

return [{
  json: {
    valid: true,
    lead: {
      ...payload,
      telefone,
      id: $input.first().json.body.id || $uuid
    }
  }
}];
```

#### Node: Enriquecer Dados (HTTP Request + Function)

```javascript
// Node: Enrich Lead Data
const lead = $input.first().json.lead;

// Determinar segmento baseado no tipo de obra
const segmentoMap = {
  'solar': lead.tipo_instalacao === 'residencial' ? 'residencial' : 'comercial',
  'pde_bt': 'residencial',
  'pde_at': 'comercial',
  'rede': 'industrial',
  'spda': lead.tamanho_predio === 'grande' ? 'industrial' : 'comercial',
  'laudo': 'comercial'
};

// Determinar concessionária baseado na cidade
const concessionariaMap = {
  'brasilia': 'neoenergia',
  'taguatinga': 'neoenergia',
  'ceilandia': 'neoenergia',
  'belo horizonte': 'cemig',
  'contagem': 'cemig'
};

const cidadeLower = (lead.cidade || '').toLowerCase();
const concessionaria = concessionariaMap[cidadeLower] || 'outra';

// Calcular prioridade
let prioridade = 'media';
if (lead.tipo_obra === 'rede' || lead.tipo_obra === 'pde_at') {
  prioridade = 'alta';
} else if (lead.urgencia === 'sim') {
  prioridade = 'alta';
}

return [{
  json: {
    lead: {
      ...lead,
      segmento: segmentoMap[lead.tipo_obra] || 'comercial',
      concessionaria,
      prioridade,
      data_criacao: new Date().toISOString()
    }
  }
}];
```

#### Node: Criar Tarefa Qualificação (Postgres)

```json
{
  "name": "Criar Tarefa Qualificação",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [650, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO tarefas (id, lead_id, tipo, titulo, descricao, responsavel_id, prioridade, status, data_criacao, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '2 days') RETURNING *",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.lead.id }}",
    "qualificacao",
    "={{ 'Qualificar lead: ' + $json.lead.nome }}",
    "={{ 'Novo lead de ' + $json.lead.tipo_obra + ' em ' + $json.lead.cidade + '. Prioridade: ' + $json.lead.prioridade }}",
    "={{ $json.lead.responsavel_comercial || $env.COMERCIAL_DEFAULT_USER }}",
    "={{ $json.lead.prioridade }}",
    "pendente"
  ]
}
```

#### Node: Enviar WhatsApp Confirmação (HTTP Request)

```json
{
  "name": "WhatsApp - Confirmação Recebimento",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [850, 300],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "={{ $json.lead.telefone }}",
    "type": "template",
    "template": {
      "name": "confirmacao_recebimento",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.lead.nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.lead.tipo_obra.toUpperCase() }}" }
          ]
        }
      ]
    }
  }
}
```

#### Node: Agendar Lembrete 24h (Schedule Trigger)

```json
{
  "name": "Schedule - Lembrete 24h",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1,
  "position": [250, 600],
  "interval": 24,
  "unit": "hours",
  "mode": "everyX"
}
```

#### Node: Verificar Documentos Pendentes (Postgres)

```json
{
  "name": "Verificar Docs Pendentes",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [450, 600],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "SELECT l.* FROM leads l LEFT JOIN documentos d ON l.id = d.lead_id WHERE l.data_criacao < NOW() - INTERVAL '24 hours' AND l.data_criacao > NOW() - INTERVAL '25 hours' AND (d.id IS NULL OR d.status != 'completo') AND l.lembrete_enviado = false"
}
```

#### Node: Enviar Lembrete Documentos (HTTP Request)

```json
{
  "name": "WhatsApp - Lembrete Docs",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [650, 600],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "to": "={{ $json.telefone }}",
    "type": "template",
    "template": {
      "name": "lembrete_documentos",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.tipo_obra }}" }
          ]
        }
      ]
    }
  }
}
```

### 2.3 Mensagens do Workflow A

**Template WhatsApp - Confirmação de Recebimento:**

```
Olá {{1}}! 👋

Recebemos sua solicitação de {{2}} com sucesso! 

✅ *Próximos passos:*
• Nossa equipe analisará seu caso
• Entraremos em contato em até 24h úteis
• Você receberá um link para enviar documentos

📋 *Documentos necessários:*
• RG/CNPJ do responsável
• Conta de energia recente
• Matrícula do imóvel (se disponível)

🔗 Link para upload: {{link_upload}}

Dúvidas? Responda aqui ou ligue: (61) 99999-9999

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Lembrete Documentos (24h):**

```
Olá {{1}}! 👋

Notamos que ainda não recebemos seus documentos para o projeto de *{{2}}*.

⏰ *Para agilizar seu atendimento, precisamos de:*
• RG ou CNPJ
• Última conta de energia
• Comprovante de endereço

📎 *Envie agora pelo link:* {{link_upload}}

⚡ *Com os documentos em mãos, conseguimos:*
• Elaborar seu projeto mais rápido
• Dar entrada na concessionária
• Agilizar sua conexão/adequação

Alguma dúvida? Estamos aqui para ajudar!

_Equipe [Nome da Empresa]_
```

**E-mail - Notificação para Comercial:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
    .priority-high { color: #dc3545; font-weight: bold; }
    .priority-medium { color: #ffc107; font-weight: bold; }
    .btn { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Novo Lead Recebido</h1>
    </div>
    <div class="content">
      <h2>Detalhes do Lead</h2>
      <p><strong>Nome:</strong> {{lead.nome}}</p>
      <p><strong>Telefone:</strong> {{lead.telefone}}</p>
      <p><strong>E-mail:</strong> {{lead.email}}</p>
      <p><strong>Cidade:</strong> {{lead.cidade}}/{{lead.estado}}</p>
      <p><strong>Tipo de Obra:</strong> {{lead.tipo_obra}}</p>
      <p><strong>Segmento:</strong> {{lead.segmento}}</p>
      <p class="priority-{{lead.prioridade}}">Prioridade: {{lead.prioridade}}</p>
      
      <h3>Descrição:</h3>
      <p>{{lead.descricao}}</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{crm_url}}/leads/{{lead.id}}" class="btn">Ver no CRM</a>
      </div>
    </div>
    <p style="text-align: center; color: #666; font-size: 12px;">
      Este é um e-mail automático do sistema CRM.
    </p>
  </div>
</body>
</html>
```

---


## 3. Workflow B - Proposta Enviada

### 3.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW B: PROPOSTA ENVIADA                          │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Proposta Status = "Enviada"]
           │
           ▼
[Node: Registrar Timestamp Envio]
           │
           ▼
[Node: Agendar Follow-up D+1]
           │
           ▼
[Node: Agendar Follow-up D+3]
           │
           ▼
[Node: Agendar Follow-up D+7]
           │
           ▼
[Node: Criar Tarefa Acompanhamento]
           │
           ▼
[Node: Enviar WhatsApp Proposta Enviada]
           │
           ▼
[Webhook: Tracking Link Clicado?]
           │
     ┌─────┴─────┐
     │   Clicou  │
     └─────┬─────┘
    NÃO    │    SIM
     │     │     │
     │     │     ▼
     │     │  [Notificar Comercial]
     │     │     │
     │     │     ▼
     │     │  [Atualizar Score Lead]
     │     │
     └─────┴─────┐
           │
[Webhook: Cliente Solicitou Desconto?]
           │
     ┌─────┴─────┐
     │ Desconto? │
     └─────┬─────┘
    NÃO    │    SIM
     │     │     │
     │     │     ▼
     │     │  [Criar Tarefa: Defender Valor]
     │     │     │
     │     │     ▼
     │     │  [Enviar Comparativo Preços]
     │     │
     └─────┴─────┐
           │
           ▼
[Node: Atualizar Pipeline CRM]
           │
           ▼
[END]
```

### 3.2 Configuração dos Nodes

#### Trigger: Webhook "Proposta Enviada"

```json
{
  "name": "Webhook - Proposta Enviada",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "proposta-enviada-webhook",
  "path": "webhook/proposta-enviada",
  "responseMode": "responseNode",
  "httpMethod": "POST",
  "authentication": "headerAuth"
}
```

#### Node: Agendar Follow-ups (Function)

```javascript
// Node: Schedule Follow-up Sequence
const proposta = $input.first().json.body;
const now = new Date();

// Calcular datas de follow-up
const followUps = [
  { dia: 1, tipo: 'educativo', template: 'followup_d1_educativo' },
  { dia: 3, tipo: 'social_proof', template: 'followup_d3_cases' },
  { dia: 7, tipo: 'urgencia', template: 'followup_d7_urgencia' }
];

const agendamentos = followUps.map(fu => {
  const dataEnvio = new Date(now);
  dataEnvio.setDate(dataEnvio.getDate() + fu.dia);
  
  return {
    json: {
      proposta_id: proposta.id,
      lead_id: proposta.lead_id,
      lead_telefone: proposta.lead_telefone,
      lead_nome: proposta.lead_nome,
      tipo_obra: proposta.tipo_obra,
      valor: proposta.valor,
      dia_followup: fu.dia,
      tipo: fu.tipo,
      template: fu.template,
      data_agendada: dataEnvio.toISOString(),
      status: 'agendado'
    }
  };
});

return agendamentos;
```

#### Node: Salvar Agendamentos (Postgres)

```json
{
  "name": "Salvar Agendamentos Follow-up",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [650, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO follow_up_agendamentos (id, proposta_id, lead_id, dia, tipo, template, data_agendada, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.proposta_id }}",
    "={{ $json.lead_id }}",
    "={{ $json.dia_followup }}",
    "={{ $json.tipo }}",
    "={{ $json.template }}",
    "={{ $json.data_agendada }}",
    "={{ $json.status }}"
  ]
}
```

#### Workflow Paralelo: Executar Follow-ups Agendados

```json
{
  "name": "Schedule - Disparar Follow-ups",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1,
  "position": [250, 600],
  "interval": 1,
  "unit": "hours",
  "mode": "everyX"
}
```

```javascript
// Node: Buscar Follow-ups do Dia
// Query: SELECT * FROM follow_up_agendamentos WHERE DATE(data_agendada) = CURRENT_DATE AND status = 'agendado' AND EXTRACT(HOUR FROM data_agendada) = EXTRACT(HOUR FROM NOW())

// Node: Verificar Status Proposta (Function)
const agendamento = $input.first().json;

// Se proposta já foi respondida ou fechada, não enviar follow-up
if (['aceita', 'rejeitada', 'fechada'].includes(agendamento.proposta_status)) {
  return [{ json: { skip: true, reason: 'Proposta já respondida' } }];
}

return [{ json: { ...agendamento, skip: false } }];
```

#### Node: Enviar WhatsApp Follow-up

```json
{
  "name": "WhatsApp - Follow-up",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [850, 600],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "to": "={{ $json.lead_telefone }}",
    "type": "template",
    "template": {
      "name": "={{ $json.template }}",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.lead_nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.tipo_obra }}" },
            { "type": "text", "text": "={{ $json.valor }}" }
          ]
        }
      ]
    }
  }
}
```

#### Node: Tracking Link Clicado (Webhook)

```json
{
  "name": "Webhook - Link Clicado",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 900],
  "webhookId": "tracking-link-click",
  "path": "webhook/link-clicked",
  "httpMethod": "POST"
}
```

```javascript
// Node: Notificar Comercial sobre Visualização
const event = $input.first().json.body;

return [{
  json: {
    to: event.comercial_email,
    subject: `🎯 Cliente visualizou a proposta - ${event.lead_nome}`,
    body: {
      lead: event.lead_nome,
      proposta: event.proposta_id,
      timestamp: new Date().toISOString(),
      device: event.device,
      location: event.location
    }
  }
}];
```

#### Node: Solicitação de Desconto (Switch)

```javascript
// Node: Processar Solicitação de Desconto
const event = $input.first().json.body;

// Criar tarefa para comercial defender valor
const tarefa = {
  id: $uuid,
  tipo: 'defender_valor',
  titulo: `Defender valor - ${event.lead_nome}`,
  descricao: `Cliente solicitou desconto na proposta de ${event.tipo_obra}. Valor original: ${event.valor_original}. Valor solicitado: ${event.valor_solicitado}`,
  prioridade: 'alta',
  responsavel: event.comercial_id,
  proposta_id: event.proposta_id
};

// Buscar comparativos de mercado
const comparativos = {
  'solar': { mercado: 'R$ 4,50/W', nosso: 'R$ 3,80/W', economia: '15%' },
  'pde_bt': { mercado: 'R$ 2.500', nosso: 'R$ 2.100', economia: '16%' },
  'pde_at': { mercado: 'R$ 8.000', nosso: 'R$ 6.500', economia: '19%' },
  'rede': { mercado: 'R$ 15.000', nosso: 'R$ 12.500', economia: '17%' },
  'spda': { mercado: 'R$ 3.500', nosso: 'R$ 2.900', economia: '17%' }
};

return [{
  json: {
    tarefa,
    comparativo: comparativos[event.tipo_obra],
    resposta_cliente: gerarRespostaDesconto(event, comparativos[event.tipo_obra])
  }
}];

function gerarRespostaDesconto(event, comp) {
  return `
Olá ${event.lead_nome.split(' ')[0]}!

Entendemos sua preocupação com o investimento. 💡

Queremos que você saiba que nosso valor já é *muito competitivo*:

✅ *Preço médio de mercado:* ${comp.mercado}
✅ *Nosso valor:* ${comp.nosso}
✅ *Você economiza:* ~${comp.economia}

💎 *O que está incluído:*
• Projeto executivo completo
• ART e responsabilidade técnica
• Acompanhamento na concessionária
• Garantia de 12 meses
• Suporte pós-obra

⚡ *Lembre-se:* O valor da obra elétrica é um investimento que:
• Garante segurança do seu imóvel
• Evita multas da concessionária
• Aumenta o valor do patrimônio

Podemos agendar uma call rápida para tirar dúvidas?

_Equipe [Nome da Empresa]_
  `;
}
```

### 3.3 Mensagens do Workflow B

**Template WhatsApp - Proposta Enviada (D+0):**

```
Olá {{1}}! 👋

Sua proposta para *{{2}}* está pronta! 🎉

📄 *Resumo da proposta:*
• Serviço: {{2}}
• Investimento: {{3}}
• Prazo estimado: {{prazo}} dias úteis

🔗 *Acesse sua proposta completa:*
{{link_proposta}}

✅ *Próximos passos:*
1. Revise os detalhes da proposta
2. Tire suas dúvidas respondendo aqui
3. Aproveite e agendamos a visita técnica

⏰ *Validade da proposta:* 15 dias

Dúvidas? Estamos à disposição!

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Follow-up D+1 (Educativo):**

```
Olá {{1}}! 👋

Vimos que você recebeu nossa proposta para *{{2}}*.

💡 *Sabia que...*

Um projeto elétrico bem executado pode:
• Reduzir riscos de incêndio em até 90%
• Evitar multas da concessionária
• Aumentar a vida útil dos equipamentos
• Garantir segurança para sua família/empresa

📊 *Por que investir em qualidade:*
✅ Conformidade com normas técnicas
✅ Aprovação na primeira vistoria
✅ Documentação completa
✅ Garantia de execução

🔗 *Revise sua proposta:* {{link_proposta}}

Alguma dúvida sobre o projeto? Estamos aqui!

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Follow-up D+3 (Social Proof):**

```
Olá {{1}}! 👋

Queremos compartilhar alguns resultados de clientes que confiaram em nós:

🏆 *Cases de sucesso:*

*Residencial - Brasília/DF*
"Entrega no prazo, equipe super profissional. Aprovaram na Neoenergia de primeira!" 
⭐⭐⭐⭐⭐ - Carlos M.

*Comercial - Taguatinga*
"Resolveu nosso problema de queda de energia. SPDA top!"
⭐⭐⭐⭐⭐ - Empresa XYZ

*Industrial - Ceilândia*
"PDE AT aprovado em 20 dias. Recomendo!"
⭐⭐⭐⭐⭐ - Indústria ABC

📸 *Veja fotos das obras:* {{link_portfolio}}

🔗 *Sua proposta:* {{link_proposta}}

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Follow-up D+7 (Urgência):**

```
Olá {{1}}! 👋

Passando para lembrar que sua proposta para *{{2}}* expira em *3 dias* ⏰

⚡ *Aproveite agora:*
• Garantimos o valor proposto
• Agendamento prioritário
• Entrega no prazo combinado

🎯 *Para aprovar, é simples:*
1. Clique no link da proposta
2. Assine digitalmente
3. Envie o comprovante aqui

🔗 *Proposta:* {{link_proposta}}

💬 *Quer negociar?* Responda aqui que chamamos você!

_Equipe [Nome da Empresa]_
```

---

## 4. Workflow C - Fechado/Ganhou

### 4.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       WORKFLOW C: FECHADO/GANHOU                           │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Contrato Assinado / Status = Ganho]
           │
           ▼
[Node: Validar Dados Contrato]
           │
           ▼
[Node: Determinar Tipo de Processo]
           │
     ┌─────┴─────┐
     │ Tipo Obra │
     └─────┬─────┘
   ┌──────┼──────┬────────┬────────┐
   ▼      ▼      ▼        ▼        ▼
[Solar] [PDE] [Rede]  [SPDA]  [Laudo]
   │      │      │        │        │
   └──────┴──────┴────────┴────────┘
           │
           ▼
[Node: Criar Processo Operacional]
           │
           ▼
[Node: Criar Pastas no Drive]
           │
           ▼
[Node: Criar Tarefas da Equipe]
           │
           ▼
[Node: Gerar Checklist Documentos]
           │
           ▼
[Node: Agendar Vistoria (se necessário)]
           │
           ▼
[Node: Enviar Onboarding Cliente]
           │
           ▼
[Node: Criar Eventos Calendar]
           │
           ▼
[Node: Notificar Equipe Técnica]
           │
           ▼
[END]
```

### 4.2 Configuração dos Nodes

#### Trigger: Webhook "Contrato Assinado"

```json
{
  "name": "Webhook - Contrato Assinado",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "contrato-assinado-webhook",
  "path": "webhook/contrato-assinado",
  "httpMethod": "POST",
  "authentication": "headerAuth"
}
```

#### Node: Determinar Workflow Operacional (Function)

```javascript
// Node: Define Operational Workflow
const contrato = $input.first().json.body;

const workflows = {
  'solar': {
    nome: 'Projeto Solar Completo',
    etapas: [
      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 2, nome: 'Elaboração Projeto', responsavel: 'projetista', prazo_dias: 7 },
      { ordem: 3, nome: 'Aprovação Cliente', responsavel: 'comercial', prazo_dias: 2 },
      { ordem: 4, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 5 },
      { ordem: 5, nome: 'Aprovação Concessionária', responsavel: 'documentalista', prazo_dias: 15 },
      { ordem: 6, nome: 'Aquisição Materiais', responsavel: 'compras', prazo_dias: 7 },
      { ordem: 7, nome: 'Execução Obra', responsavel: 'equipe_campo', prazo_dias: 5 },
      { ordem: 8, nome: 'Comissionamento', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 9, nome: 'Conexão', responsavel: 'documentalista', prazo_dias: 10 },
      { ordem: 10, nome: 'Entrega Final', responsavel: 'engenheiro', prazo_dias: 2 }
    ],
    documentos: ['rg_cpf', 'conta_energia', 'matricula_imovel', 'memorial_descritivo', 'art'],
    pasta_drive: 'SOLAR_{{cliente}}_{{data}}'
  },
  'pde_bt': {
    nome: 'PDE Baixa Tensão',
    etapas: [
      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 2 },
      { ordem: 2, nome: 'Projeto PDE', responsavel: 'projetista', prazo_dias: 5 },
      { ordem: 3, nome: 'ART', responsavel: 'documentalista', prazo_dias: 2 },
      { ordem: 4, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 3 },
      { ordem: 5, nome: 'Aprovação Concessionária', responsavel: 'documentalista', prazo_dias: 10 },
      { ordem: 6, nome: 'Execução', responsavel: 'equipe_campo', prazo_dias: 3 },
      { ordem: 7, nome: 'Vistoria Final', responsavel: 'engenheiro', prazo_dias: 2 },
      { ordem: 8, nome: 'Liberação', responsavel: 'documentalista', prazo_dias: 5 }
    ],
    documentos: ['rg_cpf', 'conta_energia', 'matricula_imovel', 'projeto_aprovado', 'art'],
    pasta_drive: 'PDE_BT_{{cliente}}_{{data}}'
  },
  'pde_at': {
    nome: 'PDE Alta Tensão',
    etapas: [
      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 2, nome: 'Projeto PDE AT', responsavel: 'projetista', prazo_dias: 10 },
      { ordem: 3, nome: 'ART e Memorial', responsavel: 'documentalista', prazo_dias: 3 },
      { ordem: 4, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 5 },
      { ordem: 5, nome: 'Aprovação Concessionária', responsavel: 'documentalista', prazo_dias: 20 },
      { ordem: 6, nome: 'Execução', responsavel: 'equipe_campo', prazo_dias: 10 },
      { ordem: 7, nome: 'Vistoria Final', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 8, nome: 'Liberação', responsavel: 'documentalista', prazo_dias: 7 }
    ],
    documentos: ['rg_cnpj', 'conta_energia', 'matricula_imovel', 'projeto_aprovado', 'art', 'memorial_descritivo'],
    pasta_drive: 'PDE_AT_{{cliente}}_{{data}}'
  },
  'rede': {
    nome: 'Projeto de Rede',
    etapas: [
      { ordem: 1, nome: 'Levantamento', responsavel: 'engenheiro', prazo_dias: 5 },
      { ordem: 2, nome: 'Projeto Executivo', responsavel: 'projetista', prazo_dias: 10 },
      { ordem: 3, nome: 'Aprovação Interna', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 4, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 5 },
      { ordem: 5, nome: 'Aprovação Concessionária', responsavel: 'documentalista', prazo_dias: 30 },
      { ordem: 6, nome: 'Execução Obra', responsavel: 'equipe_campo', prazo_dias: 20 },
      { ordem: 7, nome: 'Doação/Conexão', responsavel: 'documentalista', prazo_dias: 15 },
      { ordem: 8, nome: 'Entrega Final', responsavel: 'engenheiro', prazo_dias: 3 }
    ],
    documentos: ['rg_cnpj', 'contrato_social', 'matricula_imovel', 'projeto_aprovado', 'art', 'dossie_tecnico'],
    pasta_drive: 'REDE_{{cliente}}_{{data}}'
  },
  'spda': {
    nome: 'Projeto SPDA',
    etapas: [
      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 2 },
      { ordem: 2, nome: 'Projeto SPDA', responsavel: 'projetista', prazo_dias: 5 },
      { ordem: 3, nome: 'Medições', responsavel: 'equipe_campo', prazo_dias: 1 },
      { ordem: 4, nome: 'Laudo Técnico', responsavel: 'engenheiro', prazo_dias: 3 },
      { ordem: 5, nome: 'ART', responsavel: 'documentalista', prazo_dias: 2 },
      { ordem: 6, nome: 'Execução', responsavel: 'equipe_campo', prazo_dias: 5 },
      { ordem: 7, nome: 'Vistoria Final', responsavel: 'engenheiro', prazo_dias: 2 }
    ],
    documentos: ['rg_cpf', 'conta_energio', 'matricula_imovel', 'laudo_tecnico', 'art'],
    pasta_drive: 'SPDA_{{cliente}}_{{data}}'
  },
  'laudo': {
    nome: 'Laudo Técnico',
    etapas: [
      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 2 },
      { ordem: 2, nome: 'Medições', responsavel: 'equipe_campo', prazo_dias: 1 },
      { ordem: 3, nome: 'Elaboração Laudo', responsavel: 'engenheiro', prazo_dias: 5 },
      { ordem: 4, nome: 'Entrega', responsavel: 'comercial', prazo_dias: 1 }
    ],
    documentos: ['rg_cpf', 'conta_energia', 'matricula_imovel'],
    pasta_drive: 'LAUDO_{{cliente}}_{{data}}'
  }
};

const tipo = contrato.tipo_obra;
const workflow = workflows[tipo];

if (!workflow) {
  throw new Error(`Tipo de obra não suportado: ${tipo}`);
}

return [{
  json: {
    contrato,
    workflow,
    processo_id: $uuid
  }
}];
```

#### Node: Criar Processo Operacional (Postgres)

```json
{
  "name": "Criar Processo Operacional",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [650, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO processos_operacionais (id, contrato_id, cliente_id, tipo_obra, status, data_inicio, workflow_config) VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING *",
  "parameters": [
    "={{ $json.processo_id }}",
    "={{ $json.contrato.id }}",
    "={{ $json.contrato.cliente_id }}",
    "={{ $json.contrato.tipo_obra }}",
    "em_andamento",
    "={{ JSON.stringify($json.workflow) }}"
  ]
}
```

#### Node: Criar Pastas Google Drive (HTTP Request)

```json
{
  "name": "Google Drive - Criar Pastas",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [850, 300],
  "method": "POST",
  "url": "https://www.googleapis.com/drive/v3/files",
  "authentication": "genericCredentialType",
  "genericAuthType": "oAuth2Api",
  "contentType": "json",
  "body": {
    "name": "={{ $json.workflow.pasta_drive.replace('{{cliente}}', $json.contrato.cliente_nome).replace('{{data}}', new Date().toISOString().split('T')[0]) }}",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["{{ $env.DRIVE_FOLDER_ID_PROJETOS }}"]
  }
}
```

```javascript
// Node: Criar Subpastas
const pastaPrincipal = $input.first().json.id;
const subpastas = ['01_DOCUMENTOS', '02_PROJETOS', '03_ARTS', '04_FOTOS', '05_LAUDOS', '06_ENTREGA'];

return subpastas.map(nome => ({
  json: {
    name: nome,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [pastaPrincipal]
  }
}));
```

#### Node: Criar Tarefas da Equipe (Function + Postgres)

```javascript
// Node: Gerar Tarefas Operacionais
const data = $input.first().json;
const workflow = data.workflow;
const processo_id = data.processo_id;
const contrato = data.contrato;

let dataBase = new Date();
const tarefas = [];

for (const etapa of workflow.etapas) {
  const dataInicio = new Date(dataBase);
  const dataFim = new Date(dataBase);
  dataFim.setDate(dataFim.getDate() + etapa.prazo_dias);
  
  tarefas.push({
    id: $uuid,
    processo_id,
    ordem: etapa.ordem,
    titulo: etapa.nome,
    descricao: `Etapa ${etapa.ordem} do processo ${workflow.nome} - Cliente: ${contrato.cliente_nome}`,
    responsavel_tipo: etapa.responsavel,
    data_inicio: dataInicio.toISOString(),
    data_vencimento: dataFim.toISOString(),
    status: etapa.ordem === 1 ? 'pendente' : 'aguardando',
    dependencia_ordem: etapa.ordem > 1 ? etapa.ordem - 1 : null
  });
  
  dataBase = dataFim;
}

return tarefas.map(t => ({ json: t }));
```

#### Node: Gerar Checklist Documentos

```javascript
// Node: Gerar Checklist de Documentos
const data = $input.first().json;
const documentos = data.workflow.documentos;
const processo_id = data.processo_id;

const checklist = documentos.map(doc => ({
  id: $uuid,
  processo_id,
  tipo_documento: doc,
  status: 'pendente',
  obrigatorio: true,
  data_solicitacao: new Date().toISOString(),
  prazo_dias: 5
}));

return checklist.map(c => ({ json: c }));
```

#### Node: Agendar Vistoria (Google Calendar)

```json
{
  "name": "Google Calendar - Agendar Vistoria",
  "type": "n8n-nodes-base.googleCalendar",
  "typeVersion": 1,
  "position": [1050, 300],
  "operation": "create",
  "calendar": "={{ $env.CALENDAR_ID_VISTORIAS }}",
  "start": "={{ $addTime(new Date(), 3, 'days') }}",
  "end": "={{ $addTime(new Date(), 3, 'days', 2, 'hours') }}",
  "summary": "={{ 'Vistoria Técnica - ' + $json.contrato.cliente_nome }}",
  "description": "={{ 'Tipo: ' + $json.contrato.tipo_obra + '\\nEndereço: ' + $json.contrato.endereco + '\\nContato: ' + $json.contrato.telefone }}",
  "location": "={{ $json.contrato.endereco }}"
}
```

#### Node: Onboarding Cliente WhatsApp

```json
{
  "name": "WhatsApp - Onboarding Cliente",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [1250, 300],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "to": "={{ $json.contrato.cliente_telefone }}",
    "type": "template",
    "template": {
      "name": "onboarding_cliente",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.contrato.cliente_nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.workflow.nome }}" },
            { "type": "text", "text": "={{ $json.contrato.protocolo }}" }
          ]
        }
      ]
    }
  }
}
```

### 4.3 Mensagens do Workflow C

**Template WhatsApp - Onboarding Cliente:**

```
🎉 *Parabéns, {{1}}!* 

Sua contratação do serviço *{{2}}* foi confirmada!

📋 *Protocolo:* #{{3}}

✅ *O que acontece agora:*

*1️⃣ Visita Técnica*
Nossa equipe entrará em contato em até 24h para agendar.

*2️⃣ Acompanhamento*
Você receberá atualizações em cada etapa do projeto.

*3️⃣ Entrega*
Prazo estimado: {{prazo}} dias úteis

📁 *Acesse sua área do cliente:*
{{link_portal}}

📋 *Documentos pendentes:*
{{checklist_docs}}

⚡ *Dúvidas?*
Responda aqui ou ligue: (61) 99999-9999

Seja bem-vindo à família [Nome da Empresa]! 💙

_Equipe [Nome da Empresa]_
```

**E-mail - Notificação Equipe Técnica:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
    .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Novo Contrato Fechado!</h1>
    </div>
    <div class="content">
      <h2>Detalhes do Projeto</h2>
      
      <div class="info-box">
        <p><strong>Cliente:</strong> {{contrato.cliente_nome}}</p>
        <p><strong>Tipo:</strong> {{workflow.nome}}</p>
        <p><strong>Protocolo:</strong> #{{processo_id}}</p>
        <p><strong>Valor:</strong> {{contrato.valor}}</p>
        <p><strong>Endereço:</strong> {{contrato.endereco}}</p>
        <p><strong>Telefone:</strong> {{contrato.cliente_telefone}}</p>
      </div>

      <h3>📋 Checklist de Documentos</h3>
      <table>
        <tr>
          <th>Documento</th>
          <th>Status</th>
        </tr>
        {{#each checklist}}
        <tr>
          <td>{{tipo_documento}}</td>
          <td>{{status}}</td>
        </tr>
        {{/each}}
      </table>

      <h3>📅 Primeiras Tarefas</h3>
      <table>
        <tr>
          <th>Ordem</th>
          <th>Tarefa</th>
          <th>Responsável</th>
          <th>Prazo</th>
        </tr>
        {{#each tarefas}}
        <tr>
          <td>{{ordem}}</td>
          <td>{{titulo}}</td>
          <td>{{responsavel_tipo}}</td>
          <td>{{data_vencimento}}</td>
        </tr>
        {{/each}}
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{{erp_url}}/processos/{{processo_id}}" class="btn">Ver Processo Completo</a>
      </div>
    </div>
  </div>
</body>
</html>
```

---


## 5. Workflow D - Pendência Concessionária

### 5.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW D: PENDÊNCIA CONCESSIONÁRIA                    │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Etapa = "Aguardando Concessionária"]
           │
           ▼
[Node: Registrar Protocolo]
           │
           ▼
[Node: Definir SLA Base]
           │
     ┌─────┴─────┐
     │Concession.│
     └─────┬─────┘
   ┌──────┼──────┬────────┐
   ▼      ▼      ▼        ▼
[Neo]  [Cemig] [Enel]  [Outra]
   │      │      │        │
   └──────┴──────┴────────┘
           │
           ▼
[Node: Agendar Lembrete Semanal]
           │
           ▼
[Node: Notificar Cliente Status]
           │
           ▼
[Schedule: Verificar SLA Diariamente]
           │
           ▼
[Node: Verificar Prazo SLA]
           │
     ┌─────┴─────┐
     │ SLA > X%  │
     └─────┬─────┘
    NÃO    │    SIM
     │     │     │
     │     │     ▼
     │     │  [Notificar Gerente]
     │     │     │
     │     │     ▼
     │     │  [Escalar Prioridade]
     │     │     │
     │     │     ▼
     │     │  [Notificar Cliente]
     │     │
     └─────┴─────┐
           │
           ▼
[Webhook: Protocolo Atualizado?]
           │
     ┌─────┴─────┐
     │  Status   │
     └─────┬─────┘
   ┌──────┼──────┐
   ▼      ▼      ▼
[Aprov] [Pend] [Reprov]
   │      │       │
   │      │       ▼
   │      │    [Notificar]
   │      │    [Criar Tarefa]
   │      │
   └──────┴──────┐
           │
           ▼
[Node: Atualizar Status Processo]
           │
           ▼
[END]
```

### 5.2 Configuração dos Nodes

#### Trigger: Webhook "Pendência Concessionária"

```json
{
  "name": "Webhook - Pendência Concessionária",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "pendencia-concessionaria-webhook",
  "path": "webhook/pendencia-concessionaria",
  "httpMethod": "POST",
  "authentication": "headerAuth"
}
```

#### Node: Definir SLA por Concessionária (Function)

```javascript
// Node: Define SLA por Concessionária
const event = $input.first().json.body;

// SLAs padrão por tipo de processo e concessionária (em dias)
const slas = {
  'neoenergia': {
    'pde_bt': { padrao: 15, maximo: 30 },
    'pde_at': { padrao: 30, maximo: 60 },
    'solar': { padrao: 20, maximo: 45 },
    'rede': { padrao: 45, maximo: 90 },
    'conexao': { padrao: 10, maximo: 20 }
  },
  'cemig': {
    'pde_bt': { padrao: 12, maximo: 25 },
    'pde_at': { padrao: 25, maximo: 50 },
    'solar': { padrao: 18, maximo: 40 },
    'rede': { padrao: 40, maximo: 80 },
    'conexao': { padrao: 8, maximo: 15 }
  },
  'enel': {
    'pde_bt': { padrao: 18, maximo: 35 },
    'pde_at': { padrao: 35, maximo: 70 },
    'solar': { padrao: 22, maximo: 50 },
    'rede': { padrao: 50, maximo: 100 },
    'conexao': { padrao: 12, maximo: 25 }
  },
  'outra': {
    'pde_bt': { padrao: 20, maximo: 40 },
    'pde_at': { padrao: 40, maximo: 80 },
    'solar': { padrao: 25, maximo: 55 },
    'rede': { padrao: 60, maximo: 120 },
    'conexao': { padrao: 15, maximo: 30 }
  }
};

const concessionaria = event.concessionaria || 'outra';
const tipo = event.tipo_processo;
const sla = slas[concessionaria]?.[tipo] || { padrao: 20, maximo: 40 };

const dataEntrada = new Date(event.data_entrada);
const dataSlaPadrao = new Date(dataEntrada);
const dataSlaMaximo = new Date(dataEntrada);
dataSlaPadrao.setDate(dataSlaPadrao.getDate() + sla.padrao);
dataSlaMaximo.setDate(dataSlaMaximo.getDate() + sla.maximo);

return [{
  json: {
    processo_id: event.processo_id,
    protocolo: event.protocolo,
    concessionaria,
    tipo_processo: tipo,
    data_entrada: dataEntrada.toISOString(),
    sla_padrao_dias: sla.padrao,
    sla_maximo_dias: sla.maximo,
    data_sla_padrao: dataSlaPadrao.toISOString(),
    data_sla_maximo: dataSlaMaximo.toISOString(),
    cliente: {
      nome: event.cliente_nome,
      telefone: event.cliente_telefone,
      email: event.cliente_email
    },
    responsavel: event.responsavel_id
  }
}];
```

#### Node: Salvar Registro de Pendência (Postgres)

```json
{
  "name": "Salvar Pendência Concessionária",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [650, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO pendencias_concessionaria (id, processo_id, protocolo, concessionaria, tipo_processo, data_entrada, data_sla_padrao, data_sla_maximo, status, cliente_notificado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.processo_id }}",
    "={{ $json.protocolo }}",
    "={{ $json.concessionaria }}",
    "={{ $json.tipo_processo }}",
    "={{ $json.data_entrada }}",
    "={{ $json.data_sla_padrao }}",
    "={{ $json.data_sla_maximo }}",
    "aguardando",
    false
  ]
}
```

#### Node: Notificar Cliente Status Inicial (WhatsApp)

```json
{
  "name": "WhatsApp - Status Concessionária",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [850, 300],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "to": "={{ $json.cliente.telefone }}",
    "type": "template",
    "template": {
      "name": "status_concessionaria_entrada",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.cliente.nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.protocolo }}" },
            { "type": "text", "text": "={{ $json.concessionaria.toUpperCase() }}" },
            { "type": "text", "text": "={{ $json.sla_padrao_dias }}" }
          ]
        }
      ]
    }
  }
}
```

#### Workflow Paralelo: Monitoramento de SLA

```json
{
  "name": "Schedule - Verificar SLA Diariamente",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1,
  "position": [250, 600],
  "interval": 1,
  "unit": "days",
  "mode": "everyX",
  "triggerAtHour": 9
}
```

```javascript
// Node: Buscar Pendências Ativas
// Query: SELECT * FROM pendencias_concessionaria WHERE status = 'aguardando'

// Node: Calcular Progresso SLA (Function)
const pendencia = $input.first().json;
const hoje = new Date();
const dataEntrada = new Date(pendencia.data_entrada);
const dataSlaPadrao = new Date(pendencia.data_sla_padrao);
const dataSlaMaximo = new Date(pendencia.data_sla_maximo);

const diasDecorridos = Math.floor((hoje - dataEntrada) / (1000 * 60 * 60 * 24));
const diasAtePadrao = Math.floor((dataSlaPadrao - hoje) / (1000 * 60 * 60 * 24));
const diasAteMaximo = Math.floor((dataSlaMaximo - hoje) / (1000 * 60 * 60 * 24));

const percentualSla = (diasDecorridos / pendencia.sla_padrao_dias) * 100;

let alerta = 'normal';
if (percentualSla >= 100) {
  alerta = 'critico';
} else if (percentualSla >= 75) {
  alerta = 'atencao';
} else if (percentualSla >= 50) {
  alerta = 'monitoramento';
}

return [{
  json: {
    ...pendencia,
    dias_decorridos: diasDecorridos,
    dias_ate_padrao: diasAtePadrao,
    dias_ate_maximo: diasAteMaximo,
    percentual_sla: Math.round(percentualSla),
    alerta
  }
}];
```

#### Node: Switch por Nível de Alerta

```json
{
  "name": "Switch - Nível de Alerta",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 2,
  "position": [650, 600],
  "rules": {
    "rules": [
      {
        "value": "normal",
        "output": 0
      },
      {
        "value": "monitoramento",
        "output": 1
      },
      {
        "value": "atencao",
        "output": 2
      },
      {
        "value": "critico",
        "output": 3
      }
    ]
  }
}
```

#### Node: Ação Alerta Crítico

```javascript
// Node: Escalar Alerta Crítico
const pendencia = $input.first().json;

// Notificar gerente
const notificacaoGerente = {
  to: $env.GERENTE_EMAIL,
  subject: `🚨 ALERTA CRÍTICO: SLA Excedido - ${pendencia.protocolo}`,
  body: {
    protocolo: pendencia.protocolo,
    processo_id: pendencia.processo_id,
    cliente: pendencia.cliente_nome,
    dias_decorridos: pendencia.dias_decorridos,
    sla_padrao: pendencia.sla_padrao_dias,
    percentual: pendencia.percentual_sla,
    acao_recomendada: 'Entrar em contato urgente com a concessionária'
  }
};

// Notificar cliente com transparência
const mensagemCliente = `
Olá ${pendencia.cliente.nome.split(' ')[0]}!

Passando para atualizar sobre o protocolo *#${pendencia.protocolo}*.

⏰ *Status:* Estamos acompanhando diariamente o processo na ${pendencia.concessionaria.toUpperCase()}.

⚡ *Ação em andamento:*
Nossa equipe documentalista está em contato frequente com a concessionária para agilizar a aprovação.

📞 *Se precisar de urgência:*
Podemos protocolar uma solicitação de prioridade. Deseja que façamos isso?

*Responda SIM para priorizar.*

_Agradecemos sua paciência!_
_Equipe [Nome da Empresa]_
`;

return [{
  json: {
    notificacaoGerente,
    mensagemCliente,
    pendencia
  }
}];
```

#### Node: Atualização de Protocolo (Webhook)

```json
{
  "name": "Webhook - Atualização Protocolo",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 900],
  "webhookId": "protocolo-atualizado-webhook",
  "path": "webhook/protocolo-atualizado",
  "httpMethod": "POST"
}
```

```javascript
// Node: Processar Atualização de Protocolo
const event = $input.first().json.body;

const statusMessages = {
  'aprovado': {
    template: 'protocolo_aprovado',
    acao: 'Avançar para próxima etapa',
    notificar: true
  },
  'pendente': {
    template: 'protocolo_pendente',
    acao: 'Verificar pendências e corrigir',
    notificar: true
  },
  'reprovado': {
    template: 'protocolo_reprovado',
    acao: 'Analisar motivo e reenviar',
    notificar: true,
    prioridade: 'alta'
  },
  'em_analise': {
    template: null,
    acao: 'Aguardar',
    notificar: false
  }
};

const config = statusMessages[event.novo_status];

return [{
  json: {
    processo_id: event.processo_id,
    protocolo: event.protocolo,
    status_anterior: event.status_anterior,
    novo_status: event.novo_status,
    observacao: event.observacao,
    data_atualizacao: new Date().toISOString(),
    config
  }
}];
```

### 5.3 Mensagens do Workflow D

**Template WhatsApp - Entrada na Concessionária:**

```
Olá {{1}}! 👋

Seu projeto foi protocolado na *{{3}}*! ✅

📋 *Protocolo:* #{{2}}

⏱️ *Prazo estimado:* {{4}} dias úteis

📊 *O que acontece agora:*
• A concessionária analisa o projeto
• Podem solicitar ajustes (se necessário)
• Você recebe atualizações semanais

💡 *Dica:* O prazo pode variar conforme a demanda da concessionária.

📞 *Acompanhe seu processo:*
{{link_portal}}

Qualquer novidade, avisamos você!

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Protocolo Aprovado:**

```
🎉 *Ótima notícia, {{1}}!*

Seu protocolo *#{{2}}* foi *APROVADO* pela {{3}}! ✅

⚡ *Próximos passos:*
• Equipe técnica será acionada
• Agendamento da execução
• Prazo estimado: {{prazo_execucao}} dias

📅 *Aguarde contato em até 24h* para combinarmos os detalhes.

Dúvidas? Estamos à disposição!

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Protocolo Pendente:**

```
Olá {{1}}!

A {{2}} solicitou *ajustes* no protocolo *#{{3}}*.

📋 *Pendências identificadas:*
{{pendencias_lista}}

⚡ *Nossa ação:*
Nossa equipe já está trabalhando nas correções.

⏱️ *Novo prazo:* {{novo_prazo}} dias

Assim que reenviarmos, você recebe atualização.

_Equipe [Nome da Empresa]_
```

---

## 6. Workflow E - Entrega Concluída (Up-sell)

### 6.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW E: ENTREGA CONCLUÍDA (UP-SELL)                 │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Processo Finalizado]
           │
           ▼
[Node: Registrar Data Entrega]
           │
           ▼
[Node: Coletar Feedback Cliente]
           │
           ▼
[Node: Rules Engine - Up-sell]
           │
     ┌─────┴─────┐
     │ Tipo Obra │
     └─────┬─────┘
   ┌──────┼──────┬────────┬────────┐
   ▼      ▼      ▼        ▼        ▼
[Solar] [PDE]  [Rede]  [SPDA]  [Laudo]
   │      │      │        │        │
   ▼      ▼      ▼        ▼        ▼
[Manut] [Laudo][Laudo]  [Anual]  [Renov]
[Monit] [Adeq] [Adeq]   [Adeq]   [Atual]
   │      │      │        │        │
   └──────┴──────┴────────┴────────┘
           │
           ▼
[Node: Calcular Score de Oferta]
           │
           ▼
[Node: Enviar Ofertas Personalizadas]
           │
           ▼
[Node: Criar Oportunidades CRM]
           │
           ▼
[Node: Campanha de Indicação]
           │
           ▼
[Node: Agendar Follow-up 30 dias]
           │
           ▼
[END]
```

### 6.2 Configuração dos Nodes

#### Trigger: Webhook "Processo Finalizado"

```json
{
  "name": "Webhook - Processo Finalizado",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "processo-finalizado-webhook",
  "path": "webhook/processo-finalizado",
  "httpMethod": "POST",
  "authentication": "headerAuth"
}
```

#### Node: Rules Engine - Up-sell (Function)

```javascript
// Node: Rules Engine for Up-sell
const event = $input.first().json.body;

// Regras de cross-sell/up-sell por tipo de obra
const rules = {
  'solar': {
    ofertas: [
      {
        id: 'manutencao_solar',
        nome: 'Manutenção Preventiva Solar',
        descricao: 'Limpeza e inspeção semestral dos painéis',
        preco_sugerido: 'R$ 350/visita',
        recorrencia: 'semestral',
        prioridade: 1
      },
      {
        id: 'monitoramento_solar',
        nome: 'Monitoramento Online',
        descricao: 'Acompanhamento em tempo real da geração',
        preco_sugerido: 'R$ 49/mês',
        recorrencia: 'mensal',
        prioridade: 2
      },
      {
        id: 'spda_solar',
        nome: 'Projeto SPDA',
        descricao: 'Sistema de proteção contra descargas',
        preco_sugerido: 'a partir de R$ 2.900',
        recorrencia: 'unico',
        prioridade: 3
      }
    ]
  },
  'pde_bt': {
    ofertas: [
      {
        id: 'laudo_eletrico',
        nome: 'Laudo Técnico Elétrico',
        descricao: 'Inspeção completa da instalação',
        preco_sugerido: 'R$ 850',
        recorrencia: 'anual',
        prioridade: 1
      },
      {
        id: 'adequacao_eletrica',
        nome: 'Adequação Elétrica',
        descricao: 'Ajustes e melhorias na instalação',
        preco_sugerido: 'a partir de R$ 1.500',
        recorrencia: 'unico',
        prioridade: 2
      },
      {
        id: 'spda_residencial',
        nome: 'Projeto SPDA Residencial',
        descricao: 'Proteção contra raios',
        preco_sugerido: 'a partir de R$ 2.500',
        recorrencia: 'unico',
        prioridade: 3
      }
    ]
  },
  'pde_at': {
    ofertas: [
      {
        id: 'laudo_at',
        nome: 'Laudo Técnico AT',
        descricao: 'Inspeção de alta tensão',
        preco_sugerido: 'R$ 2.500',
        recorrencia: 'anual',
        prioridade: 1
      },
      {
        id: 'manutencao_subestacao',
        nome: 'Manutenção Subestação',
        descricao: 'Manutenção preventiva trimestral',
        preco_sugerido: 'R$ 1.200/visita',
        recorrencia: 'trimestral',
        prioridade: 2
      }
    ]
  },
  'rede': {
    ofertas: [
      {
        id: 'laudo_rede',
        nome: 'Laudo de Rede',
        descricao: 'Inspeção da infraestrutura',
        preco_sugerido: 'R$ 3.500',
        recorrencia: 'anual',
        prioridade: 1
      },
      {
        id: 'ampliacao_rede',
        nome: 'Ampliação de Rede',
        descricao: 'Expansão futura da infraestrutura',
        preco_sugerido: 'sob consulta',
        recorrencia: 'unico',
        prioridade: 2
      }
    ]
  },
  'spda': {
    ofertas: [
      {
        id: 'inspecao_anual_spda',
        nome: 'Inspeção Anual SPDA',
        descricao: 'Verificação anual conforme NBR 5419',
        preco_sugerido: 'R$ 850',
        recorrencia: 'anual',
        prioridade: 1
      },
      {
        id: 'laudo_aterramento',
        nome: 'Laudo de Aterramento',
        descricao: 'Medição de resistência de aterramento',
        preco_sugerido: 'R$ 650',
        recorrencia: 'anual',
        prioridade: 2
      }
    ]
  },
  'laudo': {
    ofertas: [
      {
        id: 'renovacao_laudo',
        nome: 'Renovação de Laudo',
        descricao: 'Atualização do laudo técnico',
        preco_sugerido: 'R$ 650',
        recorrencia: 'anual',
        prioridade: 1
      },
      {
        id: 'adequacao_laudo',
        nome: 'Adequação por Laudo',
        descricao: 'Correções apontadas no laudo',
        preco_sugerido: 'a partir de R$ 1.200',
        recorrencia: 'unico',
        prioridade: 2
      }
    ]
  }
};

const tipo = event.tipo_obra;
const ofertas = rules[tipo]?.ofertas || [];

// Calcular score baseado em histórico do cliente
let score = 50; // base
if (event.valor_contrato > 10000) score += 20;
if (event.segmento === 'industrial') score += 15;
if (event.segmento === 'comercial') score += 10;
if (event.tempo_execucao_dias < event.prazo_estimado) score += 10; // entrega rápida

return [{
  json: {
    cliente: {
      id: event.cliente_id,
      nome: event.cliente_nome,
      telefone: event.cliente_telefone,
      email: event.cliente_email,
      segmento: event.segmento
    },
    processo: {
      id: event.processo_id,
      tipo_obra: event.tipo_obra,
      valor: event.valor_contrato,
      data_finalizacao: event.data_finalizacao
    },
    ofertas: ofertas.map(o => ({
      ...o,
      score_relevancia: score + (o.prioridade * 5)
    })).sort((a, b) => b.score_relevancia - a.score_relevancia),
    score_cliente: score
  }
}];
```

#### Node: Enviar Ofertas WhatsApp

```javascript
// Node: Gerar Mensagem de Ofertas
const data = $input.first().json;
const ofertas = data.ofertas.slice(0, 3); // Top 3 ofertas

let mensagemOfertas = '';
ofertas.forEach((o, i) => {
  mensagemOfertas += `\n*${i + 1}️⃣ ${o.nome}*\n`;
  mensagemOfertas += `   ${o.descricao}\n`;
  mensagemOfertas += `   💰 ${o.preco_sugerido}\n`;
  if (o.recorrencia !== 'unico') {
    mensagemOfertas += `   🔄 ${o.recorrencia}\n`;
  }
});

const mensagemCompleta = `
🎉 *Parabéns, ${data.cliente.nome.split(' ')[0]}!*

Seu projeto de *${data.processo.tipo_obra}* foi concluído com sucesso!

💙 *Agradecemos sua confiança!*

━━━━━━━━━━━━━━━
📢 *OFERTAS ESPECIAIS PARA VOCÊ*
━━━━━━━━━━━━━━━

Como cliente [Nome da Empresa], você tem acesso a condições especiais:
${mensagemOfertas}

✨ *Interessado?*
Responda com o número da opção desejada (1, 2 ou 3) que entraremos em contato!

_Equipe [Nome da Empresa]_
`;

return [{
  json: {
    ...data,
    mensagem_whatsapp: mensagemCompleta
  }
}];
```

#### Node: Criar Oportunidades no CRM

```json
{
  "name": "Criar Oportunidades Up-sell",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [850, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO oportunidades (id, cliente_id, origem, tipo_servico, valor_estimado, status, data_criacao, data_validade, score) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days', $7)",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.cliente.id }}",
    "upsell_pos_entrega",
    "={{ $json.ofertas[0].id }}",
    "={{ $json.ofertas[0].preco_sugerido }}",
    "aberta",
    "={{ $json.score_cliente }}"
  ]
}
```

#### Node: Campanha de Indicação

```javascript
// Node: Gerar Campanha de Indicação
const data = $input.first().json;

const mensagemIndicacao = `
🎁 *GANHE R$ 200 INDICANDO AMIGOS!*

${data.cliente.nome.split(' ')[0]}, você sabia que pode ganhar *R$ 200* por cada amigo indicado que fechar conosco?

✅ *Como funciona:*
1️⃣ Indique um amigo/familiar
2️⃣ Ele fecha o projeto conosco
3️⃣ Você recebe R$ 200 em até 5 dias

📱 *É simples!*
Basta encaminhar nosso contato:

*WhatsApp:* (61) 99999-9999
*Site:* www.exemplo.com.br

Ou envie o número dele que ligamos!

🎯 *Válido para:*
• Projetos solares
• PDE (BT e AT)
• SPDA
• Laudos técnicos

_Agradecemos sua indicação! 💙_
_Equipe [Nome da Empresa]_
`;

return [{
  json: {
    ...data,
    mensagem_indicacao: mensagemIndicacao
  }
}];
```

#### Node: Agendar Follow-up 30 dias

```json
{
  "name": "Agendar Follow-up 30 dias",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [1050, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO agendamentos_comunicacao (id, cliente_id, tipo, data_agendada, status, template) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4, $5)",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.cliente.id }}",
    "pos_venda_30d",
    "agendado",
    "satisfacao_pos_obra"
  ]
}
```

### 6.3 Mensagens do Workflow E

**Template WhatsApp - Solicitação de Indicação:**

```
🎁 *{{1}}, quer ganhar R$ 200?*

Indique amigos para nossos serviços e ganhe *R$ 200* por indicação fechada!

✅ *Como participar:*
• Indique amigos/familiares
• Eles fecham conosco
• Você recebe R$ 200

📱 *Encaminhe nosso contato:*
WhatsApp: (61) 99999-9999

*Válido para:* Projetos solares, PDE, SPDA, Laudos

🎯 *Sem limite de indicações!*

_Equipe [Nome da Empresa]_
```

---


## 7. Workflow F - Renovação/Recorrência

### 7.1 Diagrama de Fluxo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW F: RENOVAÇÃO/RECORRÊNCIA                       │
└────────────────────────────────────────────────────────────────────────────┘

[Trigger: Schedule Diário (Verificar Renovações)]
           │
           ▼
[Node: Buscar Serviços com 11 Meses]
           │
           ▼
[Node: Filtrar Clientes Elegíveis]
           │
           ▼
[Node: Verificar Última Renovação]
           │
     ┌─────┴─────┐
     │ Já renovou│
     │  < 11m?   │
     └─────┬─────┘
    SIM    │    NÃO
     │     │     │
     ▼     │     ▼
[Skip]    │  [Criar Oportunidade]
           │     │
           │     ▼
           │  [Node: Calcular Oferta]
           │     │
           │     ▼
           │  [Node: Enviar WhatsApp]
           │     │
           │     ▼
           │  [Node: Enviar E-mail]
           │     │
           │     ▼
           │  [Node: Notificar Comercial]
           │     │
           │     ▼
           │  [Node: Agendar Follow-up]
           │
           ▼
[Node: Registrar Campanha]
           │
           ▼
[END]
```

### 7.2 Configuração dos Nodes

#### Trigger: Schedule Diário

```json
{
  "name": "Schedule - Verificar Renovações",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1,
  "position": [250, 300],
  "interval": 1,
  "unit": "days",
  "mode": "everyX",
  "triggerAtHour": 8
}
```

#### Node: Buscar Serviços para Renovação (Postgres)

```json
{
  "name": "Buscar Serviços 11 Meses",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [450, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "SELECT p.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email, c.segmento FROM processos_operacionais p JOIN clientes c ON p.cliente_id = c.id WHERE p.status = 'concluido' AND p.data_fim <= NOW() - INTERVAL '11 months' AND p.data_fim > NOW() - INTERVAL '12 months' AND p.renovacao_notificada = false AND p.tipo_obra IN ('spda', 'laudo', 'pde_bt', 'pde_at')"
}
```

#### Node: Verificar Última Renovação (Function)

```javascript
// Node: Verificar se já foi renovado recentemente
const servico = $input.first().json;

// Query para verificar se existe renovação nos últimos 11 meses
// SELECT COUNT(*) FROM oportunidades WHERE cliente_id = $1 AND origem = 'renovacao' AND data_criacao > NOW() - INTERVAL '11 months'

// Simulando resultado
const jaRenovou = false; // Seria resultado da query

if (jaRenovou) {
  return [{ json: { skip: true, reason: 'Já renovado nos últimos 11 meses', servico } }];
}

// Determinar tipo de renovação/oferta
const renovacoes = {
  'spda': {
    tipo: 'inspecao_anual_spda',
    nome: 'Inspeção Anual SPDA',
    descricao: 'Verificação anual conforme NBR 5419',
    valor_sugerido: 'R$ 850',
    beneficio: 'Garantir proteção contra raios e conformidade',
    urgencia: 'obrigatoria'
  },
  'laudo': {
    tipo: 'renovacao_laudo',
    nome: 'Renovação de Laudo Técnico',
    descricao: 'Atualização do laudo com novas medições',
    valor_sugerido: 'R$ 650',
    beneficio: 'Manter conformidade com normas técnicas',
    urgencia: 'recomendada'
  },
  'pde_bt': {
    tipo: 'laudo_eletrico',
    nome: 'Laudo Elétrico Anual',
    descricao: 'Inspeção da instalação de baixa tensão',
    valor_sugerido: 'R$ 850',
    beneficio: 'Prevenir problemas elétricos',
    urgencia: 'recomendada'
  },
  'pde_at': {
    tipo: 'laudo_at',
    nome: 'Laudo de Alta Tensão',
    descricao: 'Inspeção da subestação',
    valor_sugerido: 'R$ 2.500',
    beneficio: 'Garantir segurança da instalação AT',
    urgencia: 'obrigatoria'
  }
};

const renovacao = renovacoes[servico.tipo_obra];

return [{
  json: {
    skip: false,
    servico,
    renovacao
  }
}];
```

#### Node: Criar Oportunidade de Renovação

```json
{
  "name": "Criar Oportunidade Renovação",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [650, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO oportunidades (id, cliente_id, origem, tipo_servico, valor_estimado, status, data_criacao, data_validade, servico_origem_id) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days', $7) RETURNING *",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.servico.cliente_id }}",
    "renovacao_automatica",
    "={{ $json.renovacao.tipo }}",
    "={{ $json.renovacao.valor_sugerido }}",
    "aberta",
    "={{ $json.servico.id }}"
  ]
}
```

#### Node: Enviar WhatsApp Renovação

```json
{
  "name": "WhatsApp - Renovação",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [850, 300],
  "method": "POST",
  "url": "={{ $env.WHATSAPP_API_URL }}/messages",
  "headers": {
    "Authorization": "Bearer {{ $env.WHATSAPP_API_TOKEN }}"
  },
  "contentType": "json",
  "body": {
    "messaging_product": "whatsapp",
    "to": "={{ $json.servico.cliente_telefone }}",
    "type": "template",
    "template": {
      "name": "renovacao_servico",
      "language": { "code": "pt_BR" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{ $json.servico.cliente_nome.split(' ')[0] }}" },
            { "type": "text", "text": "={{ $json.renovacao.nome }}" },
            { "type": "text", "text": "={{ $json.renovacao.valor_sugerido }}" },
            { "type": "text", "text": "={{ $json.renovacao.beneficio }}" }
          ]
        }
      ]
    }
  }
}
```

#### Node: Notificar Comercial

```javascript
// Node: Notificar Comercial sobre Renovação
const data = $input.first().json;

return [{
  json: {
    to: $env.COMERCIAL_EMAIL,
    subject: `🔄 Oportunidade de Renovação - ${data.servico.cliente_nome}`,
    body: {
      cliente: data.servico.cliente_nome,
      telefone: data.servico.cliente_telefone,
      email: data.servico.cliente_email,
      servico_anterior: data.servico.tipo_obra,
      data_servico_anterior: data.servico.data_fim,
      renovacao_sugerida: data.renovacao.nome,
      valor: data.renovacao.valor_sugerido,
      oportunidade_id: data.oportunidade_id
    }
  }
}];
```

#### Node: Agendar Follow-up Renovação

```json
{
  "name": "Agendar Follow-up Renovação",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2,
  "position": [1050, 300],
  "operation": "executeQuery",
  "connectionString": "={{ $env.POSTGRES_CONNECTION_STRING }}",
  "query": "INSERT INTO agendamentos_comunicacao (id, cliente_id, tipo, data_agendada, status, template, referencia_id) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4, $5, $6)",
  "parameters": [
    "={{ $uuid }}",
    "={{ $json.servico.cliente_id }}",
    "followup_renovacao",
    "agendado",
    "lembrete_renovacao",
    "={{ $json.oportunidade_id }}"
  ]
}
```

### 7.3 Mensagens do Workflow F

**Template WhatsApp - Renovação de Serviço:**

```
Olá {{1}}! 👋

Já faz 11 meses desde o último serviço! ⏰

🔧 *Hora de renovar:* {{2}}

💰 *Investimento:* {{3}}

✅ *Benefícios:*
• {{4}}
• Prevenção de problemas futuros
• Conformidade com normas técnicas
• Segurança garantida

⚡ *Vantagens de renovar conosco:*
• Conhecemos sua instalação
• Histórico completo
• Atendimento prioritário
• Condições especiais

🔗 *Agende agora:* {{link_agendamento}}

Ou responda AGENDAR que entraremos em contato!

_Equipe [Nome da Empresa]_
```

**Template WhatsApp - Follow-up Renovação (D+7):**

```
Olá {{1}}! 👋

Lembrando que sua *{{2}}* está pendente.

⏰ *Não deixe para depois!*

A manutenção preventiva evita:
• Problemas elétricos
• Multas da concessionária
• Riscos de segurança

💰 *Valor especial:* {{3}}

🔗 *Agende agora:* {{link_agendamento}}

_Equipe [Nome da Empresa]_
```

---

## 8. Integrações Necessárias

### 8.1 WhatsApp Business API

#### Opção 1: API Oficial Meta (Recomendada)

```json
{
  "credenciais": {
    "api_url": "https://graph.facebook.com/v18.0/{phone-number-id}",
    "access_token": "{{$env.WHATSAPP_ACCESS_TOKEN}}",
    "phone_number_id": "{{$env.WHATSAPP_PHONE_NUMBER_ID}}",
    "business_account_id": "{{$env.WHATSAPP_BUSINESS_ACCOUNT_ID}}"
  },
  "templates": {
    "categoria": "UTILITY",
    "idioma": "pt_BR",
    "exemplos": ["confirmacao_recebimento", "followup_proposta", "status_concessionaria"]
  }
}
```

**Vantagens:**
- ✅ Mensagens ilimitadas em 24h após interação
- ✅ Templates pré-aprovados
- ✅ Alta entregabilidade
- ✅ Sem bloqueios

**Desvantagens:**
- ⚠️ Aprovação de templates (1-2 dias)
- ⚠️ Custo por mensagem fora da janela
- ⚠️ Requer verificação business

#### Opção 2: Provedores (Wati, Zenvia, Take Blip)

```json
{
  "wati": {
    "api_url": "https://{{instance}}.wa.api.wati.io",
    "api_key": "{{$env.WATI_API_KEY}}",
    "endpoints": {
      "send_message": "/api/v1/sendSessionMessage/{{phone}}",
      "send_template": "/api/v1/sendTemplateMessage",
      "get_messages": "/api/v1/getMessages/{{phone}}"
    }
  },
  "zenvia": {
    "api_url": "https://api.zenvia.com/v2",
    "api_token": "{{$env.ZENVIA_API_TOKEN}}",
    "channel": "whatsapp"
  }
}
```

**Vantagens:**
- ✅ Setup mais rápido
- ✅ Templates pré-configurados
- ✅ Suporte local
- ✅ Dashboard de métricas

### 8.2 E-mail (SMTP/SendGrid)

```json
{
  "sendgrid": {
    "api_url": "https://api.sendgrid.com/v3",
    "api_key": "{{$env.SENDGRID_API_KEY}}",
    "from_email": "sistema@empresa.com.br",
    "from_name": "Sistema ERP - Engenharia",
    "templates": {
      "novo_lead": "d-xxxxxxxxxxxx",
      "proposta_enviada": "d-yyyyyyyyyyyy",
      "contrato_fechado": "d-zzzzzzzzzzzz"
    }
  },
  "smtp": {
    "host": "smtp.empresa.com.br",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "{{$env.SMTP_USER}}",
      "pass": "{{$env.SMTP_PASS}}"
    }
  }
}
```

### 8.3 Google Calendar

```json
{
  "google_calendar": {
    "auth_type": "oAuth2",
    "scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ],
    "calendars": {
      "vistorias": "{{$env.CALENDAR_ID_VISTORIAS}}",
      "reunioes": "{{$env.CALENDAR_ID_REUNIOES}}",
      "entregas": "{{$env.CALENDAR_ID_ENTREGAS}}"
    }
  }
}
```

### 8.4 Google Drive

```json
{
  "google_drive": {
    "auth_type": "oAuth2",
    "scopes": [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file"
    ],
    "folder_structure": {
      "root": "{{$env.DRIVE_FOLDER_ID_PROJETOS}}",
      "subfolders": ["SOLAR", "PDE_BT", "PDE_AT", "REDE", "SPDA", "LAUDOS"]
    }
  }
}
```

### 8.5 Webhooks ERP/CRM

```json
{
  "webhooks": {
    "base_url": "{{$env.ERP_BASE_URL}}/api/webhooks",
    "endpoints": {
      "lead_criado": "/n8n/lead-criado",
      "proposta_enviada": "/n8n/proposta-enviada",
      "contrato_assinado": "/n8n/contrato-assinado",
      "processo_atualizado": "/n8n/processo-atualizado",
      "protocolo_atualizado": "/n8n/protocolo-atualizado"
    },
    "authentication": {
      "type": "header",
      "header_name": "X-Webhook-Secret",
      "secret": "{{$env.WEBHOOK_SECRET}}"
    }
  }
}
```

### 8.6 Emissor de NF (Opcional)

```json
{
  "emissores_nf": {
    "tiny": {
      "api_url": "https://api.tiny.com.br/api2",
      "api_token": "{{$env.TINY_API_TOKEN}}",
      "endpoints": {
        "emitir_nf": "/nota.fiscal.incluir.php",
        "consultar_nf": "/nota.fiscal.pesquisa.php"
      }
    },
    "plugnotas": {
      "api_url": "https://api.plugnotas.com.br",
      "api_key": "{{$env.PLUGNOTAS_API_KEY}}"
    }
  }
}
```

---

## 9. Mensagens Automáticas Prontas

### 9.1 Boas-vindas/Confirmação

**WhatsApp - Confirmação de Recebimento:**
```
Olá [NOME]! 👋

Recebemos sua solicitação de [TIPO_OBRA] com sucesso! 

✅ *Próximos passos:*
• Nossa equipe analisará seu caso
• Entraremos em contato em até 24h úteis
• Você receberá um link para enviar documentos

📋 *Documentos necessários:*
• RG/CNPJ do responsável
• Conta de energia recente
• Matrícula do imóvel (se disponível)

🔗 Link para upload: [LINK]

Dúvidas? Responda aqui ou ligue: (61) 99999-9999

_Equipe [Nome da Empresa]_
```

### 9.2 Follow-ups de Proposta

**D+1 (Educativo):**
```
Olá [NOME]! 👋

Vimos que você recebeu nossa proposta para [TIPO_OBRA].

💡 *Sabia que...*

Um projeto elétrico bem executado pode:
• Reduzir riscos de incêndio em até 90%
• Evitar multas da concessionária
• Aumentar a vida útil dos equipamentos

🔗 *Revise sua proposta:* [LINK]

_Equipe [Nome da Empresa]_
```

**D+3 (Social Proof):**
```
Olá [NOME]! 👋

Queremos compartilhar alguns resultados:

🏆 *Cases de sucesso:*

"Entrega no prazo, equipe super profissional. Aprovaram na Neoenergia de primeira!" 
⭐⭐⭐⭐⭐ - Carlos M., Brasília

"Resolveu nosso problema de queda de energia. SPDA top!"
⭐⭐⭐⭐⭐ - Empresa XYZ

📸 *Veja fotos:* [LINK_PORTFOLIO]

🔗 *Sua proposta:* [LINK]
```

**D+7 (Urgência):**
```
Olá [NOME]! 👋

Sua proposta para [TIPO_OBRA] expira em *3 dias* ⏰

⚡ *Aproveite agora:*
• Garantimos o valor proposto
• Agendamento prioritário

🎯 *Para aprovar:*
1. Clique: [LINK]
2. Assine digitalmente
3. Envie aqui

💬 *Quer negociar?* Responda aqui!
```

### 9.3 Lembrete de Documentos

```
Olá [NOME]! 👋

Notamos que ainda não recebemos seus documentos.

⏰ *Para agilizar:*
• RG ou CNPJ
• Última conta de energia
• Comprovante de endereço

📎 *Envie agora:* [LINK]

⚡ *Com os documentos:*
• Projeto mais rápido
• Entrada na concessionária
• Conexão agilizada

_Equipe [Nome da Empresa]_
```

### 9.4 Notificação de Status da Obra

```
🔔 *Atualização do seu projeto*

Olá [NOME]!

Seu projeto [TIPO_OBRA] avançou:

✅ *Etapa concluída:* [ETAPA]
📊 *Progresso:* [X]%
⏱️ *Próxima etapa:* [PROXIMA_ETAPA]
📅 *Previsão:* [DATA]

Acompanhe em tempo real: [LINK_PORTAL]

_Equipe [Nome da Empresa]_
```

### 9.5 Ofertas de Cross-sell/Up-sell

```
🎉 *Parabéns, [NOME]!* 

Seu projeto foi concluído! 💙

━━━━━━━━━━━━━━━
📢 *OFERTAS ESPECIAIS*
━━━━━━━━━━━━━━━

*1️⃣ [OFERTA_1]*
   [DESCRICAO_1]
   💰 [PRECO_1]

*2️⃣ [OFERTA_2]*
   [DESCRICAO_2]
   💰 [PRECO_2]

*3️⃣ [OFERTA_3]*
   [DESCRICAO_3]
   💰 [PRECO_3]

✨ *Interessado?*
Responda com o número (1, 2 ou 3)!

_Equipe [Nome da Empresa]_
```

### 9.6 Solicitação de Indicação

```
🎁 *Quer ganhar R$ 200?*

[NOME], indique amigos e ganhe *R$ 200* por indicação fechada!

✅ *Como funciona:*
1️⃣ Indique amigos/familiares
2️⃣ Eles fecham conosco
3️⃣ Você recebe R$ 200 em 5 dias

📱 *Encaminhe nosso contato:*
WhatsApp: (61) 99999-9999

*Válido para:* Solar, PDE, SPDA, Laudos

🎯 *Sem limite!*
```

### 9.7 Renovação de Contrato

```
Olá [NOME]! 👋

Já faz 11 meses desde o último serviço! ⏰

🔧 *Hora de renovar:* [SERVICO]

💰 *Investimento:* [VALOR]

✅ *Benefícios:*
• [BENEFICIO_1]
• Prevenção de problemas
• Conformidade técnica
• Segurança garantida

⚡ *Vantagens de renovar conosco:*
• Conhecemos sua instalação
• Histórico completo
• Atendimento prioritário

🔗 *Agende:* [LINK]

_Equipe [Nome da Empresa]_
```

---


## 10. Estratégia de Filas e Processamento

### 10.1 Arquitetura de Filas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA DE FILAS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PRODUCERS      │────▶│   MESSAGE QUEUE  │────▶│   CONSUMERS      │
│                  │     │    (Redis/Bull)  │     │                  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ • Webhooks       │     │                  │     │ • WhatsApp API   │
│ • Schedules      │     │  ┌────────────┐  │     │ • Email SMTP     │
│ • Triggers       │     │  │ whatsapp   │  │     │ • DB Operations  │
│                  │     │  │   queue    │  │     │ • HTTP Requests  │
└──────────────────┘     │  ├────────────┤  │     │                  │
                         │  │  email     │  │     └──────────────────┘
                         │  │   queue    │  │
                         │  ├────────────┤  │
                         │  │   jobs     │  │
                         │  │  pesados   │  │
                         │  ├────────────┤  │
                         │  │  dead      │  │
                         │  │  letter    │  │
                         │  └────────────┘  │
                         │                  │
                         └──────────────────┘
```

### 10.2 Configuração de Filas no n8n

#### Redis como Message Broker

```yaml
# docker-compose.yml - Redis para filas
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: n8n-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped

volumes:
  redis_data:
```

#### Configuração de Filas no n8n

```json
{
  "n8n_queue_config": {
    "bull": {
      "redis": {
        "host": "{{$env.REDIS_HOST}}",
        "port": 6379,
        "password": "{{$env.REDIS_PASSWORD}}",
        "db": 0
      },
      "settings": {
        "lockDuration": 30000,
        "stalledInterval": 30000,
        "maxStalledCount": 2,
        "guardInterval": 5000,
        "retryProcessDelay": 5000
      }
    },
    "worker": {
      "concurrency": 10,
      "maxExecutionTimeout": 300
    }
  }
}
```

### 10.3 Rate Limiting para WhatsApp

```javascript
// Node: Rate Limiter para WhatsApp
// Implementação usando Redis para controle de rate limit

const redis = require('redis');
const client = redis.createClient({
  host: $env.REDIS_HOST,
  port: 6379
});

const RATE_LIMIT = {
  messagesPerSecond: 10,
  messagesPerMinute: 80,
  messagesPerHour: 1000
};

async function checkRateLimit(phoneNumber) {
  const now = Date.now();
  const key = `whatsapp:rate:${phoneNumber}`;
  
  // Verificar limites
  const secondKey = `${key}:second:${Math.floor(now / 1000)}`;
  const minuteKey = `${key}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `${key}:hour:${Math.floor(now / 3600000)}`;
  
  const [second, minute, hour] = await Promise.all([
    client.incr(secondKey),
    client.incr(minuteKey),
    client.incr(hourKey)
  ]);
  
  // Setar expiração
  await Promise.all([
    client.expire(secondKey, 2),
    client.expire(minuteKey, 120),
    client.expire(hourKey, 7200)
  ]);
  
  if (second > RATE_LIMIT.messagesPerSecond ||
      minute > RATE_LIMIT.messagesPerMinute ||
      hour > RATE_LIMIT.messagesPerHour) {
    throw new Error('Rate limit exceeded');
  }
  
  return true;
}

// Implementação no workflow n8n usando Function node
const phoneNumber = $input.first().json.telefone;

try {
  // Simulação de verificação
  const canSend = true; // Seria resultado do checkRateLimit
  
  if (!canSend) {
    return [{
      json: {
        error: 'Rate limit exceeded',
        retry_after: 60,
        phone: phoneNumber
      }
    }];
  }
  
  return [{
    json: {
      can_send: true,
      phone: phoneNumber
    }
  }];
} catch (error) {
  return [{
    json: {
      error: error.message,
      phone: phoneNumber
    }
  }];
}
```

### 10.4 Retry Policies

```json
{
  "retry_policies": {
    "whatsapp_api": {
      "max_retries": 3,
      "retry_interval": "exponential",
      "initial_delay": 5000,
      "max_delay": 300000,
      "retry_on": [408, 429, 500, 502, 503, 504],
      "circuit_breaker": {
        "failure_threshold": 5,
        "recovery_timeout": 60000,
        "half_open_max_calls": 3
      }
    },
    "email_smtp": {
      "max_retries": 5,
      "retry_interval": "linear",
      "initial_delay": 10000,
      "max_delay": 600000,
      "retry_on": [421, 450, 451, 452, 550]
    },
    "database": {
      "max_retries": 3,
      "retry_interval": "exponential",
      "initial_delay": 1000,
      "max_delay": 30000,
      "retry_on": ["ECONNREFUSED", "ETIMEDOUT", "08006"]
    }
  }
}
```

#### Implementação de Retry no n8n

```javascript
// Node: Retry Handler
const operation = $input.first().json;
const maxRetries = 3;
const retryDelay = 5000; // 5 segundos

async function executeWithRetry(fn, retries = 0) {
  try {
    return await fn();
  } catch (error) {
    if (retries < maxRetries && isRetryableError(error)) {
      await sleep(retryDelay * Math.pow(2, retries)); // Exponential backoff
      return executeWithRetry(fn, retries + 1);
    }
    throw error;
  }
}

function isRetryableError(error) {
  const retryableCodes = [408, 429, 500, 502, 503, 504];
  return retryableCodes.includes(error.statusCode);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Uso no workflow
return executeWithRetry(async () => {
  // Operação que pode falhar
  const result = await sendWhatsAppMessage(operation);
  return [{ json: { success: true, result } }];
}).catch(error => {
  return [{ json: { success: false, error: error.message, retry_exhausted: true } }];
});
```

### 10.5 Dead Letter Queue

```javascript
// Node: Dead Letter Queue Handler
const failedJob = $input.first().json;

const dlqEntry = {
  id: $uuid,
  original_job_id: failedJob.id,
  workflow: failedJob.workflow,
  node: failedJob.node,
  error: failedJob.error,
  payload: failedJob.payload,
  timestamp: new Date().toISOString(),
  retry_count: failedJob.retry_count || 0,
  status: 'failed'
};

// Salvar na DLQ
// INSERT INTO dead_letter_queue (...) VALUES (...)

// Notificar administrador
const alert = {
  to: $env.ADMIN_EMAIL,
  subject: `🚨 Job Falhou - DLQ: ${failedJob.workflow}`,
  body: {
    job_id: failedJob.id,
    error: failedJob.error,
    timestamp: dlqEntry.timestamp,
    retry_count: dlqEntry.retry_count
  }
};

return [{
  json: {
    dlq_entry: dlqEntry,
    alert,
    action_required: dlqEntry.retry_count >= 3
  }
}];
```

### 10.6 Estrutura de Filas Recomendada

| Fila | Propósito | Prioridade | Workers |
|------|-----------|------------|---------|
| `whatsapp-priority` | Mensagens urgentes (SLA, alertas) | Alta | 3 |
| `whatsapp-standard` | Mensagens normais | Média | 5 |
| `email` | Envio de e-mails | Média | 3 |
| `jobs-pesados` | Geração de relatórios, PDFs | Baixa | 2 |
| `webhooks` | Processamento de webhooks | Alta | 4 |
| `scheduled` | Tarefas agendadas | Média | 2 |
| `dlq` | Jobs falhos para análise | - | 1 |

---

## 11. Configuração do n8n

### 11.1 Self-hosted vs Cloud

#### Recomendação: Self-hosted (Docker)

```yaml
# docker-compose.yml - n8n Production
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Database
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${N8N_DB_PASSWORD}
      
      # Security
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      
      # Webhook
      - WEBHOOK_URL=https://n8n.empresa.com.br/
      
      # Queue Mode (opcional para alta escala)
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      
      # Timezone
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      
      # Logs
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console,file
      
    volumes:
      - n8n_data:/home/node/.n8n
      - ./logs:/home/node/logs
    depends_on:
      - postgres
      - redis
    networks:
      - n8n-network

  n8n-worker:
    image: n8nio/n8n:latest
    container_name: n8n-worker
    restart: unless-stopped
    command: worker
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${N8N_DB_PASSWORD}
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - GENERIC_TIMEZONE=America/Sao_Paulo
    depends_on:
      - postgres
      - redis
    networks:
      - n8n-network
    deploy:
      replicas: 2

  postgres:
    image: postgres:15-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${N8N_DB_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n-network

  redis:
    image: redis:7-alpine
    container_name: n8n-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - n8n-network

  nginx:
    image: nginx:alpine
    container_name: n8n-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - n8n
    networks:
      - n8n-network

volumes:
  n8n_data:
  postgres_data:
  redis_data:

networks:
  n8n-network:
    driver: bridge
```

### 11.2 Segurança - Webhooks Autenticados

```javascript
// Node: Webhook Authentication Middleware
const webhookRequest = $input.first().json;

// Verificar API Key
const apiKey = webhookRequest.headers['x-api-key'];
const expectedApiKey = $env.API_KEY_WEBHOOK;

if (apiKey !== expectedApiKey) {
  return [{
    json: {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid API key'
    }
  }];
}

// Verificar timestamp (prevenir replay attacks)
const timestamp = webhookRequest.headers['x-timestamp'];
const now = Date.now();
const requestTime = parseInt(timestamp);

if (Math.abs(now - requestTime) > 300000) { // 5 minutos
  return [{
    json: {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Request expired'
    }
  }];
}

// Verificar assinatura HMAC (opcional)
const signature = webhookRequest.headers['x-signature'];
const payload = JSON.stringify(webhookRequest.body);
const expectedSignature = require('crypto')
  .createHmac('sha256', $env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return [{
    json: {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid signature'
    }
  }];
}

// Autenticação OK
return [{
  json: {
    authenticated: true,
    payload: webhookRequest.body
  }
}];
```

### 11.3 Backup dos Workflows

```bash
#!/bin/bash
# backup-n8n.sh

BACKUP_DIR="/backups/n8n"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec n8n-postgres pg_dump -U n8n n8n > $BACKUP_DIR/n8n_db_$DATE.sql

# Backup dos workflows (via API)
curl -X GET \
  https://n8n.empresa.com.br/rest/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  > $BACKUP_DIR/workflows_$DATE.json

# Backup das credenciais (criptografadas)
docker cp n8n:/home/node/.n8n $BACKUP_DIR/n8n_config_$DATE

# Compactar
tar -czf $BACKUP_DIR/n8n_backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE*

# Remover backups antigos
find $BACKUP_DIR -name "n8n_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Upload para S3 (opcional)
aws s3 cp $BACKUP_DIR/n8n_backup_$DATE.tar.gz s3://empresa-backups/n8n/

echo "Backup completed: $DATE"
```

### 11.4 Monitoring e Alerting

#### Métricas com Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus_data:
  grafana_data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'n8n'
    static_configs:
      - targets: ['n8n:5678']
    metrics_path: /metrics
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
      
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'
```

```yaml
# alerts.yml
groups:
  - name: n8n_alerts
    rules:
      - alert: N8NHighErrorRate
        expr: rate(n8n_execution_error_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "n8n high error rate"
          description: "Error rate is above 10%"

      - alert: N8NQueueBacklog
        expr: n8n_queue_waiting > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "n8n queue backlog"
          description: "More than 100 jobs waiting"

      - alert: N8NWebhookDown
        expr: up{job="n8n"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "n8n webhook is down"
          description: "n8n webhook endpoint is not responding"
```

#### Alertas por E-mail/WhatsApp

```javascript
// Node: Send Alert
const alert = $input.first().json;

const alertMessage = `
🚨 *ALERTA DO SISTEMA*

*Tipo:* ${alert.severity.toUpperCase()}
*Título:* ${alert.summary}
*Descrição:* ${alert.description}

*Timestamp:* ${new Date().toISOString()}

_Verifique o painel de monitoramento._
`;

// Enviar WhatsApp para admin
const whatsappAlert = {
  to: $env.ADMIN_WHATSAPP,
  message: alertMessage
};

// Enviar e-mail
const emailAlert = {
  to: $env.ADMIN_EMAIL,
  subject: `[${alert.severity.toUpperCase()}] ${alert.summary}`,
  body: alertMessage
};

return [{
  json: {
    whatsapp: whatsappAlert,
    email: emailAlert,
    alert
  }
}];
```

### 11.5 Variáveis de Ambiente

```bash
# .env - n8n Environment Variables

# Database
N8N_DB_PASSWORD=senha_segura_aqui

# Security
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=senha_admin_segura
N8N_ENCRYPTION_KEY=chave_criptografia_32_chars

# API Keys
API_KEY_WEBHOOK=webhook_api_key_segura
WEBHOOK_SECRET=webhook_secret_hmac

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=token_aqui
WHATSAPP_PHONE_NUMBER_ID=id_numero
WHATSAPP_BUSINESS_ACCOUNT_ID=id_conta

# E-mail
SENDGRID_API_KEY=SG.xxxxx
SMTP_USER=sistema@empresa.com.br
SMTP_PASS=senha_smtp

# Google
GOOGLE_CLIENT_ID=client_id
GOOGLE_CLIENT_SECRET=client_secret
DRIVE_FOLDER_ID_PROJETOS=folder_id
CALENDAR_ID_VISTORIAS=calendar_id

# ERP
ERP_BASE_URL=https://erp.empresa.com.br
ERP_API_KEY=api_key_erp

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=senha_redis

# Admin
ADMIN_EMAIL=admin@empresa.com.br
ADMIN_WHATSAPP=5561999999999
GERENTE_EMAIL=gerente@empresa.com.br
COMERCIAL_EMAIL=comercial@empresa.com.br
```

---


## 12. JSON dos Workflows

### 12.1 Workflow A - Novo Lead (JSON Completo)

```json
{
  "name": "A - Novo Lead",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/novo-lead",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-novo-lead",
      "name": "Webhook - Novo Lead",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "novo-lead-webhook"
    },
    {
      "parameters": {
        "jsCode": "const required = ['nome', 'telefone', 'tipo_obra'];\nconst payload = $input.first().json.body;\n\nconst missing = required.filter(field => !payload[field]);\n\nif (missing.length > 0) {\n  return [{\n    json: {\n      valid: false,\n      error: `Campos obrigatórios faltando: ${missing.join(', ')}`,\n      payload\n    }\n  }];\n}\n\nlet telefone = payload.telefone.replace(/\\D/g, '');\nif (telefone.length === 11) {\n  telefone = `55${telefone}`;\n}\n\nreturn [{\n  json: {\n    valid: true,\n    lead: {\n      ...payload,\n      telefone,\n      id: $input.first().json.body.id || $uuid\n    }\n  }\n}];"
      },
      "name": "Validate Payload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const lead = $input.first().json.lead;\n\nconst segmentoMap = {\n  'solar': lead.tipo_instalacao === 'residencial' ? 'residencial' : 'comercial',\n  'pde_bt': 'residencial',\n  'pde_at': 'comercial',\n  'rede': 'industrial',\n  'spda': lead.tamanho_predio === 'grande' ? 'industrial' : 'comercial',\n  'laudo': 'comercial'\n};\n\nconst concessionariaMap = {\n  'brasilia': 'neoenergia',\n  'taguatinga': 'neoenergia',\n  'ceilandia': 'neoenergia'\n};\n\nconst cidadeLower = (lead.cidade || '').toLowerCase();\nconst concessionaria = concessionariaMap[cidadeLower] || 'outra';\n\nlet prioridade = 'media';\nif (lead.tipo_obra === 'rede' || lead.tipo_obra === 'pde_at') {\n  prioridade = 'alta';\n}\n\nreturn [{\n  json: {\n    lead: {\n      ...lead,\n      segmento: segmentoMap[lead.tipo_obra] || 'comercial',\n      concessionaria,\n      prioridade,\n      data_criacao: new Date().toISOString()\n    }\n  }\n}];"
      },
      "name": "Enriquecer Dados",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO tarefas (id, lead_id, tipo, titulo, descricao, responsavel_id, prioridade, status, data_criacao, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '2 days') RETURNING *",
        "options": {
          "nodeVersion": "2"
        },
        "parameters": [
          "={{ $uuid }}",
          "={{ $json.lead.id }}",
          "qualificacao",
          "={{ 'Qualificar lead: ' + $json.lead.nome }}",
          "={{ 'Novo lead de ' + $json.lead.tipo_obra + ' em ' + $json.lead.cidade }}",
          "={{ $env.COMERCIAL_DEFAULT_USER }}",
          "={{ $json.lead.prioridade }}",
          "pendente"
        ]
      },
      "name": "Criar Tarefa",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.WHATSAPP_API_URL }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "body": {
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": "={{ $json.lead.telefone }}",
          "type": "template",
          "template": {
            "name": "confirmacao_recebimento",
            "language": { "code": "pt_BR" },
            "components": [
              {
                "type": "body",
                "parameters": [
                  { "type": "text", "text": "={{ $json.lead.nome.split(' ')[0] }}" },
                  { "type": "text", "text": "={{ $json.lead.tipo_obra.toUpperCase() }}" }
                ]
              }
            ]
          }
        },
        "options": {}
      },
      "name": "WhatsApp Confirmacao",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 24
            }
          ]
        }
      },
      "name": "Schedule 24h",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 600]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT l.* FROM leads l LEFT JOIN documentos d ON l.id = d.lead_id WHERE l.data_criacao < NOW() - INTERVAL '24 hours' AND l.data_criacao > NOW() - INTERVAL '25 hours' AND (d.id IS NULL OR d.status != 'completo') AND l.lembrete_enviado = false"
      },
      "name": "Buscar Docs Pendentes",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [450, 600]
    }
  ],
  "connections": {
    "Webhook - Novo Lead": {
      "main": [
        [
          {
            "node": "Validate Payload",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Validate Payload": {
      "main": [
        [
          {
            "node": "Enriquecer Dados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enriquecer Dados": {
      "main": [
        [
          {
            "node": "Criar Tarefa",
            "type": "main",
            "index": 0
          },
          {
            "node": "WhatsApp Confirmacao",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Schedule 24h": {
      "main": [
        [
          {
            "node": "Buscar Docs Pendentes",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": "Error Handler"
  },
  "staticData": null,
  "tags": ["lead", "automação", "onboarding"]
}
```

### 12.2 Workflow B - Proposta Enviada (JSON)

```json
{
  "name": "B - Proposta Enviada",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/proposta-enviada",
        "responseMode": "responseNode"
      },
      "name": "Webhook Proposta",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const proposta = $input.first().json.body;\nconst now = new Date();\n\nconst followUps = [\n  { dia: 1, tipo: 'educativo', template: 'followup_d1_educativo' },\n  { dia: 3, tipo: 'social_proof', template: 'followup_d3_cases' },\n  { dia: 7, tipo: 'urgencia', template: 'followup_d7_urgencia' }\n];\n\nreturn followUps.map(fu => {\n  const dataEnvio = new Date(now);\n  dataEnvio.setDate(dataEnvio.getDate() + fu.dia);\n  \n  return {\n    json: {\n      proposta_id: proposta.id,\n      lead_id: proposta.lead_id,\n      lead_telefone: proposta.lead_telefone,\n      lead_nome: proposta.lead_nome,\n      tipo_obra: proposta.tipo_obra,\n      valor: proposta.valor,\n      dia_followup: fu.dia,\n      tipo: fu.tipo,\n      template: fu.template,\n      data_agendada: dataEnvio.toISOString()\n    }\n  };\n});"
      },
      "name": "Agendar Follow-ups",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO follow_up_agendamentos (id, proposta_id, lead_id, dia, tipo, template, data_agendada, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
      },
      "name": "Salvar Agendamentos",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Hourly",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 600]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT f.*, p.status as proposta_status FROM follow_up_agendamentos f JOIN propostas p ON f.proposta_id = p.id WHERE DATE(f.data_agendada) = CURRENT_DATE AND f.status = 'agendado' AND EXTRACT(HOUR FROM f.data_agendada) = EXTRACT(HOUR FROM NOW())"
      },
      "name": "Buscar Follow-ups",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [450, 600]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "const agendamento = $input.first().json;\n\nif (['aceita', 'rejeitada', 'fechada'].includes(agendamento.proposta_status)) {\n  return [{ json: { skip: true } }];\n}\n\nreturn [{ json: { ...agendamento, skip: false } }];"
      },
      "name": "Verificar Status",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 600]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "cond-1",
              "leftValue": "={{ $json.skip }}",
              "rightValue": false,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "name": "IF - Enviar?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [850, 600]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.WHATSAPP_API_URL }}/messages",
        "sendBody": true,
        "body": {
          "messaging_product": "whatsapp",
          "to": "={{ $json.lead_telefone }}",
          "type": "template",
          "template": {
            "name": "={{ $json.template }}",
            "language": { "code": "pt_BR" },
            "components": [
              {
                "type": "body",
                "parameters": [
                  { "type": "text", "text": "={{ $json.lead_nome.split(' ')[0] }}" },
                  { "type": "text", "text": "={{ $json.tipo_obra }}" }
                ]
              }
            ]
          }
        }
      },
      "name": "WhatsApp Follow-up",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1050, 500]
    }
  ],
  "connections": {
    "Webhook Proposta": {
      "main": [
        [
          {
            "node": "Agendar Follow-ups",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Agendar Follow-ups": {
      "main": [
        [
          {
            "node": "Salvar Agendamentos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Schedule Hourly": {
      "main": [
        [
          {
            "node": "Buscar Follow-ups",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar Follow-ups": {
      "main": [
        [
          {
            "node": "Verificar Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verificar Status": {
      "main": [
        [
          {
            "node": "IF - Enviar?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF - Enviar?": {
      "main": [
        [
          {
            "node": "WhatsApp Follow-up",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true
  },
  "tags": ["proposta", "follow-up", "vendas"]
}
```

### 12.3 Workflow C - Fechado/Ganhou (JSON)

```json
{
  "name": "C - Fechado Ganhou",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/contrato-assinado"
      },
      "name": "Webhook Contrato",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const contrato = $input.first().json.body;\n\nconst workflows = {\n  'solar': {\n    nome: 'Projeto Solar',\n    etapas: [\n      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 3 },\n      { ordem: 2, nome: 'Elaboração Projeto', responsavel: 'projetista', prazo_dias: 7 },\n      { ordem: 3, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 5 },\n      { ordem: 4, nome: 'Execução Obra', responsavel: 'equipe_campo', prazo_dias: 5 },\n      { ordem: 5, nome: 'Conexão', responsavel: 'documentalista', prazo_dias: 10 }\n    ],\n    documentos: ['rg_cpf', 'conta_energia', 'matricula_imovel']\n  },\n  'pde_bt': {\n    nome: 'PDE BT',\n    etapas: [\n      { ordem: 1, nome: 'Visita Técnica', responsavel: 'engenheiro', prazo_dias: 2 },\n      { ordem: 2, nome: 'Projeto PDE', responsavel: 'projetista', prazo_dias: 5 },\n      { ordem: 3, nome: 'Entrada Concessionária', responsavel: 'documentalista', prazo_dias: 3 },\n      { ordem: 4, nome: 'Execução', responsavel: 'equipe_campo', prazo_dias: 3 }\n    ],\n    documentos: ['rg_cpf', 'conta_energia', 'matricula_imovel']\n  }\n};\n\nconst tipo = contrato.tipo_obra;\nconst workflow = workflows[tipo] || workflows['pde_bt'];\n\nreturn [{\n  json: {\n    contrato,\n    workflow,\n    processo_id: $uuid\n  }\n}];"
      },
      "name": "Define Workflow",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO processos_operacionais (id, contrato_id, cliente_id, tipo_obra, status, data_inicio, workflow_config) VALUES ($1, $2, $3, $4, $5, NOW(), $6)"
      },
      "name": "Criar Processo",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\nconst workflow = data.workflow;\nconst processo_id = data.processo_id;\nconst contrato = data.contrato;\n\nlet dataBase = new Date();\nconst tarefas = [];\n\nfor (const etapa of workflow.etapas) {\n  const dataInicio = new Date(dataBase);\n  const dataFim = new Date(dataBase);\n  dataFim.setDate(dataFim.getDate() + etapa.prazo_dias);\n  \n  tarefas.push({\n    id: $uuid,\n    processo_id,\n    ordem: etapa.ordem,\n    titulo: etapa.nome,\n    responsavel_tipo: etapa.responsavel,\n    data_inicio: dataInicio.toISOString(),\n    data_vencimento: dataFim.toISOString(),\n    status: etapa.ordem === 1 ? 'pendente' : 'aguardando'\n  });\n  \n  dataBase = dataFim;\n}\n\nreturn tarefas.map(t => ({ json: t }));"
      },
      "name": "Gerar Tarefas",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO tarefas_operacionais (id, processo_id, ordem, titulo, responsavel_tipo, data_inicio, data_vencimento, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
      },
      "name": "Salvar Tarefas",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.WHATSAPP_API_URL }}/messages",
        "sendBody": true,
        "body": {
          "messaging_product": "whatsapp",
          "to": "={{ $json.contrato.cliente_telefone }}",
          "type": "template",
          "template": {
            "name": "onboarding_cliente",
            "language": { "code": "pt_BR" },
            "components": [
              {
                "type": "body",
                "parameters": [
                  { "type": "text", "text": "={{ $json.contrato.cliente_nome.split(' ')[0] }}" },
                  { "type": "text", "text": "={{ $json.workflow.nome }}" },
                  { "type": "text", "text": "={{ $json.processo_id }}" }
                ]
              }
            ]
          }
        }
      },
      "name": "WhatsApp Onboarding",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Webhook Contrato": {
      "main": [
        [
          {
            "node": "Define Workflow",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Define Workflow": {
      "main": [
        [
          {
            "node": "Criar Processo",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Processo": {
      "main": [
        [
          {
            "node": "Gerar Tarefas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gerar Tarefas": {
      "main": [
        [
          {
            "node": "Salvar Tarefas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Salvar Tarefas": {
      "main": [
        [
          {
            "node": "WhatsApp Onboarding",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true
  },
  "tags": ["contrato", "onboarding", "operacional"]
}
```

### 12.4 Workflow D - Pendência Concessionária (JSON)

```json
{
  "name": "D - Pendencia Concessionaria",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/pendencia-concessionaria"
      },
      "name": "Webhook Pendencia",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const event = $input.first().json.body;\n\nconst slas = {\n  'neoenergia': { 'pde_bt': 15, 'pde_at': 30, 'solar': 20 },\n  'cemig': { 'pde_bt': 12, 'pde_at': 25, 'solar': 18 },\n  'outra': { 'pde_bt': 20, 'pde_at': 40, 'solar': 25 }\n};\n\nconst concessionaria = event.concessionaria || 'outra';\nconst tipo = event.tipo_processo;\nconst sla = slas[concessionaria]?.[tipo] || 20;\n\nconst dataEntrada = new Date(event.data_entrada);\nconst dataSla = new Date(dataEntrada);\ndataSla.setDate(dataSla.getDate() + sla);\n\nreturn [{\n  json: {\n    processo_id: event.processo_id,\n    protocolo: event.protocolo,\n    concessionaria,\n    tipo_processo: tipo,\n    data_entrada: dataEntrada.toISOString(),\n    sla_dias: sla,\n    data_sla: dataSla.toISOString(),\n    cliente: {\n      nome: event.cliente_nome,\n      telefone: event.cliente_telefone\n    }\n  }\n}];"
      },
      "name": "Definir SLA",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO pendencias_concessionaria (id, processo_id, protocolo, concessionaria, tipo_processo, data_entrada, data_sla, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando')"
      },
      "name": "Salvar Pendencia",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "days",
              "daysInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Diario",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 600]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM pendencias_concessionaria WHERE status = 'aguardando'"
      },
      "name": "Buscar Pendencias",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [450, 600]
    },
    {
      "parameters": {
        "jsCode": "const pendencia = $input.first().json;\nconst hoje = new Date();\nconst dataSla = new Date(pendencia.data_sla);\n\nconst diasRestantes = Math.floor((dataSla - hoje) / (1000 * 60 * 60 * 24));\nconst percentual = ((pendencia.sla_dias - diasRestantes) / pendencia.sla_dias) * 100;\n\nlet alerta = 'normal';\nif (percentual >= 100) alerta = 'critico';\nelse if (percentual >= 75) alerta = 'atencao';\nelse if (percentual >= 50) alerta = 'monitoramento';\n\nreturn [{\n  json: {\n    ...pendencia,\n    dias_restantes: diasRestantes,\n    percentual_sla: Math.round(percentual),\n    alerta\n  }\n}];"
      },
      "name": "Calcular Progresso",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 600]
    },
    {
      "parameters": {
        "rules": {
          "rules": [
            {
              "value": "critico",
              "output": 0
            },
            {
              "value": "atencao",
              "output": 1
            },
            {
              "value": "monitoramento",
              "output": 2
            }
          ]
        }
      },
      "name": "Switch Alerta",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 2,
      "position": [850, 600]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.WHATSAPP_API_URL }}/messages",
        "sendBody": true,
        "body": {
          "messaging_product": "whatsapp",
          "to": "={{ $env.GERENTE_WHATSAPP }}",
          "type": "text",
          "text": {
            "body": "🚨 ALERTA CRÍTICO\n\nProtocolo: {{$json.protocolo}}\nSLA Excedido: {{$json.percentual_sla}}%\nDias em atraso: {{$json.dias_restantes * -1}}\n\nAção necessária!"
          }
        }
      },
      "name": "Alerta Gerente",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1050, 400]
    }
  ],
  "connections": {
    "Webhook Pendencia": {
      "main": [
        [
          {
            "node": "Definir SLA",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Definir SLA": {
      "main": [
        [
          {
            "node": "Salvar Pendencia",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Schedule Diario": {
      "main": [
        [
          {
            "node": "Buscar Pendencias",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar Pendencias": {
      "main": [
        [
          {
            "node": "Calcular Progresso",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Calcular Progresso": {
      "main": [
        [
          {
            "node": "Switch Alerta",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch Alerta": {
      "main": [
        [
          {
            "node": "Alerta Gerente",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true
  },
  "tags": ["concessionaria", "sla", "alerta"]
}
```

---

## 13. Checklist de Implementação

### 13.1 Pré-requisitos

- [ ] Servidor VPS/Cloud (mínimo 2 vCPU, 4GB RAM, 50GB SSD)
- [ ] Docker e Docker Compose instalados
- [ ] Domínio configurado com SSL
- [ ] Conta Meta Business verificada (para WhatsApp API)
- [ ] Conta SendGrid ou SMTP configurado
- [ ] Conta Google Cloud (para Calendar e Drive)
- [ ] Banco PostgreSQL (pode ser container)

### 13.2 Configuração Inicial

1. **Clonar e configurar:**
```bash
git clone https://github.com/n8n-io/n8n-docker-compose.git
cd n8n-docker-compose
cp .env.example .env
# Editar .env com suas variáveis
```

2. **Subir serviços:**
```bash
docker-compose up -d
```

3. **Configurar credenciais no n8n:**
- Acessar https://n8n.seudominio.com
- Criar usuário admin
- Adicionar credenciais (WhatsApp, Email, PostgreSQL, Google)

4. **Importar workflows:**
- Settings > Export/Import
- Importar JSONs dos workflows

5. **Ativar workflows:**
- Abrir cada workflow
- Clicar em "Activate"

### 13.3 Testes

- [ ] Testar webhook de novo lead
- [ ] Testar envio de WhatsApp
- [ ] Testar envio de e-mail
- [ ] Testar follow-ups agendados
- [ ] Testar alertas de SLA
- [ ] Testar backup automático

---

## 14. Métricas e KPIs

### 14.1 Métricas de Automação

| Métrica | Target | Descrição |
|---------|--------|-----------|
| Taxa de conversão Lead→Proposta | >30% | Leads que recebem proposta |
| Taxa de conversão Proposta→Fechado | >25% | Propostas que viram contrato |
| Tempo médio de resposta | <2h | Tempo até primeiro contato |
| Taxa de abertura WhatsApp | >70% | Mensagens lidas |
| Taxa de resposta | >40% | Clientes que respondem |
| SLA Concessionária | <100% | Dentro do prazo acordado |
| NPS Pós-obra | >8 | Satisfação do cliente |

### 14.2 Dashboards Recomendados

1. **Funil de Vendas:**
   - Leads → Qualificados → Propostas → Fechados
   
2. **Performance de Follow-up:**
   - Taxa de resposta por dia
   - Conversão por tipo de mensagem

3. **Operacional:**
   - Obras em andamento
   - Pendências por concessionária
   - Tempo médio por etapa

4. **Financeiro:**
   - Receita por tipo de obra
   - Ticket médio
   - Taxa de renovação

---

## 15. Conclusão

Este documento técnico apresenta uma arquitetura completa de automação n8n para um ERP/CRM vertical de engenharia elétrica e solar. As 6 automações principais cobrem todo o ciclo de vida do cliente:

1. **Captação e Qualificação** (Workflow A)
2. **Follow-up de Vendas** (Workflow B)
3. **Onboarding Operacional** (Workflow C)
4. **Gestão de SLA** (Workflow D)
5. **Up-sell/Cross-sell** (Workflow E)
6. **Renovação** (Workflow F)

### Próximos Passos

1. Implementar workflows em ambiente de staging
2. Testar integrações com sandbox
3. Aprovar templates de WhatsApp
4. Treinar equipe comercial
5. Go-live gradual por workflow

### Suporte

Para dúvidas ou problemas:
- Documentação n8n: https://docs.n8n.io
- Comunidade: https://community.n8n.io
- Suporte técnico: [email de suporte]

---

**Documento gerado em:** 2024  
**Versão:** 1.0  
**Autor:** Especialista em Automação n8n

---

*Este documento é confidencial e destinado exclusivamente à equipe técnica da empresa.*
