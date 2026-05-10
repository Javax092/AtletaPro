# Backend

API principal do Sports AI SaaS. Este serviço expõe autenticação JWT, rotas multi-tenant por `clubId`, integração com Prisma/PostgreSQL e chamadas ao `ai-service`.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run start
npm run start:prod
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run smoke
```

## Variáveis

Copie [backend/.env.example](/home/limax44/soccermonitor/AtletaPro/backend/.env.example) para `backend/.env`.

Obrigatórias em produção:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `AI_SERVICE_URL`
- `CORS_ORIGINS`
- `NODE_ENV=production`

## Health checks

- `GET /health`
- `GET /api/health`

## Deploy

Alvo recomendado: Railway.

Build:

```bash
npm ci && npm run prisma:generate && npm run build
```

Start:

```bash
npm run start:prod
```

Healthcheck:

```text
/health
```

Observação: uploads usam disco local. Em Railway, use `UPLOAD_DIR=/tmp/atletapro-uploads` sabendo que o conteúdo é temporário. Se o fluxo exigir persistência real, troque por volume persistente ou storage externo.
