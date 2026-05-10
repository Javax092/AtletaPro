# Sports AI SaaS

SaaS esportivo multi-tenant para clubes com dashboard, métricas físicas, importação CSV, análise de risco com IA e processamento de vídeo.

## Visão geral

O sistema já está estruturado como monorepo e separado por serviço:

- `frontend`: SPA React/Vite para operação do produto
- `backend`: API Express com JWT, multi-tenant por `clubId`, Prisma e integração com IA
- `ai-service`: FastAPI para health checks, análise de risco e processamento de vídeo
- `database`: PostgreSQL no Neon

Principais capacidades do MVP:

- gestão de clubes e usuários
- cadastro de atletas
- métricas físicas
- importação CSV
- análise de risco de lesão
- upload e processamento de vídeo
- dashboard

## Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- Multer

### AI Service
- FastAPI
- Pydantic Settings
- NumPy
- OpenCV Headless

### Banco
- PostgreSQL
- Neon

### Deploy
- Vercel para frontend
- Railway para backend
- Railway para ai-service

## Arquitetura

```text
Frontend (Vercel)
  -> Backend API (Railway)
     -> Prisma
        -> PostgreSQL (Neon)
     -> AI Service (Railway)
```

Integrações de produção recomendadas:

- Frontend -> Backend público via `https://SEU-BACKEND.up.railway.app/api`
- Backend -> Neon via `DATABASE_URL` pooled e `DIRECT_URL` direct
- Backend -> AI Service via private networking do Railway

## Estrutura do projeto

```text
AtletaPro/
├── ai-service/
│   ├── app/
│   ├── .env.example
│   ├── README.md
│   └── requirements.txt
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env.example
│   ├── README.md
│   ├── package.json
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── README.md
│   ├── package.json
│   └── vercel.json
├── scripts/
│   ├── bootstrap-local.sh
│   ├── smoke-ai-service.mjs
│   └── smoke-backend.mjs
├── .env.example
├── docker-compose.yml
└── package.json
```

## Rodando localmente

1. Clonar o projeto.

```bash
git clone <repo-url>
cd AtletaPro
```

2. Criar os arquivos `.env`.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
```

3. Subir o PostgreSQL local via Docker.

```bash
npm run db:up
```

4. Preparar o backend e sincronizar URLs do banco local.

```bash
npm install --prefix backend
./scripts/bootstrap-local.sh
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
```

5. Rodar o backend.

```bash
npm run dev --prefix backend
```

6. Rodar o ai-service.

```bash
python3 -m venv ai-service/.venv
ai-service/.venv/bin/pip install -r ai-service/requirements.txt
ai-service/.venv/bin/uvicorn app.main:app --app-dir ai-service --reload --host 0.0.0.0 --port 8001
```

7. Rodar o frontend.

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Portas locais padrão:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- AI Service: `http://localhost:8001`

## Variáveis de ambiente

### Raiz

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `POSTGRES_PORT` | `5433` | Porta exposta pelo PostgreSQL local |
| `POSTGRES_DB` | `sports_ai_saas` | Banco local |
| `POSTGRES_USER` | `postgres` | Usuário local |
| `POSTGRES_PASSWORD` | `postgres` | Senha local |

### Frontend

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `https://SEU-BACKEND.up.railway.app/api` | Base pública do backend |

Observações:

- só use variáveis públicas com prefixo `VITE_`
- em produção, `VITE_API_URL` deve apontar para o backend público no Railway
- se `VITE_API_URL` estiver ausente, o frontend usa fallback seguro para a mesma origem; isso evita `localhost` hardcoded, mas não substitui a variável correta quando frontend e backend estão em domínios diferentes

### Backend

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `NODE_ENV` | `production` | Ambiente da aplicação |
| `PORT` | `4000` | Porta HTTP usada pelo Railway |
| `DATABASE_URL` | `postgresql://user:pass@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` | URL pooled para runtime |
| `DIRECT_URL` | `postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require` | URL direta para migrations |
| `JWT_SECRET` | `troque-por-um-segredo-forte` | Segredo do JWT |
| `JWT_EXPIRES_IN` | `1d` | Expiração do JWT |
| `AI_SERVICE_URL` | `http://ai-service.railway.internal:8001` | URL do ai-service |
| `AI_SERVICE_TIMEOUT_MS` | `5000` | Timeout das chamadas para IA |
| `CORS_ORIGINS` | `https://seu-app.vercel.app` | Lista separada por vírgula de origens permitidas |
| `UPLOAD_DIR` | `/tmp/atletapro-uploads` | Diretório temporário para uploads |

