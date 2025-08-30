package com.intranet.drive.file.repository;

import com.intranet.drive.file.entity.FileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    //Buscar arquivos não deletados
    @Query("SELECT f FROM FileEntity f WHERE f.isDeleted = false")
    Page<FileEntity> findAllActive(Pageable pageable);

    //Buscar por ID e não deletado
    @Query("SELECT f FROM FileEntity f WHERE f.id = :id AND f.isDeleted = false")
    Optional<FileEntity> findByIdAndNotDeleted(@Param("id") Long id);

    //Buscar arquivos por pasta
    @Query("SELECT f FROM FileEntity f WHERE f.folderId = :folderId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByFolderIdAndNotDeleted(@Param("folderId") Long folderId, Pageable pageable);

    //Buscar arquivos por owner
    @Query("SELECT f FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByOwnerIdAndNotDeleted(@Param("ownerId") Long ownerId, Pageable pageable);

    //Buscar por storage key
    Optional<FileEntity> findByStorageKey(String storageKey);

    //Buscar por MD5 hash (para deduplicação)
    @Query("SELECT f FROM FileEntity f WHERE f.md5Hash = :md5Hash AND f.isDeleted = false")
    List<FileEntity> findByMd5Hash(@Param("md5Hash") String md5Hash);

    //Buscar versões de um arquivo
    @Query("SELECT f FROM FileEntity f WHERE f.parentFileId = :parentFileId OR f.id = :parentFileId ORDER BY f.version DESC")
    List<FileEntity> findVersionsByParentFileId(@Param("parentFileId") Long parentFileId);

    //Buscar versão atual de um arquivo
    @Query("SELECT f FROM FileEntity f WHERE (f.parentFileId = :fileId OR f.id = :fileId) AND f.isCurrentVersion = true AND f.isDeleted = false")
    List<FileEntity> findCurrentVersionByFileId(@Param("fileId") Long fileId);

    //Buscar arquivos por nome (like)
    @Query("SELECT f FROM FileEntity f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :name, '%')) AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);

    //Buscar arquivos por tipo MIME
    @Query("SELECT f FROM FileEntity f WHERE f.mimeType = :mimeType AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByMimeType(@Param("mimeType") String mimeType, Pageable pageable);

    //Buscar arquivos por owner e pasta
    @Query("SELECT f FROM FileEntity f WHERE f.ownerId = :ownerId AND f.folderId = :folderId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByOwnerIdAndFolderId(@Param("ownerId") Long ownerId, @Param("folderId") Long folderId, Pageable pageable);

    // Contar arquivos por owner
    @Query("SELECT COUNT(f) FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Long countByOwnerId(@Param("ownerId") Long ownerId);

    // Somar tamanho dos arquivos por owner
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Long sumFileSizeByOwnerId(@Param("ownerId") Long ownerId);

    // Incrementar download count
    @Modifying
    @Query("UPDATE FileEntity f SET f.downloadCount = f.downloadCount + 1 WHERE f.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    // Marcar como deletado
    @Modifying
    @Query("UPDATE FileEntity f SET f.isDeleted = true, f.deletedAt = :deletedAt WHERE f.id = :id")
    void markAsDeleted(@Param("id") Long id, @Param("deletedAt") LocalDateTime deletedAt);

    // Restaurar arquivo deletado
    @Modifying
    @Query("UPDATE FileEntity f SET f.isDeleted = false, f.deletedAt = null WHERE f.id = :id")
    void restore(@Param("id") Long id);

    // Buscar arquivos deletados há mais de X dias (para limpeza)
    @Query("SELECT f FROM FileEntity f WHERE f.isDeleted = true AND f.deletedAt < :cutoffDate")
    List<FileEntity> findDeletedFilesBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Marcar versão anterior como não atual
    @Modifying
    @Query("UPDATE FileEntity f SET f.isCurrentVersion = false WHERE (f.parentFileId = :parentFileId OR f.id = :parentFileId) AND f.id != :currentVersionId")
    void markPreviousVersionsAsNotCurrent(@Param("parentFileId") Long parentFileId, @Param("currentVersionId") Long currentVersionId);
}
