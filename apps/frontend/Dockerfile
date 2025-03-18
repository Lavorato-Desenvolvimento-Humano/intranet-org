# Estágio de build
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar arquivos de package.json para instalação eficiente de dependências
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependências
RUN npm install

COPY . .

# Build do aplicativo Next.js
RUN cd apps/frontend && npm run build

# Estágio de produção
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Adicionar um usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar apenas os arquivos necessários para produção
COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next ./.next
RUN npm install --omit=dev

# Configurar permissões APÓS copiar os arquivos
RUN mkdir -p /app/.next/cache/images && \
    chown -R nextjs:nodejs /app/.next && \
    chmod -R 755 /app/.next/cache

# Definir usuário correto para aplicação
USER nextjs

EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]