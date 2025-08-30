-- scripts/init-db.sql
-- Criar esquemas para cada microserviço
CREATE SCHEMA IF NOT EXISTS drive_files;
CREATE SCHEMA IF NOT EXISTS drive_folders;
CREATE SCHEMA IF NOT EXISTS drive_permissions;
CREATE SCHEMA IF NOT EXISTS drive_quotas;
CREATE SCHEMA IF NOT EXISTS drive_audit;

-- Usuário para cada serviço (opcional, pode usar o mesmo)
GRANT ALL PRIVILEGES ON SCHEMA drive_files TO drive_user;
GRANT ALL PRIVILEGES ON SCHEMA drive_folders TO drive_user;
GRANT ALL PRIVILEGES ON SCHEMA drive_permissions TO drive_user;
GRANT ALL PRIVILEGES ON SCHEMA drive_quotas TO drive_user;
GRANT ALL PRIVILEGES ON SCHEMA drive_audit TO drive_user;