ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plano_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plano_check
    CHECK (plano IN ('BASICO', 'PRO', 'COMERCIAL'));