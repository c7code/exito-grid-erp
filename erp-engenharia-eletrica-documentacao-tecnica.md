# Documentação Técnica - ERP/CRM Engenharia Elétrica
## SaaS Vertical para Empresas de Engenharia Solar e Elétrica

**Versão:** 1.0  
**Data:** 2025-01-21  
**Status:** Documento Técnico para Implementação

---

# 1. VISÃO GERAL DA ARQUITETURA

## 1.1 Diagrama de Arquitetura de Alto Nível

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
│ │ PostgreSQL      │ │  │ │ SQS/RabbitMQ    │ │  │ │ Scheduled Jobs      │ │
│ │ (Read Replica)  │ │  │ │ (Async Tasks)   │ │  │ │ (BullMQ/Cron)       │ │
│ └─────────────────┘ │  │ └─────────────────┘ │  │ └─────────────────────┘ │
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ AWS S3       │  │ SendGrid/    │  │ Evolution    │  │ Concessionárias │ │
│  │ (Documents)  │  │ SES (Email)  │  │ (WhatsApp)   │  │ (APIs/Portais)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Arquitetura MVP vs V2

### MVP (3-4 meses)
```
┌─────────────────────────────────────────────────────────┐
│                    MVP STACK                            │
├─────────────────────────────────────────────────────────┤
│  Frontend: Next.js (SSR/SSG) + Tailwind CSS            │
│  Backend: NestJS (modular)                             │
│  Database: PostgreSQL (single instance)                │
│  Cache: Redis                                          │
│  Storage: AWS S3                                       │
│  Queue: BullMQ (Redis-based)                           │
│  Auth: JWT + RBAC (nestjs/jwt)                         │
│  Infra: Docker + AWS ECS Fargate / Railway / Render    │
│  Automation: n8n self-hosted                           │
│  WhatsApp: Evolution API                               │
└─────────────────────────────────────────────────────────┘
```

### V2 (Escalada)
```
┌─────────────────────────────────────────────────────────┐
│                    V2 STACK                             │
├─────────────────────────────────────────────────────────┤
│  Frontend: Next.js + Module Federation (micro-fronts)  │
│  Backend: NestJS microservices (gRPC/HTTP)             │
│  Database: PostgreSQL (primary + read replicas)        │
│  Cache: Redis Cluster                                  │
│  Storage: S3 + CloudFront                              │
│  Queue: Amazon SQS + EventBridge                       │
│  Auth: Auth0 / Cognito + JWT                           │
│  Infra: EKS / Kubernetes + Terraform                   │
│  Observability: Datadog / New Relic                    │
│  Search: Elasticsearch                                 │
│  Analytics: Metabase / Apache Superset                 │
└─────────────────────────────────────────────────────────┘
```

## 1.3 Decisões Arquiteturais (ADRs)

### ADR-001: NestJS vs Django
**Decisão:** NestJS (Node.js)

**Justificativa:**
| Critério | NestJS | Django |
|----------|--------|--------|
| Type Safety | TypeScript nativo | mypy (opcional) |
| Arquitetura | Modular/DDD nativo | MVT tradicional |
| Async I/O | Excelente (Event Loop) | Async views limitado |
| Real-time | WebSocket nativo | Channels (adicional) |
| Ecosystem | Moderno, cloud-native | Maduro, mas tradicional |
| Team Fit | JS/TS fullstack | Python backend |
| Performance | Melhor para I/O bound | Melhor para CPU bound |

**Motivo principal:** NestJS oferece arquitetura modular nativa, excelente suporte a async/await para integrações externas (concessionárias, WhatsApp), e permite time fullstack JavaScript/TypeScript.

### ADR-002: PostgreSQL
**Decisão:** PostgreSQL como banco principal

**Justificativa:**
- JSONB para dados semi-estruturados (checklists dinâmicos)
- Full-text search integrado
- Suporte a CTEs recursivas (hierarquias de workflow)
- Row-level security (RLS) para multi-tenant
- Extensões: PostGIS (geolocalização de obras), uuid-ossp
- ACID compliance para transações financeiras

### ADR-003: Monolito Modular (MVP) vs Microservices (V2)
**Decisão:** Monolito modular no MVP, evoluir para microservices

**Justificativa:**
- MVP: Velocidade de desenvolvimento, deploy simples, debugging fácil
- V2: Separar módulos críticos (billing, document processing) quando necessário
- Boundary claro: Módulos NestJS prontos para extração

### ADR-004: BullMQ vs SQS
**Decisão:** BullMQ no MVP, SQS na V2

**Justificativa:**
- BullMQ: Zero custo adicional, Redis já necessário para cache
- SQS: Melhor durabilidade, DLQ nativo, melhor para alta escala

## 1.4 Camadas da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PRESENTATION LAYER (Controllers/Gateways)                │   │
│  │ - REST Controllers (API endpoints)                       │   │
│  │ - WebSocket Gateways (real-time)                         │   │
│  │ - DTOs (Data Transfer Objects)                           │   │
│  │ - Pipes (validation/transformation)                      │   │
│  │ - Guards (auth/authorization)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ APPLICATION LAYER (Services/Use Cases)                   │   │
│  │ - Services (orquestração)                                │   │
│  │ - Use Cases (casos de negócio)                           │   │
│  │ - Event Handlers (domain events)                         │   │
│  │ - CQRS Commands/Queries                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ DOMAIN LAYER (Entities/Value Objects)                    │   │
│  │ - Entities (regras de negócio)                           │   │
│  │ - Value Objects (imutáveis)                              │   │
│  │ - Domain Events                                          │   │
│  │ - Domain Services                                        │   │
│  │ - Repository Interfaces                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ INFRASTRUCTURE LAYER (Repositories/External)             │   │
│  │ - TypeORM Repositories                                   │   │
│  │ - External Services (S3, Email, WhatsApp)                │   │
│  │ - Queue Producers/Consumers                              │   │
│  │ - Cache Implementations                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 1.5 Estrutura de Módulos NestJS

```
src/
├── modules/
│   ├── auth/                    # Autenticação e autorização
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── decorators/
│   │
│   ├── users/                   # Gestão de usuários
│   ├── roles/                   # RBAC
│   ├── permissions/             # Permissões granulares
│   │
│   ├── clients/                 # Cadastro de clientes
│   ├── contacts/                # Contatos dos clientes
│   ├── addresses/               # Endereços
│   │
│   ├── leads/                   # Captação de leads
│   ├── opportunities/           # Pipeline comercial
│   ├── proposals/               # Propostas comerciais
│   ├── contracts/               # Contratos
│   │
│   ├── works/                   # Obras/projetos
│   ├── process-orders/          # Ordens de processo
│   ├── workflows/               # Templates de workflow
│   ├── stages/                  # Etapas do processo
│   ├── checklists/              # Checklists
│   │
│   ├── protocols/               # Protocolos concessionária
│   ├── slas/                    # SLAs e monitoramento
│   │
│   ├── documents/               # Gestão documental
│   ├── folders/                 # Estrutura de pastas
│   │
│   ├── tasks/                   # Tarefas
│   ├── comments/                # Comentários
│   ├── notifications/           # Notificações
│   │
│   ├── measurements/            # Medições
│   ├── invoices/                # Faturas
│   ├── payments/                # Pagamentos
│   ├── cost-centers/            # Centros de custo
│   │
│   ├── audit-logs/              # Logs de auditoria
│   └── integrations/            # Integrações externas
│       ├── n8n/
│       ├── whatsapp/
│       └── concessionarias/
│
├── shared/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   ├── guards/
│   └── utils/
│
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── app.config.ts
│
└── main.ts
```

---

# 2. MODELAGEM DETALHADA DO BANCO DE DADOS

## 2.1 Diagrama Entidade-Relacionamento (ER)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA ER - ERP ENGENHARIA                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │     roles       │     │  permissions    │     │ role_permissions│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ id (PK)         │◄────│ id (PK)         │     │ role_id (FK)    │
│ email (UQ)      │     │ name (UQ)       │     │ code (UQ)       │◄────│ permission_id   │
│ password_hash   │     │ description     │     │ name            │     │     (FK)        │
│ first_name      │     │ is_system       │     │ resource        │     └─────────────────┘
│ last_name       │     │ created_at      │     │ action          │
│ phone           │     └─────────────────┘     │ description     │     ┌─────────────────┐
│ avatar_url      │                             └─────────────────┘     │  user_roles     │
│ is_active       │     ┌─────────────────┐                             ├─────────────────┤
│ last_login_at   │────▶│  user_roles     │◄────────────────────────────│ user_id (FK)    │
│ created_at      │     ├─────────────────┤                             │ role_id (FK)    │
│ updated_at      │     │ user_id (FK)    │                             └─────────────────┘
│ tenant_id (FK)  │     │ role_id (FK)    │
└─────────────────┘     └─────────────────┘
         │
         │              ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
         │              │    tenants      │     │ tenant_configs  │     │ tenant_plans    │
         └─────────────▶│ id (PK)         │◄────│ tenant_id (FK)  │◄────│ id (PK)         │
                        │ name            │     │ key             │     │ name            │
                        │ slug (UQ)       │     │ value           │     │ max_users       │
                        │ cnpj (UQ)       │     │ created_at      │     │ max_storage_gb  │
                        │ is_active       │     └─────────────────┘     │ price_monthly   │
                        │ plan_id (FK)    │                             └─────────────────┘
                        │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    clients      │     │    contacts     │     │    addresses    │     │  client_tags    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ client_id (FK)  │     │ addressable_id  │     │ client_id (FK)  │
│ tenant_id (FK)  │     │ name            │     │ addressable_type│     │ tag_id (FK)     │
│ type            │     │ email           │     │ street          │     └─────────────────┘
│ name            │     │ phone           │     │ number          │
│ document        │     │ role            │     │ complement      │     ┌─────────────────┐
│ email           │     │ is_primary      │     │ neighborhood    │     │      tags       │
│ phone           │     │ created_at      │     │ city            │     ├─────────────────┤
│ origin          │     └─────────────────┘     │ state           │     │ id (PK)         │
│ status          │                             │ zip_code        │◄────│ tenant_id (FK)  │
│ assigned_to(FK) │                             │ latitude        │     │ name            │
│ created_at      │                             │ longitude       │     │ color           │
└─────────────────┘                             │ is_main         │     └─────────────────┘
         │                                      └─────────────────┘
         │
         │              ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
         └─────────────▶│     leads       │     │  lead_sources   │     │ lead_activities │
                        ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
                        │ id (PK)         │◄────│ lead_id (FK)    │     │ lead_id (FK)    │
                        │ tenant_id (FK)  │     │ source          │     │ type            │
                        │ client_id (FK)  │     │ utm_source      │     │ description     │
                        │ service_type_id │     │ utm_medium      │     │ metadata (JSONB)│
                        │ source          │     │ utm_campaign    │     │ created_by (FK) │
                        │ status          │     │ created_at      │     │ created_at      │
                        │ priority        │     └─────────────────┘     └─────────────────┘
                        │ description     │
                        │ estimated_value │     ┌─────────────────┐
                        │ assigned_to(FK) │     │  opportunities  │
                        │ converted_at    │◄────├─────────────────┤
                        │ created_at      │     │ id (PK)         │
                        └─────────────────┘     │ tenant_id (FK)  │
                                                │ lead_id (FK)    │
                                                │ client_id (FK)  │
                                                │ service_type_id │
                                                │ stage_id (FK)   │
                                                │ value           │
                                                │ probability     │
                                                │ expected_close  │
                                                │ assigned_to(FK) │
                                                │ closed_at       │
                                                │ closed_reason   │
                                                │ created_at      │
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ pipeline_stages │     │  opportunities  │     │    proposals    │     │ proposal_items  │
├─────────────────┤     │      (cont)     │     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ stage_id (FK)   │◄────│ id (PK)         │◄────│ proposal_id(FK) │
│ tenant_id (FK)  │     └─────────────────┘     │ opportunity_id  │     │ service_type_id │
│ name            │                             │     (FK)        │     │ description     │
│ order           │                             │ number (UQ)     │     │ quantity        │
│ color           │                             │ version         │     │ unit_price      │
│ probability     │                             │ status          │     │ discount_percent│
│ is_won          │                             │ subtotal        │     │ total_price     │
│ is_lost         │                             │ discount_total  │     │ delivery_days   │
│ created_at      │                             │ tax_total       │     │ order           │
└─────────────────┘                             │ total           │     └─────────────────┘
                                                │ valid_until     │
                                                │ sent_at         │     ┌─────────────────┐
                                                │ accepted_at     │     │  proposal_logs  │
                                                │ rejected_at     │     ├─────────────────┤
                                                │ rejection_reason│     │ proposal_id(FK) │
                                                │ created_by (FK) │◄────│ action          │
                                                │ created_at      │     │ old_data (JSONB)│
                                                └─────────────────┘     │ new_data (JSONB)│
                                                                          │ created_by (FK) │
                                                                          │ created_at      │
                                                                          └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ contract_templts│     │    contracts    │     │ contract_clauses│     │ contract_signs  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ template_id(FK) │     │ contract_id(FK) │◄────│ contract_id(FK) │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ title           │     │ signer_name     │
