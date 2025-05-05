-- 1) Remover dependências de role_permissions e permissions
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE name LIKE 'demanda:%'
);

DELETE FROM permissions
WHERE name LIKE 'demanda:%';

-- 3) Apagar a tabela demandas (irá automaticamente remover FKs, índices e constraints)
DROP TABLE IF EXISTS demandas CASCADE;
