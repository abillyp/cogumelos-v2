CREATE TABLE password_reset_tokens (
                                       id VARCHAR(36) PRIMARY KEY,
                                       token VARCHAR(255) NOT NULL UNIQUE,
                                       usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
                                       expira_em TIMESTAMP NOT NULL,
                                       usado BOOLEAN NOT NULL DEFAULT FALSE,
                                       criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);