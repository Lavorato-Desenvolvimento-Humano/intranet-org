-- Adiciona campos para controle de tempo e qualidade
ALTER TABLE tickets
ADD COLUMN closed_at TIMESTAMP,
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN rating_comment TEXT;

-- Indexar para deixar o Dashboard rápido
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_closed_at ON tickets(closed_at);
CREATE INDEX idx_tickets_status ON tickets(status);