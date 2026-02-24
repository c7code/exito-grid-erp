# ElectraFlow - Makefile
# Comandos úteis para desenvolvimento e deploy

.PHONY: help install dev build up down logs seed test clean

# Default target
help:
	@echo "ElectraFlow - Comandos disponíveis:"
	@echo ""
	@echo "  make install     - Instalar dependências (local)"
	@echo "  make dev         - Iniciar ambiente de desenvolvimento"
	@echo "  make build       - Buildar imagens Docker"
	@echo "  make up          - Iniciar containers Docker"
	@echo "  make down        - Parar containers Docker"
	@echo "  make logs        - Ver logs dos containers"
	@echo "  make seed        - Executar seed do banco de dados"
	@echo "  make test        - Executar testes"
	@echo "  make clean       - Limpar containers e volumes"
	@echo "  make reset       - Reset completo (down + clean + up + seed)"
	@echo ""

# Instalação local
install:
	@echo "📦 Instalando dependências do backend..."
	cd electraflow-api && npm install
	@echo "📦 Instalando dependências do frontend..."
	cd app && npm install
	@echo "✅ Instalação concluída!"

# Desenvolvimento local
dev:
	@echo "🚀 Iniciando ambiente de desenvolvimento..."
	@echo "Inicie o backend: cd electraflow-api && npm run start:dev"
	@echo "Inicie o frontend: cd app && npm run dev"

# Docker commands
build:
	@echo "🔨 Buildando imagens Docker..."
	docker-compose build

up:
	@echo "🚀 Iniciando containers..."
	docker-compose up -d
	@echo "✅ Containers iniciados!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3000"
	@echo "API Docs: http://localhost:3000/api/docs"

down:
	@echo "🛑 Parando containers..."
	docker-compose down

logs:
	@echo "📋 Mostrando logs..."
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

logs-db:
	docker-compose logs -f postgres

# Database
seed:
	@echo "🌱 Executando seed do banco de dados..."
	docker-compose exec api npm run seed

migrate:
	@echo "🔄 Executando migrações..."
	docker-compose exec api npm run migration:run

migrate-generate:
	@echo "📝 Gerando nova migração..."
	docker-compose exec api npm run migration:generate -- src/database/migrations/$(name)

# Testes
test:
	@echo "🧪 Executando testes..."
	cd electraflow-api && npm test

test-e2e:
	@echo "🧪 Executando testes E2E..."
	cd electraflow-api && npm run test:e2e

# Limpeza
clean:
	@echo "🧹 Limpando containers e volumes..."
	docker-compose down -v
	docker system prune -f

reset: down clean up
	@echo "⏳ Aguardando banco de dados..."
	@sleep 10
	@echo "🌱 Executando seed..."
	@docker-compose exec api npm run seed
	@echo "✅ Reset completo concluído!"

# Backup e restore
backup:
	@echo "💾 Criando backup do banco de dados..."
	docker-compose exec postgres pg_dump -U postgres electraflow > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@echo "💾 Restaurando banco de dados..."
	@read -p "Arquivo de backup: " file; \
	docker-compose exec -T postgres psql -U postgres electraflow < $$file

# Shell access
shell-api:
	docker-compose exec api sh

shell-web:
	docker-compose exec web sh

shell-db:
	docker-compose exec postgres psql -U postgres electraflow

# Status
status:
	@echo "📊 Status dos containers:"
	docker-compose ps

# Deploy
deploy-prod:
	@echo "🚀 Deploy em produção..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Utilidades
format:
	@echo "🎨 Formatando código..."
	cd electraflow-api && npm run format

lint:
	@echo "🔍 Verificando código..."
	cd electraflow-api && npm run lint
