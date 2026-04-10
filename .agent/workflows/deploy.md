---
description: Processo padrão de git e deploy do Electraflow ERP no Railway
---

# Deploy Electraflow ERP

## Pré-requisitos antes de qualquer edição

// turbo-all

1. Verificar status do git para garantir que não há conflitos:
```
git status
```

2. Garantir que estamos na branch `main` e atualizados:
```
git pull origin main
```

3. Se houver conflitos, resolver antes de continuar.

## Após realizar edições

4. Verificar build do frontend (zero erros obrigatório):
```
cd app && npx tsc -b
```

5. Verificar build do backend (se houve mudanças na API):
```
cd electraflow-api && npx tsc --noEmit
```

6. Adicionar arquivos alterados ao git:
```
git add <arquivos-modificados>
```

7. Fazer commit com mensagem descritiva:
```
git commit -m "tipo(modulo): descrição da mudança"
```
Tipos: `feat`, `fix`, `chore`, `refactor`

8. Push para origin/main (dispara deploy automático no Railway):
```
git push origin main
```

9. Se o deploy não disparar no Railway, fazer commit vazio para forçar:
```
git commit --allow-empty -m "chore: trigger railway deploy"
git push origin main
```

## Informações Importantes do Projeto

- **Remote**: `https://github.com/c7code/exito-grid-erp.git`
- **Branch**: `main`
- **Deploy**: Railway (auto-deploy via webhook do GitHub)
- **Frontend**: `app/` (Vite + React + TypeScript)
- **Backend**: `electraflow-api/` (NestJS + TypeORM + PostgreSQL/Supabase)
- **Workspaces**: app, electraflow-api, electraflow-erp, electraflow-system, electraflow-deploy, nginx, prototipo
- **Cwd para git**: Sempre usar uma das pastas do workspace (ex: `app/`) e referências relativas (`../electraflow-api/...`)
