-- Alterar o tipo da coluna type_file para aumentar o tamanho
ALTER TABLE anexos
ALTER COLUMN type_file TYPE varchar(100);