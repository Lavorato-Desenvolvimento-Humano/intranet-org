# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

# Primeiro, copiamos apenas os arquivos de pacotes para aproveitar o cache
COPY package.json package-lock.json ./

# Instala as dependências com --legacy-peer-deps para evitar conflitos
RUN npm install --frozen-lockfile --legacy-peer-deps

# Copiamos todos os arquivos do projeto frontend
COPY . .

# Cria pastas que podem não existir
RUN mkdir -p public

# Executa o build
RUN npm run build

# Etapa de produção
FROM node:18-slim AS runtime
WORKDIR /app

# Cria todas as pastas necessárias
RUN mkdir -p .next public

# Copia os arquivos necessários para a execução (com tratamento de erro)
COPY --from=build /app/.next/ /app/.next/ || true
COPY --from=build /app/public/ /app/public/ || true
COPY --from=build /app/package.json /app/
COPY --from=build /app/node_modules/ /app/node_modules/

# Tenta copiar o arquivo de configuração do Next.js se existir
COPY --from=build /app/next.config.* /app/ 2>/dev/null || true

EXPOSE 3000
CMD ["npm", "start"]