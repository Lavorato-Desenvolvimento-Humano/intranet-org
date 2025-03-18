-- Tabela para tokens de redefinição de senha
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY, -- Mantendo SERIAL que é compatível com Integer no Java
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índice para melhorar a busca por token
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Índice para buscar tokens por usuário
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);