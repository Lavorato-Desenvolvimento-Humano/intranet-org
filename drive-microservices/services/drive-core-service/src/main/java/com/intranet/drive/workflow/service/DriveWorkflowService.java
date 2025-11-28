package com.intranet.drive.workflow.service;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.repository.FileRepository;
import com.intranet.drive.permission.service.DrivePermissionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DriveWorkflowService {

    private final FileRepository fileRepository;
    private final DrivePermissionService permissionService;

    public DriveWorkflowService(FileRepository fileRepository, DrivePermissionService permissionService) {
        this.fileRepository = fileRepository;
        this.permissionService = permissionService;
    }


    public void requestApproval(Long fileId, UserDto user) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        // Apenas o dono pode solicitar aprovação
        if (!file.getOwnerId().equals(user.getId())) {
            throw new SecurityException("Apenas o proprietário pode solicitar aprovação");
        }

        file.setApprovalStatus(FileEntity.ApprovalStatus.PENDING);
        fileRepository.save(file);

        // TODO: Notificar aprovadores (Role ADMIN ou Gestores) via NotificationService
    }

    public void approveFile(Long fileId, UserDto approver) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateApproverRole(approver);

        file.setApprovalStatus(FileEntity.ApprovalStatus.APPROVED);
        fileRepository.save(file);

        // TODO: Notificar dono do arquivo que foi aprovado
    }

    public void rejectFile(Long fileId, String reason, UserDto approver) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateApproverRole(approver);

        file.setApprovalStatus(FileEntity.ApprovalStatus.REJECTED);

        // Aqui poderíamos adicionar automaticamente um comentário com o motivo
        // collaborationService.addComment(fileId, "REJEITADO: " + reason, null, approver);

        fileRepository.save(file);

        // TODO: Notificar dono do arquivo que foi rejeitado
    }

    private void validateApproverRole(UserDto user) {
        // Regra de Negócio: Apenas ADMIN ou GERENTE pode aprovar/rejeitar
        boolean isAuthorized = user.getRoles().contains("ADMIN") ||
                user.getRoles().contains("GERENTE") ||
                user.getRoles().contains("MANAGER");

        if (!isAuthorized) {
            throw new SecurityException("Usuário não tem permissão de aprovação");
        }
    }
}