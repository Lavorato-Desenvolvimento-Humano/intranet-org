package com.intranet.backend.controllers;

import com.intranet.backend.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    @Autowired
    private FileStorageService fileStorageService;

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
}