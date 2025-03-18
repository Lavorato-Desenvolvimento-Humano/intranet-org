-- Modificação do tipo da coluna id, se necessário
ALTER TABLE password_reset_tokens ALTER COLUMN id TYPE BIGINT;