package com.intranet.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class FichaPdfConfig {

    @Value("${app.pdf.storage.path:/tmp/fichas-pdf}")
    private String pdfStoragePath;

    @Value("${app.pdf.thread.pool.core:2}")
    private int corePoolSize;

    @Value("${app.pdf.thread.pool.max:5}")
    private int maxPoolSize;

    @Value("${app.pdf.thread.pool.queue:100}")
    private int queueCapacity;

    /**
     * Executor para processamento assíncrono de fichas PDF
     */
    @Bean(name = "fichaPdfTaskExecutor")
    public Executor fichaPdfTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("FichaPdf-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    /**
     * Inicializar diretórios necessários
     */
    @Bean
    public boolean initializePdfDirectories() {
        try {
            Files.createDirectories(Paths.get(pdfStoragePath));
            Files.createDirectories(Paths.get(pdfStoragePath + "/temp"));
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao criar diretórios PDF: " + e.getMessage(), e);
        }
    }
}