FROM node:18-slim
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalamos dependências do monorepo
RUN npm install

COPY . .

WORKDIR /app/apps/frontend

# Garantimos que o Tailwind e outras dependências de build estão instaladas
RUN npm install tailwindcss postcss autoprefixer --save

RUN npx next build

EXPOSE 3000

CMD ["npx", "next", "start"]