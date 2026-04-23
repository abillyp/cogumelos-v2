#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# deploy.sh — Atualiza o cogumelos.app no VPS sem downtime
#
# Uso no VPS:
#   cd /var/www/cogumelos-v2
#   bash deploy.sh
#
# Ou configure como webhook do GitHub para deploy automático a cada push na main
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/var/www/cogumelos-v2"
COMPOSE="docker compose"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[DEPLOY $(date '+%H:%M:%S')]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

cd "$APP_DIR"

# ── 1. Verifica .env ──────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "❌ Arquivo .env não encontrado!"
  echo "   Copie o template: cp .env.example .env"
  echo "   Edite os valores: nano .env"
  exit 1
fi

# ── 2. Puxa o código mais recente ─────────────────────────────────────────────
info "Puxando código do GitHub..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  warning "Nada a atualizar — já está na versão mais recente."
  exit 0
fi

git pull origin main
info "Atualizado: $(git log --oneline -1)"

# ── 3. Rebuild apenas dos containers que mudaram ──────────────────────────────
info "Rebuilding containers..."

# Backend sempre rebuida (código Java muda)
$COMPOSE build --no-cache cogumelos-api

# Frontend rebuilda só se houver mudanças em frontend/
if git diff HEAD~1 --name-only | grep -q "^frontend/"; then
  info "Mudanças no frontend detectadas — rebuilding..."
  $COMPOSE build --no-cache cogumelos-front
else
  info "Frontend sem mudanças — pulando rebuild"
fi

# ── 4. Atualiza os containers sem derrubar o banco ────────────────────────────
info "Atualizando containers..."
$COMPOSE up -d --no-deps cogumelos-api
sleep 5  # aguarda o Spring subir

$COMPOSE up -d --no-deps cogumelos-front

# ── 5. Verifica saúde da aplicação ────────────────────────────────────────────
info "Verificando saúde do backend..."
for i in $(seq 1 20); do
  if $COMPOSE exec -T cogumelos-api wget -qO- http://localhost:8080/actuator/health 2>/dev/null | grep -q "UP"; then
    info "✅ Backend OK"
    break
  fi
  if [ $i -eq 20 ]; then
    echo "❌ Backend não respondeu — verificando logs:"
    $COMPOSE logs --tail=50 cogumelos-api
    exit 1
  fi
  sleep 3
done

# ── 6. Limpa imagens antigas ──────────────────────────────────────────────────
info "Limpando imagens Docker antigas..."
docker image prune -f

# ── 7. Resumo ─────────────────────────────────────────────────────────────────
info "✅ Deploy concluído com sucesso!"
info "   Versão: $(git log --oneline -1)"
info "   Containers:"
$COMPOSE ps --format "table {{.Name}}\t{{.Status}}"
