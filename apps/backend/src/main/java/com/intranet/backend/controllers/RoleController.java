package com.intranet.backend.controllers;

import com.intranet.backend.dto.PermissionDto;
import com.intranet.backend.dto.RoleCreateRequest;
import com.intranet.backend.dto.RoleDto;
import com.intranet.backend.dto.RoleUpdateRequest;
import com.intranet.backend.service.RoleService;
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
@RequestMapping("/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private static final Logger logger = LoggerFactory.getLogger(RoleController.class);
    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<RoleDto>> getAllRoles() {
        logger.info("Requisição para listar todas as roles");
        List<RoleDto> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDto> getRoleById(@PathVariable Integer id) {
        logger.info("Requisição para buscar role com ID: {}", id);
        RoleDto role = roleService.getRoleById(id);
        return ResponseEntity.ok(role);
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<RoleDto> getRoleByName(@PathVariable String name) {
        logger.info("Requisição para buscar role com nome: {}", name);
        RoleDto role = roleService.getRoleByName(name);
        return ResponseEntity.ok(role);
    }

    @PostMapping
    public ResponseEntity<RoleDto> createRole(@Valid @RequestBody RoleCreateRequest request) {
        logger.info("Requisição para criar nova role: {}", request.getName());
        RoleDto createdRole = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRole);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleDto> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody RoleUpdateRequest request) {
        logger.info("Requisição para atualizar role com ID: {}", id);
        RoleDto updatedRole = roleService.updateRole(id, request);
        return ResponseEntity.ok(updatedRole);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Integer id) {
        logger.info("Requisição para deletar role com ID: {}", id);
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<List<PermissionDto>> getRolePermissions(@PathVariable Integer id) {
        logger.info("Requisição para listar permissões da role com ID: {}", id);
        List<PermissionDto> permissions = roleService.getRolePermissions(id);
        return ResponseEntity.ok(permissions);
    }

    @PostMapping("/{id}/permissions/{permissionId}")
    public ResponseEntity<RoleDto> addPermissionToRole(
            @PathVariable Integer id,
            @PathVariable Integer permissionId) {
        logger.info("Requisição para adicionar permissão {} à role {}", permissionId, id);
        RoleDto updatedRole = roleService.addPermissionToRole(id, permissionId);
        return ResponseEntity.ok(updatedRole);
    }

    @DeleteMapping("/{id}/permissions/{permissionId}")
    public ResponseEntity<RoleDto> removePermissionFromRole(
            @PathVariable Integer id,
            @PathVariable Integer permissionId) {
        logger.info("Requisição para remover permissão {} da role {}", permissionId, id);
        RoleDto updatedRole = roleService.removePermissionFromRole(id, permissionId);
        return ResponseEntity.ok(updatedRole);
    }
}
