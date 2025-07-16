package com.intranet.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ficha-pdf")
public class FichaPdfProperties {

    /**
     * Configurações de armazenamento
     */
    private Storage storage = new Storage();

    /**
     * Configurações de processamento
     */
    private Processing processing = new Processing();

    /**
     * Configurações de template
     */
    private Template template = new Template();

    /**
     * Configurações de limpeza
     */
    private Cleanup cleanup = new Cleanup();

    @Data
    public static class Storage {
        private String path = "/tmp/fichas-pdf";
        private String tempPath = "/tmp/fichas-temp";
        private long maxFileSize = 50 * 1024 * 1024; // 50MB
        private int retentionDays = 30; // Manter arquivos por 30 dias
    }

    @Data
    public static class Processing {
        private int batchSize = 50;
        private int maxConcurrentJobs = 3;
        private int timeoutMinutes = 30;
        private boolean enableProgressCallback = true;
    }

    @Data
    public static class Template {
        private String logoPath = "classpath:static/images/logo.jpeg";
        private String templatesPath = "classpath:templates/fichas";
        private String defaultTemplate = "ficha-assinatura";
        private boolean enableCustomTemplates = false;
    }

    @Data
    public static class Cleanup {
        private boolean enabled = true;
        private int errorJobsRetentionDays = 7;
        private int completedJobsRetentionDays = 30;
        private int logsRetentionDays = 365;
        private String cronExpression = "0 0 2 * * ?"; // 2:00 AM todos os dias
    }
}