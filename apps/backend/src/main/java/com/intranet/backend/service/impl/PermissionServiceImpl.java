package com.intranet.backend.service.impl;

import com.intranet.backend.dto.PermissionCreateRequest;
import com.intranet.backend.dto.PermissionDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Permission;
import com.intranet.backend.repository.PermissionRepository;
import com.intranet.backend.repository.RolePermissionRepository;
import com.intranet.backend.service.PermissionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private static final Logger logger = LoggerFactory.getLogger(PermissionServiceImpl.class);

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public List<PermissionDto> getAllPermissions() {
        try {
            List<Permission> permissions = permissionRepository.findAll();
            return permissions.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Erro ao buscar todas as permissões: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public PermissionDto getPermissionById(Integer id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + id));
        return convertToDto(permission);
    }

    @Override
    public PermissionDto getPermissionByName(String name) {
        Permission permission = permissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com nome: " + name));
        return convertToDto(permission);
    }

    @Override
    @Transactional
    public PermissionDto createPermission(PermissionCreateRequest request) {
        // Verificar se a permissão já existe
        if (permissionRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Uma permissão com este nome já existe: " + request.getName());
        }

        // Criar nova permissão
        Permission permission = new Permission();
        permission.setName(request.getName());
        permission.setDescription(request.getDescription());

        Permission savedPermission = permissionRepository.save(permission);
        return convertToDto(savedPermission);
    }

    @Override
    @Transactional
    public PermissionDto updatePermission(Integer id, PermissionCreateRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + id));

        // Verificar se o novo nome já existe (quando está mudando o nome)
        if (!permission.getName().equals(request.getName()) &&
                permissionRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Uma permissão com este nome já existe: " + request.getName());
        }

        // Atualizar permissão
        permission.setName(request.getName());
        permission.setDescription(request.getDescription());

        Permission updatedPermission = permissionRepository.save(permission);
        return convertToDto(updatedPermission);
    }

    @Override
    @Transactional
    public void deletePermission(Integer id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + id));

        // Verificar se a permissão está sendo usada por alguma role
        boolean isUsedByRoles = rolePermissionRepository.existsByPermissionId(id);
        if (isUsedByRoles) {
            throw new IllegalStateException("Não é possível excluir esta permissão porque está sendo usada por uma ou mais roles.");
        }

        // Excluir a permissão
        permissionRepository.delete(permission);
    }

    // Método auxiliar de conversão
    private PermissionDto convertToDto(Permission permission) {
        return new PermissionDto(
                permission.getId(),
                permission.getName(),
                permission.getDescription()
        );
    }
}