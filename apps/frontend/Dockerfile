# Usa uma versão mais estável para o Node.js
FROM node:18-slim
WORKDIR /app

# Copiamos apenas os arquivos de pacotes primeiro
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/*/package.json ./packages/*/

# Instala as dependências incluindo next
RUN npm install --include=dev

# Copiamos todo o resto
COPY . .

RUN echo "Verificando Tailwind:" && npm list tailwindcss || npm install -D tailwindcss postcss autoprefixer

# Cria a pasta public se não existir
RUN mkdir -p public

# Build do aplicativo Next.js - ESTA É A ETAPA CRUCIAL QUE ESTAVA FALTANDO
RUN ls -la .next || echo "Pasta .next não encontrada!"
RUN npx next build

# Verificação de binários (opcional, pode ser removido em produção)
RUN echo "Path:" && echo $PATH
RUN echo "Which next:" && which next || echo "Next not in path"
RUN echo "NPX next:" && npx next --version || echo "Next not found with npx"
RUN echo "Verificando node_modules:" && ls -la node_modules/.bin/
RUN echo "Verificando .next:" && ls -la .next || echo ".next não encontrado"

EXPOSE 3000

# Usa npx para encontrar o next no node_modules
CMD ["npm", "run", "start"]