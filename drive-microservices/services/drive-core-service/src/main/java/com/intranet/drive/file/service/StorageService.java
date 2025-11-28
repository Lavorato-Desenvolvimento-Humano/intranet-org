package com.intranet.drive.file.service;

import com.intranet.drive.file.config.MinioConfig;
import io.minio.*;
import io.minio.errors.*;
import io.minio.messages.DeleteError;
import io.minio.messages.DeleteObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StorageService {

    private static final Logger logger = LoggerFactory.getLogger(StorageService.class);
    private static final String DATE_FORMAT = "yyyy/MM/dd";

    private final MinioClient minioClient;
    private final MinioConfig minioConfig;

    public StorageService(MinioClient minioClient, MinioConfig minioConfig) {
        this.minioClient = minioClient;
        this.minioConfig = minioConfig;
        initializeBucket();
    }

    private void initializeBucket() {
        try {
            //Verificar se o bucket existe
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .build()
            );

            if (!bucketExists) {
                // Criar bucket se não existir
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(minioConfig.getBucketName())
                                .build()
                );
                logger.info("Bucket '{}' criado com sucesso", minioConfig.getBucketName());
            } else {
                logger.info("Bucket '{}' já existe", minioConfig.getBucketName());
            }
        } catch (Exception e) {
            logger.error("Erro ao inicializar bucket: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao inicializar storage", e);
        }
    }

    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        String storageKey = generateStorageKey(file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream()) {

            String contentType = file.getContentType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(storageKey)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );

            logger.info("Arquivo armazenado com sucesso - Storage Key: {}, Tamanho: {} bytes",
                    storageKey, file.getSize());

            return storageKey;
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Erro ao inicializar storage: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao armazenar arquivo no storage", e);
        }
    }

    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 500))
    public InputStream getFile(String storageKey) {
        if (storageKey == null || storageKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Storage key não pode estar vazia");
        }

        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(storageKey)
                            .build()
            );

        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException | IOException e) {
            logger.error("Erro ao recuperar arquivo {}: {}", storageKey, e.getMessage(), e);
            throw new RuntimeException("Arquivo não encontrado no storage: " + storageKey, e);
        }
    }

    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 500))
    public void deleteFile(String storageKey) {
        if (storageKey == null || storageKey.trim().isEmpty()) {
            logger.warn("Tentativa de deletar arquivo com storage key vazia");
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(storageKey)
                            .build()
            );

            logger.info("Arquivo removido do storage: {}", storageKey);

        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException | IOException e) {
            logger.error("Erro ao remover arquivo {}: {}", storageKey, e.getMessage(), e);
            throw new RuntimeException("Falha ao remover arquivo do storage", e);
        }
    }

    public List<String> deleteFiles(List<String> storageKeys) {
        if (storageKeys == null || storageKeys.isEmpty()) {
            return List.of();
        }

        List<DeleteObject> objectsToDelete = storageKeys.stream()
                .filter(key -> key != null && !key.trim().isEmpty())
                .map(DeleteObject::new)
                .collect(Collectors.toList());

        try {
            Iterable<Result<DeleteError>> results = minioClient.removeObjects(
                    RemoveObjectsArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .objects(objectsToDelete)
                            .build()
            );

            boolean errors = results.spliterator()
                    .tryAdvance(result -> {
                        try {
                            DeleteError error = result.get();
                            logger.error("Erro ao deletar arquivo {}: {}", error.objectName(), error.message());
                        } catch (Exception e) {
                            logger.error("Erro ao processar resultado de deleção: {}", e.getMessage());
                        }
                    });

            logger.info("Batch delete concluído - {} arquivos processados", objectsToDelete.size());
            return List.of();

        } catch (Exception e) {
            logger.error("Erro no batch delete: {}", e.getMessage(), e);
            throw new RuntimeException("Falha no batch delete", e);
        }
    }


    public boolean fileExists(String storageKey) {
        if (storageKey == null || storageKey.trim().isEmpty()) {
            return false;
        }

        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(storageKey)
                            .build()
            );
            return true;

        } catch (Exception e) {
            logger.debug("Arquivo {} não existe no storage", storageKey);
            return false;
        }
    }

    public ObjectStat getFileInfo(String storageKey) {
        try {
            StatObjectResponse response = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(storageKey)
                            .build()
            );

            return new ObjectStat(
                    storageKey,
                    response.size(),
                    response.contentType(),
                    response.lastModified().toLocalDateTime()
            );

        } catch (Exception e) {
            logger.error("Erro ao obter informações do arquivo {}: {}", storageKey, e.getMessage());
            throw new RuntimeException("Falha ao obter informações do arquivo", e);
        }
    }

    private String generateObjectName(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        return uuid + extension;
    }

    private String generateStorageKey(String originalFilename) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern(DATE_FORMAT));
        String uuid = UUID.randomUUID().toString();
        String sanitizedFilename = sanitizeFilename(originalFilename);

        return String.format("%s/%s-%s", datePath, uuid, sanitizedFilename);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "unnamed_file";
        }

        return filename.replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("_{2,}", "_")
                .toLowerCase();
    }

    public static class ObjectStat {
        private final String key;
        private final long size;
        private final String contentType;
        private final LocalDateTime lastModified;

        public ObjectStat(String key, long size, String contentType, LocalDateTime lastModified) {
            this.key = key;
            this.size = size;
            this.contentType = contentType;
            this.lastModified = lastModified;
        }

        // Getters
        public String getKey() { return key; }
        public long getSize() { return size; }
        public String getContentType() { return contentType; }
        public LocalDateTime getLastModified() { return lastModified; }
    }
}
