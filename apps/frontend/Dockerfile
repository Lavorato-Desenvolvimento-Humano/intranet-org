FROM node:18-slim
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install

COPY . .

WORKDIR /app/apps/frontend

RUN npm install tailwindcss postcss autoprefixer --save

RUN npm install next --save

RUN npx next build

RUN echo "Verificando o diretório node_modules/.bin:"
RUN ls -la node_modules/.bin/
RUN echo "Verificando o PATH:"
RUN echo $PATH

RUN sed -i 's/"start": "next start"/"start": "npx next start"/g' package.json

EXPOSE 3000

CMD ["npm", "run", "start"]