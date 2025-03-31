# Estágio de build usando uma imagem completa
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar apenas dependências necessárias para o build
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci --only=production

# Copiar apenas os arquivos essenciais para o build
COPY apps/frontend/next.config.js ./
COPY apps/frontend/public ./public
COPY apps/frontend/src ./src
COPY apps/frontend/tailwind.config.js ./
COPY apps/frontend/postcss.config.js ./
COPY apps/frontend/tsconfig.json ./

# Garantir que o Next.js use o modo standalone
RUN grep -q '"output":\s*"standalone"' next.config.js || \
    sed -i 's/const nextConfig = {/const nextConfig = {\n  output: "standalone",/' next.config.js

# Executar o build da aplicação
ENV NODE_ENV=production
RUN npm run build

# Estágio de produção - imagem final extremamente reduzida
FROM node:18-alpine AS runner
WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar diretório para armazenar a aplicação
RUN mkdir -p /app && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copiar apenas o necessário do estágio de build
# Standalone cria um diretório .next/standalone com tudo necessário
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Usuário não-root
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]