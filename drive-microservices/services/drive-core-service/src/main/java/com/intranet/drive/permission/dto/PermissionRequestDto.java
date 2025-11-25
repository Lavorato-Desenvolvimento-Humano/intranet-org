package com.intranet.drive.permission.dto;

import com.intranet.drive.permission.entity.PermissionTargetType;
import com.intranet.drive.permission.entity.PermissionType;


public record PermissionRequestDto(PermissionTargetType targetType, String targetId, PermissionType permissionType) {
}
