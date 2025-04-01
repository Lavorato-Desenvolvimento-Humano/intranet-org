CREATE TABLE equipes (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         nome VARCHAR(255) NOT NULL,
                         descricao TEXT,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de associação entre usuários e equipes
CREATE TABLE user_equipes (
                              id SERIAL PRIMARY KEY,
                              user_id UUID NOT NULL,
                              equipe_id UUID NOT NULL,
                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                              FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
                              UNIQUE (user_id, equipe_id)
);

-- Adicionar índices para melhorar performance
CREATE INDEX idx_user_equipes_user_id ON user_equipes(user_id);
CREATE INDEX idx_user_equipes_equipe_id ON user_equipes(equipe_id);