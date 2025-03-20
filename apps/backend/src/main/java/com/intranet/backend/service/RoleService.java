package com.intranet.backend.service;

import com.intranet.backend.dto.PermissionDto;
import com.intranet.backend.dto.RoleCreateRequest;
import com.intranet.backend.dto.RoleDto;
import com.intranet.backend.dto.RoleUpdateRequest;

import java.util.List;

public interface RoleService {

    List<RoleDto> getAllRoles();

    RoleDto getRoleById(Integer id);

    RoleDto getRoleByName(String name);

    RoleDto createRole(RoleCreateRequest request);

    RoleDto updateRole(Integer id, RoleUpdateRequest request);

    void deleteRole(Integer id);

    List<PermissionDto> getRolePermissions(Integer roleId);

    RoleDto addPermissionToRole(Integer roleId, Integer permissionId);

    RoleDto removePermissionFromRole(Integer roleId, Integer permissionId);
}