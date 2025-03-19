package com.intranet.backend.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Controlador dedicado a servir imagens de perfil com acesso público adequado
 */
@RestController
@RequestMapping("/api")
public class ProfileImageController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileImageController.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Endpoint para verificar se um arquivo existe
     */
    @GetMapping("/files/check/{filename:.+}")
    public ResponseEntity<?> checkFileExists(@PathVariable String filename) {
        logger.info("Verificando se o arquivo existe: {}", filename);

        Path filePath = Paths.get(uploadDir, filename);
        if (Files.exists(filePath)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Endpoint para servir imagens de perfil diretamente
     */
    @GetMapping("/profile-images/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        logger.info("Servindo imagem de perfil: {}", filename);

        try {
            Path filePath = Paths.get(uploadDir, filename);
            Resource resource = new FileSystemResource(filePath.toFile());

            if (!resource.exists()) {
                logger.warn("Imagem de perfil não encontrada: {}", filename);
                return ResponseEntity.notFound().build();
            }

            // Determinar o tipo de conteúdo
            String contentType = determineContentType(filePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600, public")
                    .body(resource);

        } catch (Exception e) {
            logger.error("Erro ao servir imagem de perfil {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint para servir imagens de perfil pelo ID do usuário
     */
    @GetMapping("/profile-images/user/{userId}")
    public ResponseEntity<Resource> getProfileImageByUserId(@PathVariable String userId) {
        logger.info("Solicitada imagem de perfil para o usuário: {}", userId);

        // Em uma implementação real, busque o nome do arquivo a partir do registro do usuário
        // Por enquanto, apenas passa o UUID como nome do arquivo
        try {
            UUID.fromString(userId); // Valida se é um UUID adequado

            // Implementar lógica para encontrar o arquivo de imagem correto para este usuário
            // Por enquanto, retornando 404 pois não temos a lógica de mapeamento
            return ResponseEntity.notFound().build();

        } catch (IllegalArgumentException e) {
            logger.warn("Formato de ID de usuário inválido: {}", userId);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Erro ao processar imagem de perfil do usuário {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Método auxiliar para determinar o tipo de conteúdo com base na extensão do arquivo
     */
    private String determineContentType(Path filePath) throws IOException {
        String fileName = filePath.getFileName().toString().toLowerCase();

        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (fileName.endsWith(".png")) {
            return "image/png";
        } else if (fileName.endsWith(".gif")) {
            return "image/gif";
        } else if (fileName.endsWith(".webp")) {
            return "image/webp";
        } else {
            // Tenta detectar a partir do conteúdo do arquivo
            return Files.probeContentType(filePath);
        }
    }
}