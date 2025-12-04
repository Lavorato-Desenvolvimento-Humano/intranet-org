-- 1. Criar a nova tabela de itens
CREATE TABLE IF NOT EXISTS guia_itens (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            guia_id UUID NOT NULL REFERENCES guias(id) ON DELETE CASCADE,
                            especialidade VARCHAR(255) NOT NULL,
                            quantidade_autorizada INTEGER NOT NULL,
                            quantidade_executada INTEGER DEFAULT 0
);

-- Criar índice para performance
CREATE INDEX idx_guia_itens_guia_id ON guia_itens(guia_id);

-- 2. Migrar os dados existentes (A PARTE CRÍTICA)
-- Utilizamos 'UNNEST' para transformar o array de especialidades em linhas.
-- Lógica: Atribuímos a quantidade total da guia para a PRIMEIRA especialidade encontrada.
-- As demais especialidades (se houverem na mesma guia) entram com quantidade 0 para não duplicar o saldo.
INSERT INTO guia_itens (guia_id, especialidade, quantidade_autorizada, quantidade_executada)
SELECT
    g.id,
    u.especialidade_texto,
    CASE
        WHEN u.nr_ordem = 1 THEN g.quantidade_autorizada
        ELSE 0
        END,
    0 -- quantidade executada começa zerada (ou você pode tentar inferir da quantidade_faturada se necessário)
FROM
    guias g,
    -- Expande o array ["Fono", "Psico"] em duas linhas numeradas (1, 2)
    LATERAL UNNEST(g.especialidades) WITH ORDINALITY AS u(especialidade_texto, nr_ordem);

-- 3. Remover as colunas antigas da tabela guias
-- Agora que os dados estão salvos em guia_itens, podemos remover com segurança
-- para resolver o erro de "not null constraint" que está quebrando o backend.
ALTER TABLE guias DROP COLUMN especialidades;
ALTER TABLE guias DROP COLUMN quantidade_autorizada;