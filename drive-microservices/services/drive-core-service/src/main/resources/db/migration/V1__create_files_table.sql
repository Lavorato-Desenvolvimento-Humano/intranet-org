CREATE SCHEMA IF NOT EXISTS drive_files;

-- Tabela de arquivos
CREATE TABLE drive_files.files (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    md5_hash VARCHAR(32) NOT NULL,
    folder_id BIGINT,
    owner_id BIGINT NOT NULL,
    owner_username VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_current_version BOOLEAN NOT NULL DEFAULT true,
    parent_file_id BIGINT,
    download_count BIGINT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Índices
    CONSTRAINT fk_files_parent FOREIGN KEY (parent_file_id) REFERENCES drive_files.files(id)
);

-- Índices para performance
CREATE INDEX idx_files_owner_id ON drive_files.files(owner_id) WHERE is_deleted = false;
CREATE INDEX idx_files_folder_id ON drive_files.files(folder_id) WHERE is_deleted = false;
CREATE INDEX idx_files_md5_hash ON drive_files.files(md5_hash);
CREATE INDEX idx_files_storage_key ON drive_files.files(storage_key);
CREATE INDEX idx_files_name ON drive_files.files(name) WHERE is_deleted = false;
CREATE INDEX idx_files_current_version ON drive_files.files(is_current_version) WHERE is_deleted = false;
CREATE INDEX idx_files_created_at ON drive_files.files(created_at);

-- Comentários
COMMENT ON TABLE drive_files.files IS 'Tabela principal de arquivos do drive';
COMMENT ON COLUMN drive_files.files.storage_key IS 'Chave única no sistema de storage (MinIO)';
COMMENT ON COLUMN drive_files.files.md5_hash IS 'Hash MD5 para integridade e deduplicação';
COMMENT ON COLUMN drive_files.files.version IS 'Versão do arquivo para controle de versionamento';
COMMENT ON COLUMN drive_files.files.is_current_version IS 'Indica se é a versão atual do arquivo';