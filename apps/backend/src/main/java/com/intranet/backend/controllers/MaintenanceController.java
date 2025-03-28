package com.intranet.backend.controllers;

import com.intranet.backend.service.CleanupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/maintenance")
@PreAuthorize("hasRole('ADMIN')")
public class MaintenanceController {

    private static final Logger logger = LoggerFactory.getLogger(MaintenanceController.class);

    @Autowired
    private CleanupService cleanupService;

    /**
     * Endpoint para iniciar manualmente a limpeza de arquivos temporários
     * Restrito a administradores
     */
    @PostMapping("/cleanup-temp-files")
    public ResponseEntity<Map<String, Object>> cleanupTemporaryFiles() {
        logger.info("Solicitação manual para limpeza de arquivos temporários");

        int removedCount = cleanupService.forceCleanup();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Limpeza de arquivos temporários concluída");
        response.put("filesRemoved", removedCount);

        return ResponseEntity.ok(response);
    }
}