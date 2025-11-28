-- V2__create_permissions_quotas_audit.sql

-- 1. Tabela de Permissões (RF01.2)
CREATE TABLE drive_files.file_permissions (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL, -- USER, ROLE, TEAM
    target_id VARCHAR(100) NOT NULL,  -- ID do user/team ou nome da role
    permission_type VARCHAR(20) NOT NULL, -- READ, WRITE, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_permission_file FOREIGN KEY (file_id) REFERENCES drive_files.files(id) ON DELETE CASCADE
);

CREATE INDEX idx_perm_file ON drive_files.file_permissions(file_id);
CREATE INDEX idx_perm_target ON drive_files.file_permissions(target_type, target_id);

-- 2. Tabela de Cotas (RF03)
CREATE TABLE drive_files.user_quotas (
    user_id BIGINT PRIMARY KEY,
    total_space_bytes BIGINT NOT NULL DEFAULT 1073741824, -- 1GB padrão
    used_space_bytes BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Auditoria (RF09)
CREATE TABLE drive_files.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    details TEXT,
   ip_address VARCHAR(45),
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON drive_files.audit_logs(user_id);
CREATE INDEX idx_audit_resource ON drive_files.audit_logs(resource_id);