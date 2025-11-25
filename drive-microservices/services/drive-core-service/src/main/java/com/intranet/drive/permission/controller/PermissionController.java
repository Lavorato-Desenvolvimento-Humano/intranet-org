package com.intranet.drive.permission.controller;

import com.drew.lang.annotations.NotNull;
import com.intranet.drive.permission.dto.PermissionRequestDto;
import com.intranet.drive.permission.entity.PermissionTargetType;
import com.intranet.drive.permission.service.DrivePermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drive/files/{fileId}/permissions")
@Tag(name = "Permissions (RF01.2", description = "Gerenciamento de compartilhamento e controle de acesso")
public class PermissionController {

    private static final Logger logger = LoggerFactory.getLogger(PermissionController.class);
    private final DrivePermissionService permissionService;

    public PermissionController(DrivePermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PostMapping
    @Operation(summary = "Conceder Permissão", description = "Compartilha um arquivou ou pasta com um Usuário, Role ou Equipe")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Permissão concedida com sucesso"),
            @ApiResponse(responseCode = "403", description = "Você não tem permissão para compartilhar este arquivo"),
            @ApiResponse(responseCode = "404", description = "Arquivo não encontrado")
    })
    @PreAuthorize("hasAnyAuthority('drive:share') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> grantPermission(
            @Parameter(description = "ID do arquivo ou pasta")
            @PathVariable @NotNull Long fileId,
            @RequestBody @Valid PermissionRequestDto request) {

        logger.info("Requisição de compartilhamento: Arquivo={} para {}={}",
                fileId, request.targetType(), request.targetId());

        permissionService.grantPermission(fileId, request);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    @Operation(summary = "Revogar Permissão", description = "Remove o acesso de um Usuário, Role ou Equipe")
    @PreAuthorize("hasAnyAuthority('drive:share') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> revokePermission(
            @PathVariable @NotNull Long fileId,
            @Parameter(description = "Tipo do alvo (USER, ROLE, TEAM)")
            @RequestParam PermissionTargetType targetType,
            @Parameter(description = "ID do alvo (ID do usuário/equipe ou nome da role)")
            @RequestParam String targetId) {

        logger.info("Removendo permissão: Arquivo={}, Alvo={}/{}", fileId, targetType, targetId);

        permissionService.revokePermission(fileId, targetType, targetId);

        return ResponseEntity.ok().build();

    }
}
