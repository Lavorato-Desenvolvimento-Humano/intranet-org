-- Tabela de Templates de Status
CREATE TABLE workflow_status_templates (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                           name VARCHAR(100) NOT NULL,
                                           description TEXT,
                                           created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Status individuais dentro de um template
CREATE TABLE workflow_status_items (
                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       template_id UUID NOT NULL REFERENCES workflow_status_templates(id) ON DELETE CASCADE,
                                       name VARCHAR(100) NOT NULL,
                                       description TEXT,
                                       color VARCHAR(20) NOT NULL DEFAULT '#808080', -- Cor padrão cinza
                                       order_index INT NOT NULL,
                                       is_initial BOOLEAN NOT NULL DEFAULT false, -- Indica se é o status inicial
                                       is_final BOOLEAN NOT NULL DEFAULT false, -- Indica se é um status final (concluído/cancelado/etc)
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna na tabela de workflows para vincular ao template de status
ALTER TABLE workflows ADD COLUMN status_template_id UUID NULL REFERENCES workflow_status_templates(id);

-- Adicionar coluna na tabela de workflows para o status atual personalizado
ALTER TABLE workflows ADD COLUMN custom_status_id UUID NULL REFERENCES workflow_status_items(id);

-- Índices para melhorar performance
CREATE INDEX idx_workflow_status_templates_created_by ON workflow_status_templates(created_by);
CREATE INDEX idx_workflow_status_items_template_id ON workflow_status_items(template_id);
CREATE INDEX idx_workflows_status_template_id ON workflows(status_template_id);
CREATE INDEX idx_workflows_custom_status_id ON workflows(custom_status_id);

-- Adicionar novas permissões
INSERT INTO permissions (name, description)
VALUES
    ('workflow_status:manage', 'Permissão para gerenciar templates de status de fluxos');

-- Atribuir permissões aos papéis existentes
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    (SELECT id FROM permissions WHERE name = 'workflow_status:manage');

-- Adicionar a mesma permissão para supervisores
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
    (SELECT id FROM permissions WHERE name = 'workflow_status:manage');