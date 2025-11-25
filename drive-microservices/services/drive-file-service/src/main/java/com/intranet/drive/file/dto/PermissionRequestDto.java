package com.intranet.drive.file.dto;

import com.intranet.drive.file.entity.PermissionTargetType;
import com.intranet.drive.file.entity.PermissionType;


public record PermissionRequestDto(PermissionTargetType targetType, String targetId, PermissionType permissionType) {
}
