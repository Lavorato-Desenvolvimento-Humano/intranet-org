# Estágio de build
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar arquivos de package.json para instalação eficiente de dependências
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependências
RUN npm install

# Copiar todo o código fonte
COPY . .

# Build do aplicativo Next.js com configuração standalone
RUN cd apps/frontend && npm run build

# Estágio de produção
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Adicionar um usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instalar Next.js explicitamente para garantir que esteja disponível
COPY --from=builder /app/apps/frontend/package.json ./package.json
RUN npm install next --production --no-save

# Copiar arquivos necessários do build standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

# Garantir permissões corretas
RUN chown -R nextjs:nodejs /app

# Definir usuário correto para aplicação
USER nextjs

EXPOSE 3000

# Comando para iniciar a aplicação standalone
CMD ["node", "server.js"]