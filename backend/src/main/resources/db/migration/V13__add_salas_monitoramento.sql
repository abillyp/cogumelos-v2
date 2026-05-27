-- V13__add_salas_monitoramento.sql

ALTER TABLE lote_monitoramentos
    DROP CONSTRAINT IF EXISTS lote_monitoramentos_sala_check;

ALTER TABLE lote_monitoramentos
    ADD CONSTRAINT lote_monitoramentos_sala_check
        CHECK (sala IN ('PREPARACAO', 'INOCULACAO', 'AMADURECIMENTO', 'FRUTIFICACAO', 'DESCANSO'));