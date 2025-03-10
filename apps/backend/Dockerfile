# Usa uma versão sem Alpine para evitar problemas de compatibilidade do Maven
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw  # Garante permissão para executar o wrapper do Maven
RUN ./mvnw dependency:go-offline  # Faz cache das dependências

COPY . .
RUN chmod +x mvnw  # Adiciona permissão novamente após a segunda cópia
RUN ./mvnw clean package -DskipTests

# Segunda etapa: Mantém o JDK para rodar o Spring Boot corretamente
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Cria diretório para armazenar imagens de perfil
RUN mkdir -p /app/uploads/images

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
EXPOSE 8443
CMD ["java", "-jar", "app.jar"]