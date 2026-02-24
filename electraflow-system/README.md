# ElectraFlow - ERP/CRM para Engenharia Elétrica

Sistema completo de gestão para empresas de engenharia elétrica, com 3 áreas distintas: Administrador, Funcionário e Cliente.

## 🏗️ Arquitetura

```
├── backend/           # API NestJS
├── frontend/          # Aplicação React (../app)
└── docker-compose.yml # Orquestração dos serviços
```

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **JWT** - Autenticação
- **Swagger** - Documentação da API
- **Multer** - Upload de arquivos

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP
- **React Dropzone** - Upload de arquivos

## 📋 Funcionalidades

### Área do Administrador
- ✅ Dashboard com KPIs
- ✅ Gerenciamento de usuários (admin/funcionário/cliente)
- ✅ Configuração de prazos por tipo de obra e etapa
- ✅ Aprovação de prazos solicitados por funcionários
- ✅ Gestão de obras, tarefas e documentos
- ✅ Upload de múltiplos documentos

### Área do Funcionário
- ✅ Dashboard pessoal
- ✅ Visualização de obras atribuídas
- ✅ Gestão de tarefas
- ✅ Solicitação de prazos para aprovação
- ✅ Upload de documentos

### Área do Cliente
- ✅ Dashboard do cliente
- ✅ Acompanhamento de obras
- ✅ Aprovação de etapas
- ✅ Acesso a documentos

## 🔐 Fluxo de Aprovação de Prazos

1. **Funcionário** define prazo para uma tarefa
2. **Administrador** recebe notificação e aprova/rejeita
3. **Cliente** recebe notificação (se necessário) e aprova
4. **Tarefa** é atualizada com o prazo aprovado

## 🚀 Como Executar

### Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (em outro terminal)
cd ../app
npm install
npm run dev
```

### Produção (Docker)

```bash
docker-compose up -d
```

Acesse:
- Frontend: http://localhost
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

## 🔑 Credenciais de Demonstração

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@electraflow.com | admin123 |
| Funcionário | joao@electraflow.com | employee123 |
| Cliente | contato@solartech.com | client123 |

## 📁 Estrutura de Pastas

```
backend/src/
├── auth/              # Autenticação JWT
├── users/             # Usuários (admin/employee)
├── clients/           # Clientes
├── works/             # Obras
├── tasks/             # Tarefas
├── documents/         # Documentos
├── workflow-config/   # Configuração de prazos
├── deadline-approvals/# Aprovações de prazo
└── dashboard/         # Dashboards por perfil
```

## 🔧 Variáveis de Ambiente

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=electraflow
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

## 📚 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Users
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário

### Workflow Config
- `GET /api/workflow-config` - Listar configurações
- `POST /api/workflow-config` - Criar configuração
- `GET /api/workflow-config/template/:workType` - Template de workflow

### Deadline Approvals
- `GET /api/deadline-approvals/pending-admin` - Pendentes para admin
- `GET /api/deadline-approvals/pending-client` - Pendentes para cliente
- `POST /api/deadline-approvals` - Criar solicitação
- `PUT /api/deadline-approvals/:id/admin-approve` - Aprovar (admin)
- `PUT /api/deadline-approvals/:id/client-approve` - Aprovar (cliente)

### Documents
- `GET /api/documents` - Listar documentos
- `POST /api/documents/upload` - Upload de arquivos
- `GET /api/documents/:id/download` - Download

## 📝 Licença

MIT License - ElectraFlow Team
