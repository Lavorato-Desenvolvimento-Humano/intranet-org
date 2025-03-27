package com.intranet.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Classe utilitária para operações comuns de arquivo
 */
public class FileHelper {

    private static final Logger logger = LoggerFactory.getLogger(FileHelper.class);

    // Tipos MIME permitidos para imagens
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    // Tipos MIME permitidos para documentos
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv"
    );

    // Tamanho máximo de arquivo: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private FileHelper() {
        // Classe utilitária com construtor privado
    }

    /**
     * Verifica se o arquivo é uma imagem válida
     */
    public static boolean isValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        return contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());
    }

    /**
     * Verifica se o arquivo é um documento válido
     */
    public static boolean isValidDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        return contentType != null && ALLOWED_DOCUMENT_TYPES.contains(contentType.toLowerCase());
    }

    /**
     * Verifica se o tamanho do arquivo é válido
     */
    public static boolean isValidFileSize(MultipartFile file) {
        return file != null && file.getSize() <= MAX_FILE_SIZE;
    }

    /**
     * Gera um nome de arquivo único baseado no nome original
     */
    public static String generateUniqueFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        return UUID.randomUUID().toString() + extension;
    }

    /**
     * Extrai o nome do arquivo de uma URL
     */
    public static String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }

        int lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < url.length() - 1) {
            return url.substring(lastSlashIndex + 1);
        }

        return url;
    }

    /**
     * Determina o tipo de conteúdo com base na extensão do arquivo
     */
    public static String determineContentTypeByExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "application/octet-stream";
        }

        String extension = filename.toLowerCase();

        if (extension.endsWith(".jpg") || extension.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (extension.endsWith(".png")) {
            return "image/png";
        } else if (extension.endsWith(".gif")) {
            return "image/gif";
        } else if (extension.endsWith(".webp")) {
            return "image/webp";
        } else if (extension.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (extension.endsWith(".pdf")) {
            return "application/pdf";
        } else if (extension.endsWith(".doc")) {
            return "application/msword";
        } else if (extension.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (extension.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        } else if (extension.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if (extension.endsWith(".ppt")) {
            return "application/vnd.ms-powerpoint";
        } else if (extension.endsWith(".pptx")) {
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        } else if (extension.endsWith(".txt")) {
            return "text/plain";
        } else if (extension.endsWith(".csv")) {
            return "text/csv";
        }

        return "application/octet-stream";
    }

    /**
     * Valida um arquivo quanto ao tamanho e tipo de conteúdo, retornando mensagem de erro
     * @return null se válido, ou mensagem de erro
     */
    public static String validateFile(MultipartFile file, boolean mustBeImage) {
        if (file == null || file.isEmpty()) {
            return "Arquivo vazio ou inválido";
        }

        if (!isValidFileSize(file)) {
            return "Arquivo excede o tamanho máximo permitido de 10MB";
        }

        if (mustBeImage && !isValidImage(file)) {
            return "Apenas imagens nos formatos JPG, PNG, GIF ou WebP são permitidas";
        }

        if (!mustBeImage && !isValidDocument(file) && !isValidImage(file)) {
            return "Tipo de arquivo não suportado";
        }

        return null;
    }

    /**
     * Determina o caminho de armazenamento com base no tipo de arquivo
     */
    public static String determineStoragePath(MultipartFile file) {
        if (isValidImage(file)) {
            return "images/";
        } else {
            return "files/";
        }
    }

    /**
     * Limita o tamanho do tipo MIME para o máximo permitido pelo banco de dados
     * @param contentType O tipo MIME original
     * @param maxLength O tamanho máximo permitido (padrão 50)
     * @return O tipo MIME truncado se necessário
     */
    public static String limitContentType(String contentType, int maxLength) {
        if (contentType == null) {
            return null;
        }

        // Se o contentType exceder o tamanho máximo, truncar
        if (contentType.length() > maxLength) {
            // Tentar extrair apenas a parte principal do tipo MIME
            int semicolonIndex = contentType.indexOf(';');
            if (semicolonIndex > 0 && semicolonIndex < maxLength) {
                // Se houver parâmetros adicionais, manter apenas o tipo principal
                return contentType.substring(0, semicolonIndex);
            }

            // Caso contrário, simplesmente truncar
            return contentType.substring(0, maxLength);
        }

        return contentType;
    }
}