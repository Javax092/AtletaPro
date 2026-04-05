# Sports AI SaaS

Base inicial de um SaaS esportivo multi-tenant com três serviços:

- `frontend`: React + Vite + TypeScript + Tailwind
- `backend`: Express + TypeScript + Prisma + PostgreSQL
- `ai-service`: FastAPI + base pronta para evolução dos endpoints de IA

## Estrutura

```text
.
├── ai-service
├── backend
├── frontend
├── docker-compose.yml
└── README.md
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Python 3.11+
- Docker + Docker Compose

## Subindo o banco

```bash
cp .env.example .env
bash scripts/bootstrap-local.sh
docker compose up -d
```

O `docker-compose.yml` usa variáveis do `.env` da raiz e, por padrão, expõe o PostgreSQL em `5433` para evitar conflito com uma instância local já ocupando `5432`.

Exemplo de `.env` da raiz:

```env
POSTGRES_PORT=5433
POSTGRES_DB=sports_ai_saas
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API principal em `http://localhost:4000`.

Use `bash scripts/bootstrap-local.sh` sempre que alterar a configuração do PostgreSQL na raiz. O script sincroniza automaticamente o `DATABASE_URL` do backend com `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD`.

## AI Service

```bash
cd ai-service
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Serviço de IA em `http://localhost:8001`.

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Aplicação em `http://localhost:5173`.

## Deploy em produção

### Render + Supabase

O repositório inclui `render.yaml` para publicar:

- `atletapro-ai-service` no Render
- `atletapro-backend` no Render

No backend, configure no Render:

- `DATABASE_URL`: use a connection string de runtime do Supabase
- `DIRECT_URL`: use a connection string direta para o Prisma CLI e migrations
- `JWT_SECRET`: pode ser gerado automaticamente pelo Blueprint
- `AI_SERVICE_URL`: é ligado automaticamente ao serviço `atletapro-ai-service`

Sugestão prática para Supabase com Prisma:

- `DATABASE_URL`: use o Supavisor Session mode (`:5432`) ou outra string de runtime compatível
- `DIRECT_URL`: use a direct connection do banco, ou a Session mode se sua infra não tiver IPv6

O backend usa:

- `buildCommand`: `npm ci && npm run prisma:generate && npm run build`
- `startCommand`: `npm run start:render`

Esse `start:render` aplica `prisma migrate deploy` antes de subir a API.

### Vercel

Depois que o backend estiver público no Render, defina no projeto `frontend` do Vercel:

```env
VITE_API_URL=https://SEU-BACKEND.onrender.com/api
```

O frontend já está preparado para deploy no Vercel com SPA rewrite em `frontend/vercel.json`.

## Fluxo inicial do MVP

1. Registrar clube e usuário admin em `POST /api/auth/register`.
2. Fazer login em `POST /api/auth/login`.
3. Validar a sessão autenticada em `GET /api/auth/me`.
4. Usar o token JWT no frontend para acessar rotas protegidas.
5. Consultar `GET /api/dashboard` para testar a rota protegida com contexto multi-tenant.
6. Criar atletas, importar métricas CSV, consultar dashboard e subir vídeos.
7. Processar vídeo chamando o `ai-service` via backend.

## Observações

- O modelo multi-tenant é preparado desde o início via `clubId`.
- O middleware `tenantContextMiddleware` injeta `clubId`, `userId` e `role` em `req.context`.
- O Compose foi mantido simples, apenas com PostgreSQL. `backend` e `ai-service` continuam sendo executados localmente por comando, sem acoplamento prematuro ao Docker.
- Uploads ficam em `backend/uploads`.
- Heatmaps gerados ficam em `ai-service/storage/heatmaps`.
- Os resultados de IA são persistidos no PostgreSQL via Prisma.

## Observabilidade local

O `backend` e o `ai-service` agora escrevem logs estruturados em JSON no `stdout`, com `timestamp`, `level`, `service`, `event` e `requestId`.

Eventos principais atualmente logados:

- boot da aplicação
- início e fim de request HTTP
- falhas de autenticação
- uploads de vídeo
- chamadas do backend para o `ai-service`
- erros HTTP e exceções não tratadas

Correlação simples:

- o `backend` gera ou propaga `x-request-id`
- o mesmo `x-request-id` é devolvido na resposta HTTP
- chamadas do `backend` para o `ai-service` reaproveitam o mesmo valor
- isso permite seguir a mesma requisição nos dois serviços

Cuidados com dados sensíveis:

- token JWT e senha não entram em log
- e-mails são mascarados, por exemplo `ad***@democlub.com`
- logs priorizam metadados de operação, status e contexto técnico

Como ler localmente:

```bash
cd backend
npm run dev
```

```bash
cd ai-service
./.venv/bin/python -m uvicorn app.main:app --reload --port 8001
```

Se tiver `jq` instalado, fica mais legível:

```bash
cd backend
npm run dev | jq
```

```bash
cd ai-service
./.venv/bin/python -m uvicorn app.main:app --reload --port 8001 | jq
```

Filtrar por evento:

```bash
cd backend
npm run dev | rg 'ai\.video_process|match\.video_upload|auth\.'
```

Filtrar por um `requestId` específico:

```bash
cd backend
npm run dev | rg '2f5d8f0e-2d19-4a65-92d0-5d81a2f0d7b1'
```

Exemplos de logs:

