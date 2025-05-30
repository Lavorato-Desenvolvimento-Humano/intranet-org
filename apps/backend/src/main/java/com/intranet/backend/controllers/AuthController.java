package com.intranet.backend.controllers;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    @Autowired
    private Environment environment;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Solicitação de login recebida para o email: {}", loginRequest.getEmail());

            JwtResponse jwtResponse = authService.login(loginRequest);

            logger.info("Login bem-sucedido para o email: {}", loginRequest.getEmail());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            logger.error("Login falhou para {}: {}", loginRequest.getEmail(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        logger.info("Solicitação de registro recebida para o email: {}", registerRequest.getEmail());
        logger.debug("Dados de registro: {}", registerRequest);

        JwtResponse jwtResponse = authService.register(registerRequest);

        logger.info("Registro bem-sucedido para o email: {}", registerRequest.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(jwtResponse);
    }

    @PostMapping("/reset-password/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestParam("email") String email) {
        try {
            authService.requestPasswordReset(email);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Se o e-mail existir em nosso sistema, um código de redefinição será enviado.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Mesmo se houver erro, retornamos a mesma resposta para não expor informações sensíveis
            Map<String, String> response = new HashMap<>();
            response.put("message", "Se o e-mail existir em nosso sistema, um código de redefinição será enviado.");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/reset-password/verify")
    public ResponseEntity<Map<String, String>> verifyResetCode(
            @RequestParam("email") String email,
            @RequestParam("code") String code) {
        try {
            authService.verifyResetCode(email, code);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Código verificado com sucesso.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log do erro para debug interno
            logger.error("Erro ao verificar código de redefinição: {}", e.getMessage());

            // Retornar mensagem de erro específica
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/reset-password/complete")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        try {
            authService.resetPassword(resetPasswordRequest);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Senha redefinida com sucesso.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log do erro para debug interno
            logger.error("Erro ao redefinir senha: {}", e.getMessage());

            // Retornar mensagem de erro específica
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/github/callback")
    public ResponseEntity<JwtResponse> githubCallback(@RequestParam("code") String code) {
        JwtResponse jwtResponse = authService.authenticateWithGithub(code);
        return ResponseEntity.ok(jwtResponse);
    }

    @GetMapping("/github/login")
    public ResponseEntity<Map<String, String>> githubLogin() {
        logger.info("Iniciando fluxo de autenticação GitHub");

        String clientId = environment.getProperty("github.client.id");
        String redirectUri = environment.getProperty("github.redirect.uri");

        String authUrl = String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user",
                clientId,
                redirectUri
        );

        Map<String, String> response = new HashMap<>();
        response.put("authUrl", authUrl);

        return ResponseEntity.ok(response);
    }
}
