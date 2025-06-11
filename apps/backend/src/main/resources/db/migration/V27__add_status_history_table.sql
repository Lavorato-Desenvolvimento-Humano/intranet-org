-- Criação da tabela para histórico de mudanças de status

CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tipo de entidade (GUIA ou FICHA)
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('GUIA', 'FICHA')),

    -- ID da entidade (guia_id ou ficha_id)
    entity_id UUID NOT NULL,

    -- Status anterior e novo
    status_anterior VARCHAR(100),
    status_novo VARCHAR(100) NOT NULL,

    -- Motivo da mudança (opcional)
    motivo TEXT,

    -- Observações adicionais
    observacoes TEXT,

    -- Usuário responsável pela mudança
    alterado_por UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Data e hora da alteração
    data_alteracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Campos para auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance de consultas frequentes
CREATE INDEX idx_status_history_entity_type ON status_history(entity_type);
CREATE INDEX idx_status_history_entity_id ON status_history(entity_id);
CREATE INDEX idx_status_history_alterado_por ON status_history(alterado_por);
CREATE INDEX idx_status_history_data_alteracao ON status_history(data_alteracao);
CREATE INDEX idx_status_history_status_novo ON status_history(status_novo);

-- Índice composto para consultas por entidade específica
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id, data_alteracao DESC);

-- Adicionar novas permissões para o módulo de histórico de status
INSERT INTO permissions (name, description)
VALUES
    ('status_history:read', 'Permissão para ler histórico de status'),
    ('status_history:write', 'Permissão para registrar mudanças de status'),
    ('status_history:delete', 'Permissão para excluir histórico de status');

-- Atribuir permissões aos papéis existentes
-- Administradores têm todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.name IN ('status_history:read', 'status_history:write', 'status_history:delete')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Supervisores podem ler e escrever histórico
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUPERVISOR'
  AND p.name IN ('status_history:read', 'status_history:write')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gerentes podem ler e escrever histórico
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'GERENTE'
  AND p.name IN ('status_history:read', 'status_history:write')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Editores podem ler e escrever histórico
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'EDITOR'
  AND p.name IN ('status_history:read', 'status_history:write')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Usuários comuns podem apenas ler histórico
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'USER'
  AND p.name = 'status_history:read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;