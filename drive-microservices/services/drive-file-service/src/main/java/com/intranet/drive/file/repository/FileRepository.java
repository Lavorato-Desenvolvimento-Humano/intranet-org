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

    // ================================
    // QUERIES BÁSICAS
    // ================================

    /**
     * Buscar arquivos não deletados
     */
    @Query("SELECT f FROM FileEntity f WHERE f.isDeleted = false")
    Page<FileEntity> findAllActive(Pageable pageable);

    /**
     * Buscar por ID e não deletado
     */
    @Query("SELECT f FROM FileEntity f WHERE f.id = :id AND f.isDeleted = false")
    Optional<FileEntity> findByIdAndNotDeleted(@Param("id") Long id);

    // ================================
    // QUERIES POR PASTA
    // ================================

    /**
     * Buscar arquivos por pasta (versões atuais apenas)
     */
    @Query("SELECT f FROM FileEntity f WHERE f.folderId = :folderId AND f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.name")
    Page<FileEntity> findByFolderIdAndNotDeleted(@Param("folderId") Long folderId, Pageable pageable);

    /**
     * Buscar arquivos na pasta raiz do usuário
     */
    @Query("SELECT f FROM FileEntity f WHERE f.ownerId = :ownerId AND f.folderId IS NULL AND f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.name")
    Page<FileEntity> findByOwnerIdAndNotDeleted(@Param("ownerId") Long ownerId, Pageable pageable);

    // ================================
    // QUERIES DE BUSCA
    // ================================

    /**
     * Buscar arquivos por nome (case insensitive)
     */
    @Query("SELECT f FROM FileEntity f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByNameContainingIgnoreCase(@Param("query") String query, Pageable pageable);

    /**
     * Buscar arquivos por tipo MIME
     */
    @Query("SELECT f FROM FileEntity f WHERE f.mimeType = :mimeType AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByMimeType(@Param("mimeType") String mimeType, Pageable pageable);

    /**
     * Buscar arquivos por extensão
     */
    @Query("SELECT f FROM FileEntity f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%.', :extension)) AND f.isDeleted = false AND f.isCurrentVersion = true")
    Page<FileEntity> findByExtension(@Param("extension") String extension, Pageable pageable);

    // ================================
    // QUERIES DE STORAGE
    // ================================

    /**
     * Buscar por storage key
     */
    Optional<FileEntity> findByStorageKey(String storageKey);

    /**
     * Buscar por MD5 hash (para deduplicação)
     */
    @Query("SELECT f FROM FileEntity f WHERE f.md5Hash = :md5Hash AND f.isDeleted = false")
    List<FileEntity> findByMd5Hash(@Param("md5Hash") String md5Hash);

    // ================================
    // QUERIES DE VERSIONAMENTO
    // ================================

    /**
     * Buscar todas as versões de um arquivo
     */
    @Query("SELECT f FROM FileEntity f WHERE f.parentFileId = :parentFileId OR f.id = :parentFileId ORDER BY f.version DESC")
    List<FileEntity> findVersionsByParentFileId(@Param("parentFileId") Long parentFileId);

    /**
     * Buscar versão atual de um arquivo
     */
    @Query("SELECT f FROM FileEntity f WHERE (f.parentFileId = :fileId OR f.id = :fileId) AND f.isCurrentVersion = true AND f.isDeleted = false")
    Optional<FileEntity> findCurrentVersion(@Param("fileId") Long fileId);

    // ================================
    // QUERIES DE ESTATÍSTICAS
    // ================================

    /**
     * Contar arquivos do usuário
     */
    @Query("SELECT COUNT(f) FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Long countByOwnerId(@Param("ownerId") Long ownerId);

    /**
     * Calcular espaço usado pelo usuário
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true")
    Long calculateSpaceUsedByOwner(@Param("ownerId") Long ownerId);

    /**
     * Buscar arquivos mais baixados
     */
    @Query("SELECT f FROM FileEntity f WHERE f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.downloadCount DESC")
    Page<FileEntity> findMostDownloaded(Pageable pageable);

    /**
     * Buscar arquivos recentes do usuário
     */
    @Query("SELECT f FROM FileEntity f WHERE f.ownerId = :ownerId AND f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.createdAt DESC")
    Page<FileEntity> findRecentByOwner(@Param("ownerId") Long ownerId, Pageable pageable);

    // ================================
    // QUERIES DE DATA
    // ================================

    /**
     * Buscar arquivos criados em período
     */
    @Query("SELECT f FROM FileEntity f WHERE f.createdAt BETWEEN :startDate AND :endDate AND f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.createdAt DESC")
    Page<FileEntity> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate,
                                            Pageable pageable);

    /**
     * Buscar arquivos modificados em período
     */
    @Query("SELECT f FROM FileEntity f WHERE f.updatedAt BETWEEN :startDate AND :endDate AND f.isDeleted = false AND f.isCurrentVersion = true ORDER BY f.updatedAt DESC")
    Page<FileEntity> findByUpdatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate,
                                            Pageable pageable);

    // ================================
    // QUERIES DE MANUTENÇÃO
    // ================================

    /**
     * Buscar arquivos órfãos (sem referência de pasta válida)
     */
    @Query("SELECT f FROM FileEntity f WHERE f.folderId IS NOT NULL AND f.isDeleted = false")
    List<FileEntity> findOrphanedFiles();

    /**
     * Buscar arquivos para limpeza (deletados há mais de X dias)
     */
    @Query("SELECT f FROM FileEntity f WHERE f.isDeleted = true AND f.deletedAt < :cutoffDate")
    List<FileEntity> findFilesForCleanup(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ================================
    // OPERAÇÕES DE MODIFICAÇÃO
    // ================================

    /**
     * Incrementar contador de downloads
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.downloadCount = f.downloadCount + 1 WHERE f.id = :fileId")
    void incrementDownloadCount(@Param("fileId") Long fileId);

    /**
     * Marcar versões antigas como não-atuais
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.isCurrentVersion = false WHERE f.parentFileId = :parentFileId OR f.id = :parentFileId")
    void markOldVersionsAsNotCurrent(@Param("parentFileId") Long parentFileId);

    /**
     * Atualizar pasta de múltiplos arquivos
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.folderId = :newFolderId WHERE f.id IN :fileIds AND f.ownerId = :ownerId")
    void updateFolderForFiles(@Param("fileIds") List<Long> fileIds,
                              @Param("newFolderId") Long newFolderId,
                              @Param("ownerId") Long ownerId);

    /**
     * Soft delete de múltiplos arquivos
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.isDeleted = true, f.deletedAt = :deletedAt WHERE f.id IN :fileIds AND f.ownerId = :ownerId")
    void softDeleteFiles(@Param("fileIds") List<Long> fileIds,
                         @Param("deletedAt") LocalDateTime deletedAt,
                         @Param("ownerId") Long ownerId);
}