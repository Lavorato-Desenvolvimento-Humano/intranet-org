package com.intranet.drive.file.service;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.security.JwtTokenUtil;
import com.intranet.drive.file.dto.FileDto;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.repository.FileRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    private final FileRepository fileRepository;
    private final StorageService storageService;
    private final JwtTokenUtil jwtTokenUtil;
    private final Tika tika;

    @Value("${file.max-size:52428800}") // 50MB
    private Long maxFileSize;

    @Value("${file.allowed-types}")
    private String allowedTypesString;

    public FileService(FileRepository fileRepository,
                       StorageService storageService,
                       JwtTokenUtil jwtTokenUtil) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.tika = new Tika();
    }

    public FileDto uploadFile(MultipartFile file, Long folderId) throws IOException {
        logger.info("Iniciando upload do arquivo: {}", file.getOriginalFilename());

        validateFile(file);

        UserDto currentUser = getCurrentUser();

        String detectedMimeType = tika.detect(file.getInputStream(), file.getOriginalFilename());

        String md5Hash = calculateMD5(file.getBytes());

        List<FileEntity> existingFiles = fileRepository.findByMd5Hash(md5Hash);
        if (!existingFiles.isEmpty()) {
            logger.info("Arquivo com MD5 {} já existe, criando referência", md5Hash);
            //Lógica de deduplicação vou fazer ainda...
        }

        String storageKey = storageService.storeFile(file);

        // Criar entidade
        FileEntity fileEntity = new FileEntity(
                sanitizeFileName(file.getOriginalFilename()),
                file.getOriginalFilename(),
                detectedMimeType,
                file.getSize(),
                "/files/" + storageKey, // path virtual
                storageKey,
                md5Hash,
                currentUser.getId(),
                currentUser.getUsername()
        );

        fileEntity.setFolderId(folderId);

        logger.info("Arquivo uploadado com sucesso - ID: {}, Storage Key: {}",
                fileEntity.getId(), storageKey);

        return new FileDto(fileEntity);
    }


    @Transactional(readOnly = true)
    public InputStream downloadFile(Long fileId) {
        logger.info("Iniciando download do arquivo ID: {}", fileId);

        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileAccess(file);

        fileRepository.incrementDownloadCount(fileId);

        return storageService.getFile(file.getStorageKey());
    }

    @Transactional(readOnly = true)
    public FileDto getFileById(Long fileId) {
        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileAccess(file);
        return new FileDto(file);
    }

    @Transactional(readOnly = true)
    public Page<FileDto> getFilesByFolder(Long folderId, Pageable pageable) {
        UserDto currentUser = getCurrentUser();

        Page<FileEntity> files;
        if (folderId == null) {
            // Arquivos na pasta raiz do usuário
            files = fileRepository.findByOwnerIdAndNotDeleted(currentUser.getId(), pageable);
        } else {
            files = fileRepository.findByFolderIdAndNotDeleted(folderId, pageable);
        }

        List<FileDto> fileDtos = files.getContent().stream()
                .map(FileDto::new)
                .collect(Collectors.toList());

        return new PageImpl<>(fileDtos, pageable, files.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<FileDto> searchFiles(String query, Pageable pageable) {
        Page<FileEntity> files = fileRepository.findByNameContainingIgnoreCase(query, pageable);

        List<FileDto> fileDtos = files.getContent().stream()
                .filter(this::hasFileAccess) // Filtrar por permissão
                .map(FileDto::new)
                .collect(Collectors.toList());

        return new PageImpl<>(fileDtos, pageable, files.getTotalElements());
    }

    public FileDto updateFile(Long fileId, String newName) {
        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileOwnership(file);

        file.setName(sanitizeFileName(newName));
        file = fileRepository.save(file);

        logger.info("Arquivo {} renomeado para {}", fileId, newName);
        return new FileDto(file);
    }

    public void deleteFile(Long fileId) {
        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileOwnership(file);

        // Soft delete
        file.markAsDeleted();
        fileRepository.save(file);

        logger.info("Arquivo {} marcado como deletado", fileId);
    }

    public void permanentDeleteFile(Long fileId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileOwnership(file);

        // Remover do storage
        storageService.deleteFile(file.getStorageKey());

        // Remover do banco
        fileRepository.delete(file);

        logger.info("Arquivo {} removido permanentemente", fileId);
    }

    @Transactional(readOnly = true)
    public List<FileDto> getFileVersions(Long fileId) {
        List<FileEntity> versions = fileRepository.findVersionsByParentFileId(fileId);

        return versions.stream()
                .filter(this::hasFileAccess)
                .map(FileDto::new)
                .collect(Collectors.toList());
    }

    // Métodos auxiliares

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    String.format("Arquivo muito grande. Máximo permitido: %d bytes", maxFileSize)
            );
        }

        // Validar tipo do arquivo
        List<String> allowedTypes = Arrays.asList(allowedTypesString.split(","));
        if (!allowedTypes.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    String.format("Tipo de arquivo não permitido: %s", file.getContentType())
            );
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "unnamed";

        // Remover caracteres perigosos
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String calculateMD5(byte[] content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(content);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao calcular MD5", e);
        }
    }

    private UserDto getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Usuário não autenticado");
        }

        // Por enquanto, estou criando o userDetail básico
        // Futuramente integrar com intranet-core para obter dados completos
        UserDto user = new UserDto();
        user.setUsername(auth.getName());
        user.setId(1L); // Temporário - obter do token JWT

        return user;
    }

    private void validateFileAccess(FileEntity file) {
        UserDto currentUser = getCurrentUser();

        // Por enquanto, apenas verificar se é o owner
        // Futuramente integrar com drive-permission-service
        if (!file.getOwnerId().equals(currentUser.getId())) {
            throw new RuntimeException("Acesso negado ao arquivo");
        }
    }

    private boolean hasFileAccess(FileEntity file) {
        try {
            validateFileAccess(file);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private void validateFileOwnership(FileEntity file) {
        UserDto currentUser = getCurrentUser();

        if (!file.getOwnerId().equals(currentUser.getId())) {
            throw new RuntimeException("Apenas o proprietário pode modificar este arquivo");
        }
    }
}
