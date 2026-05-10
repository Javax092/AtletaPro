# AI Service

Serviço FastAPI responsável por health checks, análise de risco e processamento de vídeo.

## Setup local

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Variáveis

Copie [ai-service/.env.example](/home/limax44/soccermonitor/AtletaPro/ai-service/.env.example) para `ai-service/.env`.

Variáveis principais:

- `ENVIRONMENT=production`
- `PORT=8001`
- `STORAGE_DIR=storage`

Compatibilidade antiga:

- `APP_ENV`
- `APP_PORT`

## Health checks

- `GET /health`
- `GET /api/health`

## Deploy

Alvo recomendado: Railway.

Build:

```bash
pip install -r requirements.txt
```

Start:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Healthcheck:

```text
/health
```

Se o serviço processar vídeos em produção, trate `STORAGE_DIR` como armazenamento temporário. No Railway, prefira `STORAGE_DIR=/tmp/atletapro-ai-storage` até migrar para volume persistente ou storage externo.
