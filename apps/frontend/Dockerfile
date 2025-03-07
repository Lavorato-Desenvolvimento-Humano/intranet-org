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

# Build do aplicativo Next.js (já configurado para standalone)
RUN cd apps/frontend && npm run build

# Estágio de produção
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Adicionar um usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar apenas os arquivos necessários da build standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

# Definir usuário correto para aplicação
USER nextjs

EXPOSE 3000

# Comando para iniciar a aplicação standalone
CMD ["node", "server.js"]