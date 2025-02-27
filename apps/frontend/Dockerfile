# Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Copia apenas os arquivos essenciais para instalar as dependências
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copia o restante do código e executa o build
COPY . .
RUN npm run build

# Etapa de produção (imagem final ultra leve)
FROM gcr.io/distroless/nodejs18 AS runtime
WORKDIR /app

# Copia apenas os arquivos essenciais para rodar o app
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package-lock.json /app/
COPY --from=build /app/node_modules /app/node_modules

# Define a porta e inicia o servidor Next.js
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
