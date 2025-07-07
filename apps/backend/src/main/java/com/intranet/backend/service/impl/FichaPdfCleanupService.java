package com.intranet.backend.service.impl;

import com.intranet.backend.config.FichaPdfProperties;
import com.intranet.backend.repository.FichaPdfJobRepository;
import com.intranet.backend.repository.FichaPdfLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ficha-pdf.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class FichaPdfCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfCleanupService.class);

    private final FichaPdfJobRepository jobRepository;
    private final FichaPdfLogRepository logRepository;
    private final FichaPdfProperties properties;

    /**
     * Limpeza automática diária
     */
    @Scheduled(cron = "${app.ficha-pdf.cleanup.cron-expression:0 0 2 * * ?}")
    @Transactional
    public void executarLimpezaAutomatica() {
        logger.info("Iniciando limpeza automática de fichas PDF");

        try {
            limparJobsAntigos();
            limparLogsAntigos();
            limparArquivosOrfaos();

            logger.info("Limpeza automática concluída com sucesso");

        } catch (Exception e) {
            logger.error("Erro na limpeza automática: {}", e.getMessage(), e);
        }
    }

    /**
     * Remove jobs antigos baseado na configuração
     */
    public void limparJobsAntigos() {
        LocalDateTime dataLimiteErro = LocalDateTime.now()
                .minusDays(properties.getCleanup().getErrorJobsRetentionDays());

        LocalDateTime dataLimiteConcluido = LocalDateTime.now()
                .minusDays(properties.getCleanup().getCompletedJobsRetentionDays());

        // Remover jobs com erro antigos
        var jobsErro = jobRepository.findJobsConcluidosRecentes(dataLimiteErro);
        for (var job : jobsErro) {
            if ("ERRO".equals(job.getStatus().name())) {
                removerArquivoJob(job.getArquivoPath());
                jobRepository.delete(job);
            }
        }

        // Remover jobs concluídos muito antigos
        var jobsConcluidos = jobRepository.findJobsConcluidosRecentes(dataLimiteConcluido);
        for (var job : jobsConcluidos) {
            if ("CONCLUIDO".equals(job.getStatus().name())) {
                removerArquivoJob(job.getArquivoPath());
                jobRepository.delete(job);
            }
        }

        logger.info("Limpeza de jobs antigos concluída");
    }

    /**
     * Remove logs antigos
     */
    public void limparLogsAntigos() {
        LocalDateTime dataLimite = LocalDateTime.now()
                .minusDays(properties.getCleanup().getLogsRetentionDays());

        logRepository.deleteLogsAntigos(dataLimite);
        logger.info("Limpeza de logs antigos concluída");
    }

    /**
     * Remove arquivos órfãos (sem referência no banco)
     */
    public void limparArquivosOrfaos() {
        try {
            Path storagePath = Paths.get(properties.getStorage().getPath());

            if (!Files.exists(storagePath)) {
                return;
            }

            Files.walk(storagePath)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".pdf"))
                    .forEach(this::verificarERemoverSeOrfao);

            logger.info("Limpeza de arquivos órfãos concluída");

        } catch (IOException e) {
            logger.error("Erro na limpeza de arquivos órfãos: {}", e.getMessage());
        }
    }

    private void verificarERemoverSeOrfao(Path arquivo) {
        try {
            String caminhoArquivo = arquivo.toString();
            boolean temReferencia = jobRepository.findAll().stream()
                    .anyMatch(job -> caminhoArquivo.equals(job.getArquivoPath()));

            if (!temReferencia) {
                Files.deleteIfExists(arquivo);
                logger.debug("Arquivo órfão removido: {}", arquivo);
            }

        } catch (Exception e) {
            logger.warn("Erro ao verificar arquivo {}: {}", arquivo, e.getMessage());
        }
    }

    private void removerArquivoJob(String caminhoArquivo) {
        if (caminhoArquivo == null) return;

        try {
            Files.deleteIfExists(Paths.get(caminhoArquivo));
            logger.debug("Arquivo do job removido: {}", caminhoArquivo);
        } catch (Exception e) {
            logger.warn("Erro ao remover arquivo {}: {}", caminhoArquivo, e.getMessage());
        }
    }
}