package com.intranet.backend.service;

import com.intranet.backend.exception.FileStorageException;
import com.intranet.backend.util.FileHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        initializeStorageDirectories();
    }

    /**
     * Inicializa os diretórios de armazenamento
     */
    private void initializeStorageDirectories() {
        try {
            // Criar diretório principal se não existir
            createDirectoryIfNotExists(fileStorageLocation);

            // Criar subdiretórios para imagens e arquivos
            createDirectoryIfNotExists(fileStorageLocation.resolve("images"));
            createDirectoryIfNotExists(fileStorageLocation.resolve("files"));
            createDirectoryIfNotExists(fileStorageLocation.resolve("profiles"));

            logger.info("Diretórios de armazenamento inicializados: {}", fileStorageLocation);
        } catch (Exception e) {
            logger.error("Erro ao inicializar diretórios de armazenamento: {}", e.getMessage(), e);
            throw new FileStorageException("Não foi possível inicializar os diretórios de armazenamento.", e);
        }
    }

    /**
     * Cria um diretório se não existir
     */
    private void createDirectoryIfNotExists(Path directory) throws IOException {
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
            logger.info("Diretório criado: {}", directory);
        }

        if (!Files.isWritable(directory)) {
            throw new FileStorageException("Diretório sem permissão de escrita: " + directory);
        }
    }

    /**
     * Armazena um arquivo e retorna o caminho relativo
     */
    public String storeFile(MultipartFile file) {
        // Validar o arquivo
        String errorMessage = FileHelper.validateFile(file, false);
        if (errorMessage != null) {
            logger.error("Validação de arquivo falhou: {}", errorMessage);
            throw new FileStorageException(errorMessage);
        }

        try {
            // Determinar o subdiretório e gerar nome único
            String subdir = FileHelper.determineStoragePath(file);
            String fileName = FileHelper.generateUniqueFileName(file);

            Path targetLocation = fileStorageLocation.resolve(subdir).resolve(fileName);

            // Copiar o arquivo
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Arquivo armazenado com sucesso: {}", targetLocation);

            // Confirmar que o arquivo existe e pode ser lido
            if (!Files.exists(targetLocation) || !Files.isReadable(targetLocation)) {
                throw new FileStorageException("Falha ao armazenar arquivo ou arquivo não legível: " + fileName);
            }

            return subdir + fileName;
        } catch (IOException e) {
            logger.error("Erro ao armazenar arquivo: {}", e.getMessage(), e);
            throw new FileStorageException("Falha ao armazenar arquivo: " + e.getMessage(), e);
        }
    }

    /**
     * Remove um arquivo pelo seu caminho relativo
     */
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            logger.warn("Tentativa de excluir arquivo com caminho vazio");
            return;
        }

        try {
            // Extrair o nome do arquivo e subdiretório
            String fileName = FileHelper.extractFileNameFromUrl(filePath);

            // Tentar em diferentes diretórios possíveis
            Path[] possibleLocations = {
                    fileStorageLocation.resolve("images").resolve(fileName),
                    fileStorageLocation.resolve("files").resolve(fileName),
                    fileStorageLocation.resolve(fileName)
            };

            boolean deleted = false;
            for (Path location : possibleLocations) {
                if (Files.exists(location)) {
                    Files.delete(location);
                    logger.info("Arquivo excluído com sucesso: {}", location);
                    deleted = true;
                    break;
                }
            }

            if (!deleted) {
                logger.warn("Arquivo não encontrado para exclusão: {}", filePath);
            }
        } catch (IOException e) {
            logger.error("Erro ao excluir arquivo {}: {}", filePath, e.getMessage(), e);
        }
    }

    /**
     * Verifica se um arquivo existe
     */
    public boolean fileExists(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return false;
        }

        try {
            String fileName = FileHelper.extractFileNameFromUrl(filePath);

            Path[] possibleLocations = {
                    fileStorageLocation.resolve("images").resolve(fileName),
                    fileStorageLocation.resolve("files").resolve(fileName),
                    fileStorageLocation.resolve(fileName)
            };

            for (Path location : possibleLocations) {
                if (Files.exists(location)) {
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            logger.error("Erro ao verificar existência do arquivo: {}", filePath, e);
            return false;
        }
    }

    /**
     * Retorna o caminho absoluto de um arquivo
     */
    public Path resolveFilePath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            throw new FileStorageException("Caminho de arquivo vazio");
        }

        String fileName = FileHelper.extractFileNameFromUrl(filePath);

        // Determinar o subdiretório, se presente no caminho
        String subdir = "";
        if (filePath.startsWith("images/")) {
            subdir = "images";
        } else if (filePath.startsWith("files/")) {
            subdir = "files";
        }

        // Resolver o caminho
        if (!subdir.isEmpty()) {
            return fileStorageLocation.resolve(subdir).resolve(fileName);
        }

        // Verificar em diferentes locais possíveis
        Path[] possibleLocations = {
                fileStorageLocation.resolve("images").resolve(fileName),
                fileStorageLocation.resolve("files").resolve(fileName),
                fileStorageLocation.resolve(fileName)
        };

        for (Path location : possibleLocations) {
            if (Files.exists(location)) {
                return location;
            }
        }

        // Se não encontrou, retorna o caminho padrão (poderá lançar exceção depois)
        return fileStorageLocation.resolve(fileName);
    }

    public String storeProfileImage(MultipartFile file) {
        //Validar o arquivo
        String errorMessage = FileHelper.validateFile(file, true);
        if (errorMessage != null) {
            logger.error("Validação de arquivo falhou: {}", errorMessage);
            throw new FileStorageException(errorMessage);
        }

        try {
            //Gerar nome único para a imagem de perfil
            String fileName = FileHelper.generateUniqueFileName(file);
            Path targetLocation = fileStorageLocation.resolve("profiles").resolve(fileName);

            //Copiar o arquivo
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Imagem de perfil armazenada com sucesso: {}", targetLocation);

            //Confirmar que o arquivo existe e pode ser lido
            if (!Files.exists(targetLocation) || !Files.isReadable(targetLocation)) {
                throw new FileStorageException("Falha ao armazenar imagem de perfil ou imagem não legível: " + fileName);
            }

            return "profiles/" + fileName;
        } catch (IOException e) {
            logger.error("Erro ao armazenar imagem de perfil: {}", e.getMessage(), e);
            throw new FileStorageException("Falha ao armazenar imagem de perfil: " + e.getMessage(), e);
        }
    }

    /**
     * Retorna o diretório de armazenamento base
     */
    public Path getStorageLocation() {
        return this.fileStorageLocation;
    }
}