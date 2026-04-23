-- ============================================================
-- V2 — Dados iniciais
-- ============================================================

-- Tenant de sistema (usado para catálogos globais)
INSERT INTO tenants (nome, email, plano, status, criado_em)
VALUES ('Sistema', 'sistema@cogumelos.app', 'BASICO', 'ATIVO', NOW());

-- Admin da plataforma (senha: admin123)
INSERT INTO usuarios (id, nome, email, senha_hash, role, ativo, criado_em, tenant_id)
VALUES (
    'usr-admin',
    'Administrador',
    'admin@cogumelos.app',
    '$2a$10$GNKLSttJBjUVXBdk2WBxqubLAjb3yFTLLXQLuw/knpENqhs9AR6Ta',
    'ADMIN',
    TRUE,
    '2024-01-01',
    (SELECT id FROM tenants WHERE email = 'sistema@cogumelos.app')
);

-- Espécies de cogumelo (catálogo global)
WITH tid AS (SELECT id FROM tenants WHERE email = 'sistema@cogumelos.app')
INSERT INTO especies_cogumelo (id, nome, cn_min, cn_max, notas, tenant_id)
SELECT * FROM (VALUES
    ('esp-01', 'Shimeji (Pleurotus)',  60.0, 100.0, 'Espécie mais comum no Brasil.'),
    ('esp-02', 'Shiitake',             70.0, 100.0, 'Prefere substratos à base de madeira dura.'),
    ('esp-03', 'Juba de Leão',         70.0, 100.0, 'Espécie medicinal. Sensível a contaminações.'),
    ('esp-04', 'Ganoderma',            70.0, 100.0, 'Cogumelo medicinal. Ciclo mais longo.'),
    ('esp-05', 'Chestnut e Nameko',    60.0, 100.0, 'Preferem temperaturas mais baixas.')
) AS v(id, nome, cn_min, cn_max, notas)
CROSS JOIN tid;

-- Insumos padrão (catálogo de referência — copiado para cada novo tenant no registro)
WITH tid AS (SELECT id FROM tenants WHERE email = 'sistema@cogumelos.app')
INSERT INTO insumos (id, nome, mo_pct, carbono_pct, nitrogenio_pct, ph, categoria, tenant_id)
SELECT * FROM (VALUES
    ('ins-01', 'Bagaço de Cana Novo',    0.903,  0.5000, 0.0040, NULL, 'Gramínea'),
    ('ins-02', 'Braquiária',             0.824,  0.4800, 0.0070,  6.1, 'Gramínea'),
    ('ins-03', 'Cana Moída sem Garapa',  0.920,  0.5100, 0.0140,  4.8, 'Gramínea'),
    ('ins-04', 'Capim Elefante (Napie)', 0.9112, 0.2627, 0.0057,  7.0, 'Gramínea'),
    ('ins-05', 'Capim Tifton',           0.9239, 0.5133, 0.0184,  5.7, 'Gramínea'),
    ('ins-06', 'Farelo de Algodão',      0.932,  0.5200, 0.0600,  5.9, 'Farelo'),
    ('ins-07', 'Farelo de Arroz',        0.881,  0.4900, 0.0220,  4.9, 'Farelo'),
    ('ins-08', 'Farelo de Trigo',        0.951,  0.5286, 0.0296,  6.0, 'Farelo'),
    ('ins-09', 'Palha de Arroz',         0.8581, 0.4768, 0.0082,  7.2, 'Palha'),
    ('ins-10', 'Palha de Trigo',         0.952,  0.5300, 0.0040,  5.8, 'Palha'),
    ('ins-11', 'Resíduo de Algodão',     0.9594, 0.5330, 0.0082,  6.3, 'Resíduo'),
    ('ins-12', 'Torta de Mamona',        0.728,  0.4000, 0.0610,  6.4, 'Farelo'),
    ('ins-13', 'Borra de Café',          0.904,  0.5000, 0.0240,  6.0, 'Resíduo'),
    ('ins-14', 'Serragem de Eucalipto',  0.9500, 0.5290, 0.0010,  4.3, 'Madeira')
) AS v(id, nome, mo_pct, carbono_pct, nitrogenio_pct, ph, categoria)
CROSS JOIN tid;