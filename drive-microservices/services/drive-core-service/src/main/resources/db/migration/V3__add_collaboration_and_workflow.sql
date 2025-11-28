-- V3__add_collaboration_and_workflow.sql

-- Adiciona status de workflow na tabela de arquivos (RF11)
ALTER TABLE drive_files.files
    ADD COLUMN approval_status VARCHAR(20) DEFAULT 'APPROVED'; -- PENDING, APPROVED, REJECTED

-- Tabela de Comentários (RF10.1)
CREATE TABLE drive_files.file_comments (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id BIGINT, -- Para respostas aninhadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_comment_file FOREIGN KEY (file_id) REFERENCES drive_files.files(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES drive_files.file_comments(id)
);

-- Tabela de Links de Compartilhamento (RF10.2)
CREATE TABLE drive_files.share_links (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE, -- Token aleatório para URL
    password_hash VARCHAR(255), -- Senha opcional
    expires_at TIMESTAMP WITH TIME ZONE,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_share_file FOREIGN KEY (file_id) REFERENCES drive_files.files(id) ON DELETE CASCADE
);

CREATE INDEX idx_share_token ON drive_files.share_links(token);