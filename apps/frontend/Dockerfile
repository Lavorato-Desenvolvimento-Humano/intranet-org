# Usa uma versão mais estável para o Node.js
FROM node:18-slim
WORKDIR /app

# Copiamos apenas os arquivos de pacotes primeiro
COPY package.json package-lock.json ./

# Instala as dependências incluindo next
RUN npm install --frozen-lockfile --legacy-peer-deps
RUN npm install next

# Copiamos todo o resto
COPY . .

# Cria a pasta public se não existir
RUN mkdir -p public

# Verificação de binários
RUN echo "Path:" && echo $PATH
RUN echo "Which next:" && which next || echo "Next not in path"
RUN echo "NPX next:" && npx next --version || echo "Next not found with npx"
RUN echo "Verificando node_modules:" && ls -la node_modules/.bin/

EXPOSE 3000

# Usa npx para encontrar o next no node_modules
CMD ["npx", "next", "start"]