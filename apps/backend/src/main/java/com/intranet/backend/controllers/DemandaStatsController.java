package com.intranet.backend.controllers;

import com.intranet.backend.service.DemandaStatsService;
import com.intranet.backend.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/demandas/estatisticas")
@RequiredArgsConstructor
public class DemandaStatsController {

    private static final Logger logger = LoggerFactory.getLogger(DemandaStatsController.class);
    private final DemandaStatsService demandaStatsService;

    @GetMapping("/gerais")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE')")
    public ResponseEntity<Map<String, Object>> getEstatisticasGerais() {
        logger.info("Requisição para estatísticas gerais de demandas");
        try {
            Map<String, Object> estatisticas = demandaStatsService.getEstatisticasGerais();
            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas gerais: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/usuario/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or @userSecurity.isCurrentUser(#userId)")
    public ResponseEntity<Map<String, Object>> getEstatisticasUsuario(@PathVariable UUID userId) {
        logger.info("Requisição para estatísticas do usuário: {}", userId);
        try {
            Map<String, Object> estatisticas = demandaStatsService.getEstatisticasUsuario(userId);
            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas do usuário {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/minhas")
    public ResponseEntity<Map<String, Object>> getEstatisticasUsuarioAtual() {
        logger.info("Requisição para estatísticas do usuário atual");
        try {
            Map<String, Object> estatisticas = demandaStatsService.getEstatisticasUsuarioAtual();
            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas do usuário atual: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/equipe/{equipeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getEstatisticasEquipe(@PathVariable UUID equipeId) {
        logger.info("Requisição para estatísticas da equipe: {}", equipeId);
        try {
            Map<String, Object> estatisticas = demandaStatsService.getEstatisticasEquipe(equipeId);
            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas da equipe {}: {}", equipeId, e.getMessage(), e);
            throw e;
        }
    }
}