-- V22__add_unique_numbers_guias_fichas.sql

-- Adicionar número único para Guias
ALTER TABLE guias
    ADD COLUMN numero_guia VARCHAR(50) UNIQUE NOT NULL;

-- Criar índice para busca rápida
CREATE INDEX idx_guias_numero_guia ON guias(numero_guia);

-- Adicionar código único para Fichas
ALTER TABLE fichas
    ADD COLUMN codigo_ficha VARCHAR(6) UNIQUE NOT NULL;

-- Criar índice para busca rápida
CREATE INDEX idx_fichas_codigo_ficha ON fichas(codigo_ficha);

-- Popular registros existentes com valores temporários
UPDATE guias SET numero_guia = 'TEMP-' || id::text WHERE numero_guia IS NULL;
UPDATE fichas SET codigo_ficha = SUBSTRING(id::text, 1, 6) WHERE codigo_ficha IS NULL;