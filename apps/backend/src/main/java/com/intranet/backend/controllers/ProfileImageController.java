package com.intranet.backend.controllers;

import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ProfileImageController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileImageController.class);

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/files/check/{filename:.+}")
    public ResponseEntity<?> checkFileExists(@PathVariable String filename) {
        logger.info("Verificando se o arquivo existe: {}", filename);

        Path filePath = Paths.get(uploadDir, filename);
        if (Files.exists(filePath)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/profile-images/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        logger.info("Servindo imagem de perfil: {}", filename);

        try {
            Path filePath = Paths.get(uploadDir, "profiles", filename);
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

    @GetMapping("/profile-images/user/{userId}")
    public ResponseEntity<Resource> getProfileImageByUserId(@PathVariable String userId) {
        logger.info("Solicitada imagem de perfil para o usuário: {}", userId);

        try {
            UUID userUuid = UUID.fromString(userId);

            // Buscar o usuário para obter o nome do arquivo de imagem
            Optional<User> userOptional = userRepository.findById(userUuid);

            if (userOptional.isEmpty() || userOptional.get().getProfileImage() == null) {
                return ResponseEntity.notFound().build();
            }

            User user = userOptional.get();
            String profileImage = user.getProfileImage();

            //Extrair o nome do arquivo do caminho armazenado
            String filename = profileImage;
            if (profileImage.contains("/")) {
                filename = profileImage.substring(profileImage.lastIndexOf("/") + 1);
            }

            Path filePath = Paths.get(uploadDir, "profiles", filename);
            Resource resource = new FileSystemResource(filePath.toFile());

            if (!resource.exists()) {
                logger.warn("Imagem de perfil não encontrada para o usuário: {}", userId);
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600, public")
                    .body(resource);
        } catch (IllegalArgumentException e) {
            logger.warn("Formato de ID de usuário inválido: {}", userId);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.warn("Erro ao processar imagem de perfil do usuário {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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