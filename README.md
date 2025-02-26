# Documentação do projeto

## Organização dos pacotes

1. github:
   - github/workflows - Configuração das pipelines de CI/CD
2. apps:
   - backend - Spring Boot(Java)
   - frontend - Next.js (Typescript)
3. packages:
   - shared: DTOS, validadores e configurações compartilhadas
4. src:
   - .gitignore: Arquivos ignorados do github
   - .npmrc: Configurações do npm
   - package\*.json: configurações globais do monorepo
   - turbo.json: configuração do turborepo
   - readme: documentação do projeto

## Organização dos pacotes do Front-End

1. public:
   - Arquivos estáticos (imagens, favicons, etc)
2. src:
   - Código-fonte principal do projeto
3. app:
   - Páginas e rotas do next.js
4. components:
   - components reutilizáveis
5. hooks:
   - Hooks customizados (useState, useEffect, etc...)
6. lib:
   - funções utilitárias e configurações globais
7. services:
   - requisições HTTP para APIs externas/backend
8. styles:
   - arquivos de estilo
9. types:
   - tipagens TypeScript
10. context:

- Context API
