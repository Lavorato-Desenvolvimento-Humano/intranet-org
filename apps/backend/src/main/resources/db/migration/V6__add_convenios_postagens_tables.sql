-- Criação da tabela de convênios
CREATE TABLE convenios (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           name VARCHAR(255) NOT NULL,
                           description TEXT,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de postagens
CREATE TABLE postagens (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           title VARCHAR(255) NOT NULL,
                           text TEXT NOT NULL,
                           convenio_id UUID REFERENCES convenios(id) ON DELETE CASCADE,
                           created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de imagens
CREATE TABLE imagens (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         post_id UUID REFERENCES postagens(id) ON DELETE CASCADE,
                         url TEXT NOT NULL,
                         description TEXT
);

-- Criação da tabela de anexos
CREATE TABLE anexos (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        post_id UUID REFERENCES postagens(id) ON DELETE CASCADE,
                        name_file VARCHAR(255) NOT NULL,
                        type_file VARCHAR(50),
                        url TEXT NOT NULL
);

-- Criação da tabela de tabelas de postagens
CREATE TABLE tabelas_postagens (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   post_id UUID REFERENCES postagens(id) ON DELETE CASCADE,
                                   conteudo JSONB NOT NULL
);

-- Adicionar índices para melhorar a performance de consultas frequentes
CREATE INDEX idx_postagens_convenio_id ON postagens(convenio_id);
CREATE INDEX idx_postagens_created_by ON postagens(created_by);
CREATE INDEX idx_imagens_post_id ON imagens(post_id);
CREATE INDEX idx_anexos_post_id ON anexos(post_id);
CREATE INDEX idx_tabelas_postagens_post_id ON tabelas_postagens(post_id);

-- Inserir alguns convênios de exemplo
INSERT INTO convenios (name, description) VALUES
                                              ('Unimed', 'Convênio com a Unimed para atendimentos clínicos e especializados'),
                                              ('Amil', 'Convênio com a Amil para diversos procedimentos médicos'),
                                              ('Bradesco Saúde', 'Parceria completa com Bradesco Saúde'),
                                              ('Sul América', 'Convênio para atendimentos gerais e especializados');

-- Adicionar uma nova permissão para editor de conteúdo
INSERT INTO permissions (name, description) VALUES
    ('post:write', 'Permissão para criar e editar postagens');

-- Criar um papel de EDITOR
INSERT INTO roles (name, description) VALUES
    ('EDITOR', 'Editor de conteúdo do sistema');

-- Associar as permissões necessárias ao papel de EDITOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'EDITOR'),
    (SELECT id FROM permissions WHERE name = 'post:write')
UNION
SELECT
    (SELECT id FROM roles WHERE name = 'EDITOR'),
    (SELECT id FROM permissions WHERE name = 'user:read');

-- Associar a permissão de post:write ao ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    (SELECT id FROM permissions WHERE name = 'post:write')
    ON CONFLICT DO NOTHING;