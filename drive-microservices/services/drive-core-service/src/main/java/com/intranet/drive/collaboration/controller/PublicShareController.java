package com.intranet.drive.collaboration.controller;

import com.intranet.drive.collaboration.service.CollaborationService;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.service.StorageService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;

@RestController
@RequestMapping("/api/public/drive")
public class PublicShareController {

    private final CollaborationService collaborationService;
    private final StorageService storageService;

    public PublicShareController(CollaborationService collaborationService, StorageService storageService) {
        this.collaborationService = collaborationService;
        this.storageService = storageService;
    }

    @GetMapping("/download/{token}")
    public ResponseEntity<InputStreamResource> downloadViaLink(@PathVariable String token) {

        // Valida token e recupera arquivo
        FileEntity file = collaborationService.accessViaLink(token);

        // Registra o download (contagem)
        collaborationService.registerDownloadViaLink(token);

        InputStream resource = storageService.getFile(file.getStorageKey());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalName() + "\"")
                .contentType(MediaType.parseMediaType(file.getMimeType()))
                .body(new InputStreamResource(resource));
    }

    @GetMapping("/info/{token}")
    public ResponseEntity<?> getFileInfo(@PathVariable String token) {
        // Retorna metadados básicos para mostrar uma tela de "Baixar arquivo X" antes do download real
        FileEntity file = collaborationService.accessViaLink(token);
        return ResponseEntity.ok().body(new Object() {
            public String name = file.getOriginalName();
            public Long size = file.getFileSize();
            public String type = file.getMimeType();
        });
    }
}
