FROM node:18-alpine AS builder
WORKDIR /app

# 1. Copiar APENAS arquivos de dependência primeiro
# Ajuste os caminhos conforme a estrutura da raiz do seu monorepo se necessário
COPY apps/frontend/package.json apps/frontend/package-lock.json ./

# 2. Instalar dependências (Isso agora será cacheado se package.json não mudar)
RUN npm install

# 3. Copiar o restante do código fonte
COPY apps/frontend ./

# Ajuste do next.config.js (mantido do seu original)
RUN grep -q '"output": *"standalone"' next.config.js || \
    sed -i 's/const nextConfig = {/const nextConfig = {\n  output: "standalone",/' next.config.js

# 4. Build da aplicação
ENV NODE_ENV=production
RUN npm run build

# --- Estágio Runner (mantido similar ao seu) ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia os artefatos do estágio builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]