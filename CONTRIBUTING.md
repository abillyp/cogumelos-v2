# Fluxo de trabalho Git — cogumelos.app

## Estrutura de branches

```
main          ← produção (VPS) — protegida, só aceita merge via PR
develop       ← integração — base para novas features
feature/*     ← novas funcionalidades (ex: feature/relatorio-avancado)
fix/*         ← correções de bug (ex: fix/cn-ratio-nulo)
hotfix/*      ← correção urgente em produção
```

## Regras da branch main (configurar no GitHub)

- Nenhum push direto — obrigatoriamente via Pull Request
- Requer pelo menos 1 aprovação no PR
- CI deve passar antes do merge
- Branch protegida contra force push e delete

## Fluxo padrão

```bash
# 1. Sempre parte da develop
git checkout develop
git pull origin develop

# 2. Cria branch da feature
git checkout -b feature/nome-da-feature

# 3. Desenvolve e commita
git add .
git commit -m "feat: descrição clara do que foi feito"

# 4. Sobe para o remote
git push origin feature/nome-da-feature

# 5. Abre PR: feature → develop (nunca direto para main)
# 6. Depois de testado em develop, PR: develop → main
```

## Convenção de commits (Conventional Commits)

| Tipo | Quando usar |
|------|-------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `security:` | Correção de segurança |
| `refactor:` | Refatoração sem mudança de comportamento |
| `test:` | Adição ou ajuste de testes |
| `docs:` | Documentação |
| `chore:` | Configuração, dependências, CI |

Exemplos:
```
feat: adiciona gráfico de eficiência biológica no relatório
fix: corrige cn_ratio nulo em insumos inseridos via seed
security: restringe CORS ao domínio do frontend
test: adiciona testes de integração do AuthController
```

## O que NUNCA commitar

- Arquivo `.env` com valores reais
- Senhas, tokens, API keys
- Certificados SSL (.pem, .key)
- Dados de clientes ou tenants reais
- Arquivos de dump do banco (.sql.gz, .dump)

Use `.env.example` como template — ele mostra quais variáveis existem sem expor os valores.
