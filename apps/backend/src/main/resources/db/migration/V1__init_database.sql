-- Criação das tabelas

-- Tabela de usuários (users)
CREATE TABLE users (
                       id UUID PRIMARY KEY,
                       full_name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash TEXT NOT NULL,
                       github_id VARCHAR(255) UNIQUE,
                       profile_image VARCHAR(255),
                       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de funções (roles)
CREATE TABLE roles (
                       id SERIAL PRIMARY KEY,
                       name VARCHAR(50) NOT NULL UNIQUE,
                       description TEXT
);

-- Tabela de permissões (permissions)
CREATE TABLE permissions (
                             id SERIAL PRIMARY KEY,
                             name VARCHAR(50) NOT NULL UNIQUE,
                             description TEXT
);

-- Tabela de relacionamento entre usuários e funções (user_roles)
CREATE TABLE user_roles (
                            id SERIAL PRIMARY KEY,
                            user_id UUID NOT NULL,
                            role_id INTEGER NOT NULL,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                            UNIQUE (user_id, role_id)
);

-- Tabela de relacionamento entre funções e permissões (role_permissions)
CREATE TABLE role_permissions (
                                  id SERIAL PRIMARY KEY,
                                  role_id INTEGER NOT NULL,
                                  permission_id INTEGER NOT NULL,
                                  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                                  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                                  UNIQUE (role_id, permission_id)
);

-- Inserção de dados iniciais

-- Funções padrão
INSERT INTO roles (name, description)
VALUES
    ('ADMIN', 'Administrador do sistema com acesso completo'),
    ('USER', 'Usuário regular do sistema');

-- Permissões
INSERT INTO permissions (name, description)
VALUES
    ('user:read', 'Permissão para ler dados de usuários'),
    ('user:write', 'Permissão para criar e editar usuários'),
    ('user:delete', 'Permissão para excluir usuários'),
    ('role:read', 'Permissão para ler funções'),
    ('role:write', 'Permissão para criar e editar funções'),
    ('role:delete', 'Permissão para excluir funções');

-- Associações de permissões para as funções
-- Admin tem todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions;

-- User tem permissões limitadas
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ((SELECT id FROM roles WHERE name = 'USER'), (SELECT id FROM permissions WHERE name = 'user:read'));