│ name            │     │ proposal_id(FK) │     │ content         │     │ signer_email    │
│ content         │     │ number (UQ)     │     │ order           │     │ signer_document │
│ service_types   │     │ status          │     │ is_optional     │     │ ip_address      │
│ variables (JSON)│     │ total_value     │     └─────────────────┘     │ signed_at       │
│ is_active       │     │ start_date      │                             │ signature_url   │
│ created_at      │     │ end_date        │                             └─────────────────┘
└─────────────────┘     │ signed_at       │
                        │ created_by (FK) │
                        │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  service_types  │     │    packages     │     │  package_rules  │     │ package_items   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ service_type_id │◄────│ package_id (FK) │     │ package_id (FK) │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ condition_type  │     │ service_type_id │
│ code (UQ)       │     │ name            │     │ condition_value │     │ quantity        │
│ name            │     │ description     │     │ discount_type   │     │ is_optional     │
│ category        │     │ base_price      │     │ discount_value  │     └─────────────────┘
│ description     │     │ is_active       │     │ description     │
│ default_price   │     │ created_at      │     └─────────────────┘
│ unit            │     └─────────────────┘
│ delivery_days   │
│ is_active       │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ workflow_templts│     │  stage_templts  │     │ checklist_templ │     │ cklist_item_temp│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ workflow_templt │◄────│ stage_templt_id │◄────│ checklist_templ │
│ tenant_id (FK)  │     │     _id (FK)    │     │     (FK)        │     │     _id (FK)    │
│ service_type_id │     │ name            │     │ name            │     │ description     │
│ name            │     │ description     │     │ description     │     │ is_required     │
│ description     │     │ order           │     │ order           │     │ order           │
│ is_active       │     │ duration_days   │     └─────────────────┘     │ document_type   │
│ created_at      │     │ is_parallel     │                             └─────────────────┘
└─────────────────┘     │ assigned_role_id│
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     works       │     │ process_orders  │     │ stage_instances │     │cklist_instances │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ work_id (FK)    │◄────│ process_order_id│◄────│ stage_instance  │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │     (FK)        │     │     _id (FK)    │
│ client_id (FK)  │     │ workflow_templt │     │ stage_templt_id │     │ checklist_templ │
│ contract_id (FK)│     │     _id (FK)    │     │     (FK)        │     │     _id (FK)    │
│ service_type_id │     │ number (UQ)     │     │ name            │     │ name            │
│ status          │     │ status          │     │ status          │     │ status          │
│ title           │     │ current_stage_id│     │ assigned_to(FK) │     │ completed_at    │
│ description     │     │ progress_percent│     │ started_at      │     │ completed_by(FK)│
│ address_id (FK) │     │ started_at      │     │ completed_at    │     │ notes           │
│ estimated_start │     │ completed_at    │     │ due_date        │     └─────────────────┘
│ estimated_end   │     │ created_by (FK) │     │ notes           │
│ actual_start    │     │ created_at      │     └─────────────────┘
│ actual_end      │     └─────────────────┘
│ created_at      │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   protocols     │     │  protocol_logs  │     │  sla_configs    │     │  sla_violations │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ protocol_id(FK) │     │ id (PK)         │◄────│ sla_config_id   │
│ tenant_id (FK)  │     │ action          │     │ tenant_id (FK)  │     │     (FK)        │
│ work_id (FK)    │     │ old_status      │     │ protocol_type   │     │ protocol_id (FK)│
│ process_order_id│     │ new_status      │     │ sla_days        │     │ violation_type  │
│     (FK)        │     │ description     │     │ warning_days    │     │ detected_at     │
│ concessionaria  │     │ created_by (FK) │     │ escalation_days │     │ resolved_at     │
│ protocol_number │     │ created_at      │     │ is_active       │     │ created_at      │
│ protocol_type   │     └─────────────────┘     └─────────────────┘     └─────────────────┘
│ status          │
│ opened_at       │     ┌─────────────────┐     ┌─────────────────┐
│ expected_return │     │  protocol_docs  │     │  protocol_notes │
│ returned_at     │     ├─────────────────┤     ├─────────────────┤
│ requirements    │     │ protocol_id(FK) │     │ protocol_id(FK) │
│     (JSONB)     │     │ document_id(FK) │     │ content         │
│ notes           │     └─────────────────┘     │ created_by (FK) │
│ created_at      │                             │ created_at      │
└─────────────────┘                             └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     folders     │     │    documents    │     │document_versions│     │ document_shares │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ folder_id (FK)  │◄────│ document_id(FK) │     │ document_id(FK)│
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ version_number  │     │ shared_with(FK)│
│ parent_id (FK)  │     │ work_id (FK)    │     │ file_name       │     │ permission      │
│ name            │     │ process_order_id│     │ file_size       │     │ expires_at      │
│ path            │     │     (FK)        │     │ mime_type       │     │ created_at      │
│ level           │     │ name            │     │ storage_key     │     └─────────────────┘
│ created_at      │     │ description     │     │ checksum        │
└─────────────────┘     │ document_type   │     │ uploaded_by(FK) │
                        │ file_url        │     │ created_at      │
                        │ current_version │     └─────────────────┘
                        │ size_bytes      │
                        │ created_by (FK) │
                        │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     tasks       │     │ task_assignees  │     │    comments     │     │  notifications  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ task_id (FK)    │     │ commentable_id  │     │ id (PK)         │
│ tenant_id (FK)  │     │ user_id (FK)    │     │ commentable_type│     │ tenant_id (FK)  │
│ work_id (FK)    │     └─────────────────┘     │ content         │     │ user_id (FK)    │
│ process_order_id│                             │ created_by (FK) │     │ type            │
│ title           │                             │ parent_id (FK)  │     │ title           │
│ description     │                             │ created_at      │     │ content         │
│ priority        │                             └─────────────────┘     │ data (JSONB)    │
│ status          │                                                     │ is_read         │
│ due_date        │                                                     │ read_at         │
│ completed_at    │                                                     │ created_at      │
│ created_by (FK) │                                                     └─────────────────┘
│ created_at      │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  measurements   │     │    invoices     │     │    payments     │     │  cost_centers   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ measurement_id  │◄────│ invoice_id (FK) │     │ id (PK)         │
│ tenant_id (FK)  │     │     (FK)        │     │ tenant_id (FK)  │     │ tenant_id (FK)  │
│ work_id (FK)    │     │ tenant_id (FK)  │     │ amount          │     │ code (UQ)       │
│ number          │     │ number (UQ)     │     │ method          │     │ name            │
│ reference_month │     │ status          │     │ status          │     │ description     │
│ reference_year  │     │ issue_date      │     │ paid_at         │     │ parent_id (FK)  │
│ total_value     │     │ due_date        │     │ transaction_id  │     │ is_active       │
│ status          │     │ total_amount    │     │ gateway_response│     │ created_at      │
│ approved_at     │     │ paid_amount     │     │     (JSONB)     │     └─────────────────┘
│ approved_by(FK) │     │ paid_at         │     │ created_at      │
│ created_at      │     │ created_at      │     └─────────────────┘
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   audit_logs    │     │  activity_logs  │     │  system_configs │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ tenant_id (FK)  │
│ user_id (FK)    │     │ user_id (FK)    │     │ config_key      │
│ action          │     │ action_type     │     │ config_value    │
│ entity_type     │     │ entity_type     │     │ created_at      │
│ entity_id       │     │ entity_id       │     │ updated_at      │
│ old_values      │     │ metadata (JSONB)│     └─────────────────┘
│     (JSONB)     │     │ created_at      │
│ new_values      │     └─────────────────┘
│     (JSONB)     │
│ ip_address      │
│ user_agent      │
│ created_at      │
└─────────────────┘
```

## 2.2 Definição Detalhada das Tabelas

### 2.2.1 Autenticação e Autorização

```sql
-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(tenant_id, is_active) WHERE deleted_at IS NULL;

-- ============================================
-- TABELA: roles
-- ============================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_roles_name_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);

-- ============================================
-- TABELA: permissions
-- ============================================
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_resource ON permissions(resource);

-- ============================================
-- TABELA: user_roles
-- ============================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================
-- TABELA: role_permissions
-- ============================================
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    PRIMARY KEY (role_id, permission_id)
);
```

### 2.2.2 Multi-tenant e Configurações

```sql
-- ============================================
-- TABELA: tenants
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT TRUE,
    plan_id UUID REFERENCES tenant_plans(id),
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10GB
    subscription_status VARCHAR(20) DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- ============================================
-- TABELA: tenant_plans
-- ============================================
CREATE TABLE tenant_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    max_users INTEGER NOT NULL,
    max_storage_gb INTEGER NOT NULL,
    max_works_per_month INTEGER,
    features JSONB DEFAULT '[]',
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: tenant_configs
-- ============================================
CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_config_key UNIQUE (tenant_id, config_key)
);
```

### 2.2.3 Cadastro de Clientes

```sql
-- ============================================
-- TABELA: clients
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'company')),
    name VARCHAR(200) NOT NULL,
    document VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    origin VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    credit_limit DECIMAL(12,2),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT uq_client_document_tenant UNIQUE (tenant_id, document)
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_assigned ON clients(assigned_to);
CREATE INDEX idx_clients_status ON clients(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_name ON clients USING gin(to_tsvector('portuguese', name));

-- ============================================
-- TABELA: contacts
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50),
    department VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_contacts_primary ON contacts(client_id, is_primary) WHERE is_primary = TRUE;

-- ============================================
-- TABELA: addresses
-- ============================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    addressable_id UUID NOT NULL,
    addressable_type VARCHAR(50) NOT NULL,
    label VARCHAR(50) DEFAULT 'main',
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(9) NOT NULL,
    country VARCHAR(2) DEFAULT 'BR',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_main_address UNIQUE (addressable_id, addressable_type, is_main) 
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_addresses_addressable ON addresses(addressable_id, addressable_type);
CREATE INDEX idx_addresses_location ON addresses USING gist (
    point(longitude, latitude)
);
```

### 2.2.4 Comercial (Leads, Oportunidades, Propostas)

```sql
-- ============================================
-- TABELA: leads
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    service_type_id UUID REFERENCES service_types(id),
    source VARCHAR(50) NOT NULL,
    source_detail VARCHAR(100),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'disqualified', 'archived')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    description TEXT,
    estimated_value DECIMAL(12,2),
    expected_close_date DATE,
    assigned_to UUID REFERENCES users(id),
    converted_to_opportunity_id UUID,
    converted_at TIMESTAMP,
    disqualified_reason VARCHAR(50),
    disqualified_at TIMESTAMP,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ============================================
-- TABELA: lead_activities
-- ============================================
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'whatsapp', 'note', 'status_change')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- ============================================
-- TABELA: pipeline_stages
-- ============================================
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(7) DEFAULT '#6B7280',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_pipeline_stage_order UNIQUE (tenant_id, "order")
);

-- ============================================
-- TABELA: opportunities
-- ============================================
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    service_type_id UUID REFERENCES service_types(id),
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    value DECIMAL(12,2),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold')),
    lost_reason VARCHAR(50),
    lost_reason_detail TEXT,
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_client ON opportunities(client_id);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_status ON opportunities(tenant_id, status);
CREATE INDEX idx_opportunities_close_date ON opportunities(expected_close_date);

-- ============================================
-- TABELA: proposals
-- ============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id),
    number VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired', 'canceled')),
    title VARCHAR(200) NOT NULL,
    introduction TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    valid_until DATE,
    delivery_days INTEGER,
    warranty_months INTEGER DEFAULT 12,
    payment_terms TEXT,
    notes TEXT,
    terms_conditions TEXT,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_proposal_number UNIQUE (tenant_id, number)
);

CREATE INDEX idx_proposals_opportunity ON proposals(opportunity_id);
CREATE INDEX idx_proposals_status ON proposals(tenant_id, status);
CREATE INDEX idx_proposals_number ON proposals(number);

-- ============================================
-- TABELA: proposal_items
-- ============================================
CREATE TABLE proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES service_types(id),
    parent_id UUID REFERENCES proposal_items(id),
    item_type VARCHAR(20) DEFAULT 'service' CHECK (item_type IN ('service', 'product', 'package', 'subtotal')),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'un',
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_days INTEGER,
    "order" INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposal_items_proposal ON proposal_items(proposal_id);
CREATE INDEX idx_proposal_items_order ON proposal_items(proposal_id, "order");
```

### 2.2.5 Contratos e Serviços

```sql
-- ============================================
-- TABELA: contract_templates
-- ============================================
CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    service_types UUID[] DEFAULT '{}',
    variables JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: contracts
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID REFERENCES contract_templates(id),
    proposal_id UUID REFERENCES proposals(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'completed', 'canceled')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    total_value DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    signed_at TIMESTAMP,
    signed_by_client_name VARCHAR(200),
    signed_by_client_document VARCHAR(18),
    signature_ip VARCHAR(45),
    signature_user_agent TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_contract_number UNIQUE (tenant_id, number)
);

CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_proposal ON contracts(proposal_id);

