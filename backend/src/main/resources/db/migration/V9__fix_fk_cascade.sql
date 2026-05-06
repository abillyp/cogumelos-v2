-- ============================================================
-- V9__fix_fk_cascade.sql
-- Remove FKs dinamicamente (qualquer nome) e recria com CASCADE
-- ============================================================

CREATE OR REPLACE FUNCTION drop_fk_if_exists(p_table text, p_column text) RETURNS void AS $$
DECLARE
    v_constraint text;
BEGIN
    FOR v_constraint IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                          AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = p_table
          AND kcu.column_name = p_column
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', p_table, v_constraint);
        END LOOP;
END;
$$ LANGUAGE plpgsql;

-- colheitas → experimentos
SELECT drop_fk_if_exists('colheitas', 'experimento_id');
ALTER TABLE colheitas ADD CONSTRAINT fk_colheitas_experimento
    FOREIGN KEY (experimento_id) REFERENCES experimentos(id) ON DELETE CASCADE;

-- experimento_custos → experimentos
SELECT drop_fk_if_exists('experimento_custos', 'experimento_id');
ALTER TABLE experimento_custos ADD CONSTRAINT fk_experimento_custos_experimento
    FOREIGN KEY (experimento_id) REFERENCES experimentos(id) ON DELETE CASCADE;

-- experimento_custos → insumos (sem cascade — dado mestre)
SELECT drop_fk_if_exists('experimento_custos', 'insumo_id');
ALTER TABLE experimento_custos ADD CONSTRAINT fk_experimento_custos_insumo
    FOREIGN KEY (insumo_id) REFERENCES insumos(id);

-- experimento_fase → experimentos
SELECT drop_fk_if_exists('experimento_fase', 'experimento_id');
ALTER TABLE experimento_fase ADD CONSTRAINT fk_experimento_fase_experimento
    FOREIGN KEY (experimento_id) REFERENCES experimentos(id) ON DELETE CASCADE;

-- experimentos → usuarios
SELECT drop_fk_if_exists('experimentos', 'usuario_id');
ALTER TABLE experimentos ADD CONSTRAINT fk_experimentos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- experimentos → formulacoes (sem cascade — dado mestre)
SELECT drop_fk_if_exists('experimentos', 'formulacao_id');
ALTER TABLE experimentos ADD CONSTRAINT fk_experimentos_formulacao
    FOREIGN KEY (formulacao_id) REFERENCES formulacoes(id);

-- formulacao_insumos → formulacoes
SELECT drop_fk_if_exists('formulacao_insumos', 'formulacao_id');
ALTER TABLE formulacao_insumos ADD CONSTRAINT fk_formulacao_insumos_formulacao
    FOREIGN KEY (formulacao_id) REFERENCES formulacoes(id) ON DELETE CASCADE;

-- formulacao_insumos → insumos (sem cascade — dado mestre)
SELECT drop_fk_if_exists('formulacao_insumos', 'insumo_id');
ALTER TABLE formulacao_insumos ADD CONSTRAINT fk_formulacao_insumos_insumo
    FOREIGN KEY (insumo_id) REFERENCES insumos(id);

-- formulacoes → especie (sem cascade — dado mestre)
SELECT drop_fk_if_exists('formulacoes', 'especie_id');
ALTER TABLE formulacoes ADD CONSTRAINT fk_formulacoes_especie
    FOREIGN KEY (especie_id) REFERENCES especies_cogumelo(id);

-- formulacoes → usuarios
SELECT drop_fk_if_exists('formulacoes', 'usuario_id');
ALTER TABLE formulacoes ADD CONSTRAINT fk_formulacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- lote_monitoramentos → experimentos
SELECT drop_fk_if_exists('lote_monitoramentos', 'experimento_id');
ALTER TABLE lote_monitoramentos ADD CONSTRAINT fk_lote_monitoramentos_experimento
    FOREIGN KEY (experimento_id) REFERENCES experimentos(id) ON DELETE CASCADE;

-- password_reset_tokens → usuarios
SELECT drop_fk_if_exists('password_reset_tokens', 'usuario_id');
ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_tokens_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- refresh_tokens → usuarios
SELECT drop_fk_if_exists('refresh_tokens', 'usuario_id');
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- usuarios → tenants
SELECT drop_fk_if_exists('usuarios', 'tenant_id');
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Remove função auxiliar
DROP FUNCTION drop_fk_if_exists(text, text);