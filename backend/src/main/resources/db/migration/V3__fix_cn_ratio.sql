-- V3: recalcula cn_ratio para insumos inseridos via seed (sem passar pelo JPA)
-- O campo é calculado pelo @PrePersist/@PreUpdate mas o seed inseriu direto via SQL

UPDATE insumos
SET cn_ratio = carbono_pct / nitrogenio_pct
WHERE cn_ratio IS NULL
  AND nitrogenio_pct IS NOT NULL
  AND nitrogenio_pct > 0;
