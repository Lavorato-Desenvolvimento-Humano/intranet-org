package com.intranet.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDetails> handleResourceNotFoundException(
            ResourceNotFoundException exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(exception, request, httpRequest,
                HttpStatus.NOT_FOUND, "Recurso não encontrado");
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ErrorDetails> handleFileStorageException(
            FileStorageException exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(exception, request, httpRequest,
                HttpStatus.BAD_REQUEST, "Erro de armazenamento de arquivo");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDetails> handleBadCredentialsException(
            BadCredentialsException exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(new RuntimeException("Email ou senha incorretos"),
                request, httpRequest, HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDetails> handleAccessDeniedException(
            AccessDeniedException exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(
                new RuntimeException("Você não tem permissão para acessar este recurso"),
                request, httpRequest, HttpStatus.FORBIDDEN, "Acesso negado");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException exception, HttpServletRequest httpRequest) {
        logError(httpRequest, exception);

        Map<String, String> errors = new HashMap<>();
        exception.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ErrorDetails> handleEmailNotVerifiedException(
            EmailNotVerifiedException exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(exception, request, httpRequest,
                HttpStatus.FORBIDDEN, "Email não verificado");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> handleGlobalException(
            Exception exception, WebRequest request, HttpServletRequest httpRequest) {
        return createErrorResponse(exception, request, httpRequest,
                HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor");
    }

    /**
     * Método utilitário para criar respostas de erro padronizadas
     */
    private ResponseEntity<ErrorDetails> createErrorResponse(
            Exception exception, WebRequest request, HttpServletRequest httpRequest,
            HttpStatus status, String error) {

        logError(httpRequest, exception);

        ErrorDetails errorDetails = new ErrorDetails(
                LocalDateTime.now(),
                status.value(),
                error,
                exception.getMessage(),
                request.getDescription(false)
        );

        return new ResponseEntity<>(errorDetails, status);
    }

    /**
     * Método para registrar detalhes do erro no log
     */
    private void logError(HttpServletRequest request, Exception exception) {
        String requestURI = request != null ? request.getRequestURI() : "desconhecido";
        String requestMethod = request != null ? request.getMethod() : "desconhecido";
        String userAgent = request != null ? request.getHeader("User-Agent") : "desconhecido";
        String remoteAddr = request != null ? request.getRemoteAddr() : "desconhecido";

        logger.error("Erro ao processar requisição: {} {} - Cliente: {} - IP: {}",
                requestMethod, requestURI, userAgent, remoteAddr, exception);
    }

    // Classe interna para detalhes de erro
    public static class ErrorDetails {
        private LocalDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private String path;

        public ErrorDetails() {
        }

        public ErrorDetails(LocalDateTime timestamp, int status, String error, String message, String path) {
            this.timestamp = timestamp;
            this.status = status;
            this.error = error;
            this.message = message;
            this.path = path;
        }

        // Getters e setters
        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public int getStatus() {
            return status;
        }

        public void setStatus(int status) {
            this.status = status;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }
    }
}