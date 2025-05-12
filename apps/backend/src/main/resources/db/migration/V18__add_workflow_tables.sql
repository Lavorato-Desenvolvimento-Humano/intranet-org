-- apps/backend/src/main/resources/db/migration/V18__add_workflow_tables.sql

-- Tabela de Templates de Fluxos
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public, restricted, team
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Etapas dos Templates
CREATE TABLE workflow_template_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    step_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fluxos (Instâncias de Templates)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, paused, completed, canceled, archived
    visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public, restricted, team
    deadline TIMESTAMP,
    team_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step INT NOT NULL DEFAULT 1,
    progress_percentage INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Atribuições de Etapas (quem está responsável por cada etapa do fluxo)
CREATE TABLE workflow_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Transições
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    from_step INT,
    to_step INT,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    transition_type VARCHAR(20) NOT NULL, -- assignment, status_change, step_change
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE workflow_notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     title VARCHAR(100) NOT NULL,
     message TEXT NOT NULL,
     type VARCHAR(20) NOT NULL, -- assignment, deadline, status_change
     read BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_workflow_templates_created_by ON workflow_templates(created_by);
CREATE INDEX idx_workflow_template_steps_template_id ON workflow_template_steps(template_id);
CREATE INDEX idx_workflows_template_id ON workflows(template_id);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_team_id ON workflows(team_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_assignments_workflow_id ON workflow_assignments(workflow_id);
CREATE INDEX idx_workflow_assignments_assigned_to ON workflow_assignments(assigned_to);
CREATE INDEX idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);
CREATE INDEX idx_workflow_notifications_workflow_id ON workflow_notifications(workflow_id);
CREATE INDEX idx_workflow_notifications_user_id ON workflow_notifications(user_id);
CREATE INDEX idx_workflow_notifications_read ON workflow_notifications(read);

-- Adicionar constraints para validar valores
ALTER TABLE workflow_templates ADD CONSTRAINT check_template_visibility
    CHECK (visibility IN ('public', 'restricted', 'team'));

ALTER TABLE workflows ADD CONSTRAINT check_workflow_priority
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE workflows ADD CONSTRAINT check_workflow_status
    CHECK (status IN ('in_progress', 'paused', 'completed', 'canceled', 'archived'));

ALTER TABLE workflows ADD CONSTRAINT check_workflow_visibility
    CHECK (visibility IN ('public', 'restricted', 'team'));

ALTER TABLE workflow_assignments ADD CONSTRAINT check_assignment_status
    CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Adicionar permissões
INSERT INTO permissions (name, description)
VALUES
    ('workflow:create', 'Permissão para criar fluxos de trabalho'),
    ('workflow:read', 'Permissão para ler fluxos de trabalho'),
    ('workflow:update', 'Permissão para atualizar fluxos de trabalho'),
    ('workflow:delete', 'Permissão para excluir fluxos de trabalho'),
    ('workflow:manage', 'Permissão para gerenciar templates de fluxos de trabalho'),
    ('workflow:assign', 'Permissão para atribuir etapas de fluxos a outros usuários');

-- Atribuir permissões aos papéis existentes
-- Administradores têm todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions
WHERE name LIKE 'workflow:%';

-- Supervisores podem gerenciar fluxos de trabalho
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
    id
FROM permissions
WHERE name LIKE 'workflow:%';

-- Usuários comuns podem criar, ler e atualizar fluxos
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'USER'),
    id
FROM permissions
WHERE name IN ('workflow:create', 'workflow:read', 'workflow:update', 'workflow:assign');