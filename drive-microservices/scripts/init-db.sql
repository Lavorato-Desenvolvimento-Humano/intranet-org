-- scripts/init-db.sql

-- 1. Criação dos Schemas
CREATE SCHEMA IF NOT EXISTS drive_files;

-- O usuário drive_user já é criado pelo Docker via variáveis de ambiente,
-- então focamos nas permissões.

GRANT ALL PRIVILEGES ON SCHEMA drive_files TO drive_user;

-- 2. Configuração para garantir o search_path correto
ALTER USER drive_user SET search_path TO drive_files, public;

-- Conectar no schema correto para criar as tabelas
SET search_path TO drive_files;

-- 3. Tabela de Arquivos e Pastas (RF02.1 e RF06)
CREATE TABLE IF NOT EXISTS files (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    md5_hash VARCHAR(32) NOT NULL,
    folder_id BIGINT,
    owner_id BIGINT NOT NULL,
    owner_username VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT TRUE,
    parent_file_id BIGINT,
    download_count BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES files(id),
    CONSTRAINT fk_parent_version FOREIGN KEY (parent_file_id) REFERENCES files(id)
    );

CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_md5 ON files(md5_hash);

-- 4. Tabela de Permissões (RF01.2)
CREATE TABLE IF NOT EXISTS file_permissions (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL, -- USER, ROLE, TEAM
    target_id VARCHAR(100) NOT NULL,  -- ID do user/team ou nome da role
    permission_type VARCHAR(20) NOT NULL, -- READ, WRITE, ADMIN, SHARE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_permission_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

CREATE INDEX idx_perm_file ON file_permissions(file_id);
CREATE INDEX idx_perm_target ON file_permissions(target_type, target_id);

-- 5. Tabelas de Cotas e Auditoria (Estrutura básica para RF03 e RF09)
CREATE TABLE IF NOT EXISTS user_quotas (
     user_id BIGINT PRIMARY KEY,
     total_space_bytes BIGINT NOT NULL DEFAULT 1073741824, -- 1GB padrão
     used_space_bytes BIGINT NOT NULL DEFAULT 0,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );