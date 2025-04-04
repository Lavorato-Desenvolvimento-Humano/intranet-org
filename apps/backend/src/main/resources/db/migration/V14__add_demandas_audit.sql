-- Criação da tabela para auditoria de demandas
CREATE TABLE demandas_audit (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                demanda_id UUID NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
                                campo_alterado VARCHAR(100) NOT NULL,
                                valor_anterior TEXT,
                                valor_novo TEXT,
                                alterado_por UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                data_alteracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                operacao VARCHAR(20) NOT NULL
);

-- Índices para melhorar performance de consultas frequentes
CREATE INDEX idx_demandas_audit_demanda_id ON demandas_audit(demanda_id);
CREATE INDEX idx_demandas_audit_alterado_por ON demandas_audit(alterado_por);
CREATE INDEX idx_demandas_audit_operacao ON demandas_audit(operacao);
CREATE INDEX idx_demandas_audit_data_alteracao ON demandas_audit(data_alteracao);

-- Adicionar constraint para validar os tipos de operação
ALTER TABLE demandas_audit ADD CONSTRAINT check_operacao
    CHECK (operacao IN ('criacao', 'atualizacao', 'atribuicao', 'mudanca_status'));