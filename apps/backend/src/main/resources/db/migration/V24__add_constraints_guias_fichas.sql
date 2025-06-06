-- Tornar colunas obrigatórias
ALTER TABLE guias
    ALTER COLUMN numero_guia SET NOT NULL;

ALTER TABLE fichas
    ALTER COLUMN codigo_ficha SET NOT NULL;

-- Adicionar constraints unique
ALTER TABLE guias
    ADD CONSTRAINT uk_guias_numero_guia UNIQUE (numero_guia);

ALTER TABLE fichas
    ADD CONSTRAINT uk_fichas_codigo_ficha UNIQUE (codigo_ficha);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_guias_numero_guia ON guias(numero_guia);
CREATE INDEX IF NOT EXISTS idx_fichas_codigo_ficha ON fichas(codigo_ficha);