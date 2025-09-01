package com.intranet.drive.file.service;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.security.JwtTokenUtil;
import com.intranet.drive.file.dto.FileDto;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.repository.FileRepository;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    private final FileRepository fileRepository;
    private final StorageService storageService;
    private final CoreIntegrationService coreIntegrationService;
    private final Tika tika;

    @Value("${file.max-size:52428800}") // 50MB
    private Long maxFileSize;

    @Value("${file.allowed-types}")
    private String allowedTypesString;

    public FileService(FileRepository fileRepository,
                       StorageService storageService,
                       CoreIntegrationService coreIntegrationService) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.coreIntegrationService = coreIntegrationService;
        this.tika = new Tika();
    }

    public FileDto uploadFile(MultipartFile file, Long folderId) throws IOException {
        logger.info("Iniciando upload do arquivo: {}", file.getOriginalFilename());

        validateFile(file);

        UserDto currentUser = getCurrentUser();
        logger.debug("Upload iniciado pelo usuário: {} (ID: {})", currentUser.getUsername(), currentUser.getId());

        String detectedMimeType = tika.detect(file.getInputStream(), file.getOriginalFilename());

        String md5Hash = calculateMD5(file.getBytes());

        List<FileEntity> existingFiles = fileRepository.findByMd5Hash(md5Hash);
        if (!existingFiles.isEmpty()) {
            logger.info("Arquivo com MD5 {} já existe, criando referência", md5Hash);
            //Lógica de deduplicação vou fazer ainda...
        }

        String storageKey = storageService.storeFile(file);

        // Criar entidade
        FileEntity fileEntity = createFileEntity(file, detectedMimeType, md5Hash, storageKey, folderId, currentUser);

        fileEntity = fileRepository.save(fileEntity);

        logger.info("Arquivo uploadado com sucesso - ID: {}, Storage Key: {}, Usuário: {}",
                fileEntity.getId(), storageKey, currentUser.getUsername());

        return new FileDto(fileEntity);
    }


    @Transactional(readOnly = true)
    public InputStream downloadFile(Long fileId) {
        logger.info("Iniciando download do arquivo ID: {}", fileId);

        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileAccess(file);

        fileRepository.incrementDownloadCount(fileId);

        logger.info("Download autorizado para arquivo: {} - Usuário: {}",
                file.getName(), getCurrentUser().getUsername());

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
                .filter(this::hasFileAccess)
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

        validateFileAccess(file);

        String sanitizedName = sanitizeFileName(newName);
        file.setName(sanitizedName);

        file = fileRepository.save(file);

        logger.info("Arquivo {} renomeado para {} pelo usuário {}", fileId, sanitizedName, getCurrentUser().getUsername());

        return new FileDto(file);
    }

    public void deleteFile(Long fileId) {
        FileEntity file = fileRepository.findByIdAndNotDeleted(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        validateFileAccess(file);

        // Soft delete
        file.markAsDeleted();
        fileRepository.save(file);

        logger.info("Arquivo {} deletado pelo usuário {}",
                fileId, getCurrentUser().getUsername());
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
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    String.format("Arquivo muito grande. Máximo permitido: %d MB", maxFileSize / 1024 / 1024)
            );
        }

        if (file.getOriginalFilename() == null || file.getOriginalFilename().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do arquivo é obrigatório");
        }

        // Validar por extensão
        String filename = file.getOriginalFilename().toLowerCase();
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Nome do arquivo contém caracteres inválidos");
        }
    }

    private String sanitizeFileName(String filename) {
        if (filename == null) return "arquivo_sem_nome";

        return filename.replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("_{2,}", "_")
                .substring(0, Math.min(filename.length(), 255));
    }

    private UserDto getCurrentUser() {
       // Primeiro tentar obter do request (colocado pelo JwtAuthenticationFilter)
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            UserDto user = (UserDto) request.getAttribute("currentUser");
            if (user != null) {
                return user;
            }
        }

        // Fallback obter do SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            throw new RuntimeException("Usuário não encontrado no contexto de segurança");
        }

        throw new RuntimeException("Usuário não autenticado");
    }

    private String detectMimeType(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            String detectedType = tika.detect(inputStream, file.getOriginalFilename());

            // Validar se o tipo é permitido
            List<String> allowedTypes = Arrays.asList(allowedTypesString.split(","));
            if (!allowedTypes.contains(detectedType)) {
                throw new IllegalArgumentException(
                        "Tipo de arquivo não permitido: " + detectedType
                );
            }

            return detectedType;
        }
    }

    private String calculateMD5(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao calcular MD5", e);
        }
    }

    private void validateFileAccess(FileEntity file) {
        UserDto currentUser = getCurrentUser();

        if (file.getOwnerId().equals(currentUser.getId())) {
            return;
        }

        if (coreIntegrationService.hasRole(currentUser, "ADMIN")) {
            return;
        }

        // FUTURA INTEGRAÇÃO COM DRIVE-PERMISSION-SERVICE
        // Por enquanto, só o proprietário e admin têm acesso
        throw new RuntimeException("Acesso negado ao arquivo");
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

    /**
     * Criar entidade de arquivo
     */
    private FileEntity createFileEntity(MultipartFile file, String mimeType, String md5Hash,
                                        String storageKey, Long folderId, UserDto user) {
        String sanitizedName = sanitizeFileName(file.getOriginalFilename());
        String virtualPath = "/files/" + storageKey;

        FileEntity fileEntity = new FileEntity(
                sanitizedName,
                file.getOriginalFilename(),
                mimeType,
                file.getSize(),
                virtualPath,
                storageKey,
                md5Hash,
                user.getId(),
                user.getUsername()
        );

        fileEntity.setFolderId(folderId);

        return fileEntity;
    }
}
