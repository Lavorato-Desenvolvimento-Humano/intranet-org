package com.intranet.backend.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;

/**
 * Controlador para endpoints de diagnóstico da aplicação
 * Útil para verificar se a aplicação está funcionando corretamente
 */
@RestController
@RequestMapping("/api/diagnostic")
public class DiagnosticController {

    private static final Logger logger = LoggerFactory.getLogger(DiagnosticController.class);

    @Autowired(required = false)
    private DataSource dataSource;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        logger.info("Verificando status da aplicação");

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());

        // Verificar o usuário atual autenticado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            response.put("authenticated", auth.isAuthenticated());
            response.put("username", auth.getName());
            response.put("authorities", auth.getAuthorities().toString());
        } else {
            response.put("authenticated", false);
        }

        // Verificar conexão com banco de dados
        boolean dbConnected = false;
        String dbStatus = "Não verificado";

        if (dataSource != null && jdbcTemplate != null) {
            try {
                Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                dbConnected = (result != null && result == 1);
                dbStatus = dbConnected ? "Conectado" : "Erro na consulta";
            } catch (Exception e) {
                logger.error("Erro ao verificar conexão com banco de dados", e);
                dbStatus = "Erro: " + e.getMessage();
            }
        } else {
            dbStatus = "DataSource ou JdbcTemplate não disponível";
        }

        response.put("database", dbStatus);
        response.put("dbConnected", dbConnected);

        // Informações do ambiente
        response.put("javaVersion", System.getProperty("java.version"));
        response.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        response.put("freeMemory", Runtime.getRuntime().freeMemory());
        response.put("maxMemory", Runtime.getRuntime().maxMemory());

        // Pode adicionar mais verificações específicas aqui

        return ResponseEntity.ok(response);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}