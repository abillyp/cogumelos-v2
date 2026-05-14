INSERT INTO insumos (id, nome, mo_pct, carbono_pct, nitrogenio_pct, cn_ratio, ph, categoria, tenant_id)
SELECT 'ins-15', 'Gesso', 0, 0, 0, null, null, 'Resíduo',
       (SELECT id FROM tenants WHERE email = 'sistema@cogumelos.app')
WHERE NOT EXISTS (
    SELECT 1 FROM insumos WHERE id = 'ins-15'
);