-- ============================================
-- TABELA: service_types
-- ============================================
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('solar', 'eletrica_bt', 'eletrica_mt', 'eletrica_at', 'pde', 'obra_rede', 'laudo', 'spda', 'consultoria')),
    description TEXT,
    default_price DECIMAL(12,2),
    unit VARCHAR(20) DEFAULT 'un',
    default_delivery_days INTEGER,
    required_documents JSONB DEFAULT '[]',
    workflow_template_id UUID REFERENCES workflow_templates(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_service_type_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_service_types_category ON service_types(tenant_id, category);
CREATE INDEX idx_service_types_active ON service_types(tenant_id, is_active);

-- ============================================
-- TABELA: packages
-- ============================================
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES service_types(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(12,2) NOT NULL,
    total_value DECIMAL(12,2),
    delivery_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: package_items
-- ============================================
CREATE TABLE package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2),
    is_optional BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_package_items_package ON package_items(package_id);
```

### 2.2.6 Workflow e Processos

```sql
-- ============================================
-- TABELA: workflow_templates
-- ============================================
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES service_types(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_duration_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: stage_templates
-- ============================================
CREATE TABLE stage_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    duration_days INTEGER DEFAULT 1,
    is_parallel BOOLEAN DEFAULT FALSE,
    required_role_id UUID REFERENCES roles(id),
    auto_assign_logic VARCHAR(50),
    dependencies UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_stage_template_order UNIQUE (workflow_template_id, "order")
);

CREATE INDEX idx_stage_templates_workflow ON stage_templates(workflow_template_id);

-- ============================================
-- TABELA: checklist_templates
-- ============================================
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_template_id UUID NOT NULL REFERENCES stage_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    requires_document BOOLEAN DEFAULT FALSE,
    allowed_document_types JSONB DEFAULT '["pdf", "jpg", "png"]',
    max_file_size_mb INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklist_templates_stage ON checklist_templates(stage_template_id);

-- ============================================
-- TABELA: works
-- ============================================
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    contract_id UUID REFERENCES contracts(id),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'canceled')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    address_id UUID REFERENCES addresses(id),
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    technical_responsible_id UUID REFERENCES users(id),
    commercial_responsible_id UUID REFERENCES users(id),
    custom_fields JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_works_tenant ON works(tenant_id);
CREATE INDEX idx_works_client ON works(client_id);
CREATE INDEX idx_works_status ON works(tenant_id, status);
CREATE INDEX idx_works_service ON works(service_type_id);
CREATE INDEX idx_works_dates ON works(estimated_start_date, estimated_end_date);

-- ============================================
-- TABELA: process_orders
-- ============================================
CREATE TABLE process_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES works(id),
    workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id),
    number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting', 'completed', 'canceled')),
    current_stage_id UUID,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_process_order_number UNIQUE (tenant_id, number)
);

CREATE INDEX idx_process_orders_work ON process_orders(work_id);
CREATE INDEX idx_process_orders_status ON process_orders(tenant_id, status);

-- ============================================
-- TABELA: stage_instances
-- ============================================
CREATE TABLE stage_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_order_id UUID NOT NULL REFERENCES process_orders(id) ON DELETE CASCADE,
    stage_template_id UUID NOT NULL REFERENCES stage_templates(id),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting', 'completed', 'skipped')),
    assigned_to UUID REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stage_instances_process ON stage_instances(process_order_id);
CREATE INDEX idx_stage_instances_status ON stage_instances(status);
CREATE INDEX idx_stage_instances_assigned ON stage_instances(assigned_to);

-- ============================================
-- TABELA: checklist_instances
-- ============================================
CREATE TABLE checklist_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_instance_id UUID NOT NULL REFERENCES stage_instances(id) ON DELETE CASCADE,
    checklist_template_id UUID REFERENCES checklist_templates(id),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'not_applicable')),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    document_id UUID REFERENCES documents(id),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklist_instances_stage ON checklist_instances(stage_instance_id);
```

### 2.2.7 Protocolos e Concessionárias

```sql
-- ============================================
-- TABELA: protocols
-- ============================================
CREATE TABLE protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES works(id),
    process_order_id UUID REFERENCES process_orders(id),
    concessionaria VARCHAR(50) NOT NULL,
    protocol_number VARCHAR(50) NOT NULL,
    protocol_type VARCHAR(50) NOT NULL CHECK (protocol_type IN ('comissionamento', 'incorporacao', 'conexao', 'padrao_entrada', 'aumento_carga', 'religacao', 'outros')),
    status VARCHAR(20) DEFAULT 'opened' CHECK (status IN ('opened', 'in_analysis', 'waiting_documents', 'approved', 'rejected', 'completed', 'canceled')),
    opened_at DATE NOT NULL,
    expected_return_date DATE,
    returned_at DATE,
    completed_at DATE,
    requirements JSONB DEFAULT '[]',
    pending_requirements JSONB DEFAULT '[]',
    response_summary TEXT,
    notes TEXT,
    sla_config_id UUID REFERENCES sla_configs(id),
    sla_deadline DATE,
    sla_violated BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_protocols_work ON protocols(work_id);
CREATE INDEX idx_protocols_status ON protocols(tenant_id, status);
CREATE INDEX idx_protocols_concessionaria ON protocols(concessionaria);
CREATE INDEX idx_protocols_number ON protocols(protocol_number);
CREATE INDEX idx_protocols_sla ON protocols(sla_deadline) WHERE status NOT IN ('completed', 'canceled');

-- ============================================
-- TABELA: protocol_logs
-- ============================================
CREATE TABLE protocol_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_protocol_logs_protocol ON protocol_logs(protocol_id);
CREATE INDEX idx_protocol_logs_created ON protocol_logs(created_at);

-- ============================================
-- TABELA: sla_configs
-- ============================================
CREATE TABLE sla_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    concessionaria VARCHAR(50),
    protocol_type VARCHAR(50) NOT NULL,
    sla_days INTEGER NOT NULL,
    warning_days INTEGER DEFAULT 3,
    escalation_days INTEGER DEFAULT 5,
    business_days_only BOOLEAN DEFAULT TRUE,
    priority_factor JSONB DEFAULT '{"low": 1, "medium": 1, "high": 0.8, "urgent": 0.5}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_sla_config UNIQUE (tenant_id, concessionaria, protocol_type)
);

-- ============================================
-- TABELA: sla_violations
-- ============================================
CREATE TABLE sla_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sla_config_id UUID NOT NULL REFERENCES sla_configs(id),
    protocol_id UUID NOT NULL REFERENCES protocols(id),
    violation_type VARCHAR(30) NOT NULL CHECK (violation_type IN ('first_response', 'resolution')),
    expected_date DATE NOT NULL,
    actual_date DATE,
    days_overdue INTEGER,
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,
    escalated_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_sla_violations_protocol ON sla_violations(protocol_id);
CREATE INDEX idx_sla_violations_open ON sla_violations(resolved_at) WHERE resolved_at IS NULL;
```

### 2.2.8 Documentos e Gestão Documental

```sql
-- ============================================
-- TABELA: folders
-- ============================================
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id),
    name VARCHAR(100) NOT NULL,
    path VARCHAR(500) NOT NULL,
    level INTEGER DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#6B7280',
    is_system BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_folders_tenant ON folders(tenant_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders USING gin(path gin_trgm_ops);

-- ============================================
-- TABELA: documents
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id),
    work_id UUID REFERENCES works(id),
    process_order_id UUID REFERENCES process_orders(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('contract', 'proposal', 'project', 'blueprint', 'report', 'photo', 'invoice', 'certificate', 'other')),
    file_name VARCHAR(255),
    file_url TEXT,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    current_version INTEGER DEFAULT 1,
    storage_provider VARCHAR(20) DEFAULT 's3',
    storage_bucket VARCHAR(100),
    storage_key TEXT,
    checksum VARCHAR(64),
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key_id VARCHAR(100),
    retention_until DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_work ON documents(work_id);
CREATE INDEX idx_documents_type ON documents(tenant_id, document_type);
CREATE INDEX idx_documents_name ON documents USING gin(to_tsvector('portuguese', name));

-- ============================================
-- TABELA: document_versions
-- ============================================
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_key TEXT NOT NULL,
    checksum VARCHAR(64),
    change_description TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_document_version UNIQUE (document_id, version_number)
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);

-- ============================================
-- TABELA: document_protocols (junction)
-- ============================================
CREATE TABLE document_protocols (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    document_purpose VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (document_id, protocol_id)
);
```

### 2.2.9 Tarefas, Comentários e Notificações

```sql
-- ============================================
-- TABELA: tasks
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_id UUID REFERENCES works(id),
    process_order_id UUID REFERENCES process_orders(id),
    stage_instance_id UUID REFERENCES stage_instances(id),
    parent_id UUID REFERENCES tasks(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled')),
    due_date TIMESTAMP,
    reminder_at TIMESTAMP,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_work ON tasks(work_id);
CREATE INDEX idx_tasks_status ON tasks(tenant_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(tenant_id, status) WHERE status != 'completed';
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status != 'completed';

-- ============================================
-- TABELA: task_assignees
-- ============================================
CREATE TABLE task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (task_id, user_id)
);

-- ============================================
-- TABELA: comments
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    commentable_id UUID NOT NULL,
    commentable_type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES comments(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_commentable ON comments(commentable_id, commentable_type);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at);

-- ============================================
-- TABELA: notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'push', 'whatsapp')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### 2.2.10 Financeiro

```sql
-- ============================================
-- TABELA: measurements
-- ============================================
CREATE TABLE measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES works(id),
    number VARCHAR(50) NOT NULL,
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
    reference_year INTEGER NOT NULL,
    measurement_date DATE NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    adjustments DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'invoiced')),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_measurement_number UNIQUE (tenant_id, number)
);

CREATE INDEX idx_measurements_work ON measurements(work_id);
CREATE INDEX idx_measurements_status ON measurements(tenant_id, status);

-- ============================================
-- TABELA: invoices
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    measurement_id UUID REFERENCES measurements(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    work_id UUID REFERENCES works(id),
    number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'canceled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    payment_method VARCHAR(30),
    payment_gateway VARCHAR(30),
    gateway_transaction_id VARCHAR(100),
    notes TEXT,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    canceled_at TIMESTAMP,
    cancel_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_invoice_number UNIQUE (tenant_id, number)
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status NOT IN ('paid', 'canceled');

-- ============================================
-- TABELA: payments
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(30) NOT NULL CHECK (method IN ('bank_transfer', 'credit_card', 'debit_card', 'boleto', 'pix', 'cash', 'check', 'other')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP,
    gateway VARCHAR(30),
    gateway_transaction_id VARCHAR(100),
    gateway_response JSONB,
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- TABELA: cost_centers
-- ============================================
CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES cost_centers(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'expense' CHECK (type IN ('revenue', 'expense', 'both')),
    budget_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_cost_center_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX idx_cost_centers_active ON cost_centers(tenant_id, is_active);
```

### 2.2.11 Auditoria e Logs

```sql
-- ============================================
-- TABELA: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Criar partições mensais
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... criar partições conforme necessário

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- TABELA: activity_logs
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
```

## 2.3 Índices de Performance Adicionais

```sql
-- Índices compostos para consultas frequentes
CREATE INDEX idx_works_client_status ON works(tenant_id, client_id, status);
CREATE INDEX idx_opportunities_pipeline ON opportunities(tenant_id, stage_id, status);
CREATE INDEX idx_protocols_work_status ON protocols(work_id, status);
CREATE INDEX idx_documents_work_type ON documents(work_id, document_type);
CREATE INDEX idx_tasks_user_status ON task_assignees(user_id) 
    JOIN tasks ON task_assignees.task_id = tasks.id 
    WHERE tasks.status != 'completed';

-- Índices para full-text search
CREATE INDEX idx_clients_search ON clients 
    USING gin(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(document, '')));

CREATE INDEX idx_works_search ON works 
    USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Índices para geolocalização (PostGIS)
CREATE INDEX idx_addresses_geo ON addresses 
    USING gist (point(longitude, latitude)) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

## 2.4 Triggers e Functions

```sql
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... aplicar às demais tabelas

