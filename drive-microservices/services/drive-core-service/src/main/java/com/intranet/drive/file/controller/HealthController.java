package com.intranet.drive.file.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/drive/files")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    @Value("${intranet.core.url}")
    private String coreUrl;

    private final RestTemplate restTemplate;

    public HealthController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("services", "drive-file-service");
        health.put("status", "UP");
        health.put("timestamp",  System.currentTimeMillis());

        //Verifica conectividade com Core Service
        health.put("core_connectivity", checkCoreConnectivity());

        return ResponseEntity.ok(health);
    }

    private String checkCoreConnectivity() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(coreUrl + "/actuator/health", String.class);

            return response.getStatusCode() == HttpStatus.OK ? "UP" : "DOWN";
        } catch (Exception e) {
            logger.debug("Core service não acessível: {}", e.getMessage());
            return "DOWN";
        }
    }
}
