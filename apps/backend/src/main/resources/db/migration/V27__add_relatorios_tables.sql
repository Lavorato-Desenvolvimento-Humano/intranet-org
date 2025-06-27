-- Tabela principal de relatórios
CREATE TABLE relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    usuario_gerador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fim TIMESTAMP NOT NULL,
    filtros JSONB, -- Armazena os filtros aplicados
    total_registros INTEGER NOT NULL DEFAULT 0,
    dados_relatorio JSONB, -- Cache dos dados do relatório
    hash_compartilhamento VARCHAR(255) UNIQUE, -- Hash para link de compartilhamento
    status_relatorio VARCHAR(20) DEFAULT 'PROCESSANDO' CHECK (status_relatorio IN ('PROCESSANDO', 'CONCLUIDO', 'ERRO')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de compartilhamentos de relatórios
CREATE TABLE relatorios_compartilhamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id UUID NOT NULL REFERENCES relatorios(id) ON DELETE CASCADE,
    usuario_origem_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usuario_destino_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    observacao TEXT,
    data_compartilhamento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    visualizado BOOLEAN DEFAULT FALSE,
    data_visualizacao TIMESTAMP
);

-- Tabela para logs de geração de relatório (para auditoria)
CREATE TABLE relatorios_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id UUID NOT NULL REFERENCES relatorios(id) ON DELETE CASCADE,
    acao VARCHAR(50) NOT NULL, -- 'GERADO', 'COMPARTILHADO', 'VISUALIZADO', 'DOWNLOAD'
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    detalhes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_relatorios_usuario_gerador ON relatorios(usuario_gerador_id);
CREATE INDEX idx_relatorios_periodo ON relatorios(periodo_inicio, periodo_fim);
CREATE INDEX idx_relatorios_hash_compartilhamento ON relatorios(hash_compartilhamento);
CREATE INDEX idx_relatorios_status ON relatorios(status_relatorio);
CREATE INDEX idx_relatorios_created_at ON relatorios(created_at);

CREATE INDEX idx_compartilhamentos_relatorio ON relatorios_compartilhamentos(relatorio_id);
CREATE INDEX idx_compartilhamentos_origem ON relatorios_compartilhamentos(usuario_origem_id);
CREATE INDEX idx_compartilhamentos_destino ON relatorios_compartilhamentos(usuario_destino_id);
CREATE INDEX idx_compartilhamentos_data ON relatorios_compartilhamentos(data_compartilhamento);

CREATE INDEX idx_relatorios_logs_relatorio ON relatorios_logs(relatorio_id);
CREATE INDEX idx_relatorios_logs_usuario ON relatorios_logs(usuario_id);
CREATE INDEX idx_relatorios_logs_acao ON relatorios_logs(acao);
CREATE INDEX idx_relatorios_logs_created_at ON relatorios_logs(created_at);

-- Adicionar permissões para relatórios
INSERT INTO permissions (name, description)
VALUES
    ('relatorio:create', 'Permissão para gerar relatórios'),
    ('relatorio:read', 'Permissão para visualizar relatórios'),
    ('relatorio:share', 'Permissão para compartilhar relatórios'),
    ('relatorio:download', 'Permissão para baixar relatórios em PDF'),
    ('relatorio:view_all', 'Permissão para visualizar relatórios de todos os usuários'),
    ('relatorio:delete', 'Permissão para excluir relatórios');

-- Atribuir permissões aos papéis
-- Usuários básicos podem criar e compartilhar seus próprios relatórios
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'USER'
  AND p.name IN ('relatorio:create', 'relatorio:read', 'relatorio:share', 'relatorio:download')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Supervisores podem ver relatórios de suas equipes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUPERVISOR'
  AND p.name IN ('relatorio:create', 'relatorio:read', 'relatorio:share', 'relatorio:download', 'relatorio:view_all')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admins têm todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.name LIKE 'relatorio:%'
    ON CONFLICT (role_id, permission_id) DO NOTHING;