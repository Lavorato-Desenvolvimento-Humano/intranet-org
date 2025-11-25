package com.intranet.drive.file.repository;

import com.intranet.drive.file.entity.FilePermissionEntity;
import com.intranet.drive.file.entity.PermissionTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FilePermissionRepository extends JpaRepository<FilePermissionEntity, Long> {
    List<FilePermissionEntity> findByFileId(Long id);
    void deleteByFileIdAndTargetTypeAndTargetId(Long fileId, PermissionTargetType targetType, String targetId);
}
