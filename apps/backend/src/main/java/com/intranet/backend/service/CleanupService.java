package com.intranet.backend.service;

import com.intranet.backend.model.Anexo;
import com.intranet.backend.model.Imagem;
import com.intranet.backend.repository.AnexoRepository;
import com.intranet.backend.repository.ImagemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CleanupService {

    private static final Logger logger = LoggerFactory.getLogger(CleanupService.class);

    @Autowired
    private ImagemRepository imagemRepository;

    @Autowired
    private AnexoRepository anexoRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${app.cleanup.temp-files.max-age-hours:24}")
    private int tempFilesMaxAgeHours;

    /**
     * Limpa imagens órfãs (sem postagem associada) mais antigas que o período configurado
     */
    @Transactional
    public int cleanupOrphanedImages() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(tempFilesMaxAgeHours);
        List<Imagem> orphanedImages = imagemRepository.findOrphanedImagesCreatedBefore(cutoffDate);

        logger.info("Encontradas {} imagens órfãs para limpeza (mais antigas que {} horas)",
                orphanedImages.size(), tempFilesMaxAgeHours);

        int deletedCount = 0;
        for (Imagem imagem : orphanedImages) {
            try {
                // Extrair o nome do arquivo do caminho
                String fileName = extractFileNameFromUrl(imagem.getUrl());

                // Excluir o arquivo físico
                fileStorageService.deleteFile(fileName);

                // Excluir o registro no banco de dados
                imagemRepository.delete(imagem);

                deletedCount++;
                logger.debug("Imagem órfã removida: {}", imagem.getId());
            } catch (Exception e) {
                logger.error("Erro ao remover imagem órfã {}: {}", imagem.getId(), e.getMessage(), e);
            }
        }

        logger.info("Limpeza de imagens concluída. {} imagens removidas com sucesso", deletedCount);
        return deletedCount;
    }

    /**
     * Limpa anexos órfãos (sem postagem associada) mais antigos que o período configurado
     */
    @Transactional
    public int cleanupOrphanedAttachments() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(tempFilesMaxAgeHours);
        List<Anexo> orphanedAttachments = anexoRepository.findOrphanedAnexosCreatedBefore(cutoffDate);

        logger.info("Encontrados {} anexos órfãos para limpeza (mais antigos que {} horas)",
                orphanedAttachments.size(), tempFilesMaxAgeHours);

        int deletedCount = 0;
        for (Anexo anexo : orphanedAttachments) {
            try {
                // Extrair o nome do arquivo do caminho
                String fileName = extractFileNameFromUrl(anexo.getUrl());

                // Excluir o arquivo físico
                fileStorageService.deleteFile(fileName);

                // Excluir o registro no banco de dados
                anexoRepository.delete(anexo);

                deletedCount++;
                logger.debug("Anexo órfão removido: {}", anexo.getId());
            } catch (Exception e) {
                logger.error("Erro ao remover anexo órfão {}: {}", anexo.getId(), e.getMessage(), e);
            }
        }

        logger.info("Limpeza de anexos concluída. {} anexos removidos com sucesso", deletedCount);
        return deletedCount;
    }

    /**
     * Executa a limpeza de todos os arquivos temporários
     */
    public int cleanupAllTemporaryFiles() {
        int imagesDeleted = cleanupOrphanedImages();
        int attachmentsDeleted = cleanupOrphanedAttachments();

        logger.info("Limpeza de arquivos temporários concluída. Total removido: {} (Imagens: {}, Anexos: {})",
                imagesDeleted + attachmentsDeleted, imagesDeleted, attachmentsDeleted);

        return imagesDeleted + attachmentsDeleted;
    }

    /**
     * Agendamento para executar a limpeza diariamente à 01:00 da manhã
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void scheduledCleanup() {
        logger.info("Iniciando limpeza agendada de arquivos temporários");
        cleanupAllTemporaryFiles();
    }

    /**
     * Método para forçar a execução da limpeza manualmente (pode ser exposto via API)
     */
    public int forceCleanup() {
        logger.info("Iniciando limpeza forçada de arquivos temporários");
        return cleanupAllTemporaryFiles();
    }

    /**
     * Extrai o nome do arquivo de uma URL ou caminho
     */
    private String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }

        int lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < url.length() - 1) {
            return url.substring(lastSlashIndex + 1);
        }

        return url;
    }
}