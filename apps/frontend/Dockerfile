FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY . .

RUN npm install
RUN npm install -D tailwindcss postcss autoprefixer

RUN echo "Diretório de trabalho:" && pwd
RUN echo "Conteúdo:" && ls -la
RUN echo "Node.js version:" && node -v
RUN echo "NPM version:" && npm -v
RUN echo "Tailwind version:" && npx tailwindcss --version

RUN echo "Next config:" && cat next.config.ts

RUN NODE_OPTIONS="--max-old-space-size=4096" npx next build || echo "Build falhou"

CMD ["npm", "run", "dev"]