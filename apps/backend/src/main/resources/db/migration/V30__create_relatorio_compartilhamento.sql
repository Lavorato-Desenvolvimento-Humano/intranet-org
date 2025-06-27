-- Migration para criar tabela de compartilhamento de relatórios

-- Criar tabela de compartilhamentos de relatórios
CREATE TABLE relatorio_compartilhamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    dados_relatorio TEXT NOT NULL,
    usuario_origem UUID NOT NULL,
    usuario_destino UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    observacao TEXT,
    observacao_resposta TEXT,
    data_compartilhamento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_relatorio_usuario_origem FOREIGN KEY (usuario_origem) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_relatorio_usuario_destino FOREIGN KEY (usuario_destino) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_status_valido CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'REJEITADO')),
    CONSTRAINT check_usuarios_diferentes CHECK (usuario_origem != usuario_destino)
);

-- Índices para otimização de consultas
CREATE INDEX idx_relatorio_comp_usuario_origem ON relatorio_compartilhamentos(usuario_origem);
CREATE INDEX idx_relatorio_comp_usuario_destino ON relatorio_compartilhamentos(usuario_destino);
CREATE INDEX idx_relatorio_comp_status ON relatorio_compartilhamentos(status);
CREATE INDEX idx_relatorio_comp_data_compartilhamento ON relatorio_compartilhamentos(data_compartilhamento);
CREATE INDEX idx_relatorio_comp_pendentes ON relatorio_compartilhamentos(usuario_destino, status) WHERE status = 'PENDENTE';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_relatorio_compartilhamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_relatorio_compartilhamentos_updated_at
    BEFORE UPDATE ON relatorio_compartilhamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_relatorio_compartilhamentos_updated_at();

-- Comentários para documentação
COMMENT ON TABLE relatorio_compartilhamentos IS 'Tabela para armazenar compartilhamentos de relatórios entre usuários';
COMMENT ON COLUMN relatorio_compartilhamentos.titulo IS 'Título do relatório compartilhado';
COMMENT ON COLUMN relatorio_compartilhamentos.dados_relatorio IS 'Dados do relatório em formato JSON';
COMMENT ON COLUMN relatorio_compartilhamentos.usuario_origem IS 'Usuário que compartilhou o relatório';
COMMENT ON COLUMN relatorio_compartilhamentos.usuario_destino IS 'Usuário que recebeu o compartilhamento';
COMMENT ON COLUMN relatorio_compartilhamentos.status IS 'Status do compartilhamento: PENDENTE, CONFIRMADO, REJEITADO';
COMMENT ON COLUMN relatorio_compartilhamentos.observacao IS 'Observação do remetente ao compartilhar';
COMMENT ON COLUMN relatorio_compartilhamentos.observacao_resposta IS 'Observação do destinatário ao responder';
COMMENT ON COLUMN relatorio_compartilhamentos.data_compartilhamento IS 'Data e hora do compartilhamento';
COMMENT ON COLUMN relatorio_compartilhamentos.data_resposta IS 'Data e hora da resposta (confirmação/rejeição)';

-- Inserir permissões relacionadas a relatórios
INSERT INTO permissions (name, description) VALUES
    ('relatorio:read', 'Permissão para ler relatórios'),
    ('relatorio:create', 'Permissão para criar relatórios'),
    ('relatorio:share', 'Permissão para compartilhar relatórios'),
    ('relatorio:respond', 'Permissão para responder compartilhamentos'),
    ('relatorio:delete', 'Permissão para excluir compartilhamentos'),
    ('relatorio:admin', 'Permissão administrativa para relatórios')
    ON CONFLICT (name) DO NOTHING;

-- Associar permissões de relatórios aos roles existentes
-- Admin tem todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    p.id
FROM permissions p
WHERE p.name LIKE 'relatorio:%'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User tem permissões básicas de relatórios
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'USER'),
    p.id
FROM permissions p
WHERE p.name IN ('relatorio:read', 'relatorio:create', 'relatorio:share', 'relatorio:respond')
    ON CONFLICT (role_id, permission_id) DO NOTHING;