package com.intranet.backend.controllers;

import com.intranet.backend.dto.PermissionDto;
import com.intranet.backend.dto.PermissionCreateRequest;
import com.intranet.backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    private static final Logger logger = LoggerFactory.getLogger(PermissionController.class);
    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<PermissionDto>> getAllPermissions() {
        logger.info("Requisição para listar todas as permissões");
        List<PermissionDto> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermissionDto> getPermissionById(@PathVariable Integer id) {
        logger.info("Requisição para buscar permissão com ID: {}", id);
        PermissionDto permission = permissionService.getPermissionById(id);
        return ResponseEntity.ok(permission);
    }

    @PostMapping
    public ResponseEntity<PermissionDto> createPermission(@Valid @RequestBody PermissionCreateRequest request) {
        logger.info("Requisição para criar nova permissão: {}", request.getName());
        PermissionDto createdPermission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPermission);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermissionDto> updatePermission(
            @PathVariable Integer id,
            @Valid @RequestBody PermissionCreateRequest request) {
        logger.info("Requisição para atualizar permissão com ID: {}", id);
        PermissionDto updatedPermission = permissionService.updatePermission(id, request);
        return ResponseEntity.ok(updatedPermission);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Integer id) {
        logger.info("Requisição para deletar permissão com ID: {}", id);
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }
}