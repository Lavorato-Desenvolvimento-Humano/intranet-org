# Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Copia apenas os arquivos essenciais para instalar as dependências
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copia o restante do código e executa o build
COPY . .
RUN npm run build

# Etapa de execução no Node.js
FROM node:18-alpine
WORKDIR /app

# Copia apenas os arquivos necessários da etapa de build
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm install --production

COPY --from=build /app /app

# Define a porta que o Next.js rodará
EXPOSE 3000

# Comando para iniciar o servidor Next.js
CMD ["npm", "run", "start"]


FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]