CREATE TABLE IF NOT EXISTS experimento_fase (
     id                BIGSERIAL PRIMARY KEY,
     experimento_id VARCHAR(255)     NOT NULL REFERENCES experimentos(id) ON DELETE CASCADE,
     fase              VARCHAR(50)  NOT NULL DEFAULT 'PREPARACAO',
     inicio            DATE,
     fim               DATE,
     ciclo             INTEGER NOT NULL
);

ALTER TABLE experimentos
    ADD COLUMN IF NOT EXISTS fase_atual VARCHAR (50) NOT NULL DEFAULT 'PREPARACAO',
    ADD COLUMN IF NOT EXISTS total_blocos_perdidos INTEGER NOT NULL DEFAULT 0;

ALTER TABLE lote_monitoramentos
    ADD COLUMN IF NOT EXISTS blocos_perdidos INTEGER NOT NULL DEFAULT 0
