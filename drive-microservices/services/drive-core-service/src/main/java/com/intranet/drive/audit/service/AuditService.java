package com.intranet.drive.audit.service;

import com.intranet.drive.audit.entity.AuditLogEntity;
import com.intranet.drive.audit.repository.AuditLogRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    private final AuditLogRepository auditRepository;

    public AuditService(AuditLogRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @Async // Executa assincronamente para não impactar performance do usuário
    public void logAction(Long userId, String username, String action,
                          Long resourceId, String details, String ipAddress) {
        try {
            AuditLogEntity log = new AuditLogEntity();
            log.setUserId(userId);
            log.setUsername(username);
            log.setAction(action);
            log.setResourceId(resourceId);
            log.setDetails(details);
            log.setIpAddress(ipAddress);
            log.setCreatedAt(LocalDateTime.now());

            auditRepository.save(log);
        } catch (Exception e) {
            System.err.println("Falha ao salvar log de auditoria: " + e.getMessage());
        }
    }
}