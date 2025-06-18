package com.lavorato.observability;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Aplicação principal do Bot Discord para Observabilidade
 *
 * Este bot monitora:
 * - Status do backend Spring Boot
 * - Métricas de sistema (CPU, Memória, Disco)
 * - Logs de autenticação e erros
 * - Performance de APIs
 * - Status do banco de dados
 * - Alertas em tempo real via Discord
 */
@Slf4j
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class DiscordObservabilityBotApplication {

    public static void main(String[] args) {
        try {
            log.info("=== INICIANDO DISCORD OBSERVABILITY BOT ===");
            log.info("Versão: 1.0.0");
            log.info("Ambiente: {}", System.getenv("SPRING_PROFILES_ACTIVE"));
            log.info("Timezone: {}", System.getProperty("user.timezone"));

            SpringApplication.run(DiscordObservabilityBotApplication.class, args);

            log.info("=== BOT INICIADO COM SUCESSO ===");
        } catch (Exception e) {
            log.error("Erro crítico ao iniciar o bot: ", e);
            System.exit(1);
        }
    }
}