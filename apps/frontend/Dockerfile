# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

# Etapa de produção
FROM node:18-slim AS runtime
WORKDIR /app

COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package-lock.json /app/
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["npm", "start"]
