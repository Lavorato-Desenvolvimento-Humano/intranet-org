FROM node:18-slim
WORKDIR /app

# Copiamos apenas os arquivos de pacotes primeiro
COPY package.json package-lock.json ./

# Instala as dependências incluindo next
RUN npm install --legacy-peer-deps
RUN npm install next tailwindcss postcss autoprefixer --save

COPY . .

RUN mkdir -p public

RUN ls -la .next || echo "Pasta .next não encontrada!"
RUN npx next build

RUN echo "Path:" && echo $PATH
RUN echo "Which next:" && which next || echo "Next not in path"
RUN echo "NPX next:" && npx next --version || echo "Next not found with npx"
RUN echo "Verificando node_modules:" && ls -la node_modules/.bin/
RUN echo "Verificando .next:" && ls -la .next || echo ".next não encontrado"

EXPOSE 3000

CMD ["npm", "run", "start"]