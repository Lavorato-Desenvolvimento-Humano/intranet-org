-- Tabela Principal
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(20) NOT NULL,   -- OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED
    requester_id UUID NOT NULL REFERENCES users(id),
    assignee_id UUID REFERENCES users(id), -- Pode ser null
    target_team_id UUID REFERENCES equipes(id),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico/Interações
CREATE TABLE ticket_interactions (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id),
    user_id UUID REFERENCES users(id), -- Null se for evento de sistema
    type VARCHAR(20) NOT NULL, -- COMMENT, ATTACHMENT, SYSTEM_LOG
    content TEXT,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_sla_configs (
    priority VARCHAR(20) PRIMARY KEY, -- A Prioridade é a chave (LOW, HIGH, etc)
    sla_hours INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed inicial (Valores padrão)
INSERT INTO ticket_sla_configs (priority, sla_hours) VALUES
    ('LOW', 48),
    ('MEDIUM', 24),
    ('HIGH', 8),
    ('CRITICAL', 4);