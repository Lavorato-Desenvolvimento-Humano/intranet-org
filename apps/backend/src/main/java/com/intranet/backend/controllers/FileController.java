package com.intranet.backend.controllers;

import com.intranet.backend.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping("/check/{filename}")
    public ResponseEntity<?> checkFileExists(@PathVariable String filename) {
        logger.info("Verificando existência do arquivo: {}", filename);

        boolean exists = fileStorageService.fileExists(filename);

        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("filename", filename);

        if (exists) {
            logger.info("Arquivo encontrado: {}", filename);
            return ResponseEntity.ok(response);
        } else {
            logger.warn("Arquivo não encontrado: {}", filename);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/diagnose")
    public ResponseEntity<Map<String, Object>> diagnoseFileSystem() {
        Map<String, Object> diagnosticInfo = new HashMap<>();

        diagnosticInfo.put("uploadDir", fileStorageService.getStorageLocation().toString());
        diagnosticInfo.put("dirExists", Files.exists(fileStorageService.getStorageLocation()));
        diagnosticInfo.put("dirWritable", Files.isWritable(fileStorageService.getStorageLocation()));

        // Verificar subdiretórios
        Path imagesDir = fileStorageService.getStorageLocation().resolve("images");
        diagnosticInfo.put("imagesDirExists", Files.exists(imagesDir));
        diagnosticInfo.put("imagesDirWritable", Files.isWritable(imagesDir));

        // Adicionar informações do servidor
        diagnosticInfo.put("javaVersion", System.getProperty("java.version"));
        diagnosticInfo.put("osName", System.getProperty("os.name"));
        diagnosticInfo.put("osVersion", System.getProperty("os.version"));

        return ResponseEntity.ok(diagnosticInfo);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String path) {
        try {
            // Normaliza o caminho para evitar directory traversal (../)
            Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = basePath.resolve(path).normalize();

            // Segurança: Garante que o arquivo solicitado está DENTRO da pasta de uploads
            if (!filePath.startsWith(basePath)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Tenta descobrir o tipo do arquivo (PDF, PNG, etc)
                String contentType = "application/octet-stream";
                try {
                    contentType = Files.probeContentType(filePath);
                } catch (Exception ex) {
                    logger.info("Não foi possível determinar o tipo do arquivo.");
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                logger.error("Arquivo não encontrado: " + filePath);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}