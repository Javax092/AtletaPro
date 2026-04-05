#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV_FILE="$ROOT_DIR/.env"
ROOT_ENV_EXAMPLE="$ROOT_DIR/.env.example"
BACKEND_ENV_FILE="$ROOT_DIR/backend/.env"
BACKEND_ENV_EXAMPLE="$ROOT_DIR/backend/.env.example"

if [[ ! -f "$ROOT_ENV_FILE" ]]; then
  cp "$ROOT_ENV_EXAMPLE" "$ROOT_ENV_FILE"
fi

if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
  cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV_FILE"
fi

set -a
source "$ROOT_ENV_FILE"
set +a

POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-sports_ai_saas}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

if grep -q '^DATABASE_URL=' "$BACKEND_ENV_FILE"; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$BACKEND_ENV_FILE"
else
  printf '\nDATABASE_URL="%s"\n' "$DATABASE_URL" >> "$BACKEND_ENV_FILE"
fi

cat <<EOF
Local bootstrap completed.
Root env: $ROOT_ENV_FILE
Backend env: $BACKEND_ENV_FILE
DATABASE_URL synchronized to:
$DATABASE_URL
EOF

