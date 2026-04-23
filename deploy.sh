#!/bin/bash
set -e
echo ""
echo " Atualizando repositório..."
git pull origin main

echo ""
echo " Parando versão anterior..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

echo ""
echo " Subindo nova versão..."
docker compose -f docker-compose.prod.yml up --build -d

echo ""
echo " Limpando imagens antigas..."
docker image prune -f

echo ""
echo " Deploy concluído!"
docker compose -f docker-compose.prod.yml ps
