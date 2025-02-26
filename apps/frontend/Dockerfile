#Imagem node alpine otimizada
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários para o build
COPY package.json package-lock.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Gera o build otimizado
RUN npm run build

# Expõe a porta do Next.js
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "run", "start"]
