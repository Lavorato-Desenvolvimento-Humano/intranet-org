package com.intranet.backend.service.impl;

import com.intranet.backend.dto.PermissionDto;
import com.intranet.backend.dto.RoleCreateRequest;
import com.intranet.backend.dto.RoleDto;
import com.intranet.backend.dto.RoleUpdateRequest;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Permission;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.RolePermission;
import com.intranet.backend.repository.PermissionRepository;
import com.intranet.backend.repository.RolePermissionRepository;
import com.intranet.backend.repository.RoleRepository;
import com.intranet.backend.repository.UserRoleRepository;
import com.intranet.backend.service.RoleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private static final Logger logger = LoggerFactory.getLogger(RoleServiceImpl.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public List<RoleDto> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public RoleDto getRoleById(Integer id) {
        Role role = roleRepository.findByIdWithPermissions(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + id));
        return convertToDto(role);
    }

    @Override
    public RoleDto getRoleByName(String name) {
        Role role = roleRepository.findByNameWithPermissions(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com nome: " + name));
        return convertToDto(role);
    }

    @Override
    @Transactional
    public RoleDto createRole(RoleCreateRequest request) {
        // Verificar se a role já existe
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Uma role com este nome já existe: " + request.getName());
        }

        // Criar nova role
        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());

        Role savedRole = roleRepository.save(role);

        // Adicionar permissões, se houver
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            for (Integer permissionId : request.getPermissionIds()) {
                Permission permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + permissionId));

                RolePermission rolePermission = new RolePermission();
                rolePermission.setRole(savedRole);
                rolePermission.setPermission(permission);
                rolePermissionRepository.save(rolePermission);
            }
        }

        // Buscar a role com permissões para retornar
        return getRoleById(savedRole.getId());
    }

    @Override
    @Transactional
    public RoleDto updateRole(Integer id, RoleUpdateRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + id));

        // Atualizar descrição
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        // Salvar alterações básicas
        roleRepository.save(role);

        // Atualizar permissões se fornecidas
        if (request.getPermissionIds() != null) {
            // Remover todas as permissões existentes
            rolePermissionRepository.deleteByRoleId(id);

            // Adicionar novas permissões
            for (Integer permissionId : request.getPermissionIds()) {
                Permission permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + permissionId));

                RolePermission rolePermission = new RolePermission();
                rolePermission.setRole(role);
                rolePermission.setPermission(permission);
                rolePermissionRepository.save(rolePermission);
            }
        }

        // Buscar a role atualizada com permissões
        return getRoleById(id);
    }

    @Override
    @Transactional
    public void deleteRole(Integer id) {
        if (!roleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Role não encontrada com ID: " + id);
        }

        // Verificar se existem usuários com esta role
        boolean hasUsers = userRoleRepository.existsByRoleId(id);
        if (hasUsers) {
            throw new IllegalStateException("Não é possível excluir esta role porque existem usuários vinculados a ela.");
        }

        // Remover todas as permissões da role
        rolePermissionRepository.deleteByRoleId(id);

        // Excluir a role
        roleRepository.deleteById(id);
    }

    @Override
    public List<PermissionDto> getRolePermissions(Integer roleId) {
        Role role = roleRepository.findByIdWithPermissions(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + roleId));

        List<Permission> permissions = role.getRolePermissions().stream()
                .map(RolePermission::getPermission)
                .collect(Collectors.toList());

        return permissions.stream()
                .map(this::convertToPermissionDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleDto addPermissionToRole(Integer roleId, Integer permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + roleId));

        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + permissionId));

        // Verificar se a permissão já está atribuída à role
        boolean alreadyHasPermission = rolePermissionRepository.existsByRoleIdAndPermissionId(roleId, permissionId);
        if (alreadyHasPermission) {
            logger.info("A permissão {} já está atribuída à role {}", permissionId, roleId);
            return getRoleById(roleId);
        }

        // Adicionar nova permissão
        RolePermission rolePermission = new RolePermission();
        rolePermission.setRole(role);
        rolePermission.setPermission(permission);
        rolePermissionRepository.save(rolePermission);

        return getRoleById(roleId);
    }

    @Override
    @Transactional
    public RoleDto removePermissionFromRole(Integer roleId, Integer permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + roleId));

        if (!permissionRepository.existsById(permissionId)) {
            throw new ResourceNotFoundException("Permissão não encontrada com ID: " + permissionId);
        }

        // Remover a permissão da role
        rolePermissionRepository.deleteByRoleIdAndPermissionId(roleId, permissionId);

        return getRoleById(roleId);
    }

    // Métodos auxiliares de conversão
    private RoleDto convertToDto(Role role) {
        List<PermissionDto> permissions = new ArrayList<>();

        if (role.getRolePermissions() != null) {
            permissions = role.getRolePermissions().stream()
                    .map(RolePermission::getPermission)
                    .map(this::convertToPermissionDto)
                    .collect(Collectors.toList());
        }

        // Contar usuários com esta role
        int userCount = userRoleRepository.countByRoleId(role.getId());

        return new RoleDto(
                role.getId(),
                role.getName(),
                role.getDescription(),
                permissions,
                userCount
        );
    }

    private PermissionDto convertToPermissionDto(Permission permission) {
        return new PermissionDto(
                permission.getId(),
                permission.getName(),
                permission.getDescription()
        );
    }
}