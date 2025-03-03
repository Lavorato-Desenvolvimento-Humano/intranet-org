FROM node:18-slim

WORKDIR /app/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./

RUN npm install
RUN npm install tailwindcss postcss autoprefixer --save

COPY apps/frontend/ ./

RUN ls -la

RUN npx next build

RUN ls -la .next || echo ".next directory not found"

EXPOSE 3000

CMD ["npm", "run", "start"]