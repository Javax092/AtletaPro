# Frontend

SPA em React/Vite que consome a API pública do backend.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run start
npm run smoke
```

## Variáveis

Copie [frontend/.env.example](/home/limax44/soccermonitor/AtletaPro/frontend/.env.example) para `frontend/.env`.

Variável principal:

- `VITE_API_URL=https://SEU-BACKEND.up.railway.app/api`

Se `VITE_API_URL` não existir, o app faz fallback para a mesma origem em produção e para `http://localhost:4000/api` em desenvolvimento.

## Deploy na Vercel

- Root Directory: `frontend`
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

O arquivo [frontend/vercel.json](/home/limax44/soccermonitor/AtletaPro/frontend/vercel.json) já aplica rewrite SPA para `index.html`.
