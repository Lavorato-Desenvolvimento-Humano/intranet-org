# Estágio de dependências - apenas para instalar pacotes
FROM node:18-alpine AS deps
WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY turbo.json ./

# Instalar dependências usando ci para garantir reprodutibilidade
# Adicionando dependências explícitas mencionadas no CI/CD
RUN npm ci && \
    cd apps/frontend && \
    npm install lucide-react react-hot-toast axios && \
    npm install --save @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic && \
    npm install -D @tailwindcss/typography

# Estágio de build
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copiar apenas os arquivos necessários para o build
COPY turbo.json ./
COPY package.json package-lock.json ./
COPY apps/frontend ./apps/frontend

# Executar o build da aplicação
WORKDIR /app/apps/frontend
RUN npm run build

# Estágio de produção - imagem final mínima
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Adicionar usuário não-root para segurança (agrupando comandos RUN)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Aproveitar o modo standalone do Next.js que inclui tudo necessário para rodar a app
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/.next/standalone ./

# Configurar permissões corretas
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

EXPOSE 3000

# Usar diretamente o server.js gerado pelo modo standalone do Next.js
CMD ["node", "server.js"]