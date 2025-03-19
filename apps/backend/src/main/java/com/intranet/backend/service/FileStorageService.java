package com.intranet.backend.service;

import com.intranet.backend.exception.FileStorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private final Path fileStorageLocation;

    // Limite máximo de arquivo - 5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir)
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
            logger.info("Diretório de armazenamento de arquivos inicializado: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            logger.error("Não foi possível criar o diretório para armazenar os arquivos: {}", this.fileStorageLocation, ex);
            throw new FileStorageException("Não foi possível criar o diretório para armazenar os arquivos.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Verificar se o arquivo é nulo ou vazio
        if (file == null || file.isEmpty()) {
            logger.error("Tentativa de armazenar arquivo nulo ou vazio");
            throw new FileStorageException("Arquivo não pode ser nulo ou vazio");
        }

        // Verificar o tamanho do arquivo
        if (file.getSize() > MAX_FILE_SIZE) {
            logger.error("Arquivo excede o tamanho máximo permitido: {} bytes", file.getSize());
            throw new FileStorageException("Arquivo excede o tamanho máximo permitido de 5MB");
        }

        // Verificar o tipo de conteúdo do arquivo
        String contentType = file.getContentType();
        if (contentType == null || !isValidImageContentType(contentType)) {
            logger.error("Tipo de arquivo não suportado: {}", contentType);
            throw new FileStorageException("Apenas imagens JPEG, PNG, GIF e WEBP são aceitas");
        }

        // Normaliza o nome do arquivo
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        logger.debug("Processando arquivo: {}", originalFilename);

        try {
            // Verifica se o nome do arquivo contém caracteres inválidos
            if (originalFilename.contains("..")) {
                logger.error("O nome do arquivo contém um caminho inválido: {}", originalFilename);
                throw new FileStorageException("O nome do arquivo contém um caminho inválido: " + originalFilename);
            }

            // Gera um nome único para o arquivo para evitar sobrescrever arquivos existentes
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            logger.debug("Nome de arquivo gerado: {}", newFilename);

            // Copia o arquivo para o diretório de destino
            Path targetLocation = this.fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Arquivo armazenado com sucesso: {}", newFilename);

            return newFilename;
        } catch (IOException ex) {
            logger.error("Não foi possível armazenar o arquivo: {}", originalFilename, ex);
            throw new FileStorageException("Não foi possível armazenar o arquivo " + originalFilename + ". Por favor, tente novamente!", ex);
        }
    }

    public void deleteFile(String filename) {
        if (filename == null || filename.isEmpty()) {
            logger.warn("Tentativa de excluir arquivo com nome nulo ou vazio");
            return; // Silenciosamente não faz nada
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();

            // Verificar se o arquivo existe antes de tentar excluí-lo
            if (Files.exists(filePath)) {
                Files.deleteIfExists(filePath);
                logger.info("Arquivo excluído com sucesso: {}", filename);
            } else {
                logger.warn("Arquivo não encontrado para exclusão: {}", filename);
            }
        } catch (IOException ex) {
            logger.error("Não foi possível excluir o arquivo: {}", filename, ex);
            throw new FileStorageException("Não foi possível excluir o arquivo " + filename, ex);
        }
    }

    // Método auxiliar para validar tipos de conteúdo de imagem
    private boolean isValidImageContentType(String contentType) {
        return contentType.equals("image/jpeg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/gif") ||
                contentType.equals("image/webp");
    }
}