-- 1. Limpeza preventiva: Remove a tabela se ela existir (para corrigir definições incorretas anteriores)
DROP TABLE IF EXISTS guia_itens;

-- 2. Criar a tabela guia_itens CORRETAMENTE (com gen_random_uuid())
CREATE TABLE guia_itens (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- IMPORTANTE: Este default gera o ID
                            guia_id UUID NOT NULL REFERENCES guias(id) ON DELETE CASCADE,
                            especialidade VARCHAR(255) NOT NULL,
                            quantidade_autorizada INTEGER NOT NULL,
                            quantidade_executada INTEGER DEFAULT 0
);

-- Criar índice para performance
CREATE INDEX idx_guia_itens_guia_id ON guia_itens(guia_id);

-- 3. Migrar os dados existentes
-- A query abaixo não define o 'id', então o banco usará o gen_random_uuid() definido acima
INSERT INTO guia_itens (guia_id, especialidade, quantidade_autorizada, quantidade_executada)
SELECT
    g.id,
    u.especialidade_texto,
    CASE
        WHEN u.nr_ordem = 1 THEN g.quantidade_autorizada
        ELSE 0
        END,
    0
FROM
    guias g,
    LATERAL UNNEST(g.especialidades) WITH ORDINALITY AS u(especialidade_texto, nr_ordem);

-- 4. Remover as colunas antigas da tabela guias
-- (Se as colunas já tiverem sido removidas em uma tentativa anterior que falhou parcialmente,
--  o PostgreSQL pode dar erro. Vamos usar IF EXISTS para segurança).
ALTER TABLE guias DROP COLUMN IF EXISTS especialidades;
ALTER TABLE guias DROP COLUMN IF EXISTS quantidade_autorizada;