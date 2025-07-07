package com.intranet.backend.util;

import com.intranet.backend.dto.FichaPdfResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Classe utilitária para criação de respostas padronizadas da API
 * com suporte a tipos genéricos para maior flexibilidade
 */
public class ResponseUtil {

    private ResponseUtil() {
        // Classe utilitária com construtor privado
    }

    /**
     * Cria uma resposta de sucesso com dados
     */
    public static <T> ResponseEntity<T> success(T data) {
        return ResponseEntity.ok(data);
    }

    /**
     * Cria uma resposta de sucesso com status CREATED e dados
     */
    public static <T> ResponseEntity<T> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(data);
    }

    /**
     * Cria uma resposta de sucesso vazia (204 No Content)
     */
    public static ResponseEntity<Void> noContent() {
        return ResponseEntity.noContent().build();
    }

    /**
     * Cria uma resposta de erro com mensagem
     */
    public static <T> ResponseEntity<T> error(HttpStatus status, String message) {
        return (ResponseEntity<T>) ResponseEntity.status(status)
                .body(createErrorMap(status, message));
    }

    /**
     * Cria uma resposta de erro 404 (Not Found)
     */
    public static <T> ResponseEntity<T> notFound(String message) {
        return error(HttpStatus.NOT_FOUND, message);
    }

    /**
     * Cria uma resposta de erro 400 (Bad Request)
     */
    public static <T> ResponseEntity<T> badRequest(String message) {
        return error(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Cria uma resposta de erro 401 (Unauthorized)
     */
    public static <T> ResponseEntity<T> unauthorized(String message) {
        return error(HttpStatus.UNAUTHORIZED, message);
    }

    /**
     * Cria uma resposta de erro 403 (Forbidden)
     */
    public static <T> ResponseEntity<T> forbidden(String message) {
        return error(HttpStatus.FORBIDDEN, message);
    }

    /**
     * Cria uma resposta de erro 500 (Internal Server Error)
     */
    public static <T> ResponseEntity<T> serverError(String message) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    /**
     * Cria uma mensagem de resposta simples
     */
    public static ResponseEntity<Map<String, String>> message(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    /**
     * Cria uma mensagem de erro simples
     */
    public static ResponseEntity<Map<String, String>> errorMessage(HttpStatus status, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Método auxiliar para criar um mapa de erro padrão
     */
    private static Map<String, Object> createErrorMap(HttpStatus status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", status.getReasonPhrase());
        response.put("message", message);
        return response;
    }
}