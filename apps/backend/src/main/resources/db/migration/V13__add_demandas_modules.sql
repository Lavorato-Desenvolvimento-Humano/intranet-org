-- Criação da tabela de demandas
CREATE TABLE demandas (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          titulo VARCHAR(100) NOT NULL,
                          descricao TEXT,
                          data_inicio TIMESTAMP,
                          data_fim TIMESTAMP,
                          criado_por UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                          atribuido_para UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                          status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                          prioridade VARCHAR(30) NOT NULL DEFAULT 'media',
                          criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          atualizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance de consultas frequentes
CREATE INDEX idx_demandas_criado_por ON demandas(criado_por);
CREATE INDEX idx_demandas_atribuido_para ON demandas(atribuido_para);
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_data_inicio ON demandas(data_inicio);
CREATE INDEX idx_demandas_data_fim ON demandas(data_fim);

-- Adicionar constraint para validar os valores de status
ALTER TABLE demandas ADD CONSTRAINT check_status
    CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada'));

-- Adicionar constraint para validar os valores de prioridade
ALTER TABLE demandas ADD CONSTRAINT check_prioridade
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

-- Adicionar validação para garantir que a data de início seja anterior à data de fim
ALTER TABLE demandas ADD CONSTRAINT check_datas
    CHECK (data_inicio IS NULL OR data_fim IS NULL OR data_inicio <= data_fim);

-- Adicionar novas permissões para o módulo de demandas
INSERT INTO permissions (name, description)
VALUES
    ('demanda:create', 'Permissão para criar demandas'),
    ('demanda:read', 'Permissão para ler demandas'),
    ('demanda:update', 'Permissão para atualizar demandas'),
    ('demanda:delete', 'Permissão para excluir demandas'),
    ('demanda:assign', 'Permissão para atribuir demandas a outros usuários');

-- Atribuir permissões aos papéis existentes

-- Administradores têm todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions
WHERE name LIKE 'demanda:%';

-- Usuários comuns podem criar, ler e atualizar suas próprias demandas
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'USER'),
    id
FROM permissions
WHERE name IN ('demanda:create', 'demanda:read', 'demanda:update');

-- Criar o papel de SUPERVISOR
INSERT INTO roles (name, description)
VALUES ('SUPERVISOR', 'Supervisor com permissões estendidas para gerenciar equipes e demandas')
    ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões ao papel de supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
    id
FROM permissions
WHERE name LIKE 'demanda:%';

-- Criar o papel de GERENTE
INSERT INTO roles (name, description)
VALUES ('GERENTE', 'Gerente com permissões para visualizar todos os dados e gerenciar demandas')
    ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões ao papel de gerente
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'GERENTE'),
    id
FROM permissions
WHERE name LIKE 'demanda:%';