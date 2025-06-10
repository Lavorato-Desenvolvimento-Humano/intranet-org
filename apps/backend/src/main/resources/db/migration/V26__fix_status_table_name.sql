-- Corrigir estrutura da tabela de status

-- Remover tabela antiga se existir
DROP TABLE IF EXISTS status_management CASCADE;

-- Recriar tabela com nome correto
CREATE TABLE status_guias (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              status VARCHAR(50) NOT NULL UNIQUE,
                              descricao TEXT,
                              ativo BOOLEAN NOT NULL DEFAULT TRUE,
                              ordem_exibicao INTEGER,
                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar índices para otimização
CREATE INDEX idx_status_guias_ativo ON status_guias(ativo);
CREATE INDEX idx_status_guias_ordem ON status_guias(ordem_exibicao);
CREATE INDEX idx_status_guias_status ON status_guias(status);

-- Inserir dados iniciais dos status para guias e fichas
INSERT INTO status_guias (status, descricao, ordem_exibicao) VALUES
    ('EMITIDO', 'Guia ou ficha foi emitida', 1),
    ('SUBIU', 'Subiu para análise', 2),
    ('ANALISE', 'Em processo de análise', 3),
    ('CANCELADO', 'Cancelado pelo sistema', 4),
    ('SAIU', 'Saiu da agenda', 5),
    ('RETORNOU', 'Retornou para a recepção', 6),
    ('NAO USOU', 'Não foi utilizado', 7),
    ('ASSINADO', 'Foi assinado completamente pelo responsável', 8),
    ('FATURADO', 'Processo de faturamento concluído', 9),
    ('ENVIADO A BM', 'Enviado para BM', 10),
    ('DEVOLVIDO BM', 'Devolvido pela BM', 11),
    ('PERDIDA', 'Guia perdida', 12);

-- Adicionar constraint para validar status válidos
ALTER TABLE status_guias ADD CONSTRAINT check_status_valid
    CHECK (status IN ('EMITIDO', 'SUBIU', 'ANALISE', 'CANCELADO', 'SAIU',
                      'RETORNOU', 'NAO USOU', 'ASSINADO', 'FATURADO',
                      'ENVIADO A BM', 'DEVOLVIDO BM', 'PERDIDA'));