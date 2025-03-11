package com.intranet.backend.service;

import com.intranet.backend.exception.FileStorageException;
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

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir)
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Não foi possível criar o diretório para armazenar os arquivos.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Normaliza o nome do arquivo
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        try {
            // Verifica se o nome do arquivo contém caracteres inválidos
            if (originalFilename.contains("..")) {
                throw new FileStorageException("O nome do arquivo contém um caminho inválido: " + originalFilename);
            }

            // Gera um nome único para o arquivo para evitar sobrescrever arquivos existentes
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Copia o arquivo para o diretório de destino
            Path targetLocation = this.fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFilename;
        } catch (IOException ex) {
            throw new FileStorageException("Não foi possível armazenar o arquivo " + originalFilename + ". Por favor, tente novamente!", ex);
        }
    }

    public void deleteFile(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new FileStorageException("Não foi possível excluir o arquivo " + filename, ex);
        }
    }
}