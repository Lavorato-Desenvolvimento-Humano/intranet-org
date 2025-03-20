-- Adicionar coluna active na tabela users com valor padrão true
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;