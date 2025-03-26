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
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class TempFilesCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(TempFilesCleanupService.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Autowired
    private ImagemRepository imagemRepository;

    @Autowired
    private AnexoRepository anexoRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Executa às 3h da manhã todos os dias
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupTempFiles() {
        logger.info("Iniciando limpeza de arquivos temporários...");

        try {
            cleanupTempImages();
            cleanupTempAnexos();
            cleanupOrphanFiles();

            logger.info("Limpeza de arquivos temporários concluída");
        } catch (Exception e) {
            logger.error("Erro durante limpeza de arquivos temporários: {}", e.getMessage(), e);
        }
    }

    private void cleanupTempImages() {
        // Buscar imagens sem postagem
        List<Imagem> orphanedImages = imagemRepository.findOrphanedImages();

        logger.info("Encontradas {} imagens temporárias para remoção", orphanedImages.size());

        for (Imagem imagem : orphanedImages) {
            try {
                // Verificar se a imagem está sem postagem há mais de 24 horas
                // Este código assume que você não tem um campo createdAt
                // Se tiver, use o método findOrphanedImagesCreatedBefore

                // Extrair o caminho do arquivo da URL
                String filePath = imagem.getUrl().replace("/api/uploads/", "");

                // Excluir arquivo físico
                fileStorageService.deleteFile(filePath);

                // Excluir registro do banco
                imagemRepository.delete(imagem);

                logger.debug("Imagem temporária removida: {}", imagem.getId());
            } catch (Exception e) {
                logger.warn("Erro ao remover imagem temporária {}: {}", imagem.getId(), e.getMessage());
            }
        }
    }

    private void cleanupTempAnexos() {
        // Buscar anexos sem postagem
        List<Anexo> orphanedAnexos = anexoRepository.findOrphanedAnexos();

        logger.info("Encontrados {} anexos temporários para remoção", orphanedAnexos.size());

        for (Anexo anexo : orphanedAnexos) {
            try {
                // Extrair o caminho do arquivo da URL
                String filePath = anexo.getUrl().replace("/uploads/", "");

                // Excluir arquivo físico
                fileStorageService.deleteFile(filePath);

                // Excluir registro do banco
                anexoRepository.delete(anexo);

                logger.debug("Anexo temporário removido: {}", anexo.getId());
            } catch (Exception e) {
                logger.warn("Erro ao remover anexo temporário {}: {}", anexo.getId(), e.getMessage());
            }
        }
    }

    private void cleanupOrphanFiles() {
        // Limpar arquivos órfãos nas pastas temporárias
        try {
            Path tempImagesPath = Paths.get(uploadDir, "temp", "imagens");
            Path tempAnexosPath = Paths.get(uploadDir, "temp", "anexos");

            if (Files.exists(tempImagesPath)) {
                Files.list(tempImagesPath)
                        .filter(Files::isRegularFile)
                        .filter(file -> isFileOlderThan24Hours(file))
                        .forEach(file -> {
                            try {
                                Files.delete(file);
                                logger.debug("Arquivo temporário removido: {}", file);
                            } catch (IOException e) {
                                logger.warn("Erro ao remover arquivo: {}", e.getMessage());
                            }
                        });
            }

            if (Files.exists(tempAnexosPath)) {
                Files.list(tempAnexosPath)
                        .filter(Files::isRegularFile)
                        .filter(file -> isFileOlderThan24Hours(file))
                        .forEach(file -> {
                            try {
                                Files.delete(file);
                                logger.debug("Arquivo temporário removido: {}", file);
                            } catch (IOException e) {
                                logger.warn("Erro ao remover arquivo: {}", e.getMessage());
                            }
                        });
            }
        } catch (IOException e) {
            logger.error("Erro ao listar arquivos temporários: {}", e.getMessage());
        }
    }

    private boolean isFileOlderThan24Hours(Path file) {
        try {
            long lastModified = Files.getLastModifiedTime(file).toMillis();
            long currentTime = System.currentTimeMillis();
            long oneDayInMillis = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

            return (currentTime - lastModified) > oneDayInMillis;
        } catch (IOException e) {
            logger.warn("Erro ao obter data de modificação do arquivo: {}", e.getMessage());
            return false;
        }
    }
}