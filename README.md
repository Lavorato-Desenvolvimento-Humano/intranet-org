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
