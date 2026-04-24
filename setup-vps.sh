#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# setup-vps.sh — Instalação do cogumelos.app no VPS Hostinger
# Sistema: Ubuntu 22.04 / 24.04
# Domínio: organico4you.com.br
#
# Uso:
#   ssh root@IP_DO_SEU_VPS
#   curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/cogumelos-v2/main/setup-vps.sh | bash
#
# OU copie o arquivo para o VPS e execute:
#   chmod +x setup-vps.sh && sudo bash setup-vps.sh
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="organico4you.com.br"
APP_DIR="/var/www/cogumelos-v2"
APP_USER="cogumelos"
REPO_URL="https://github.com/abillyp/cogumelos-v2.git"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 1. Atualiza o sistema ─────────────────────────────────────────────────────
info "Atualizando o sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instala dependências ───────────────────────────────────────────────────
info "Instalando dependências..."
apt-get install -y -qq \
  curl wget git ufw fail2ban \
  nginx certbot python3-certbot-nginx \
  ca-certificates gnupg lsb-release

# ── 3. Instala Docker ─────────────────────────────────────────────────────────
info "Instalando Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# Docker Compose v2
if ! docker compose version &> /dev/null; then
  apt-get install -y docker-compose-plugin
fi

info "Docker $(docker --version)"
info "Docker Compose $(docker compose version)"

# ── 4. Cria usuário da aplicação ──────────────────────────────────────────────
info "Criando usuário $APP_USER..."
if ! id "$APP_USER" &> /dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  usermod -aG docker "$APP_USER"
fi

# ── 5. Firewall ───────────────────────────────────────────────────────────────
info "Configurando firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
info "Firewall ativo — portas abertas: SSH, 80, 443"

# ── 6. Fail2ban ───────────────────────────────────────────────────────────────
info "Configurando Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 7. Clona o repositório ────────────────────────────────────────────────────
info "Clonando repositório em $APP_DIR..."
if [ -d "$APP_DIR" ]; then
  warning "Diretório já existe — fazendo git pull"
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

# ── 8. Cria o .env de produção ────────────────────────────────────────────────
info "Verificando arquivo .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  warning "ATENÇÃO: edite o arquivo .env antes de continuar!"
  warning "  nano $APP_DIR/.env"
  warning "Depois execute: bash $APP_DIR/deploy.sh"
  exit 0
fi

# ── 9. Configura Nginx ────────────────────────────────────────────────────────
info "Configurando Nginx..."
cp "$APP_DIR/nginx.conf" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 10. Sobe os containers ────────────────────────────────────────────────────
info "Subindo containers Docker..."
cd "$APP_DIR"
docker compose pull 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 11. Aguarda o backend subir ───────────────────────────────────────────────
info "Aguardando backend ficar disponível..."
for i in $(seq 1 30); do
  if docker compose exec -T cogumelos-api wget -qO- http://localhost:8080/actuator/health 2>/dev/null | grep -q "UP"; then
    info "Backend OK"
    break
  fi
  sleep 3
done

info "✅ Setup concluído!"
info ""
info "Próximos passos:"
info "  1. Aponte o DNS do domínio $DOMAIN para o IP deste VPS"
info "  2. Aguarde a propagação do DNS (pode levar até 24h)"
info "  3. Execute: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
info "  4. Atualize o Google Console com o redirect URI de produção"
