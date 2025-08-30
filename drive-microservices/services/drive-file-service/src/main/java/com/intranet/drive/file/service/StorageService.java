package com.intranet.drive.file.service;

import com.intranet.drive.file.config.MinioConfig;
import io.minio.*;
import io.minio.errors.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class StorageService {

    private static final Logger logger = LoggerFactory.getLogger(StorageService.class);

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

    public String storeFile(MultipartFile file) throws IOException {
        String objectName = generateObjectName(file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            logger.info("Arquivo armazenado com sucesso: {}", objectName);
            return objectName;
        } catch (Exception e) {
            logger.error("Erro ao inicializar object: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao inicializar object", e);
        }
    }

    public String storeFile(byte[] content, String contentType, String originalFilename) {
        String objectName = generateObjectName(originalFilename);

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(content)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .stream(inputStream, content.length, -1)
                            .contentType(contentType)
                            .build()
            );

            logger.info("Arquivo armazenado com sucesso: {}", objectName);
            return objectName;

        } catch (Exception e) {
            logger.error("Erro ao armazenar arquivo: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao armazenar arquivo", e);
        }
    }
    public InputStream getFile(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            logger.error("Erro ao recuperar arquivo: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao recuperar arquivo", e);
        }
    }

    public boolean deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .build()
            );

            logger.info("Arquivo removido com sucesso: {}", objectName);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao remover arquivo: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean fileExists(String objectName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
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
}
