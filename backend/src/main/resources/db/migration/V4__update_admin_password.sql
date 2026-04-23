-- V4: atualiza senha do admin padrão
-- Gerado em 2026-04-23
UPDATE usuarios
SET senha_hash = '$2b$10$MXhNN738Zj/0yprgq3i4vORVgcA/mSzUJOzblPlXorqI0c/mV5iN2'
WHERE email = 'admin@cogumelos.app';
