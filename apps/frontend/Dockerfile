# Usa uma versão mais estável para o Node.js
FROM node:18-slim AS build
WORKDIR /app

# Debug - mostrar diretório atual
RUN pwd && ls -la

# Primeiro, copiamos apenas os arquivos de pacotes para aproveitar o cache
COPY package.json ./
COPY package-lock.json ./

# Debug - mostrar arquivos copiados
RUN ls -la

# Instala as dependências com --legacy-peer-deps para evitar conflitos
RUN npm install --frozen-lockfile --legacy-peer-deps

# Copiamos todos os arquivos do projeto frontend EXCETO node_modules
COPY .next ./.next
COPY src ./src
COPY next.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY next-env.d.ts ./
COPY eslint.config.mjs ./

# Debug - mostrar arquivos após cópia completa
RUN ls -la
RUN echo "Verificando .next:" && ls -la .next || echo ".next não encontrado"

# Etapa de produção - sem multi-stage para simplificar
RUN mkdir -p public

EXPOSE 3000
CMD ["npm", "start"]