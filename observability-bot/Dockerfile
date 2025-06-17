# observability-bot/Dockerfile
FROM openjdk:17-jdk-slim

# Metadados da imagem
LABEL maintainer="Lavorato Observability Team"
LABEL description="Discord Bot para Observabilidade do Sistema Lavorato"
LABEL version="1.0.0"

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    htop \
    procps \
    net-tools \
    postgresql-client \
    iproute2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root para segurança
RUN groupadd -r botuser && useradd -r -g botuser botuser

# Criar diretórios necessários
WORKDIR /app
RUN mkdir -p /app/logs && \
    chown -R botuser:botuser /app

# Copiar JAR já buildado (otimizado para GitHub Actions)
COPY target/discord-observability-bot-*.jar /app/observability-bot.jar

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Configurar JVM para container
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -Djava.security.egd=file:/dev/./urandom \
               -Dfile.encoding=UTF-8"

# Mudar para usuário não-root
USER botuser

# Expor porta para métricas e health checks
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/actuator/health || exit 1

# Comando para iniciar o bot
CMD ["sh", "-c", "java $JAVA_OPTS -jar observability-bot.jar"]