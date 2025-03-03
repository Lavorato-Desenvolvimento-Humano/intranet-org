# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

# Copiar apenas os arquivos de configuração primeiro para aproveitar o cache
COPY package.json package-lock.json ./
COPY .eslintrc.json .eslintrc.js* ./  
COPY next.config.js tsconfig.json* ./  

# Instala as dependências com --legacy-peer-deps para evitar conflitos
RUN npm install --frozen-lockfile --legacy-peer-deps

# Copiar o restante dos arquivos do projeto
COPY . .

# Executa o build
RUN npm run build

# Etapa de produção
FROM node:18-slim AS runtime
WORKDIR /app

COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package-lock.json /app/
COPY --from=build /app/next.config.js /app/
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["npm", "start"]