### AI Service

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | Ambiente do serviço |
| `PORT` | `8001` | Porta HTTP |
| `STORAGE_DIR` | `/tmp/atletapro-ai-storage` | Diretório temporário |

Compatibilidade: o `ai-service` ainda aceita `APP_ENV` e `APP_PORT`, mas o padrão novo é `ENVIRONMENT` e `PORT`.

## Neon PostgreSQL

Configuração recomendada para Neon:

- `DATABASE_URL` = pooled connection
- `DIRECT_URL` = direct connection

### Onde pegar cada URL no painel Neon

1. Entre no projeto no painel da Neon.
2. Na tela do projeto, clique em `Connect`.
3. No modal `Connection Details`, selecione:
   - branch
   - database
   - role
4. Para `DATABASE_URL`, ative o toggle de pooling.
5. Copie a string com `-pooler` no hostname.
6. Para `DIRECT_URL`, desative o toggle de pooling.
7. Copie a string sem `-pooler`.

Exemplos:

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Regras práticas:

- `DATABASE_URL` deve ser pooled
- `DIRECT_URL` deve ser direct
- mantenha `sslmode=require`
- não use SQLite
- não use `localhost` em produção

## Prisma

O schema já está preparado para produção:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Comandos principais:

```bash
npm run prisma:generate --prefix backend
npm run prisma:deploy --prefix backend
npm run prisma:seed --prefix backend
```

Regras de produção:

- use `npx prisma migrate deploy`
- não use `prisma migrate dev` em produção
- use `DATABASE_URL` pooled para o app
- use `DIRECT_URL` para migrations

## Frontend na Vercel

Configuração do projeto:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variável obrigatória:

```env
VITE_API_URL=https://SEU-BACKEND.up.railway.app/api
```

O arquivo [frontend/vercel.json](/home/limax44/soccermonitor/AtletaPro/frontend/vercel.json) já configura rewrite SPA para evitar `404` em refresh:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Backend no Railway

Crie um serviço no Railway apontando para `backend`.

Configuração recomendada:

- Root Directory: `backend`
- Build Command: `npm install && npm run prisma:generate && npm run build`
- Start Command: `npx prisma migrate deploy && npm run start`
- Healthcheck Path: `/health`

Variáveis obrigatórias:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=COLOQUE_UM_SEGREDO_FORTE
JWT_EXPIRES_IN=1d
AI_SERVICE_URL=http://ai-service.railway.internal:8001
AI_SERVICE_TIMEOUT_MS=5000
CORS_ORIGINS=https://SEU-FRONTEND.vercel.app
UPLOAD_DIR=/tmp/atletapro-uploads
```

Notas de produção:

- `UPLOAD_DIR=/tmp/...` funciona em filesystem temporário do Railway, mas não é persistente entre deploys/restarts
- o backend não deve ser hospedado na Vercel por depender de upload local
- CORS agora é restrito por `CORS_ORIGINS`
- falhas do `ai-service` agora retornam `502/504` no backend em vez de `500` genérico

### Gerar a URL pública do backend

1. Abra o serviço backend no Railway.
2. Vá em `Settings`.
3. Em `Networking -> Public Networking`, clique em `Generate Domain`.
4. Use a URL gerada, por exemplo:

```text
https://atletapro-backend.up.railway.app
```

Essa é a base que entra em `VITE_API_URL` com `/api` no final.

## AI Service no Railway

Crie um serviço no Railway apontando para `ai-service`.

Configuração recomendada:

- Root Directory: `ai-service`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Healthcheck Path: `/health`

Variáveis:

```env
ENVIRONMENT=production
PORT=8001
STORAGE_DIR=/tmp/atletapro-ai-storage
```

Recomendação de rede:

- se o backend também estiver no Railway, prefira private networking
- renomeie o serviço para `ai-service`
- configure `AI_SERVICE_URL=http://ai-service.railway.internal:8001`

Se você quiser testar o serviço manualmente por fora, também pode gerar um domínio público no Railway, mas isso não é obrigatório para a integração interna backend -> ai-service.

## Health checks

Backend:

- `GET /health`
- `GET /api/health`

AI Service:

- `GET /health`
- `GET /api/health`

## Smoke tests

