-- V11__modify_postagens_structure.sql
-- Adicionar campos para suportar diferentes tipos de destino
ALTER TABLE postagens ADD COLUMN tipo_destino VARCHAR(20) NOT NULL DEFAULT 'convenio';
ALTER TABLE postagens ADD COLUMN equipe_id UUID NULL;

-- Adicionar chave estrangeira para equipes
ALTER TABLE postagens ADD CONSTRAINT fk_postagens_equipe
    FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE SET NULL;

-- Modificar a constraint do convenio_id para permitir NULL
ALTER TABLE postagens ALTER COLUMN convenio_id DROP NOT NULL;

-- Adicionar validação para tipo_destino
ALTER TABLE postagens ADD CONSTRAINT check_tipo_destino
    CHECK (tipo_destino IN ('geral', 'equipe', 'convenio'));

-- Adicionar validação para garantir que os campos apropriados estejam preenchidos
ALTER TABLE postagens ADD CONSTRAINT check_destino_fields
    CHECK (
        (tipo_destino = 'geral' AND convenio_id IS NULL AND equipe_id IS NULL) OR
        (tipo_destino = 'equipe' AND equipe_id IS NOT NULL AND convenio_id IS NULL) OR
        (tipo_destino = 'convenio' AND convenio_id IS NOT NULL AND equipe_id IS NULL)
        );

-- Adicionar índice para melhorar consultas por tipo de destino
CREATE INDEX idx_postagens_tipo_destino ON postagens(tipo_destino);
CREATE INDEX idx_postagens_equipe_id ON postagens(equipe_id);