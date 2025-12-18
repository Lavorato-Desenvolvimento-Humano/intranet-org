-- Adicionar colunas na tabela postagens
ALTER TABLE postagens ADD COLUMN categoria VARCHAR(20) DEFAULT 'GERAL';
ALTER TABLE postagens ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE postagens ADD COLUMN views_count BIGINT DEFAULT 0;

-- Criar tabela de comentários
CREATE TABLE postagem_comentarios (
    id UUID NOT NULL,
    text TEXT NOT NULL,
    postagem_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_postagem_comentarios PRIMARY KEY (id),
    CONSTRAINT fk_comentarios_postagem FOREIGN KEY (postagem_id) REFERENCES postagens(id),
    CONSTRAINT fk_comentarios_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criar tabela de reações
CREATE TABLE postagem_reacoes (
    id UUID NOT NULL,
    postagem_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_postagem_reacoes PRIMARY KEY (id),
    CONSTRAINT fk_reacoes_postagem FOREIGN KEY (postagem_id) REFERENCES postagens(id),
    CONSTRAINT fk_reacoes_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_reacoes_user_post UNIQUE (postagem_id, user_id)
);