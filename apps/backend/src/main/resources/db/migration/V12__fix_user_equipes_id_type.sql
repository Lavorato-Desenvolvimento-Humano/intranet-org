-- Alteração do tipo da coluna id em user_equipes de SERIAL para BIGINT
-- Primeiro, precisamos remover o valor padrão (sequência)
ALTER TABLE user_equipes ALTER COLUMN id DROP DEFAULT;

-- Em seguida, podemos alterar o tipo da coluna
ALTER TABLE user_equipes ALTER COLUMN id TYPE BIGINT;

-- Recriar a sequência com tipo BIGINT
CREATE SEQUENCE IF NOT EXISTS user_equipes_id_seq AS BIGINT;
ALTER TABLE user_equipes ALTER COLUMN id SET DEFAULT nextval('user_equipes_id_seq');
ALTER SEQUENCE user_equipes_id_seq OWNED BY user_equipes.id;

-- Atualizar a sequência para começar a partir do valor máximo atual + 1
SELECT setval('user_equipes_id_seq', COALESCE((SELECT MAX(id) FROM user_equipes), 0) + 1, false);