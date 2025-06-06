-- V23__add_unique_numbers_guias_fichas.sql

-- Primeiro, adicionar as colunas como NULLABLE
ALTER TABLE guias
    ADD COLUMN numero_guia VARCHAR(50);

ALTER TABLE fichas
    ADD COLUMN codigo_ficha VARCHAR(6);

-- Popular com valores temporários únicos para registros existentes
UPDATE guias
SET numero_guia = 'TEMP-' || SUBSTRING(id::text, 1, 8) || '-' || ROW_NUMBER() OVER (ORDER BY created_at)
WHERE numero_guia IS NULL;

UPDATE fichas
SET codigo_ficha = UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
WHERE codigo_ficha IS NULL;

ALTER TABLE guias
    ALTER COLUMN numero_guia SET NOT NULL;

ALTER TABLE fichas
    ALTER COLUMN codigo_ficha SET NOT NULL;

-- Adicionar as constraints UNIQUE
ALTER TABLE guias
    ADD CONSTRAINT uk_guias_numero_guia UNIQUE (numero_guia);

ALTER TABLE fichas
    ADD CONSTRAINT uk_fichas_codigo_ficha UNIQUE (codigo_ficha);

-- Criar índices para busca rápida
CREATE INDEX idx_guias_numero_guia ON guias(numero_guia);
CREATE INDEX idx_fichas_codigo_ficha ON fichas(codigo_ficha);