```json
{"timestamp":"2026-04-05T18:20:31.114Z","level":"info","service":"backend","event":"app.boot.ready","port":4000}
{"timestamp":"2026-04-05T18:21:02.442Z","level":"warn","service":"backend","event":"auth.token.invalid","requestId":"2f5d8f0e-2d19-4a65-92d0-5d81a2f0d7b1","method":"GET","path":"/api/auth/me"}
{"timestamp":"2026-04-05T18:22:11.908Z","level":"info","service":"backend","event":"match.video_upload.received","requestId":"b42d4c1b-ecf1-47b3-bcf6-c7fd0d10f3a6","clubId":"cm9club123","matchId":"cm9match123","fileName":"rodada-9.mp4","mimeType":"video/mp4","sizeBytes":18273441}
{"timestamp":"2026-04-05T18:22:12.141Z","level":"info","service":"backend","event":"ai.video_process.request","requestId":"b42d4c1b-ecf1-47b3-bcf6-c7fd0d10f3a6","clubId":"cm9club123","matchId":"cm9match123","matchVideoId":"cm9video123","url":"http://127.0.0.1:8001/api/video/process"}
{"timestamp":"2026-04-05T18:22:13.037Z","level":"info","service":"ai-service","event":"video.process.completed","requestId":"b42d4c1b-ecf1-47b3-bcf6-c7fd0d10f3a6","clubId":"cm9club123","matchId":"cm9match123","sampledFrames":12,"heatmapPath":"storage/heatmaps/cm9club123_cm9match123_a1b2c3d4.png"}
{"timestamp":"2026-04-05T18:22:13.219Z","level":"error","service":"backend","event":"request.unhandled_error","requestId":"b42d4c1b-ecf1-47b3-bcf6-c7fd0d10f3a6","method":"POST","path":"/api/matches/cm9match123/videos/cm9video123/process","message":"connect ECONNREFUSED 127.0.0.1:8001"}
```

## Comandos de teste local

Subir o banco:

```bash
cp .env.example .env
bash scripts/bootstrap-local.sh
docker compose up -d
docker compose ps
```

Validar que a porta publicada corresponde ao `.env`:

```bash
docker compose ps postgres
```

Validar backend com o banco configurado:

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

## Smoke tests

Os smoke tests são scripts simples em Node.js usando `fetch` nativo, sem framework extra.

Backend:

```bash
node scripts/smoke-backend.mjs
```

AI service:

```bash
node scripts/smoke-ai-service.mjs
```

Variáveis opcionais:

```bash
BACKEND_URL=http://127.0.0.1:4000
AI_SERVICE_URL=http://127.0.0.1:8001
SMOKE_ADMIN_EMAIL=admin@democlub.com
SMOKE_ADMIN_PASSWORD=password123
```

Exemplo:

```bash
BACKEND_URL=http://127.0.0.1:4000 \
SMOKE_ADMIN_EMAIL=admin@democlub.com \
SMOKE_ADMIN_PASSWORD=password123 \
node scripts/smoke-backend.mjs
```

## Importação CSV de métricas físicas

Endpoint:

```bash
POST /api/performance/metrics/import-csv
Content-Type: multipart/form-data
Campo do arquivo: file
```

Cabeçalhos esperados:

```csv
athleteId,recordedAt,distanceMeters,sprintCount,accelCount,decelCount,workload,avgHeartRateBpm,maxHeartRateBpm,sessionMinutes,perceivedEffort,fatigueLevel,sleepHours,sorenessLevel
```

Exemplo:

```csv
athleteId,recordedAt,distanceMeters,sprintCount,accelCount,decelCount,workload,avgHeartRateBpm,maxHeartRateBpm,sessionMinutes,perceivedEffort,fatigueLevel,sleepHours,sorenessLevel
cm9abc1230001xyz,2026-04-05T09:00:00.000Z,10432,22,31,28,487.5,162,178,88,8.2,4,7.5,2
cm9abc1230002xyz,2026-04-05T09:00:00.000Z,9540,18,25,21,430,154,169,76,6.9,6,6.8,4
```

Regras atuais:

- O importador valida cabeçalhos antes de processar linhas.
- Linhas inválidas entram no relatório de erro e não derrubam a importação inteira.
- A importação CSV não sobrescreve registros existentes: se já houver uma métrica com o mesmo `athleteId` e `recordedAt`, a linha é recusada.
- O endpoint manual `POST /api/performance/metrics` continua disponível sem alteração de fluxo.
- Cada métrica importada ou criada dispara uma análise heurística no `ai-service`, com fallback local caso o serviço não responda.
- As análises ficam disponíveis em `GET /api/performance/risks`.

Fluxo de teste manual:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

1. Faça login no sistema.
2. Cadastre ou confirme atletas ativos em `/athletes`.
3. Copie os `athleteId` exibidos no dashboard de performance.
4. Monte um CSV com os cabeçalhos esperados e inclua ao menos:
   - uma linha válida
   - uma linha com `athleteId` inexistente
   - uma linha duplicada com o mesmo `athleteId` e `recordedAt`
5. Acesse `/dashboard`, envie o arquivo e confirme o relatório com `total lido`, `total importado`, `total com erro` e a lista resumida de erros.
6. Confirme que o gráfico do dashboard reflete apenas as linhas importadas com sucesso.
7. Confirme que a seção de risco mostra badge, score e resumo explicável para cada sessão processada.
8. Opcionalmente valide `GET /api/performance/risks` para conferir o payload persistido no backend.
