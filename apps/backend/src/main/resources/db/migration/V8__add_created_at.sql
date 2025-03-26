-- Adicionar coluna created_at à tabela imagens
ALTER TABLE imagens ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Adicionar coluna created_at à tabela anexos
ALTER TABLE anexos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;