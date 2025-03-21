-- Criação da tabela de valores para convênios
CREATE TABLE tabela_valores (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                nome VARCHAR(255) NOT NULL,
                                descricao TEXT,
                                conteudo JSONB NOT NULL,
                                convenio_id UUID NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
                                created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar índices para melhorar a performance de consultas frequentes
CREATE INDEX idx_tabela_valores_convenio_id ON tabela_valores(convenio_id);
CREATE INDEX idx_tabela_valores_created_by ON tabela_valores(created_by);

-- Adicionar permissão para gerenciar tabelas de valores
INSERT INTO permissions (name, description) VALUES
    ('tabela:write', 'Permissão para criar e editar tabelas de valores');

-- Adicionar essa permissão para ADMINs e EDITORs
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    (SELECT id FROM permissions WHERE name = 'tabela:write')
    ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'EDITOR'),
    (SELECT id FROM permissions WHERE name = 'tabela:write')
    ON CONFLICT DO NOTHING;