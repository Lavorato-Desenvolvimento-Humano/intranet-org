package com.intranet.drive.collaboration.repository;

import com.intranet.drive.collaboration.entity.FileCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FileCommentRepository extends JpaRepository<FileCommentEntity, Long> {

    List<FileCommentEntity> findByFileIdAndIsDeletedFalseOrderByCreatedAtDesc(Long fileId);
}
