FROM node:18-slim
WORKDIR /app

COPY apps/frontend/package.json apps/frontend/package-lock.json ./apps/frontend/

WORKDIR /app/apps/frontend/src

RUN npm install

COPY apps/frontend/ .
RUN npm install tailwindcss postcss autoprefixer --save

RUN npx next build

RUN ls -la

EXPOSE 3000

CMD ["npm", "run", "start"]
