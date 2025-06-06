-- V22__allow_fichas_without_guias.sql
ALTER TABLE fichas
    ALTER COLUMN guia_id DROP NOT NULL;

-- Adicionar campo para identificar fichas independentes
ALTER TABLE fichas
    ADD COLUMN tipo_ficha VARCHAR(20) DEFAULT 'COM_GUIA'
        CHECK (tipo_ficha IN ('COM_GUIA', 'ASSINATURA'));

-- Adicionar referência direta ao paciente para fichas independentes
ALTER TABLE fichas
    ADD COLUMN paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE;

-- Índice para buscar fichas por paciente
CREATE INDEX idx_fichas_paciente_id ON fichas(paciente_id);