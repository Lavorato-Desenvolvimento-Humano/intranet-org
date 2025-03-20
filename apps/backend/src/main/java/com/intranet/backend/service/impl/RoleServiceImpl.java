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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<RoleDto> getAllRoles() {
        try {
            List<Role> roles = roleRepository.findAllRoles();

            // Converter para DTOs, buscando as permissões individualmente
            return roles.stream()
                    .map(role -> {
                        try {
                            // Buscar a role com permissões usando findByIdWithPermissions
                            Role roleWithPermissions = roleRepository.findByIdWithPermissions(role.getId())
                                    .orElse(role);

                            // Converter para DTO
                            return convertToDto(roleWithPermissions);
                        } catch (Exception e) {
                            logger.warn("Erro ao carregar permissões para role {}: {}", role.getId(), e.getMessage());

                            // Retornar DTO básico sem permissões em caso de erro
                            int userCount = userRoleRepository.countByRoleId(role.getId());
                            return new RoleDto(
                                    role.getId(),
                                    role.getName(),
                                    role.getDescription(),
                                    new ArrayList<>(),
                                    userCount
                            );
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Erro ao buscar todas as roles: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public RoleDto getRoleById(Integer id) {
        try {
            // Buscar role com permissões usando consulta JPQL otimizada
            Role role = roleRepository.findByIdWithPermissions(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + id));

            // Buscar manualmente a contagem de usuários
            int userCount = userRoleRepository.countByRoleId(id);

            // Criar o DTO manualmente para evitar problemas com collections
            List<PermissionDto> permissionDtos = new ArrayList<>();
            if (role.getRolePermissions() != null) {
                for (RolePermission rp : role.getRolePermissions()) {
                    if (rp != null && rp.getPermission() != null) {
                        Permission permission = rp.getPermission();
                        permissionDtos.add(new PermissionDto(
                                permission.getId(),
                                permission.getName(),
                                permission.getDescription()
                        ));
                    }
                }
            }

            return new RoleDto(
                    role.getId(),
                    role.getName(),
                    role.getDescription(),
                    permissionDtos,
                    userCount
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar role por ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar cargo: " + e.getMessage(), e);
        }
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

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        roleRepository.save(role);

        if (request.getPermissionIds() != null) {
            // Remover todas as permissões existentes
            rolePermissionRepository.deleteByRoleId(id);

            // Para garantir que o banco de dados reflita as alterações imediatamente
            entityManager.flush();
            entityManager.clear();

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

        // Buscar a role atualizada com permissões - importante usar findByIdWithPermissions
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
        logger.info("Iniciando adição de permissão {} ao cargo {}", permissionId, roleId);

        // 1. Verificar se a role e a permissão existem
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada com ID: " + roleId));

        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + permissionId));

        // 2. Verificar se a permissão já está associada à role
        boolean alreadyExists = rolePermissionRepository.existsByRoleIdAndPermissionId(roleId, permissionId);
        if (alreadyExists) {
            logger.info("Permissão {} já está associada ao cargo {}", permissionId, roleId);
            return getRoleById(roleId);
        }

        // 3. Criar e salvar a associação role-permissão
        RolePermission rolePermission = new RolePermission();
        rolePermission.setRole(role);
        rolePermission.setPermission(permission);

        try {
            rolePermissionRepository.save(rolePermission);
            // Forçar o flush para garantir que a operação seja persistida
            rolePermissionRepository.flush();
            logger.info("Permissão {} adicionada com sucesso ao cargo {}", permissionId, roleId);
        } catch (Exception e) {
            logger.error("Erro ao salvar associação role-permissão: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao adicionar permissão ao cargo: " + e.getMessage(), e);
        }

        // Limpar o cache da sessão Hibernate
        entityManager.clear();

        // 4. Retornar a role atualizada - buscar novamente para garantir dados atualizados
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

        // Se role tem permissões, processá-las com segurança
        if (role.getRolePermissions() != null) {
            // Usar uma nova lista para evitar problemas de iteração concorrente
            List<RolePermission> rolePermissionList = new ArrayList<>(role.getRolePermissions());

            for (RolePermission rp : rolePermissionList) {
                if (rp != null && rp.getPermission() != null) {
                    permissions.add(convertToPermissionDto(rp.getPermission()));
                }
            }
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