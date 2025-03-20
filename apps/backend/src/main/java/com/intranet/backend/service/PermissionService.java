package com.intranet.backend.service;

import com.intranet.backend.dto.PermissionCreateRequest;
import com.intranet.backend.dto.PermissionDto;

import java.util.List;

public interface PermissionService {

    List<PermissionDto> getAllPermissions();

    PermissionDto getPermissionById(Integer id);

    PermissionDto getPermissionByName(String name);

    PermissionDto createPermission(PermissionCreateRequest request);

    PermissionDto updatePermission(Integer id, PermissionCreateRequest request);

    void deletePermission(Integer id);
}