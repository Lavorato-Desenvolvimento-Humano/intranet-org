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
import java.util.UUID;

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

            // Log adicional para depuração
            logger.info("Caminhos completos dos diretórios:");
            logger.info("Base: {}", fileStorageLocation.toAbsolutePath());
            logger.info("Images: {}", fileStorageLocation.resolve("images").toAbsolutePath());
            logger.info("Files: {}", fileStorageLocation.resolve("files").toAbsolutePath());
            logger.info("Profiles: {}", fileStorageLocation.resolve("profiles").toAbsolutePath());

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
            logger.error("Diretório sem permissão de escrita: {}", directory);
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
            logger.debug("Tentando excluir arquivo: {}", fileName);

            // Tentar em diferentes diretórios possíveis
            Path[] possibleLocations = {
                    fileStorageLocation.resolve("images").resolve(fileName),
                    fileStorageLocation.resolve("files").resolve(fileName),
                    fileStorageLocation.resolve("profiles").resolve(fileName),
                    fileStorageLocation.resolve(fileName)
            };

            boolean deleted = false;
            for (Path location : possibleLocations) {
                logger.debug("Verificando localização: {}", location);
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
            logger.debug("Verificando existência do arquivo: {}", fileName);

            Path[] possibleLocations = {
                    fileStorageLocation.resolve("images").resolve(fileName),
                    fileStorageLocation.resolve("files").resolve(fileName),
                    fileStorageLocation.resolve("profiles").resolve(fileName),
                    fileStorageLocation.resolve(fileName)
            };

            for (Path location : possibleLocations) {
                logger.debug("Verificando em: {}", location);
                if (Files.exists(location)) {
                    logger.debug("Arquivo encontrado em: {}", location);
                    return true;
                }
            }

            logger.debug("Arquivo não encontrado em nenhum diretório esperado: {}", fileName);
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
        logger.debug("Resolvendo caminho para o arquivo: {}", fileName);

        // Determinar o subdiretório, se presente no caminho
        String subdir = "";
        if (filePath.startsWith("images/")) {
            subdir = "images";
        } else if (filePath.startsWith("files/")) {
            subdir = "files";
        } else if (filePath.startsWith("profiles/")) {
            subdir = "profiles";
        }

        // Resolver o caminho
        if (!subdir.isEmpty()) {
            Path path = fileStorageLocation.resolve(subdir).resolve(fileName);
            logger.debug("Caminho resolvido (com subdir): {}", path);
            return path;
        }

        // Verificar em diferentes locais possíveis
        Path[] possibleLocations = {
                fileStorageLocation.resolve("profiles").resolve(fileName),
                fileStorageLocation.resolve("images").resolve(fileName),
                fileStorageLocation.resolve("files").resolve(fileName),
                fileStorageLocation.resolve(fileName)
        };

        for (Path location : possibleLocations) {
            if (Files.exists(location)) {
                logger.debug("Arquivo encontrado em: {}", location);
                return location;
            }
        }

        // Se não encontrou, retorna o caminho padrão (poderá lançar exceção depois)
        Path defaultPath = fileStorageLocation.resolve(fileName);
        logger.debug("Arquivo não encontrado, retornando caminho padrão: {}", defaultPath);
        return defaultPath;
    }

    /**
     * Armazena uma imagem de perfil
     */
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
            Path profilesDir = fileStorageLocation.resolve("profiles");

            // Garantir que o diretório existe
            if (!Files.exists(profilesDir)) {
                Files.createDirectories(profilesDir);
                logger.info("Diretório de perfis criado: {}", profilesDir);
            }

            Path targetLocation = profilesDir.resolve(fileName);
            logger.debug("Armazenando imagem de perfil em: {}", targetLocation);

            //Copiar o arquivo
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Imagem de perfil armazenada com sucesso: {}", targetLocation);

            //Confirmar que o arquivo existe e pode ser lido
            if (!Files.exists(targetLocation) || !Files.isReadable(targetLocation)) {
                throw new FileStorageException("Falha ao armazenar imagem de perfil ou imagem não legível: " + fileName);
            }

            // Retornar o caminho relativo padronizado
            return "profiles/" + fileName;
        } catch (IOException e) {
            logger.error("Erro ao armazenar imagem de perfil: {}", e.getMessage(), e);
            throw new FileStorageException("Falha ao armazenar imagem de perfil: " + e.getMessage(), e);
        }
    }

    /**
     * Armazena um arquivo em um caminho específico e retorna o caminho relativo
     */
    public String storeFileInPath(MultipartFile file, String subPath) {
        // Validar o arquivo
        String errorMessage = FileHelper.validateFile(file, false);
        if (errorMessage != null) {
            logger.error("Validação de arquivo falhou: {}", errorMessage);
            throw new FileStorageException(errorMessage);
        }

        try {
            // Gerar nome único para o arquivo
            String fileName = FileHelper.generateUniqueFileName(file);

            // Resolver o caminho completo
            Path targetPath = fileStorageLocation.resolve(subPath);

            // Garantir que o diretório existe
            if (!Files.exists(targetPath)) {
                Files.createDirectories(targetPath);
                logger.info("Diretório criado: {}", targetPath);
            }

            Path targetFile = targetPath.resolve(fileName);

            // Copiar o arquivo
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Arquivo armazenado com sucesso em: {}", targetFile);

            return subPath + "/" + fileName;
        } catch (IOException e) {
            logger.error("Erro ao armazenar arquivo: {}", e.getMessage(), e);
            throw new FileStorageException("Falha ao armazenar arquivo: " + e.getMessage(), e);
        }
    }

    /**
     * Retorna o diretório de armazenamento base
     */
    public Path getStorageLocation() {
        return this.fileStorageLocation;
    }
}