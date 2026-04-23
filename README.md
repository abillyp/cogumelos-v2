**Sistema SaaS multi-tenant para gestão de cultivo de cogumelos**

![Java](https://img.shields.io/badge/java-21-ED8B00)
![Spring Boot](https://img.shields.io/badge/spring%20boot-3.2.5-6DB33F)
![Next.js](https://img.shields.io/badge/next.js-14-000000)
![PostgreSQL](https://img.shields.io/badge/postgresql-15-336791)
![Docker Compose](https://img.shields.io/badge/docker-compose-2496ED)
![CI](https://img.shields.io/badge/ci-passing-2da44e)
![License](https://img.shields.io/badge/license-proprietary-534AB7)

---

## Sobre o projeto

O **cogumelos.app** é um sistema SaaS voltado para produtores de cogumelos, com foco em gestão operacional, análise técnica e acompanhamento financeiro do cultivo.

A plataforma foi pensada para funcionar em modelo **multi-tenant**, garantindo isolamento de dados entre produtores e oferecendo recursos para acompanhamento de lotes, cálculo técnico de formulações e relatórios gerenciais.

---

## Telas

### 1. Relatório do produtor
Painel com indicadores de desempenho do cultivo, incluindo:

- eficiência biológica
- custo por kg
- margem
- colheita mensal
- sugestões baseadas no desempenho dos lotes

### 2. Experimentos / Lotes
Gestão visual do ciclo de produção com acompanhamento por lote:

- código do experimento
- espécie e formulação
- quantidade de blocos
- estágio atual
- progresso do lote
- resultado final com produção e receita

### 3. Calculadora C/N
Ferramenta para apoio técnico na formulação do substrato:

- cálculo em tempo real da relação C/N
- acompanhamento de pH e peso total
- visualização da contribuição de cada insumo
- indicação automática se a faixa está adequada para a espécie

---

## Stack

### Backend
- Java 21
- Spring Boot 3.2
- PostgreSQL 15
- Flyway
- JWT
- OAuth2 com Google
- arquitetura multi-tenant
- TrialFilter

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- PWA instalável

### Infra & DevOps
- Docker Compose
- GitHub Actions CI
- Nginx
- Let's Encrypt
- VPS Hostinger

### Qualidade
- JUnit 5
- Mockito
- Vitest
- Testing Library
- Gitleaks
- verificação de copyright na CI

---

## Arquitetura

```text
Browser / Mobile
        ↓
    Nginx + SSL
        ↓
     Next.js 14
        ↓
   proxy para API
        ↓
    Spring Boot
        ↓
    PostgreSQL
```

**Multi-tenant:** cada produtor possui dados isolados por `tenant_id` em todas as consultas.

---

## Funcionalidades

### Gestão de lotes
- pipeline de status:
  - Preparo
  - Inoculação
  - Amadurecimento
  - Frutificação
  - Concluído
- monitoramento de temperatura e umidade
- registro de colheitas com cálculo de EB

### Calculadora C/N
- cálculo em tempo real da relação C/N
- barras de contribuição por insumo
- rascunho salvo automaticamente

### Relatório avançado
- eficiência biológica por formulação
- projeção financeira dos lotes ativos
- correlação C/N × EB
- exportação para CSV

### SaaS multi-tenant
- login com email e senha
- login com Google OAuth2
- trial automático de 14 dias
- isolamento total entre produtores

---

## Setup local

```bash
# Clone e configure
git clone https://github.com/abillyp/cogumelos-v2
cd cogumelos-v2
cp .env.example .env  # edite com seus valores

# Suba todos os serviços
docker compose up -d

# Acesse
http://localhost:3000
```

---

## Objetivo do MVP

Este MVP foi desenhado para validar uma solução SaaS especializada no mercado de cultivo de cogumelos, oferecendo ao produtor:

- controle operacional dos lotes
- apoio técnico na formulação
- visibilidade financeira
- acompanhamento de desempenho produtivo

---

## Licença

Projeto **proprietário**.
