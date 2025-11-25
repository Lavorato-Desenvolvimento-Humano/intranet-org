FROM eclipse-temurin:21-jre-jammy

# Metadados
LABEL maintainer="intranet-team" \
      service="drive-file-service" \
      version="1.0.0"

# Criar usuário não-root para segurança
RUN groupadd --system spring && \
    useradd --system --gid spring --create-home spring

WORKDIR /app

RUN mkdir -p /app/uploads /app/logs && \
    chown -R spring:spring /app

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0" \
    SPRING_PROFILES_ACTIVE=docker \
    TZ=America/Sao_Paulo

# Instalar timezone data e curl para health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    tzdata && \
    ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY target/drive-file-service-*.jar app.jar

# Alterar ownership do arquivo JAR
RUN chown spring:spring app.jar

# Mudar para usuário não-root
USER spring:spring

# Expor a porta do serviço
EXPOSE 8444

# Health check
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=60s \
            --retries=3 \
  CMD curl -f http://localhost:8444/api/drive/files/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]