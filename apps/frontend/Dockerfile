# Estágio de build usando uma imagem completa
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar todo o projeto para o estágio de build
COPY apps/frontend ./

# Instalar todas as dependências (incluindo dev)
# Usando 'npm install' em vez de 'npm ci' para evitar problemas de sincronização
RUN npm install

# Garantir que o Next.js use o modo standalone
RUN grep -q '"output": *"standalone"' next.config.js || \
    sed -i 's/const nextConfig = {/const nextConfig = {\n  output: "standalone",/' next.config.js

# Executar o build da aplicação
ENV NODE_ENV=production
RUN npm run build

# Estágio de produção - imagem mínima
FROM node:18-alpine AS runner
WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar apenas o necessário do estágio de build
# Se standalone estiver funcionando, use:
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Se standalone não estiver funcionando, descomente estas linhas e comente as de cima
# COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Usuário não-root
USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
# Use este para modo standalone:
CMD ["node", "server.js"]

# Use este se standalone não estiver funcionando:
# CMD ["npm", "start"]