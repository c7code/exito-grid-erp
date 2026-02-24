# ElectraFlow - ERP/CRM para Engenharia Elétrica

Sistema completo de gestão empresarial para empresas de engenharia elétrica no Brasil. Captação de leads, gestão de pipeline, controle de processos, protocolos com concessionárias e muito mais.

## 🚀 Funcionalidades

### Módulos Principais

- **👥 CRM Completo**: Gestão de leads, clientes e oportunidades
- **📋 Pipeline Kanban**: Visualização e controle do funil de vendas
- **🔧 Gestão de Obras**: Controle completo de projetos e execução
- **📊 Processos com Checklists**: Fluxos padronizados com etapas e tarefas
- **📄 Propostas Comerciais**: Geração e acompanhamento de propostas
- **🏛️ Protocolos**: Gestão de protocolos com concessionárias (Neoenergia, etc.)
- **📑 Documentos**: Repositório centralizado de documentos
- **💰 Financeiro**: Controle de pagamentos e recebíveis
- **🤖 Motor de Regras**: Cross-sell e up-sell automatizado
- **📈 Dashboard**: KPIs e indicadores em tempo real

### Recursos Específicos para Engenharia Elétrica

- Fluxos específicos para PDE (Projeto de Entrada de Energia)
- Gestão de laudos SPDA
- Controle de doação de rede
- Integração com concessionárias
- SLAs de protocolos
- Cálculos técnicos integrados

## 🏗️ Arquitetura

```
ElectraFlow/
├── electraflow-api/          # Backend NestJS
│   ├── src/
│   │   ├── auth/             # Autenticação JWT
│   │   ├── users/            # Gestão de usuários
│   │   ├── clients/          # Clientes
│   │   ├── leads/            # Leads
│   │   ├── opportunities/    # Oportunidades/Pipeline
│   │   ├── works/            # Obras/Projetos
│   │   ├── processes/        # Processos e checklists
│   │   ├── tasks/            # Tarefas
│   │   ├── proposals/        # Propostas
│   │   ├── protocols/        # Protocolos
│   │   ├── documents/        # Documentos
│   │   ├── packages/         # Pacotes de serviço
│   │   ├── rules/            # Motor de regras
│   │   ├── finance/          # Financeiro
│   │   └── dashboard/        # Dashboard/KPIs
│   └── Dockerfile
├── app/                       # Frontend Next.js + React
│   ├── src/
│   │   ├── pages/            # Páginas
│   │   ├── components/       # Componentes
│   │   ├── services/         # API services
│   │   └── contexts/         # Contextos React
│   └── Dockerfile
└── docker-compose.yml         # Orquestração Docker
```

## 🛠️ Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Swagger** - Documentação API
- **Class Validator** - Validação de dados

### Frontend
- **Next.js** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado
- **Axios** - Cliente HTTP

## 📦 Instalação

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- PostgreSQL 15+ (para desenvolvimento local)

### Opção 1: Docker (Recomendado)

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/electraflow.git
cd electraflow
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Acesse a aplicação:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Documentação API: http://localhost:3000/api/docs

5. Execute o seed para dados iniciais:
```bash
docker-compose exec api npm run seed
```

### Opção 2: Desenvolvimento Local

#### Backend

1. Entre na pasta do backend:
```bash
cd electraflow-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados PostgreSQL

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env
```

5. Execute as migrações:
```bash
npm run migration:run
```

6. Inicie o servidor:
```bash
npm run start:dev
```

7. (Opcional) Execute o seed:
```bash
npm run seed
```

#### Frontend

1. Entre na pasta do frontend:
```bash
cd app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🔐 Credenciais Padrão (Seed)

Após executar o seed, use estas credenciais:

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | admin@electraflow.com.br | admin123 |
| Comercial | comercial@electraflow.com.br | comercial123 |
| Técnico | tecnico@electraflow.com.br | tecnico123 |

## 📚 Documentação da API

A documentação completa da API está disponível em:
```
http://localhost:3000/api/docs
```

### Endpoints Principais

#### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /auth/profile` - Perfil do usuário

#### Clientes
- `GET /clients` - Listar clientes
- `POST /clients` - Criar cliente
- `GET /clients/:id` - Detalhes do cliente
- `PUT /clients/:id` - Atualizar cliente

#### Oportunidades (Pipeline)
- `GET /opportunities` - Listar oportunidades
- `POST /opportunities` - Criar oportunidade
- `PATCH /opportunities/:id/stage` - Mover de estágio

#### Obras
- `GET /works` - Listar obras
- `POST /works` - Criar obra
- `GET /works/:id` - Detalhes da obra

#### Processos
- `GET /processes` - Listar processos
- `POST /processes` - Criar processo
- `PATCH /processes/:id/stage` - Avançar etapa

#### Protocolos
- `GET /protocols` - Listar protocolos
- `POST /protocols` - Criar protocolo
- `GET /protocols/sla-alerts` - Alertas de SLA

#### Dashboard
- `GET /dashboard` - Dashboard completo
- `GET /dashboard/kpis` - KPIs
- `GET /dashboard/pipeline` - Resumo do pipeline

## 🎯 Motor de Regras (Cross-sell)

O sistema inclui um motor de regras configurável para sugerir serviços adicionais:

### Regras Padrão

1. **Sugestão de SPDA**: Clientes industriais com projeto elétrico
2. **Energia Solar**: Clientes comerciais/industriais com alto valor
3. **Pacote Premium**: Clientes classe A com histórico
4. **Manutenção**: Projetos concluídos há mais de 1 ano

### Criar Nova Regra

```typescript
POST /rules
{
  "name": "Minha Regra",
  "conditions": [
    { "field": "client.segment", "operator": "equals", "value": "INDUSTRIAL" }
  ],
  "actions": [
    { "type": "suggest_service", "params": { "service": "SPDA_REPORT" } }
  ]
}
```

## 🐳 Comandos Docker Úteis

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar todos os serviços
docker-compose down

# Rebuild após alterações
docker-compose up -d --build

# Acessar container do backend
docker-compose exec api sh

# Acessar container do frontend
docker-compose exec web sh

# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres electraflow > backup.sql

# Restaurar banco de dados
docker-compose exec -T postgres psql -U postgres electraflow < backup.sql
```

## 🧪 Testes

### Backend
```bash
cd electraflow-api
npm run test
npm run test:e2e
```

### Frontend
```bash
cd app
npm run test
```

## 🚀 Deploy em Produção

### Requisitos
- Servidor com Docker e Docker Compose
- Domínio configurado
- SSL (Let's Encrypt recomendado)

### Passos

1. Clone o repositório no servidor
2. Configure o arquivo `.env` com variáveis de produção
3. Execute:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente Importantes

```env
# Backend
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
DB_PASSWORD=secure-database-password

# Frontend
VITE_API_URL=https://api.seudominio.com
```

## 📞 Suporte

Para suporte e dúvidas:
- Email: suporte@electraflow.com.br
- Documentação: https://docs.electraflow.com.br
- Issues: https://github.com/seu-usuario/electraflow/issues

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Comunidade NestJS
- Comunidade React
- shadcn/ui pelos componentes

---

**Desenvolvido com ❤️ para o setor de engenharia elétrica brasileiro**
