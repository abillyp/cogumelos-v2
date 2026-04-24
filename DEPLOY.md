# Deploy no VPS — organico4you.com.br

## Pré-requisitos

- VPS Hostinger com Ubuntu 22.04/24.04 (mínimo 2GB RAM, 20GB disco)
- Domínio `organico4you.com.br` comprado
- Acesso SSH ao VPS como root

---

## Passo 1 — Configurar o DNS do domínio

No painel da Hostinger onde comprou o domínio:

1. Acessa **DNS Zone** do domínio `organico4you.com.br`
2. Adiciona/edita os registros:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP_DO_SEU_VPS | 3600 |
| A | www | IP_DO_SEU_VPS | 3600 |

O IP do VPS aparece no painel do VPS na Hostinger.

> Aguarde 15–60 minutos para o DNS propagar antes de continuar.
> Verifique com: `ping organico4you.com.br`

---

## Passo 2 — Primeiro acesso ao VPS

```bash
ssh root@IP_DO_SEU_VPS
```

Se pedir senha, use a que aparece no painel da Hostinger.
Recomendado: configure autenticação por chave SSH depois.

---

## Passo 3 — Executar o script de instalação

```bash
# Copia o script para o VPS (do seu Windows):
scp setup-vps.sh root@IP_DO_SEU_VPS:/root/

# No VPS:
chmod +x /root/setup-vps.sh
bash /root/setup-vps.sh
```

O script instala: Docker, Nginx, Fail2ban, UFW, clona o repositório.

---

## Passo 4 — Configurar o .env de produção

```bash
nano /var/www/cogumelos-v2/.env
```

Preenche com os valores reais de produção:

```env
DB_PASSWORD=senha_forte_aqui_minimo_20_chars
JWT_SECRET=gere_com_openssl_rand_base64_64
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu-secret
FRONTEND_URL=https://organico4you.com.br
```

Para gerar um JWT_SECRET seguro:
```bash
openssl rand -base64 64
```

---

## Passo 5 — Subir os containers

```bash
cd /var/www/cogumelos-v2
bash deploy.sh
```

---

## Passo 6 — Configurar HTTPS com Let's Encrypt

> O DNS precisa estar propagado antes deste passo.

```bash
sudo certbot --nginx -d organico4you.com.br -d www.organico4you.com.br
```

- Informe seu email quando pedido
- Aceite os termos
- Escolha opção **2** para redirecionar HTTP → HTTPS automaticamente

Verifica renovação automática:
```bash
sudo certbot renew --dry-run
```

---

## Passo 7 — Atualizar o Google Cloud Console

No [console.cloud.google.com](https://console.cloud.google.com):

1. APIs & Services → Credentials → seu OAuth 2.0 Client
2. **Authorized redirect URIs** — adiciona:
   ```
   https://organico4you.com.br/api/auth/oauth2/callback/google
   ```
3. **Authorized JavaScript origins** — adiciona:
   ```
   https://organico4you.com.br
   ```
4. Salva

---

## Passo 8 — Verificar o deploy

```bash
# Status dos containers
cd /var/www/cogumelos-v2
docker compose ps

# Logs do backend
docker compose logs -f cogumelos-api

# Logs do frontend
docker compose logs -f cogumelos-front

# Saúde do backend
curl https://organico4you.com.br/api/actuator/health
```

---

## Deploys futuros

Para atualizar após um push na branch main:

```bash
ssh root@IP_DO_SEU_VPS
cd /var/www/cogumelos-v2
bash deploy.sh
```

---

## Troubleshooting

**Nginx não inicia:**
```bash
nginx -t          # verifica configuração
journalctl -u nginx --no-pager -n 50
```

**Container não sobe:**
```bash
docker compose logs cogumelos-api
docker compose down && docker compose up -d
```

**Certificado SSL não renova:**
```bash
systemctl status certbot.timer
certbot renew --force-renewal
```

**Banco de dados com problema:**
```bash
docker compose exec postgres psql -U cogumelos_user -d cogumelos
```

---

## Segurança pós-deploy

```bash
# Troca a porta SSH padrão (opcional mas recomendado)
nano /etc/ssh/sshd_config
# Muda: Port 22 → Port 2222
systemctl restart sshd

# Verifica status do Fail2ban
fail2ban-client status
fail2ban-client status sshd

# Verifica firewall
ufw status verbose
```
