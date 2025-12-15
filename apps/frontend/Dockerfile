FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia a pasta public
COPY --chown=nextjs:nodejs apps/frontend/public ./public

# Copia os arquivos estáticos e o servidor standalone gerado pelo Next.js
# Nota: O modo standalone gera uma pasta com as dependências necessárias (node_modules) minimizadas
COPY --from=context --chown=nextjs:nodejs apps/frontend/.next/standalone ./
COPY --from=context --chown=nextjs:nodejs apps/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]