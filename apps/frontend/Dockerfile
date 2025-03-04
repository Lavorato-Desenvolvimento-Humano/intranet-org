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

# Debug: verificar se o next está instalado e onde está
RUN echo "Verificando next no diretório raiz:" && \
    ls -la ./node_modules/.bin/ | grep next || echo "next não encontrado na raiz" && \
    echo "Verificando next no diretório frontend:" && \
    ls -la ./apps/frontend/node_modules/.bin/ | grep next || echo "next não encontrado no frontend"

# Build do aplicativo Next.js - usando npx para garantir que o next seja encontrado
RUN cd apps/frontend && npx next build

EXPOSE 3000

# Usar npx para garantir que next seja encontrado
CMD ["sh", "-c", "cd apps/frontend && npx next start"]