#!/bin/bash

# ElectraFlow - Script de Setup
# Este script configura o ambiente completo do ElectraFlow

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   ⚡ ElectraFlow - ERP/CRM para Engenharia Elétrica        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funções
print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar Docker
print_step "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

print_success "Docker e Docker Compose encontrados"

# Verificar se os arquivos existem
print_step "Verificando arquivos do projeto..."

if [ ! -f "docker-compose.yml" ]; then
    print_error "Arquivo docker-compose.yml não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

if [ ! -d "electraflow-api" ]; then
    print_error "Diretório electraflow-api não encontrado."
    exit 1
fi

if [ ! -d "app" ]; then
    print_error "Diretório app não encontrado."
    exit 1
fi

print_success "Arquivos do projeto verificados"

# Criar arquivos de ambiente
print_step "Configurando arquivos de ambiente..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Arquivo .env criado"
else
    print_warning "Arquivo .env já existe, pulando..."
fi

if [ ! -f "electraflow-api/.env" ]; then
    cp electraflow-api/.env.example electraflow-api/.env
    print_success "Arquivo electraflow-api/.env criado"
else
    print_warning "Arquivo electraflow-api/.env já existe, pulando..."
fi

if [ ! -f "app/.env" ]; then
    cp app/.env.example app/.env
    print_success "Arquivo app/.env criado"
else
    print_warning "Arquivo app/.env já existe, pulando..."
fi

# Build das imagens
print_step "Buildando imagens Docker..."
docker-compose build --no-cache

# Iniciar containers
print_step "Iniciando containers..."
docker-compose up -d

# Aguardar banco de dados
print_step "Aguardando banco de dados ficar pronto..."
sleep 10

# Verificar se o banco está pronto
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    print_warning "Aguardando PostgreSQL..."
    sleep 2
done

print_success "Banco de dados pronto!"

# Executar seed
print_step "Executando seed do banco de dados..."
docker-compose exec api npm run seed || print_warning "Seed já executado ou erro ao executar"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🎉 Setup concluído com sucesso!                          ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║   Acesse o sistema:                                        ║"
echo "║                                                            ║"
echo "║   🌐 Frontend:    http://localhost:5173                    ║"
echo "║   🔧 Backend:     http://localhost:3000                    ║"
echo "║   📚 API Docs:    http://localhost:3000/api/docs           ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║   Credenciais padrão:                                      ║"
echo "║                                                            ║"
echo "║   Admin:      admin@electraflow.com.br / admin123          ║"
echo "║   Comercial:  comercial@electraflow.com.br / comercial123  ║"
echo "║   Técnico:    tecnico@electraflow.com.br / tecnico123      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Comandos úteis:"
echo "  make logs     - Ver logs"
echo "  make down     - Parar containers"
echo "  make seed     - Executar seed novamente"
echo "  make shell-db - Acessar banco de dados"
echo ""
