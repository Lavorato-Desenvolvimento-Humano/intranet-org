FROM node:18-slim
WORKDIR /app

# Copiamos apenas os arquivos de pacotes primeiro
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/*/package.json ./packages/*/

# Instala as dependências incluindo dev
RUN npm install --include=dev

# Copiamos todo o resto
COPY . .

# Build do aplicativo Next.js
RUN npm run build

EXPOSE 3000

# Executa a aplicação
CMD ["npm", "run", "start"]