ALTER TABLE guias
    ADD COLUMN IF NOT EXISTS numero_guia VARCHAR(50);

ALTER TABLE fichas
    ADD COLUMN IF NOT EXISTS codigo_ficha VARCHAR(6);

-- Popular com valores temporários
UPDATE guias
SET numero_guia = 'TEMP-' || SUBSTRING(id::text, 1, 8) || '-' || ROW_NUMBER() OVER (ORDER BY created_at)
WHERE numero_guia IS NULL;

UPDATE fichas
SET codigo_ficha = UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
WHERE codigo_ficha IS NULL;