Comandos disponíveis:

```bash
node scripts/smoke-backend.mjs
node scripts/smoke-ai-service.mjs
```

Atalhos:

```bash
npm run smoke:backend
npm run smoke:ai-service
npm run smoke
```

O smoke do backend exige banco, usuário e serviços realmente no ar.

## Segurança

- use `JWT_SECRET` forte
- restrinja `CORS_ORIGINS` ao domínio real da Vercel
- não commite `.env` real
- não logue token, senha ou segredo
- deixe secrets no painel da Vercel, Railway e Neon
- use `sslmode=require` nas URLs do Neon
- trate uploads como temporários enquanto não houver storage persistente

## Troubleshooting

### Prisma P1001

Causa comum:

- `DIRECT_URL` errada
- host do Neon incorreto
- serviço sem saída de rede
- string pooled sendo usada onde o Prisma CLI precisa de conexão direta

Checklist:

- confirme que `DIRECT_URL` está sem `-pooler`
- confirme `sslmode=require`
- rode `npm run prisma:generate --prefix backend`
- rode `npx prisma migrate deploy` no serviço backend

### DATABASE_URL ausente

O backend não sobe sem `DATABASE_URL`. Confirme a variável no serviço backend do Railway.

### DIRECT_URL inválida

Migrations podem falhar mesmo com o app funcionando. Confirme que `DIRECT_URL` é a URL direct do Neon, não a pooled.

### Neon timeout

Revise:

- região do Neon
- região do Railway
- `sslmode=require`
- uso de pooled para runtime e direct para migration

### Neon pooled connection

Use pooled no app (`DATABASE_URL`) para suportar concorrência melhor. Use direct (`DIRECT_URL`) para `migrate deploy`.

### CORS blocked

Coloque em `CORS_ORIGINS` exatamente a URL da Vercel, por exemplo:

```env
CORS_ORIGINS=https://sports-ai-saas.vercel.app
```

### localhost em produção

Não use:

- `VITE_API_URL=http://localhost:4000/api`
- `AI_SERVICE_URL=http://localhost:8001`

Em produção, use Railway e Vercel.

### MIME type CSS

Se o frontend responder CSS/JS com HTML, normalmente o rewrite ou o output do build está incorreto. Verifique:

- `frontend/vercel.json`
- Output Directory = `dist`
- Build Command = `npm run build`

### Hydration errors

Este frontend é SPA com Vite, não SSR. Se aparecer erro parecido com hydration, normalmente é build quebrada, bundle desatualizado ou HTML antigo em cache.

### Vercel SPA refresh 404

Confirme que [frontend/vercel.json](/home/limax44/soccermonitor/AtletaPro/frontend/vercel.json) contém rewrite para `index.html`.

### AI_SERVICE_URL quebrada

Se backend e ai-service estiverem no mesmo projeto Railway, prefira:

```env
AI_SERVICE_URL=http://ai-service.railway.internal:8001
```

Se usar domínio público, confirme que a URL base não termina com `/api` porque o backend já chama rotas específicas do ai-service.

## Checklist de deploy

- Neon criado
- `DATABASE_URL` pooled configurada
- `DIRECT_URL` direct configurada
- `npm install --prefix backend`
- `npm run prisma:generate --prefix backend`
- `npm run build --prefix backend`
- `npm run build --prefix frontend`
- `python` dependencies do ai-service instaladas
- `GET /health` do backend responde `200`
- `GET /health` do ai-service responde `200`
- `CORS_ORIGINS` aponta para a URL da Vercel
- `VITE_API_URL` aponta para a URL pública do backend
- nenhum `localhost` em env de produção
- `JWT_SECRET` forte

## Ordem correta do deploy

1. Criar o banco Neon.
2. Copiar `DATABASE_URL` pooled e `DIRECT_URL` direct.
3. Subir o AI Service no Railway.
4. Subir o Backend no Railway.
5. Subir o Frontend na Vercel.

Fluxo recomendado:

1. No Neon, crie o projeto e copie as duas URLs.
2. No Railway, crie o serviço `ai-service`, configure envs e valide `/health`.
3. No Railway, crie o serviço `backend`, configure envs, rode `migrate deploy` no start e gere o domínio público.
4. Na Vercel, crie o projeto do `frontend`, cadastre `VITE_API_URL` usando a URL pública do backend com `/api`.
5. Teste login, dashboard, importação CSV e processamento de vídeo.
