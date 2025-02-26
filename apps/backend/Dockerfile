#Usando a imagem padrão do jdk: menos otimizada, dev
FROM openjdk:17-jdk-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o arquivo JAR do backend para o container
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expõe a porta 8080 para acesso ao backend
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["java", "-jar", "app.jar"]