-- Trigger para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values)
        VALUES (OLD.tenant_id, current_setting('app.current_user_id')::UUID, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (NEW.tenant_id, current_setting('app.current_user_id')::UUID, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, new_values)
        VALUES (NEW.tenant_id, current_setting('app.current_user_id')::UUID, 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar SLA
CREATE OR REPLACE FUNCTION check_sla_violation()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_config RECORD;
    v_deadline DATE;
BEGIN
    SELECT * INTO v_sla_config FROM sla_configs 
    WHERE tenant_id = NEW.tenant_id 
    AND (concessionaria = NEW.concessionaria OR concessionaria IS NULL)
    AND protocol_type = NEW.protocol_type
    AND is_active = TRUE
    ORDER BY concessionaria NULLS LAST
    LIMIT 1;
    
    IF FOUND THEN
        IF v_sla_config.business_days_only THEN
            v_deadline := NEW.opened_at + (v_sla_config.sla_days || ' days')::INTERVAL;
        ELSE
            v_deadline := NEW.opened_at + (v_sla_config.sla_days || ' days')::INTERVAL;
        END IF;
        
        NEW.sla_deadline := v_deadline;
        NEW.sla_config_id := v_sla_config.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_sla BEFORE INSERT ON protocols
    FOR EACH ROW EXECUTE FUNCTION check_sla_violation();
```

---

# 3. ENDPOINTS PRINCIPAIS DA API

## 3.1 Estrutura de Resposta Padrão

```typescript
// Response envelope padrão
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Paginação padrão
interface PaginationParams {
  page?: number;      // default: 1
  limit?: number;     // default: 20, max: 100
  sort?: string;      // ex: "created_at:desc,name:asc"
  search?: string;    // busca full-text
  filters?: {         // filtros dinâmicos
    [key: string]: string | string[] | number | boolean;
  };
}
```

## 3.2 Autenticação e Autorização

### Endpoints de Auth

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/auth/login` | Login com email/senha | Público |
| POST | `/api/v1/auth/register` | Registro de novo tenant | Público |
| POST | `/api/v1/auth/refresh` | Refresh token | JWT |
| POST | `/api/v1/auth/logout` | Logout | JWT |
| POST | `/api/v1/auth/forgot-password` | Solicitar reset de senha | Público |
| POST | `/api/v1/auth/reset-password` | Resetar senha | Token |
| POST | `/api/v1/auth/change-password` | Alterar senha | JWT |
| GET | `/api/v1/auth/me` | Dados do usuário logado | JWT |
| PUT | `/api/v1/auth/me` | Atualizar perfil | JWT |

### Request/Response - Login

```typescript
// POST /api/v1/auth/login
interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;  // para multi-tenant
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    roles: string[];
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
}
```

## 3.3 Módulo de Usuários e RBAC

### Endpoints de Usuários

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/users` | Listar usuários | users:read |
| POST | `/api/v1/users` | Criar usuário | users:create |
| GET | `/api/v1/users/:id` | Obter usuário | users:read |
| PUT | `/api/v1/users/:id` | Atualizar usuário | users:update |
| DELETE | `/api/v1/users/:id` | Desativar usuário | users:delete |
| POST | `/api/v1/users/:id/roles` | Atribuir roles | users:manage-roles |
| GET | `/api/v1/users/:id/activities` | Atividades do usuário | users:read |

### Endpoints de Roles

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/roles` | Listar roles | roles:read |
| POST | `/api/v1/roles` | Criar role | roles:create |
| GET | `/api/v1/roles/:id` | Obter role | roles:read |
| PUT | `/api/v1/roles/:id` | Atualizar role | roles:update |
| DELETE | `/api/v1/roles/:id` | Excluir role | roles:delete |
| PUT | `/api/v1/roles/:id/permissions` | Definir permissões | roles:manage-permissions |

### Endpoints de Permissões

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/permissions` | Listar permissões | permissions:read |
| GET | `/api/v1/permissions/resources` | Recursos disponíveis | permissions:read |

## 3.4 Módulo de Clientes

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/clients` | Listar clientes | clients:read |
| POST | `/api/v1/clients` | Criar cliente | clients:create |
| GET | `/api/v1/clients/:id` | Obter cliente | clients:read |
| PUT | `/api/v1/clients/:id` | Atualizar cliente | clients:update |
| DELETE | `/api/v1/clients/:id` | Excluir cliente | clients:delete |
| GET | `/api/v1/clients/:id/contacts` | Contatos do cliente | clients:read |
| POST | `/api/v1/clients/:id/contacts` | Adicionar contato | clients:update |
| GET | `/api/v1/clients/:id/addresses` | Endereços do cliente | clients:read |
| POST | `/api/v1/clients/:id/addresses` | Adicionar endereço | clients:update |
| GET | `/api/v1/clients/:id/works` | Obras do cliente | clients:read |
| GET | `/api/v1/clients/:id/opportunities` | Oportunidades | clients:read |
| GET | `/api/v1/clients/:id/documents` | Documentos | clients:read |
| POST | `/api/v1/clients/:id/merge` | Mesclar cliente | clients:admin |

### Request/Response - Clientes

```typescript
// GET /api/v1/clients
interface ListClientsRequest extends PaginationParams {
  type?: 'individual' | 'company';
  status?: 'active' | 'inactive' | 'blocked';
  assignedTo?: string;
  origin?: string;
  hasOpenOpportunities?: boolean;
}

interface ClientResponse {
  id: string;
  type: 'individual' | 'company';
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  origin?: string;
  status: string;
  creditLimit?: number;
  assignedTo?: {
    id: string;
    name: string;
  };
  contactsCount: number;
  addressesCount: number;
  opportunitiesCount: number;
  worksCount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/clients
interface CreateClientRequest {
  type: 'individual' | 'company';
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  origin?: string;
  creditLimit?: number;
  assignedToId?: string;
  notes?: string;
  customFields?: Record<string, any>;
  contacts?: CreateContactRequest[];
  addresses?: CreateAddressRequest[];
}

interface CreateContactRequest {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

interface CreateAddressRequest {
  label?: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  isMain?: boolean;
}
```

## 3.5 Módulo Comercial (Leads e Oportunidades)

### Endpoints de Leads

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/leads` | Listar leads | leads:read |
| POST | `/api/v1/leads` | Criar lead | leads:create |
| GET | `/api/v1/leads/:id` | Obter lead | leads:read |
| PUT | `/api/v1/leads/:id` | Atualizar lead | leads:update |
| POST | `/api/v1/leads/:id/convert` | Converter para oportunidade | leads:convert |
| POST | `/api/v1/leads/:id/disqualify` | Desqualificar lead | leads:update |
| POST | `/api/v1/leads/:id/activities` | Adicionar atividade | leads:update |
| GET | `/api/v1/leads/:id/activities` | Listar atividades | leads:read |
| POST | `/api/v1/leads/import` | Importar leads | leads:admin |

### Endpoints de Oportunidades

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/opportunities` | Listar oportunidades | opportunities:read |
| POST | `/api/v1/opportunities` | Criar oportunidade | opportunities:create |
| GET | `/api/v1/opportunities/:id` | Obter oportunidade | opportunities:read |
| PUT | `/api/v1/opportunities/:id` | Atualizar oportunidade | opportunities:update |
| PUT | `/api/v1/opportunities/:id/stage` | Mover de estágio | opportunities:update |
| POST | `/api/v1/opportunities/:id/win` | Ganhar oportunidade | opportunities:close |
| POST | `/api/v1/opportunities/:id/lose` | Perder oportunidade | opportunities:close |
| GET | `/api/v1/opportunities/pipeline` | Dados do pipeline | opportunities:read |
| GET | `/api/v1/opportunities/dashboard` | Dashboard comercial | opportunities:read |

### Request/Response - Oportunidades

```typescript
// GET /api/v1/opportunities
interface ListOpportunitiesRequest extends PaginationParams {
  stageId?: string;
  status?: 'open' | 'won' | 'lost' | 'on_hold';
  clientId?: string;
  assignedTo?: string;
  serviceTypeId?: string;
  minValue?: number;
  maxValue?: number;
  expectedCloseFrom?: string;
  expectedCloseTo?: string;
}

interface OpportunityResponse {
  id: string;
  title: string;
  description?: string;
  value?: number;
  probability: number;
  expectedCloseDate?: string;
  status: string;
  lostReason?: string;
  client: {
    id: string;
    name: string;
    document?: string;
  };
  serviceType?: {
    id: string;
    name: string;
    category: string;
  };
  stage: {
    id: string;
    name: string;
    color: string;
    probability: number;
  };
  assignedTo?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  proposals: {
    id: string;
    number: string;
    status: string;
    total: number;
  }[];
  activities: ActivityResponse[];
  createdAt: string;
  updatedAt: string;
}

// PUT /api/v1/opportunities/:id/stage
interface MoveStageRequest {
  stageId: string;
  reason?: string;
}

// POST /api/v1/opportunities/:id/win
interface WinOpportunityRequest {
  wonValue?: number;
  contractStartDate?: string;
  notes?: string;
}

// GET /api/v1/opportunities/pipeline
interface PipelineResponse {
  stages: {
    id: string;
    name: string;
    order: number;
    color: string;
    probability: number;
    opportunities: OpportunityResponse[];
    totalValue: number;
    opportunitiesCount: number;
  }[];
  summary: {
    totalOpen: number;
    totalValueOpen: number;
    totalWon: number;
    totalValueWon: number;
    totalLost: number;
    totalValueLost: number;
    conversionRate: number;
  };
}
```

## 3.6 Módulo de Propostas

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/proposals` | Listar propostas | proposals:read |
| POST | `/api/v1/proposals` | Criar proposta | proposals:create |
| GET | `/api/v1/proposals/:id` | Obter proposta | proposals:read |
| PUT | `/api/v1/proposals/:id` | Atualizar proposta | proposals:update |
| DELETE | `/api/v1/proposals/:id` | Excluir proposta | proposals:delete |
| POST | `/api/v1/proposals/:id/duplicate` | Duplicar proposta | proposals:create |
| POST | `/api/v1/proposals/:id/send` | Enviar proposta | proposals:send |
| POST | `/api/v1/proposals/:id/accept` | Aceitar proposta | proposals:close |
| POST | `/api/v1/proposals/:id/reject` | Rejeitar proposta | proposals:close |
| GET | `/api/v1/proposals/:id/pdf` | Gerar PDF | proposals:read |
| GET | `/api/v1/proposals/:id/logs` | Histórico | proposals:read |

### Request/Response - Propostas

```typescript
// POST /api/v1/proposals
interface CreateProposalRequest {
  opportunityId: string;
  title: string;
  introduction?: string;
  validUntil?: string;
  deliveryDays?: number;
  warrantyMonths?: number;
  paymentTerms?: string;
  notes?: string;
  termsConditions?: string;
  items: ProposalItemRequest[];
}

interface ProposalItemRequest {
  serviceTypeId?: string;
  itemType: 'service' | 'product' | 'package';
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  deliveryDays?: number;
  notes?: string;
}

interface ProposalResponse {
  id: string;
  number: string;
  version: number;
  status: string;
  title: string;
  introduction?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  validUntil?: string;
  deliveryDays?: number;
  warrantyMonths: number;
  paymentTerms?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  opportunity: {
    id: string;
    title: string;
    client: {
      id: string;
      name: string;
    };
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}
```

## 3.7 Módulo de Obras e Processos

### Endpoints de Obras (Works)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/works` | Listar obras | works:read |
| POST | `/api/v1/works` | Criar obra | works:create |
| GET | `/api/v1/works/:id` | Obter obra | works:read |
| PUT | `/api/v1/works/:id` | Atualizar obra | works:update |
| PUT | `/api/v1/works/:id/status` | Alterar status | works:update |
| GET | `/api/v1/works/:id/process-orders` | Ordens de processo | works:read |
| GET | `/api/v1/works/:id/documents` | Documentos | works:read |
| GET | `/api/v1/works/:id/measurements` | Medições | works:read |
| GET | `/api/v1/works/:id/tasks` | Tarefas | works:read |
| GET | `/api/v1/works/:id/timeline` | Timeline | works:read |
| POST | `/api/v1/works/:id/duplicate` | Duplicar obra | works:create |

### Endpoints de Ordens de Processo

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/process-orders` | Listar ordens | process-orders:read |
| POST | `/api/v1/process-orders` | Criar ordem | process-orders:create |
| GET | `/api/v1/process-orders/:id` | Obter ordem | process-orders:read |
| PUT | `/api/v1/process-orders/:id` | Atualizar ordem | process-orders:update |
| POST | `/api/v1/process-orders/:id/start` | Iniciar ordem | process-orders:manage |
| POST | `/api/v1/process-orders/:id/cancel` | Cancelar ordem | process-orders:manage |
| GET | `/api/v1/process-orders/:id/stages` | Etapas | process-orders:read |
| POST | `/api/v1/process-orders/:id/stages/:stageId/complete` | Completar etapa | process-orders:update |

### Request/Response - Works

```typescript
// GET /api/v1/works
interface ListWorksRequest extends PaginationParams {
  status?: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'canceled';
  clientId?: string;
  serviceTypeId?: string;
  technicalResponsibleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface WorkResponse {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: string;
  serviceType: {
    id: string;
    name: string;
    category: string;
  };
  client: {
    id: string;
    name: string;
    document?: string;
  };
  address?: AddressResponse;
  contract?: {
    id: string;
    number: string;
    totalValue: number;
  };
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  progressPercent: number;
  technicalResponsible?: UserSummary;
  commercialResponsible?: UserSummary;
  processOrders: ProcessOrderSummary[];
  activeProtocols: ProtocolSummary[];
  pendingTasks: number;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/works
interface CreateWorkRequest {
  clientId: string;
  serviceTypeId: string;
  contractId?: string;
  title: string;
  description?: string;
  addressId?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  estimatedCost?: number;
  technicalResponsibleId?: string;
  commercialResponsibleId?: string;
  customFields?: Record<string, any>;
  startProcessOrder?: boolean;
}
```

## 3.8 Módulo de Protocolos

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/protocols` | Listar protocolos | protocols:read |
| POST | `/api/v1/protocols` | Criar protocolo | protocols:create |
| GET | `/api/v1/protocols/:id` | Obter protocolo | protocols:read |
| PUT | `/api/v1/protocols/:id` | Atualizar protocolo | protocols:update |
| PUT | `/api/v1/protocols/:id/status` | Alterar status | protocols:update |
| POST | `/api/v1/protocols/:id/documents` | Anexar documento | protocols:update |
| GET | `/api/v1/protocols/:id/logs` | Histórico | protocols:read |
| POST | `/api/v1/protocols/:id/notes` | Adicionar nota | protocols:update |
| GET | `/api/v1/protocols/dashboard` | Dashboard | protocols:read |
| GET | `/api/v1/protocols/sla-violations` | Violações de SLA | protocols:admin |

### Request/Response - Protocolos

```typescript
// GET /api/v1/protocols
interface ListProtocolsRequest extends PaginationParams {
  workId?: string;
  concessionaria?: string;
  protocolType?: string;
  status?: string;
  slaViolated?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

interface ProtocolResponse {
  id: string;
  concessionaria: string;
  protocolNumber: string;
  protocolType: string;
  status: string;
  openedAt: string;
  expectedReturnDate?: string;
  returnedAt?: string;
  completedAt?: string;
  slaDeadline?: string;
  slaViolated: boolean;
  daysUntilDeadline?: number;
  daysOverdue?: number;
  work: {
    id: string;
    title: string;
    client: {
      id: string;
      name: string;
    };
  };
  requirements: ProtocolRequirement[];
  pendingRequirements: ProtocolRequirement[];
  documents: DocumentSummary[];
  notes: ProtocolNote[];
  logs: ProtocolLog[];
  createdBy: UserSummary;
  createdAt: string;
}

interface ProtocolRequirement {
  id: string;
  description: string;
  isPending: boolean;
  documentId?: string;
}

// POST /api/v1/protocols
interface CreateProtocolRequest {
  workId: string;
  processOrderId?: string;
  concessionaria: string;
  protocolNumber: string;
  protocolType: string;
  openedAt: string;
  expectedReturnDate?: string;
  requirements?: string[];
  notes?: string;
}
```

## 3.9 Módulo de Documentos

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/folders` | Listar pastas | documents:read |
| POST | `/api/v1/folders` | Criar pasta | documents:create |
| GET | `/api/v1/folders/:id` | Obter pasta | documents:read |
| PUT | `/api/v1/folders/:id` | Atualizar pasta | documents:update |
| DELETE | `/api/v1/folders/:id` | Excluir pasta | documents:delete |
| GET | `/api/v1/documents` | Listar documentos | documents:read |
| POST | `/api/v1/documents` | Upload documento | documents:create |
| GET | `/api/v1/documents/:id` | Obter documento | documents:read |
| PUT | `/api/v1/documents/:id` | Atualizar documento | documents:update |
| DELETE | `/api/v1/documents/:id` | Excluir documento | documents:delete |
| GET | `/api/v1/documents/:id/download` | Download | documents:read |
| GET | `/api/v1/documents/:id/versions` | Versões | documents:read |
| POST | `/api/v1/documents/:id/versions` | Nova versão | documents:update |
| POST | `/api/v1/documents/:id/share` | Compartilhar | documents:share |
| GET | `/api/v1/documents/search` | Busca avançada | documents:read |

### Request/Response - Documentos

```typescript
// POST /api/v1/documents (multipart/form-data)
interface UploadDocumentRequest {
  file: File;
  folderId?: string;
  workId?: string;
  processOrderId?: string;
  name: string;
  description?: string;
  documentType: string;
}

interface DocumentResponse {
  id: string;
  name: string;
  description?: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  currentVersion: number;
  folder?: FolderSummary;
  work?: WorkSummary;
  downloadUrl: string;
  versions: DocumentVersion[];
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

// GET /api/v1/documents/search
interface SearchDocumentsRequest {
  q: string;
  documentType?: string;
  workId?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
}
```

## 3.10 Módulo de Tarefas

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/tasks` | Listar tarefas | tasks:read |
| POST | `/api/v1/tasks` | Criar tarefa | tasks:create |
| GET | `/api/v1/tasks/:id` | Obter tarefa | tasks:read |
| PUT | `/api/v1/tasks/:id` | Atualizar tarefa | tasks:update |
| DELETE | `/api/v1/tasks/:id` | Excluir tarefa | tasks:delete |
| POST | `/api/v1/tasks/:id/complete` | Completar tarefa | tasks:update |
| POST | `/api/v1/tasks/:id/assign` | Atribuir usuário | tasks:assign |
| GET | `/api/v1/tasks/my` | Minhas tarefas | tasks:read |
| GET | `/api/v1/tasks/dashboard` | Dashboard | tasks:read |

## 3.11 Módulo Financeiro

### Endpoints de Medições

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/measurements` | Listar medições | measurements:read |
| POST | `/api/v1/measurements` | Criar medição | measurements:create |
| GET | `/api/v1/measurements/:id` | Obter medição | measurements:read |
| PUT | `/api/v1/measurements/:id` | Atualizar medição | measurements:update |
| POST | `/api/v1/measurements/:id/submit` | Submeter medição | measurements:submit |
| POST | `/api/v1/measurements/:id/approve` | Aprovar medição | measurements:approve |
| POST | `/api/v1/measurements/:id/reject` | Rejeitar medição | measurements:approve |
| POST | `/api/v1/measurements/:id/invoice` | Gerar fatura | measurements:invoice |

### Endpoints de Faturas

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/invoices` | Listar faturas | invoices:read |
| GET | `/api/v1/invoices/:id` | Obter fatura | invoices:read |
| POST | `/api/v1/invoices/:id/send` | Enviar fatura | invoices:send |
| POST | `/api/v1/invoices/:id/cancel` | Cancelar fatura | invoices:cancel |
| GET | `/api/v1/invoices/:id/pdf` | Gerar PDF | invoices:read |
| POST | `/api/v1/invoices/:id/payment` | Registrar pagamento | invoices:payment |

### Endpoints de Pagamentos

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/payments` | Listar pagamentos | payments:read |
| POST | `/api/v1/payments` | Registrar pagamento | payments:create |
| GET | `/api/v1/payments/:id` | Obter pagamento | payments:read |
| POST | `/api/v1/payments/:id/refund` | Estornar | payments:refund |

## 3.12 Módulo de Integrações

### Endpoints do n8n

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/api/v1/webhooks/n8n/lead-created` | Webhook lead | Público (validado) |
| POST | `/api/v1/webhooks/n8n/opportunity-won` | Webhook oportunidade | Público (validado) |
| POST | `/api/v1/webhooks/n8n/protocol-updated` | Webhook protocolo | Público (validado) |
| POST | `/api/v1/webhooks/n8n/task-overdue` | Webhook tarefa | Público (validado) |
| GET | `/api/v1/integrations/n8n/workflows` | Listar workflows | integrations:admin |
| POST | `/api/v1/integrations/n8n/workflows/:id/trigger` | Executar workflow | integrations:admin |

### Endpoints do WhatsApp

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/api/v1/whatsapp/send` | Enviar mensagem | whatsapp:send |
| POST | `/api/v1/whatsapp/send-template` | Enviar template | whatsapp:send |
| GET | `/api/v1/whatsapp/sessions` | Sessões ativas | whatsapp:admin |
| POST | `/api/v1/whatsapp/sessions/:id/connect` | Conectar | whatsapp:admin |
| POST | `/api/v1/webhooks/whatsapp/message` | Webhook mensagem | Público (validado) |
| POST | `/api/v1/webhooks/whatsapp/status` | Webhook status | Público (validado) |

### Request/Response - WhatsApp

```typescript
// POST /api/v1/whatsapp/send
interface SendWhatsAppRequest {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video' | 'audio';
  templateName?: string;
  templateData?: Record<string, string>;
  workId?: string;
  clientId?: string;
}

interface SendWhatsAppResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}
```

## 3.13 Dashboards e Relatórios

### Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/v1/dashboard/commercial` | Dashboard comercial | dashboard:commercial |
| GET | `/api/v1/dashboard/operational` | Dashboard operacional | dashboard:operational |
| GET | `/api/v1/dashboard/financial` | Dashboard financeiro | dashboard:financial |
| GET | `/api/v1/reports/works` | Relatório de obras | reports:read |
| GET | `/api/v1/reports/protocols` | Relatório de protocolos | reports:read |
| GET | `/api/v1/reports/revenue` | Relatório de receita | reports:read |
| POST | `/api/v1/reports/custom` | Relatório customizado | reports:admin |

### Request/Response - Dashboards

```typescript
// GET /api/v1/dashboard/commercial
interface CommercialDashboardResponse {
  period: {
    start: string;
    end: string;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
    bySource: { source: string; count: number }[];
  };
  opportunities: {
    total: number;
    open: number;
    won: number;
    lost: number;
    totalValueOpen: number;
    totalValueWon: number;
    totalValueLost: number;
    conversionRate: number;
    byStage: { stageId: string; name: string; count: number; value: number }[];
  };
  proposals: {
    total: number;
    sent: number;
    accepted: number;
    rejected: number;
    acceptanceRate: number;
    averageResponseTime: number;
  };
  topClients: { clientId: string; name: string; value: number }[];
  topServices: { serviceTypeId: string; name: string; count: number; value: number }[];
}

// GET /api/v1/dashboard/operational
interface OperationalDashboardResponse {
  works: {
    total: number;
    byStatus: { status: string; count: number }[];
    inProgress: number;
    completed: number;
    delayed: number;
  };
  processOrders: {
    total: number;
    active: number;
    completed: number;
    averageCompletionTime: number;
  };
  protocols: {
    total: number;
    open: number;
    slaViolations: number;
    byConcessionaria: { name: string; count: number; avgResponseTime: number }[];
  };
  tasks: {
    total: number;
    pending: number;
    overdue: number;
    completedToday: number;
  };
}
```

---

# 4. FLUXOS DE DADOS PONTA A PONTA

## 4.1 Visão Geral dos Fluxos Principais

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXOS PRINCIPAIS DO SISTEMA                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CAPTAÇÃO   │───▶│   QUALIFICA  │───▶│   PROPOSTA   │───▶│   CONTRATO   │───▶│    OBRA      │
│    (Lead)    │    │(Oportunidade)│    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  WhatsApp    │    │  Pipeline    │    │    PDF       │    │   Assinatura │    │   Process    │
│  Portal Web  │    │  Comercial   │    │   Email      │    │   Digital    │    │   Order      │
│  Indicação   │    │  Atividades  │    │  Negociação  │    │   Geração    │    │   Workflow   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                                          │
       ┌──────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXECUÇÃO E ACOMPANHAMENTO                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   ETAPAS     │───▶│  CHECKLISTS  │───▶│  PROTOCOLOS  │───▶│   MEDIÇÃO    │          │
│  │   (Stages)   │    │              │    │Concessionária│    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│       │                   │                   │                   │                     │
│       ▼                   ▼                   ▼                   ▼                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Tarefas    │    │  Documentos  │    │    SLA       │    │   Faturas    │          │
│  │  Atribuição  │    │  Versionados │    │  Monitorado  │    │  Pagamentos  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Fluxo 1: Captação de Lead → Oportunidade

### Diagrama de Sequência

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Cliente │     │   WhatsApp   │     │    n8n      │     │    API      │     │   Banco     │
└────┬────┘     └──────┬───────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                    │                   │                   │
     │ 1. Envia msg    │                    │                   │                   │
     │────────────────▶│                    │                   │                   │
     │                 │ 2. Webhook         │                   │                   │
     │                 │───────────────────▶│                   │                   │
     │                 │                    │ 3. Processa msg   │                   │
     │                 │                    │ (NLP/intent)      │                   │
     │                 │                    │                   │                   │
     │                 │                    │ 4. POST /leads    │                   │
     │                 │                    │──────────────────▶│                   │
     │                 │                    │                   │ 5. Valida dados   │
     │                 │                    │                   │ 6. Cria lead      │
     │                 │                    │                   │──────────────────▶│
     │                 │                    │                   │ 7. Confirma       │
     │                 │                    │                   │◀──────────────────│
     │                 │                    │ 8. Retorna lead   │                   │
     │                 │                    │◀──────────────────│                   │
     │                 │ 9. Envia confirmação│                  │                   │
     │                 │◀───────────────────│                   │                   │
     │ 10. Recebe confirmação               │                   │                   │
     │◀────────────────│                    │                   │                   │
     │                 │                    │                   │                   │
     │                 │                    │ 11. Trigger workflow                   │
     │                 │                    │ (notifica equipe) │                   │
     │                 │                    │                   │                   │
     │                 │                    │                   │ 12. Evento:       │
     │                 │                    │                   │ lead.created      │
     │                 │                    │                   │                   │
```

### Eventos Disparados

| Evento | Origem | Ação |
|--------|--------|------|
| `lead.created` | API | Notificar equipe comercial |
| `lead.assigned` | API | Notificar responsável |
| `lead.status_changed` | API | Atualizar métricas |
| `lead.converted` | API | Criar oportunidade |

### Webhooks n8n

```json
// POST /webhooks/n8n/lead-created
{
  "event": "lead.created",
  "timestamp": "2025-01-21T10:30:00Z",
  "data": {
    "leadId": "uuid",
    "clientId": "uuid",
    "source": "whatsapp",
    "sourceDetail": "evolution-api",
    "estimatedValue": 50000.00,
    "serviceType": "solar_residencial",
    "requiresImmediateContact": true
  }
}
```

## 4.3 Fluxo 2: Oportunidade → Proposta → Contrato

### Diagrama de Sequência

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Vendedor │     │     API     │     │    Banco    │     │  Template   │     │     S3      │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                  │                   │                   │                   │
     │ 1. Cria proposta │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 2. Valida itens   │                   │                   │
     │                  │ 3. Calcula total  │                   │                   │
     │                  │ 4. Gera número    │                   │                   │
     │                  │                   │                   │                   │
     │                  │ 5. INSERT proposal│                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 6. Confirma       │                   │
     │                  │◀──────────────────│                   │                   │
     │ 7. Retorna proposta                  │                   │                   │
     │◀─────────────────│                   │                   │                   │
     │                  │                   │                   │                   │
     │ 8. Solicita PDF  │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 9. Busca template │                   │                   │
     │                  │──────────────────────────────────────▶│                   │
     │                  │                   │                   │ 10. Retorna       │
     │                  │◀──────────────────────────────────────│                   │
     │                  │ 11. Gera PDF      │                   │                   │
     │                  │──────────────────────────────────────────────────────────▶│
     │                  │                   │                   │                   │ 12. Salva
     │                  │                   │                   │                   │ 13. Retorna URL
     │                  │◀──────────────────────────────────────────────────────────│
     │ 14. Retorna PDF  │                   │                   │                   │
     │◀─────────────────│                   │                   │                   │
     │                  │                   │                   │                   │
     │ 15. Envia email  │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 16. Queue: send-email                  │                   │
     │                  │                   │                   │                   │
     │                  │                   │                   │                   │
     │ 17. Cliente aceita                     │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 18. UPDATE status │                   │                   │
     │                  │                   │                   │                   │
     │                  │ 19. Cria contrato │                   │                   │
     │                  │ (baseado em template)                │                   │
     │                  │                   │                   │                   │
     │                  │ 20. INSERT contract                    │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 21. Trigger:      │                   │
     │                  │                   │ proposal.accepted │                   │
```

### Eventos Disparados

| Evento | Origem | Ação |
|--------|--------|------|
| `proposal.created` | API | Notificar cliente, atualizar pipeline |
| `proposal.sent` | API | Registrar envio, iniciar follow-up |
| `proposal.viewed` | API | Notificar vendedor |
| `proposal.accepted` | API | Criar contrato, notificar equipe |
| `proposal.rejected` | API | Registrar motivo, reabrir negociação |
| `contract.created` | API | Iniciar processo de assinatura |
| `contract.signed` | API | Criar obra, notificar operacional |

### Webhooks n8n

```json
// POST /webhooks/n8n/proposal-accepted
{
  "event": "proposal.accepted",
  "timestamp": "2025-01-21T14:30:00Z",
  "data": {
    "proposalId": "uuid",
    "opportunityId": "uuid",
    "clientId": "uuid",
    "totalValue": 75000.00,
    "acceptedBy": "nome_cliente",
    "acceptedAt": "2025-01-21T14:30:00Z",
    "contractId": "uuid",
    "nextActions": ["create_work", "notify_team"]
  }
}
```

## 4.4 Fluxo 3: Criação de Obra → Process Order → Execução

### Diagrama de Sequência

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Sistema  │     │     API     │     │    Banco    │     │   Workflow  │     │    n8n      │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                  │                   │                   │                   │
     │ 1. Contrato      │                   │                   │                   │
     │    assinado      │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 2. Cria work      │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 3. Confirma       │                   │
     │                  │◀──────────────────│                   │                   │
     │                  │                   │                   │                   │
     │                  │ 4. Busca workflow │                   │                   │
     │                  │    template       │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 5. Retorna        │                   │
     │                  │◀──────────────────│                   │                   │
     │                  │                   │                   │                   │
     │                  │ 6. Cria process   │                   │                   │
     │                  │    order + stages │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 7. INSERT         │                   │
     │                  │                   │    process_order  │                   │
     │                  │                   │    stage_instances│                   │
     │                  │                   │    checklist_inst │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 8. Confirma       │                   │
     │                  │◀──────────────────│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 9. Trigger evento │                   │
     │                  │                   │ work.created      │                   │
     │                  │                   │                   │                   │
     │                  │                   │                   │ 10. Notifica equipe
     │                  │                   │                   │──────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │                   │                   │
     │ 11. Técnico      │                   │                   │                   │
     │    completa      │                   │                   │                   │
     │    etapa         │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 12. Valida        │                   │                   │
     │                  │    checklists     │                   │                   │
     │                  │                   │                   │                   │
     │                  │ 13. UPDATE stage  │                   │                   │
     │                  │    status         │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 14. Verifica      │                   │
     │                  │                   │    próxima etapa  │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 15. Ativa próxima │                   │
     │                  │                   │    etapa          │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 16. Trigger:      │                   │
     │                  │                   │ stage.completed   │                   │
```

### Eventos Disparados

| Evento | Origem | Ação |
|--------|--------|------|
| `work.created` | API | Notificar equipe técnica |
| `process_order.started` | API | Iniciar acompanhamento |
| `stage.started` | API | Notificar responsável |
| `stage.completed` | API | Ativar próxima etapa |
| `checklist.completed` | API | Verificar conclusão da etapa |
| `process_order.completed` | API | Notificar comercial |

## 4.5 Fluxo 4: Protocolos com Concessionárias

### Diagrama de Sequência

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Operador │     │     API     │     │    Banco    │     │    SLA      │     │    n8n      │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                  │                   │                   │                   │
     │ 1. Registra      │                   │                   │                   │
     │    protocolo     │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 2. Valida dados   │                   │                   │
     │                  │ 3. Busca SLA      │                   │                   │
     │                  │    config         │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 4. Calcula        │                   │
     │                  │                   │    deadline       │                   │
     │                  │                   │                   │                   │
     │                  │ 5. INSERT protocol│                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │ 6. Agenda         │                   │
     │                  │                   │    verificações   │                   │
     │                  │                   │    SLA            │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 7. Confirma       │                   │
     │                  │◀──────────────────│                   │                   │
     │ 8. Retorna       │                   │                   │                   │
     │◀─────────────────│                   │                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │                   │                   │
     │ 9. Concessionária                      │                   │                   │
     │    responde      │                   │                   │                   │
     │─────────────────▶│                   │                   │                   │
     │                  │ 10. UPDATE        │                   │                   │
     │                  │    status         │                   │                   │
     │                  │    requirements   │                   │                   │
     │                  │──────────────────▶│                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 11. Verifica SLA  │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 12. Registra log  │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 13. Trigger:      │                   │
     │                  │                   │ protocol.updated  │                   │
     │                  │                   │                   │                   │
     │                  │                   │                   │ 14. Notifica      │
     │                  │                   │                   │    equipe         │
     │                  │                   │                   │──────────────────▶│
     │                  │                   │                   │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 15. Job diário    │                   │
     │                  │                   │    verifica SLA   │                   │
     │                  │                   │◀──────────────────────────────────────│
     │                  │                   │                   │                   │
     │                  │                   │ 16. Detecta       │                   │
     │                  │                   │    violação       │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 17. INSERT        │                   │
     │                  │                   │    sla_violation  │                   │
     │                  │                   │                   │                   │
     │                  │                   │ 18. Trigger:      │                   │
     │                  │                   │ sla.violated      │                   │
     │                  │                   │                   │ 19. Alerta        │
     │                  │                   │                   │    gerência       │
     │                  │                   │                   │──────────────────▶│
```

### Eventos Disparados

| Evento | Origem | Ação |
|--------|--------|------|
| `protocol.created` | API | Iniciar monitoramento SLA |
| `protocol.status_changed` | API | Atualizar dashboard |
| `protocol.returned` | API | Notificar operador |
| `protocol.completed` | API | Atualizar obra |
| `sla.warning` | Job | Alertar sobre prazo próximo |
| `sla.violated` | Job | Escalar para gerência |

### Webhooks n8n - SLA

```json
// POST /webhooks/n8n/sla-warning
{
  "event": "sla.warning",
  "timestamp": "2025-01-21T10:00:00Z",
  "data": {
    "protocolId": "uuid",
    "protocolNumber": "NEO-2025-001234",
    "concessionaria": "neoenergia",
    "protocolType": "comissionamento",
    "slaDeadline": "2025-01-25",
    "daysRemaining": 2,
    "workId": "uuid",
    "clientName": "João Silva",
    "assignedUsers": ["uuid1", "uuid2"]
  }
}

// POST /webhooks/n8n/sla-violated
{
  "event": "sla.violated",
  "timestamp": "2025-01-26T00:00:00Z",
  "data": {
    "protocolId": "uuid",
    "protocolNumber": "NEO-2025-001234",
    "concessionaria": "neoenergia",
    "slaDeadline": "2025-01-25",
    "daysOverdue": 1,
    "escalationLevel": 1,
    "workId": "uuid",
    "clientName": "João Silva",
    "escalateTo": ["manager_uuid"]
  }
}
```

## 4.6 Fluxo 5: Upgrade/Cross-sell Automático

### Diagrama de Sequência

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Job      │     │     API     │     │    Banco    │     │   Package   │     │    n8n      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │                   │
       │ 1. Executa diário │                   │                   │                   │
       │──────────────────▶│                   │                   │                   │
       │                   │ 2. Busca obras    │                   │                   │
       │                   │    completadas    │                   │                   │
       │                   │──────────────────▶│                   │                   │
       │                   │                   │ 3. Retorna lista  │                   │
       │                   │◀──────────────────│                   │                   │
       │                   │                   │                   │                   │
       │                   │ 4. Para cada obra │                   │                   │
       │                   │    busca rules    │                   │                   │
       │                   │──────────────────────────────────────▶│                   │
       │                   │                   │                   │ 5. Retorna        │
       │                   │                   │                   │    packages       │
       │                   │◀──────────────────────────────────────│                   │
       │                   │                   │                   │                   │
       │                   │ 6. Aplica regras  │                   │                   │
       │                   │    de negócio     │                   │                   │
       │                   │                   │                   │                   │
       │                   │ 7. Gera           │                   │                   │
       │                   │    oportunidades  │                   │                   │
       │                   │    de upgrade     │                   │                   │
       │                   │──────────────────▶│                   │                   │
       │                   │                   │ 8. INSERT         │                   │
       │                   │                   │    opportunities  │                   │
       │                   │                   │                   │                   │
       │                   │                   │ 9. Confirma       │                   │
       │                   │◀──────────────────│                   │                   │
       │                   │                   │                   │                   │
       │                   │                   │ 10. Trigger:      │                   │
       │                   │                   │ opportunity.auto  │                   │
       │                   │                   │    _created       │                   │
       │                   │                   │                   │ 11. Notifica      │
       │                   │                   │                   │    comercial      │
       │                   │                   │                   │──────────────────▶│
       │                   │                   │                   │                   │
```

### Regras de Package

```typescript
interface PackageRule {
  id: string;
  packageId: string;
  conditionType: 'after_service' | 'client_type' | 'location' | 'season';
  conditionValue: any;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  validForDays: number;
  autoCreateOpportunity: boolean;
  notificationTemplate: string;
}

// Exemplo de regras
const exampleRules = [
  {
    // Após instalação solar, oferecer manutenção
    conditionType: 'after_service',
    conditionValue: { serviceType: 'solar', daysAfter: 30 },
    discountType: 'percentage',
    discountValue: 15,
    autoCreateOpportunity: true
  },
  {
    // Cliente PJ, oferecer PDE
    conditionType: 'client_type',
    conditionValue: { type: 'company', hasService: 'solar' },
    discountType: 'fixed_amount',
    discountValue: 500,
    autoCreateOpportunity: true
  },
  {
    // Período de alta demanda
    conditionType: 'season',
    conditionValue: { months: [11, 12, 0, 1], serviceType: 'solar' },
    discountType: 'percentage',
    discountValue: 10,
    autoCreateOpportunity: false // apenas notificar
  }
];
```

## 4.7 Fluxo 6: Notificações Multi-canal

### Diagrama

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SISTEMA DE NOTIFICAÇÕES                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   Evento do     │
                              │   Sistema       │
                              │ (Domain Event)  │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Notification   │
                              │    Service      │
                              │                 │
                              │ 1. Determina    │
                              │    canais       │
                              │ 2. Aplica       │
                              │    preferências │
                              │ 3. Cria registro│
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
           │  In-App     │    │    Email    │    │  WhatsApp   │
           │  (Realtime) │    │  (Queue)    │    │  (Queue)    │
           ├─────────────┤    ├─────────────┤    ├─────────────┤
           │ WebSocket   │    │  SendGrid   │    │  Evolution  │
           │   emit      │    │    API      │    │    API      │
           │             │    │             │    │             │
           │ Socket.io   │    │  BullMQ     │    │   BullMQ    │
           │             │    │  consumer   │    │  consumer   │
           └─────────────┘    └─────────────┘    └─────────────┘
```

### Estrutura de Notificação

```typescript
interface NotificationEvent {
  type: 'lead.assigned' | 'proposal.sent' | 'task.due' | 'protocol.sla' | 'work.completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipients: {
    users?: string[];
    roles?: string[];
    channels: ('in_app' | 'email' | 'whatsapp' | 'push')[];
  };
  data: {
    title: string;
    content: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  };
}

// Exemplo: Notificação de tarefa atrasada
const taskOverdueNotification: NotificationEvent = {
  type: 'task.due',
  priority: 'high',
  recipients: {
    users: ['assignee_id'],
    roles: ['manager'],
    channels: ['in_app', 'email', 'whatsapp']
  },
  data: {
    title: 'Tarefa Atrasada',
    content: 'A tarefa "{taskTitle}" está atrasada há {daysOverdue} dias.',
    actionUrl: '/tasks/{taskId}',
    metadata: {
      taskId: 'uuid',
      taskTitle: 'Aprovar projeto',
      daysOverdue: 2,
      workId: 'uuid'
    }
  }
};
```

## 4.8 Integração n8n - Workflows Recomendados

### Workflow 1: Captação WhatsApp

```json
{
  "name": "Captação de Lead via WhatsApp",
  "trigger": {
    "type": "webhook",
    "path": "/whatsapp/incoming"
  },
  "nodes": [
    {
      "name": "Receber Mensagem",
      "type": "webhook",
      "parameters": {
        "httpMethod": "POST"
      }
    },
    {
      "name": "Extrair Dados",
      "type": "function",
      "code": "// Extrair telefone, nome, mensagem\nconst msg = $input.body;\nreturn {\n  phone: msg.sender,\n  name: msg.pushName,\n  message: msg.message.conversation,\n  timestamp: msg.messageTimestamp\n};"
    },
    {
      "name": "NLP - Classificar Intenção",
      "type": "openai",
      "parameters": {
        "model": "gpt-4",
        "prompt": "Classifique a intenção desta mensagem: {{$json.message}}\nOpções: orcamento_solar, orcamento_eletrica, duvida, outro"
      }
    },
    {
      "name": "Criar Lead na API",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.API_URL}}/leads",
        "body": {
          "source": "whatsapp",
          "sourceDetail": "{{$json.phone}}",
          "description": "{{$json.message}}",
          "serviceType": "{{$json.intention}}"
        }
      }
    },
    {
      "name": "Responder Cliente",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.EVOLUTION_API}}/message/sendText/{{$env.INSTANCE}}",
        "body": {
          "number": "{{$json.phone}}",
          "text": "Obrigado pelo contato! Seu orçamento foi registrado. Nossa equipe entrará em contato em breve."
        }
      }
    },
    {
      "name": "Notificar Equipe",
      "type": "slack",
      "parameters": {
        "channel": "#comercial",
        "text": "🆕 Novo lead via WhatsApp: {{$json.name}} - {{$json.intention}}"
      }
    }
  ]
}
```

### Workflow 2: Monitoramento SLA

```json
{
  "name": "Alerta de SLA de Protocolo",
  "trigger": {
    "type": "webhook",
    "path": "/sla/warning"
  },
  "nodes": [
    {
      "name": "Receber Alerta",
      "type": "webhook"
    },
    {
      "name": "Buscar Responsáveis",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "{{$env.API_URL}}/works/{{$json.workId}}/responsibles"
      }
    },
    {
      "name": "Enviar Email",
      "type": "sendgrid",
      "parameters": {
        "to": "{{$json.responsibles.map(r => r.email)}}",
        "templateId": "d-sla-warning",
        "dynamicTemplateData": {
          "protocolNumber": "{{$json.protocolNumber}}",
          "concessionaria": "{{$json.concessionaria}}",
          "daysRemaining": "{{$json.daysRemaining}}",
          "clientName": "{{$json.clientName}}"
        }
      }
    },
    {
      "name": "Criar Tarefa Urgente",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.API_URL}}/tasks",
        "body": {
          "title": "Acompanhar protocolo {{$json.protocolNumber}}",
          "priority": "urgent",
          "dueDate": "{{$json.slaDeadline}}",
          "workId": "{{$json.workId}}"
        }
      }
    }
  ]
}
```

### Workflow 3: Follow-up Proposta

```json
{
  "name": "Follow-up de Proposta",
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * *"
  },
  "nodes": [
    {
      "name": "Buscar Propostas Pendentes",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "{{$env.API_URL}}/proposals?status=sent&daysSinceSent=3"
      }
    },
    {
      "name": "Para Cada Proposta",
      "type": "splitInBatches",
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Verificar Visualização",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "{{$env.API_URL}}/proposals/{{$json.id}}/tracking"
      }
    },
    {
      "name": "Decidir Ação",
      "type": "if",
      "parameters": {
        "conditions": [
          {
            "value": "{{$json.viewedAt}}",
            "operation": "isEmpty"
          }
        ]
      }
    },
    {
      "name": "Enviar Lembrete (Não Visualizado)",
      "type": "sendgrid",
      "parameters": {
        "templateId": "d-proposal-reminder"
      }
    },
    {
      "name": "Enviar Oferta (Visualizado)",
      "type": "sendgrid",
      "parameters": {
        "templateId": "d-proposal-followup"
      }
    }
  ]
}
```

---

# 5. PLANO DE IMPLANTAÇÃO E SEGURANÇA

## 5.1 Estratégia de Deploy

### Pipeline CI/CD

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PIPELINE CI/CD                                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │───▶│   Lint   │───▶│   Test   │───▶│  Build   │───▶│  Deploy  │───▶│  Verify  │
│  main    │    │          │    │          │    │  Docker  │    │   Stg    │    │   E2E    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                      │
                                                                      │ Aprovado
                                                                      ▼
                                                               ┌──────────┐
                                                               │  Deploy  │
                                                               │   Prod   │
                                                               │  (Blue-  │
                                                               │  Green)  │
                                                               └──────────┘
```

### Estratégia Blue-Green (MVP)

```yaml
# docker-compose.prod.yml (simplificado)
version: '3.8'

services:
  # Blue environment (current)
  api-blue:
    image: erp-engenharia:${VERSION}
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Green environment (new)
  api-green:
    image: erp-engenharia:${NEW_VERSION}
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Load balancer / Reverse proxy
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api-blue
      - api-green
    networks:
      - app-network

  # Database
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=erp_engenharia
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    networks:
      - app-network

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Script de Deploy Blue-Green

```bash
#!/bin/bash
# deploy.sh

set -e

VERSION=$1
ENVIRONMENT=${2:-production}
CURRENT_COLOR=$(cat /var/run/current_color 2>/dev/null || echo "blue")
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "Deploying version $VERSION to $NEW_COLOR environment..."

# 1. Pull new image
docker pull erp-engenharia:$VERSION

# 2. Update green/blue with new version
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d --no-deps api-$NEW_COLOR

# 3. Run migrations
docker-compose -f docker-compose.$ENVIRONMENT.yml run --rm api-$NEW_COLOR npm run migration:run

# 4. Health check
sleep 10
if ! curl -f http://localhost:$([ "$NEW_COLOR" = "blue" ] && echo "3000" || echo "3001")/health; then
    echo "Health check failed! Rolling back..."
    docker-compose -f docker-compose.$ENVIRONMENT.yml stop api-$NEW_COLOR
    exit 1
fi

# 5. Switch traffic
echo "$NEW_COLOR" > /var/run/current_color
docker-compose -f docker-compose.$ENVIRONMENT.yml exec nginx nginx -s reload

# 6. Keep old version for 5 minutes (quick rollback)
echo "Deployment complete. Old version will be stopped in 5 minutes..."
(sleep 300 && docker-compose -f docker-compose.$ENVIRONMENT.yml stop api-$CURRENT_COLOR) &

echo "Deployed $VERSION to $NEW_COLOR successfully!"
```

### Estratégia Kubernetes (V2)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: erp-api
  template:
    metadata:
      labels:
        app: erp-api
        version: "${VERSION}"
    spec:
      containers:
        - name: api
          image: erp-engenharia:${VERSION}
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
      terminationGracePeriodSeconds: 60

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: erp-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: erp-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

## 5.2 Backup e Disaster Recovery

### Estratégia de Backup

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ESTRATÉGIA DE BACKUP                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │      S3         │     │    Snapshot     │     │    Cross-       │
│                 │     │                 │     │     EBS         │     │    Region       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│                 │     │                 │     │                 │     │                 │
│ Full: Diário    │────▶│ backups/        │     │ Diário          │────▶│ Replicação      │
│ 02:00 UTC       │     │ full/           │     │ Retenção: 7d    │     │ automática      │
│ Retenção: 30d   │     │ YYYY/MM/DD/     │     │                 │     │                 │
│                 │     │                 │     │                 │     │                 │
│ Incremental:    │────▶│ backups/        │     │                 │     │                 │
│ A cada 6h       │     │ incremental/    │     │                 │     │                 │
│ Retenção: 7d    │     │                 │     │                 │     │                 │
│                 │     │                 │     │                 │     │                 │
│ WAL: Contínuo   │────▶│ wal/            │     │                 │     │                 │
│ Streaming       │     │                 │     │                 │     │                 │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Redis       │     │      S3         │
├─────────────────┤     ├─────────────────┤
│                 │     │                 │
│ RDB: A cada 1h  │────▶│ redis/          │
│ AOF: Contínuo   │     │                 │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

### Script de Backup

```bash
#!/bin/bash
# backup.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="s3://erp-engenharia-backups"
DB_NAME="erp_engenharia"
RETENTION_DAYS=30

# 1. PostgreSQL Full Backup
echo "Starting PostgreSQL backup..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --format=custom \
    --file=/tmp/backup_$DATE.dump

# 2. Compress and upload
gzip /tmp/backup_$DATE.dump
aws s3 cp /tmp/backup_$DATE.dump.gz $BACKUP_BUCKET/full/$DATE/

# 3. Clean old backups
echo "Cleaning old backups..."
aws s3 ls $BACKUP_BUCKET/full/ | awk '{print $2}' | while read folder; do
    folder_date=$(echo $folder | tr -d '/')
    if [[ $(date -d "$folder_date" +%s) -lt $(date -d "-$RETENTION_DAYS days" +%s) ]]; then
        aws s3 rm --recursive $BACKUP_BUCKET/full/$folder
    fi
done

# 4. Backup Redis
echo "Starting Redis backup..."
redis-cli BGSAVE
sleep 5
cp /var/lib/redis/dump.rdb /tmp/redis_$DATE.rdb
aws s3 cp /tmp/redis_$DATE.rdb $BACKUP_BUCKET/redis/

# 5. Clean up local files
rm -f /tmp/backup_$DATE.dump.gz /tmp/redis_$DATE.rdb

echo "Backup completed successfully!"
```

### Plano de Disaster Recovery

| Cenário | RTO | RPO | Ação |
|---------|-----|-----|------|
| Perda de instância | 5 min | 0 | Auto-scaling recria pod |
| Perda de AZ | 10 min | 0 | Failover para outra AZ |
| Perda de região | 1 hora | 15 min | Ativar DR em outra região |
| Corrupção de dados | 30 min | 6h | Restore do último backup |
| Ransomware | 1 hora | 6h | Restore + verificação |

```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Restore PostgreSQL from backup
aws s3 cp s3://erp-engenharia-backups/full/$BACKUP_DATE/backup_$BACKUP_DATE.dump.gz /tmp/
gunzip /tmp/backup_$BACKUP_DATE.dump.gz

# 2. Drop and recreate database
dropdb -h $DR_DB_HOST -U $DR_DB_USER $DR_DB_NAME
createdb -h $DR_DB_HOST -U $DR_DB_USER $DR_DB_NAME

# 3. Restore data
pg_restore -h $DR_DB_HOST -U $DR_DB_USER -d $DR_DB_NAME /tmp/backup_$BACKUP_DATE.dump

# 4. Apply WAL logs for point-in-time recovery (if needed)
# pg_waldump + replay

# 5. Verify data integrity
psql -h $DR_DB_HOST -U $DR_DB_USER -d $DR_DB_NAME -c "SELECT COUNT(*) FROM users;"

# 6. Update DNS / Load Balancer to point to DR
# Route53 failover or ALB target group update

echo "Disaster recovery completed!"
```

## 5.3 Segurança

### OWASP Top 10 - Mitigações

| Risco | Mitigação | Implementação |
|-------|-----------|---------------|
| **A01: Broken Access Control** | RBAC + JWT + Guards | `@Roles()`, `@Permissions()` decorators |
| **A02: Cryptographic Failures** | bcrypt (senhas), AES-256 (docs) | `bcrypt.hash(12)`, AWS KMS |
| **A03: Injection** | Parameterized queries | TypeORM query builder |
| **A04: Insecure Design** | Rate limiting, input validation | `class-validator`, `express-rate-limit` |
| **A05: Security Misconfiguration** | Hardened containers, secrets mgmt | Docker best practices, AWS Secrets Manager |
| **A06: Vulnerable Components** | Dependency scanning | Snyk, Dependabot |
| **A07: Auth Failures** | JWT + refresh tokens, MFA | `passport-jwt`, TOTP |
| **A08: Data Integrity** | HTTPS, signed URLs | TLS 1.3, AWS CloudFront signed URLs |
| **A09: Logging Failures** | Audit logs, SIEM | Winston, CloudWatch Logs |
| **A10: SSRF** | URL validation, egress filtering | `new URL()`, security groups |

### Configuração de Segurança NestJS

```typescript
// security.config.ts
import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

export function configureSecurity(app: INestApplication): void {
  // Helmet - Headers de segurança
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Rate Limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente mais tarde.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Rate limit específico para auth
  app.use('/api/v1/auth/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentativas de login
    skipSuccessfulRequests: true,
  }));

  // Compressão
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
}
```

### Guards de Autorização

```typescript
// guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.every((permission) => 
      user.permissions?.includes(permission)
    );
  }
}

// decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// decorators/permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
```

### Uso nos Controllers

```typescript
@Controller('api/v1/works')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WorksController {
  
  @Get()
  @Roles('admin', 'manager', 'technical')
  @Permissions('works:read')
  async findAll(@Query() query: ListWorksDto) {
    return this.worksService.findAll(query);
  }

  @Post()
  @Roles('admin', 'manager')
  @Permissions('works:create')
  async create(@Body() createWorkDto: CreateWorkDto, @CurrentUser() user: User) {
    return this.worksService.create(createWorkDto, user);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('works:delete')
  async remove(@Param('id') id: string) {
    return this.worksService.remove(id);
  }
}
```

### Validação de Input

```typescript
// dto/create-client.dto.ts
import { IsString, IsEmail, IsOptional, IsEnum, Length, Matches } from 'class-validator';

export class CreateClientDto {
  @IsEnum(['individual', 'company'])
  type: 'individual' | 'company';

  @IsString()
  @Length(2, 200)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'Documento deve ser CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)'
  })
  document?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (00) 00000-0000'
  })
  phone?: string;
}
```

### Sanitização

```typescript
// interceptors/sanitize.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }
    
    return next.handle();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
}
```

## 5.4 Compliance LGPD

### Checklist LGPD

| Requisito | Implementação | Status |
|-----------|---------------|--------|
| Consentimento explícito | Checkbox no cadastro + registro timestamp | ✅ |
| Finalidade clara | Termos de uso e política de privacidade | ✅ |
| Minimização de dados | Coletar apenas dados necessários | ✅ |
| Retenção limitada | Política de retenção + exclusão automática | ✅ |
| Direito de acesso | Endpoint `/api/v1/me/data` | ✅ |
| Direito de retificação | Endpoints de atualização de perfil | ✅ |
| Direito de exclusão | Endpoint `/api/v1/me/delete` + anonimização | ✅ |
| Direito de portabilidade | Exportação de dados em JSON/CSV | ✅ |
| Registro de operações | Audit logs completos | ✅ |
| Segurança dos dados | Criptografia em trânsito e repouso | ✅ |
| Notificação de breaches | Procedimento + notificação em 72h | ✅ |
| DPO | Designação + contato | ✅ |

### Implementação LGPD

```typescript
// lgpd/lgpd.controller.ts
@Controller('api/v1/me')
@UseGuards(JwtAuthGuard)
export class LgpdController {
  constructor(private lgpdService: LgpdService) {}

  // Direito de acesso (Art. 18, I)
  @Get('data')
  async getAllData(@CurrentUser() user: User) {
    return this.lgpdService.exportUserData(user.id);
  }

  // Direito de retificação (Art. 18, II)
  @Put('data')
  async updateData(
    @CurrentUser() user: User,
    @Body() updateDataDto: UpdateDataDto
  ) {
    return this.lgpdService.updateUserData(user.id, updateDataDto);
  }

  // Direito de exclusão (Art. 18, VI)
  @Delete('data')
  async deleteData(
    @CurrentUser() user: User,
    @Body() deleteDataDto: DeleteDataDto
  ) {
    return this.lgpdService.deleteUserData(user.id, deleteDataDto.reason);
  }

  // Direito de portabilidade (Art. 18, V)
  @Get('data/export')
  async exportData(
    @CurrentUser() user: User,
    @Query('format') format: 'json' | 'csv' = 'json'
  ) {
    return this.lgpdService.exportData(user.id, format);
  }

  // Consentimentos
  @Get('consents')
  async getConsents(@CurrentUser() user: User) {
    return this.lgpdService.getUserConsents(user.id);
  }

  @Post('consents')
  async updateConsent(
    @CurrentUser() user: User,
    @Body() consentDto: ConsentDto
  ) {
    return this.lgpdService.updateConsent(user.id, consentDto);
  }
}
```

### Anonimização de Dados

```typescript
// lgpd/anonymization.service.ts
@Injectable()
export class AnonymizationService {
  async anonymizeUser(userId: string): Promise<void> {
    const anonymizedEmail = `anonymized_${uuid()}@deleted.local`;
    const anonymizedName = 'Usuário Excluído';
    const anonymizedPhone = '00000000000';
    const anonymizedDocument = '00000000000';

    await this.dataSource.transaction(async (manager) => {
      // Anonimizar usuário
      await manager.update(User, userId, {
        email: anonymizedEmail,
        firstName: anonymizedName,
        lastName: '',
        phone: anonymizedPhone,
        document: anonymizedDocument,
        isActive: false,
        anonymizedAt: new Date(),
      });

      // Anonimizar leads do usuário
      await manager.update(Lead, { assignedTo: userId }, {
        assignedTo: null,
      });

      // Anonimizar comentários (manter conteúdo, remover autor)
      await manager.update(Comment, { createdBy: userId }, {
        createdBy: null,
        authorName: 'Usuário Anônimo',
      });

      // Excluir dados sensíveis
      await manager.delete(Notification, { userId });
      await manager.delete(UserSession, { userId });

      // Registrar anonimização
      await manager.insert(AuditLog, {
        action: 'USER_ANONYMIZED',
        entityType: 'User',
        entityId: userId,
        metadata: { anonymizedAt: new Date() },
      });
    });
  }
}
```

### Política de Retenção

```typescript
// jobs/data-retention.job.ts
@Injectable()
export class DataRetentionJob {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  @Cron('0 2 * * *') // Diário às 2h
  async execute(): Promise<void> {
    const retentionConfig = {
      auditLogs: { years: 5 },
      deletedUsers: { days: 90 },
      oldNotifications: { days: 365 },
      oldActivityLogs: { years: 2 },
      draftProposals: { days: 180 },
      canceledWorks: { years: 3 },
    };

    // Excluir logs antigos
    await this.dataSource.query(`
      DELETE FROM audit_logs 
      WHERE created_at < NOW() - INTERVAL '${retentionConfig.auditLogs.years} years'
    `);

    // Excluir notificações antigas
    await this.dataSource.query(`
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '${retentionConfig.oldNotifications.days} days'
      AND is_read = true
    `);

    // Excluir usuários anonimizados após período
    await this.dataSource.query(`
      DELETE FROM users 
      WHERE anonymized_at < NOW() - INTERVAL '${retentionConfig.deletedUsers.days} days'
    `);

    // Arquivar propostas em rascunho antigas
    await this.dataSource.query(`
      UPDATE proposals 
      SET status = 'archived', archived_at = NOW()
      WHERE status = 'draft' 
      AND created_at < NOW() - INTERVAL '${retentionConfig.draftProposals.days} days'
    `);
  }
}
```

## 5.5 Monitoramento e Observabilidade

### Métricas Principais

```typescript
// monitoring/metrics.service.ts
@Injectable()
export class MetricsService {
  constructor(@InjectMetric('http_requests_total') private counter: Counter<string>) {}

  recordRequest(method: string, route: string, status: number, duration: number): void {
    this.counter.inc({
      method,
      route,
      status_code: status.toString(),
    });
  }
}

// interceptors/metrics.interceptor.ts
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const response = context.switchToHttp().getResponse();
        
        this.metricsService.recordRequest(
          request.method,
          request.route?.path || request.url,
          response.statusCode,
          duration
        );
      }),
    );
  }
}
```

### Health Checks

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private storage: StorageHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      () => this.storage.check('s3'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness() {
    return { status: 'ok' };
  }
}
```

### Alertas

```yaml
# prometheus/alerts.yml
groups:
  - name: erp-engenharia
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro alta"
          description: "Taxa de erro acima de 10% nos últimos 5 minutos"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tempo de resposta alto"
          description: "P95 acima de 2 segundos"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Conexões de banco altas"
          description: "Mais de 80 conexões ativas"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Espaço em disco baixo"
          description: "Menos de 10% de espaço disponível"
```

---

## 5.6 Roadmap de Implementação

### Fase 1: MVP (Mês 1-3)

| Semana | Módulo | Funcionalidades |
|--------|--------|-----------------|
| 1-2 | Foundation | Setup, Auth, RBAC, Multi-tenant |
| 3-4 | Cadastros | Clientes, Endereços, Contatos |
| 5-6 | Comercial | Leads, Oportunidades, Pipeline |
| 7-8 | Propostas | Templates, PDF, Envio |
| 9-10 | Obras | Works, Process Orders básico |
| 11-12 | Documentos | Upload, Pastas, Versionamento |

### Fase 2: Core (Mês 4-6)

| Semana | Módulo | Funcionalidades |
|--------|--------|-----------------|
| 13-14 | Workflow | Templates, Stages, Checklists |
| 15-16 | Protocolos | Concessionárias, SLA |
| 17-18 | Financeiro | Medições, Faturas, Pagamentos |
| 19-20 | Tarefas | Atribuição, Notificações |
| 21-22 | Integrações | WhatsApp, n8n básico |
| 23-24 | Dashboards | Relatórios iniciais |

### Fase 3: Scale (Mês 7-9)

| Semana | Módulo | Funcionalidades |
|--------|--------|-----------------|
| 25-26 | Performance | Cache, Otimização |
| 27-28 | Analytics | Eventos, Métricas |
| 29-30 | Mobile | PWA, App nativo |
| 31-32 | API | Webhooks, SDK |
| 33-34 | Automação | Workflows avançados |
| 35-36 | Segurança | Pen-test, Compliance |

---

## 5.7 Checklist de Lançamento

### Pre-launch

- [ ] Testes unitários > 80% coverage
- [ ] Testes de integração passando
- [ ] Testes E2E críticos passando
- [ ] Penetration test realizado
- [ ] Performance test (load 1000 req/s)
- [ ] Documentação API completa (Swagger)
- [ ] Backup configurado e testado
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Runbook de incidentes
- [ ] LGPD compliance verificado
- [ ] Termos de uso e privacidade

### Launch

- [ ] DNS configurado
- [ ] SSL/TLS configurado
- [ ] CDN configurado
- [ ] Rate limiting ativo
- [ ] WAF configurado
- [ ] DDoS protection ativo
- [ ] Logs centralizados
- [ ] On-call escalado

### Post-launch

- [ ] Métricas de negócio definidas
- [ ] Feedback dos primeiros usuários
- [ ] Bugs críticos resolvidos
- [ ] Performance baseline estabelecida
- [ ] Plano de melhorias contínuas

---

# ANEXOS

## A. Estrutura de Permissões

```
users:*
  users:create
  users:read
  users:update
  users:delete
  users:manage-roles

roles:*
  roles:create
  roles:read
  roles:update
  roles:delete
  roles:manage-permissions

clients:*
  clients:create
  clients:read
  clients:update
  clients:delete
  clients:merge
  clients:export

leads:*
  leads:create
  leads:read
  leads:update
  leads:delete
  leads:convert
  leads:import
  leads:export

opportunities:*
  opportunities:create
  opportunities:read
  opportunities:update
  opportunities:delete
  opportunities:close
  opportunities:admin

proposals:*
  proposals:create
  proposals:read
  proposals:update
  proposals:delete
  proposals:send
  proposals:close

contracts:*
  contracts:create
  contracts:read
  contracts:update
  contracts:delete
  contracts:sign

works:*
  works:create
  works:read
  works:update
  works:delete
  works:manage

protocols:*
  protocols:create
  protocols:read
  protocols:update
  protocols:delete
  protocols:admin

documents:*
  documents:create
  documents:read
  documents:update
  documents:delete
  documents:share

financial:*
  measurements:*
  invoices:*
  payments:*
  cost-centers:*

admin:*
  admin:settings
  admin:users
  admin:logs
  admin:integrations
```

## B. Variáveis de Ambiente

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=secret

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=erp-engenharia-docs

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=xxx
EMAIL_FROM=noreply@erp-engenharia.com

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://evo.example.com
EVOLUTION_API_KEY=xxx
EVOLUTION_INSTANCE=erp-engenharia

# n8n
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
N8N_API_KEY=xxx

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
FEATURE_WHATSAPP=true
FEATURE_N8N=true
FEATURE_FINANCIAL=true
```

## C. Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev
npm run test
npm run test:e2e
npm run migration:generate -- -n MigrationName
npm run migration:run

# Docker
docker-compose up -d
docker-compose logs -f api
docker-compose exec postgres psql -U postgres -d erp_engenharia

# Deploy
./scripts/deploy.sh v1.0.0 production
./scripts/backup.sh
./scripts/disaster-recovery.sh 20250121_020000

# Manutenção
npm run db:seed
npm run db:reset
npm run cache:clear
```

---

**Documento Técnico - ERP Engenharia Elétrica**  
**Versão 1.0**  
**Última atualização: 21/01/2025**
