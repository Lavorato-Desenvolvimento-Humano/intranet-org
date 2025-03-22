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
            // Criar diretório se não existir
            if (!Files.exists(fileStorageLocation)) {
                Files.createDirectories(this.fileStorageLocation);
                logger.info("Diretório de armazenamento de arquivos criado: {}", this.fileStorageLocation);
            } else {
                logger.info("Diretório de armazenamento de arquivos já existe: {}", this.fileStorageLocation);
            }

            // Verificar permissões no diretório
            if (!Files.isWritable(this.fileStorageLocation)) {
                logger.error("Diretório de armazenamento de arquivos sem permissão de escrita: {}", this.fileStorageLocation);
                throw new FileStorageException("Diretório sem permissão de escrita: " + this.fileStorageLocation);
            }

            // Criar subdiretórios se necessário
            Path imagesDir = this.fileStorageLocation.resolve("images");
            Path filesDir = this.fileStorageLocation.resolve("files");

            if (!Files.exists(imagesDir)) {
                Files.createDirectories(imagesDir);
                logger.info("Subdiretório de imagens criado: {}", imagesDir);
            }

            if (!Files.exists(filesDir)) {
                Files.createDirectories(filesDir);
                logger.info("Subdiretório de arquivos criado: {}", filesDir);
            }

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
        if (contentType == null) {
            logger.error("Tipo de conteúdo desconhecido");
            throw new FileStorageException("Tipo de conteúdo desconhecido");
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

            // Determinar o subdiretório com base no tipo de conteúdo
            String subdir = contentType.startsWith("image/") ? "images" : "files";
            Path targetLocation = this.fileStorageLocation.resolve(subdir).resolve(newFilename);

            // Copia o arquivo para o diretório de destino
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Arquivo armazenado com sucesso: {}", newFilename);

            // Verifica se o arquivo foi realmente escrito com sucesso
            if (!Files.exists(targetLocation)) {
                throw new FileStorageException("Falha ao escrever o arquivo no disco: " + newFilename);
            }

            // Verifica se podemos ler o arquivo (confirma permissões)
            if (!Files.isReadable(targetLocation)) {
                throw new FileStorageException("Arquivo foi criado, mas não pode ser lido: " + newFilename);
            }

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

    // Adicionar método para verificar se um arquivo existe
    public boolean fileExists(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            return Files.exists(filePath);
        } catch (Exception ex) {
            logger.error("Erro ao verificar existência do arquivo: {}", filename, ex);
            return false;
        }
    }

    // Método para obter o caminho absoluto de um arquivo
    public String getAbsoluteFilePath(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            return filePath.toString();
        } catch (Exception ex) {
            logger.error("Erro ao obter caminho absoluto do arquivo: {}", filename, ex);
            return null;
        }
    }
    
    public Path getStorageLocation() {
        return this.fileStorageLocation;
    }
}