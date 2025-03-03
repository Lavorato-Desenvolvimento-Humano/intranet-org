FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

RUN npm install tailwindcss postcss autoprefixer --save-dev

COPY . .

RUN echo "Diretório atual:" && pwd
RUN echo "Conteúdo do diretório:" && ls -la

RUN npm run build

RUN echo "Conteúdo após o build:" && ls -la
RUN echo "Verificando diretório .next:" && ls -la .next || echo ".next não encontrado"

EXPOSE 3000

CMD ["npm", "run", "start"]