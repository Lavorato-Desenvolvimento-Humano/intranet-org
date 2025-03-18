-- apps/backend/src/main/resources/db/migration/V3__add_email_verification.sql

-- Adicionar coluna para status de verificação na tabela users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Tabela para tokens de verificação de email
CREATE TABLE email_verification_tokens (
                                           id SERIAL PRIMARY KEY,
                                           token VARCHAR(255) NOT NULL UNIQUE,
                                           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                           expiry_date TIMESTAMP NOT NULL,
                                           used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índice para melhorar a busca por token
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Índice para buscar tokens por usuário
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);