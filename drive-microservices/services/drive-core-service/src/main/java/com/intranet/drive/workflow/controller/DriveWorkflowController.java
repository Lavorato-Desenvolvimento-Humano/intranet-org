package com.intranet.drive.workflow.controller;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.service.CoreIntegrationService;
import com.intranet.drive.workflow.service.DriveWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/drive/files/{fileId}/workflow")
public class DriveWorkflowController {

    private final DriveWorkflowService workflowService;
    private final CoreIntegrationService coreIntegrationService;

    public DriveWorkflowController(DriveWorkflowService workflowService, CoreIntegrationService coreIntegrationService) {
        this.workflowService = workflowService;
        this.coreIntegrationService = coreIntegrationService;
    }

    @PostMapping("/request")
    public ResponseEntity<Void> requestApproval(@PathVariable Long fileId) {
        UserDto currentUser = getCurrentUser();
        workflowService.requestApproval(fileId, currentUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/approve")
    public ResponseEntity<Void> approveFile(@PathVariable Long fileId) {
        UserDto currentUser = getCurrentUser();
        workflowService.approveFile(fileId, currentUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject")
    public ResponseEntity<Void> rejectFile(@PathVariable Long fileId,
                                           @RequestBody Map<String, String> body) {
        UserDto currentUser = getCurrentUser();
        String reason = body.get("reason");
        workflowService.rejectFile(fileId, reason, currentUser);
        return ResponseEntity.ok().build();
    }

    private UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            String username = (String) authentication.getPrincipal();
            return coreIntegrationService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        }
        if (authentication != null && authentication.getDetails() instanceof UserDto) {
            return (UserDto) authentication.getDetails();
        }
        throw new RuntimeException("Usuário não autenticado");
    }
}