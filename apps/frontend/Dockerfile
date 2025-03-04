FROM node:18-slim
WORKDIR /app

# Copiamos apenas os arquivos de pacotes primeiro
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/*/package.json ./packages/*/

# Instala as dependências incluindo dev
RUN npm install --include=dev

COPY . .

# Build do aplicativo Next.js usando npx
RUN cd apps/frontend && npx next build

EXPOSE 3000

# Usar npx para executar o next
CMD ["sh", "-c", "cd apps/frontend && npx next start"]