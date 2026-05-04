-- ============================================================
-- V1 — Criação de todas as tabelas
-- ============================================================

CREATE TABLE tenants (
    id                BIGSERIAL PRIMARY KEY,
    nome              VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    plano             VARCHAR(50)  NOT NULL DEFAULT 'BASICO',
    status            VARCHAR(50)  NOT NULL DEFAULT 'TRIAL',
    trial_expira      DATE,
    assinatura_expira DATE,
    criado_em         TIMESTAMP
);

CREATE TABLE usuarios (
    id          VARCHAR(255) PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'PRODUTOR',
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   DATE         NOT NULL,
    tenant_id   BIGINT       NOT NULL REFERENCES tenants(id)
);

CREATE TABLE refresh_tokens (
    id          VARCHAR(255) PRIMARY KEY,
    token       VARCHAR(255) NOT NULL UNIQUE,
    usuario_id  VARCHAR(255) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em   TIMESTAMP    NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE especies_cogumelo (
    id        VARCHAR(255)   PRIMARY KEY,
    nome      VARCHAR(255)   NOT NULL UNIQUE,
    cn_min    DOUBLE PRECISION NOT NULL,
    cn_max    DOUBLE PRECISION NOT NULL,
    notas     VARCHAR(1000),
    tenant_id BIGINT         NOT NULL
);

CREATE TABLE insumos (
    id             VARCHAR(255)     PRIMARY KEY,
    nome           VARCHAR(255)     NOT NULL,
    mo_pct         DOUBLE PRECISION NOT NULL,
    carbono_pct    DOUBLE PRECISION NOT NULL,
    nitrogenio_pct DOUBLE PRECISION NOT NULL,
    cn_ratio       DOUBLE PRECISION,
    ph             DOUBLE PRECISION,
    categoria      VARCHAR(255),
    tenant_id      BIGINT           NOT NULL,
    CONSTRAINT uq_insumo_nome_tenant UNIQUE (nome, tenant_id)
);

CREATE TABLE formulacoes (
    id         VARCHAR(255)     PRIMARY KEY,
    usuario_id VARCHAR(255)     NOT NULL REFERENCES usuarios(id),
    especie_id VARCHAR(255)     NOT NULL REFERENCES especies_cogumelo(id),
    nome       VARCHAR(255)     NOT NULL,
    cn_total   DOUBLE PRECISION,
    ph_medio   DOUBLE PRECISION,
    criado_em  DATE             NOT NULL,
    status     VARCHAR(50)      NOT NULL DEFAULT 'RASCUNHO',
    tenant_id  BIGINT           NOT NULL
);

CREATE TABLE formulacao_insumos (
    id            VARCHAR(255)     PRIMARY KEY,
    formulacao_id VARCHAR(255)     NOT NULL REFERENCES formulacoes(id) ON DELETE CASCADE,
    insumo_id     VARCHAR(255)     NOT NULL REFERENCES insumos(id),
    peso_real_kg  DOUBLE PRECISION NOT NULL,
    umidade_pct   DOUBLE PRECISION NOT NULL,
    peso_seco_kg  DOUBLE PRECISION,
    ms_pct        DOUBLE PRECISION,
    mo_kg         DOUBLE PRECISION,
    c_kg          DOUBLE PRECISION,
    n_kg          DOUBLE PRECISION,
    tenant_id     BIGINT           NOT NULL
);

CREATE TABLE experimentos (
    id                    VARCHAR(255)     PRIMARY KEY,
    usuario_id            VARCHAR(255)     NOT NULL REFERENCES usuarios(id),
    formulacao_id         VARCHAR(255)     NOT NULL REFERENCES formulacoes(id),
    codigo                VARCHAR(255)     NOT NULL,
    data_preparo          DATE             NOT NULL,
    data_inoculacao       DATE,
    amadurecimento_inicio DATE,
    amadurecimento_fim    DATE,
    frutificacao_inicio   DATE,
    frutificacao_fim      DATE,
    total_blocos          INTEGER          NOT NULL,
    peso_bloco_kg         DOUBLE PRECISION,
    preco_venda_kg        DOUBLE PRECISION,
    tenant_id             BIGINT           NOT NULL,
    CONSTRAINT uq_experimento_codigo_tenant UNIQUE (codigo, tenant_id)
);

CREATE TABLE experimento_custos (
    id             VARCHAR(255)     PRIMARY KEY,
    experimento_id VARCHAR(255)     NOT NULL REFERENCES experimentos(id) ON DELETE CASCADE,
    insumo_id      VARCHAR(255)     NOT NULL REFERENCES insumos(id),
    custo_por_kg   DOUBLE PRECISION NOT NULL,
    tenant_id      BIGINT           NOT NULL
);

CREATE TABLE lote_monitoramentos (
    id             VARCHAR(255)     PRIMARY KEY,
    experimento_id VARCHAR(255)     NOT NULL REFERENCES experimentos(id) ON DELETE CASCADE,
    sala           VARCHAR(50)      NOT NULL,
    data           DATE             NOT NULL,
    temperatura    DOUBLE PRECISION,
    umidade        DOUBLE PRECISION,
    observacao     VARCHAR(500),
    tenant_id      BIGINT           NOT NULL
);

CREATE TABLE colheitas (
    id                 VARCHAR(255)     PRIMARY KEY,
    experimento_id     VARCHAR(255)     NOT NULL REFERENCES experimentos(id) ON DELETE CASCADE,
    data               DATE             NOT NULL,
    peso_total_kg      DOUBLE PRECISION NOT NULL,
    media_por_bloco_kg DOUBLE PRECISION,
    notas              VARCHAR(500),
    tenant_id          BIGINT           NOT NULL
);