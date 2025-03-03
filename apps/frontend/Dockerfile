# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

# Primeiro, copiamos apenas os arquivos de pacotes para aproveitar o cache
COPY package.json package-lock.json ./

# Instala as dependências com --legacy-peer-deps para evitar conflitos
RUN npm install --frozen-lockfile --legacy-peer-deps

# Copiamos todos os arquivos do projeto frontend
COPY . .

# Executa o build
RUN npm run build

# Etapa de produção
FROM node:18-slim AS runtime
WORKDIR /app

# Copia os arquivos necessários para a execução
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/next.config.ts /app/next.config.ts
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["npm", "start"]