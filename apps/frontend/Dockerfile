# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

# Primeiro, copiamos apenas o package.json e package-lock.json para aproveitar o cache
COPY package.json package-lock.json* ./

# Instala as dependências com --legacy-peer-deps para evitar conflitos
RUN npm install --frozen-lockfile --legacy-peer-deps

# Agora copiamos todos os arquivos do projeto (incluindo next.config.ts)
COPY . .

# Executa o build
RUN npm run build

# Etapa de produção
FROM node:18-slim AS runtime
WORKDIR /app

COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package-lock.json* /app/
COPY --from=build /app/next.config.ts* /app/ 2>/dev/null || : /
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["npm", "start"]