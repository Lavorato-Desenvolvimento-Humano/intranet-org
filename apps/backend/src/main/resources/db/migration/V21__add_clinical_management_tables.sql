-- V21__add_clinical_management_tables.sql

-- Tabela de Pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    responsavel VARCHAR(255),
    convenio_id UUID NOT NULL REFERENCES convenios(id) ON DELETE RESTRICT,
    unidade VARCHAR(10) NOT NULL CHECK (unidade IN ('KIDS', 'SENIOR')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Guias
CREATE TABLE guias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    especialidades TEXT[] NOT NULL, -- Array de especialidades
    quantidade_autorizada INTEGER NOT NULL CHECK (quantidade_autorizada > 0),
    convenio_id UUID NOT NULL REFERENCES convenios(id) ON DELETE RESTRICT,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020),
    validade DATE NOT NULL,
    lote VARCHAR(100),
    quantidade_faturada INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_faturada >= 0),
    valor_reais DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_reais >= 0),
    usuario_responsavel UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fichas
CREATE TABLE fichas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guia_id UUID NOT NULL REFERENCES guias(id) ON DELETE CASCADE,
    especialidade VARCHAR(100) NOT NULL,
    quantidade_autorizada INTEGER NOT NULL CHECK (quantidade_autorizada > 0),
    convenio_id UUID NOT NULL REFERENCES convenios(id) ON DELETE RESTRICT,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020),
    usuario_responsavel UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Constraint para garantir que uma ficha tenha apenas uma guia
    UNIQUE(guia_id, especialidade)
);

-- Índices para melhorar performance
CREATE INDEX idx_pacientes_nome ON pacientes(nome);
CREATE INDEX idx_pacientes_convenio_id ON pacientes(convenio_id);
CREATE INDEX idx_pacientes_unidade ON pacientes(unidade);
CREATE INDEX idx_pacientes_data_nascimento ON pacientes(data_nascimento);

CREATE INDEX idx_guias_paciente_id ON guias(paciente_id);
CREATE INDEX idx_guias_convenio_id ON guias(convenio_id);
CREATE INDEX idx_guias_mes_ano ON guias(mes, ano);
CREATE INDEX idx_guias_validade ON guias(validade);
CREATE INDEX idx_guias_usuario_responsavel ON guias(usuario_responsavel);

CREATE INDEX idx_fichas_guia_id ON fichas(guia_id);
CREATE INDEX idx_fichas_convenio_id ON fichas(convenio_id);
CREATE INDEX idx_fichas_especialidade ON fichas(especialidade);
CREATE INDEX idx_fichas_mes_ano ON fichas(mes, ano);
CREATE INDEX idx_fichas_usuario_responsavel ON fichas(usuario_responsavel);

-- Adicionar novas permissões para o módulo clínico
INSERT INTO permissions (name, description)
VALUES
    ('paciente:create', 'Permissão para criar pacientes'),
    ('paciente:read', 'Permissão para ler dados de pacientes'),
    ('paciente:update', 'Permissão para atualizar dados de pacientes'),
    ('paciente:delete', 'Permissão para excluir pacientes'),
    ('guia:create', 'Permissão para criar guias'),
    ('guia:read', 'Permissão para ler guias'),
    ('guia:update', 'Permissão para atualizar guias'),
    ('guia:delete', 'Permissão para excluir guias'),
    ('ficha:create', 'Permissão para criar fichas'),
    ('ficha:read', 'Permissão para ler fichas'),
    ('ficha:update', 'Permissão para atualizar fichas'),
    ('ficha:delete', 'Permissão para excluir fichas');

-- Atribuir permissões aos papéis existentes

-- Administradores têm todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions
WHERE name LIKE 'paciente:%' OR name LIKE 'guia:%' OR name LIKE 'ficha:%';

-- Supervisores têm todas as permissões clínicas
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
    id
FROM permissions
WHERE name LIKE 'paciente:%' OR name LIKE 'guia:%' OR name LIKE 'ficha:%';

-- Gerentes têm todas as permissões clínicas
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'GERENTE'),
    id
FROM permissions
WHERE name LIKE 'paciente:%' OR name LIKE 'guia:%' OR name LIKE 'ficha:%';

-- Editores podem criar e editar, mas não excluir
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'EDITOR'),
    id
FROM permissions
WHERE name LIKE 'paciente:create' OR name LIKE 'paciente:read' OR name LIKE 'paciente:update'
   OR name LIKE 'guia:create' OR name LIKE 'guia:read' OR name LIKE 'guia:update'
   OR name LIKE 'ficha:create' OR name LIKE 'ficha:read' OR name LIKE 'ficha:update';

-- Usuários comuns podem apenas ler
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'USER'),
    id
FROM permissions
WHERE name LIKE 'paciente:read' OR name LIKE 'guia:read' OR name LIKE 'ficha:read';