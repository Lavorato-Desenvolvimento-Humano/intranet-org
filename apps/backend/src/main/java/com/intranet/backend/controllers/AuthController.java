package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.security.JwtUtils;
import com.intranet.backend.service.AuthService;
import com.intranet.backend.service.UserService;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    @Autowired
    private Environment environment;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

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

    @PostMapping("/validate")
    public ResponseEntity<TokenValidationResponse> validateToken(
            @Valid @RequestBody TokenValidationRequest request) {

        try {
            String token = request.getToken();

            // Log da tentativa de validação
            logger.debug("Validando token para integração com microserviços");

            // Verificar se o token tem formato válido
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Token não fornecido")
                        .build());
            }

            // Remover prefixo Bearer se presente
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            // Validar token com JwtUtils (classe correta do Core)
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Token inválido ou expirado")
                        .build());
            }

            // Extrair username do token usando JwtUtils
            String username = jwtUtils.getUserNameFromJwtToken(token);
            if (username == null) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Não foi possível extrair usuário do token")
                        .build());
            }

            // Buscar usuário no banco de dados (username é geralmente o email)
            Optional<User> userOptional = userRepository.findByEmail(username);
            if (userOptional.isEmpty()) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Usuário não encontrado")
                        .build());
            }

            User user = userOptional.get();

            // Verificar se o usuário está ativo
            if (!user.isActive()) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Usuário inativo")
                        .build());
            }

            // Verificar se o email foi verificado
            if (!user.isEmailVerified()) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Email não verificado")
                        .build());
            }

            // Verificar se foi aprovado pelo admin
            if (!user.isAdminApproved()) {
                return ResponseEntity.ok(TokenValidationResponse.builder()
                        .valid(false)
                        .message("Usuário não aprovado pelo administrador")
                        .build());
            }

            // Buscar roles do usuário usando o método existente no repositório
            List<String> roles = userRepository.findRoleNamesByUserId(user.getId());

            // Buscar equipes do usuário
            List<String> teams = List.of(); // Por enquanto vazio, pode ser implementado depois
            try {
                // Esta parte pode ser implementada quando necessário
                teams = List.of();
            } catch (Exception e) {
                logger.debug("Equipes não implementadas ou erro ao buscar: {}", e.getMessage());
                teams = List.of();
            }

            // Converter usuário para DTO
            TokenValidationResponse.UserDto userDto = TokenValidationResponse.UserDto.builder()
                    .id(user.getId().toString())
                    .username(user.getEmail()) // Core usa email como username
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .profileImage(user.getProfileImage())
                    .roles(roles)
                    .teams(teams)
                    .isActive(user.isActive())
                    .emailVerified(user.isEmailVerified())
                    .adminApproved(user.isAdminApproved())
                    .build();

            logger.info("Token validado com sucesso para usuário: {}", username);

            return ResponseEntity.ok(TokenValidationResponse.builder()
                    .valid(true)
                    .user(userDto)
                    .message("Token válido")
                    .build());

        } catch (Exception e) {
            logger.error("Erro na validação do token: {}", e.getMessage(), e);

            return ResponseEntity.ok(TokenValidationResponse.builder()
                    .valid(false)
                    .message("Erro interno na validação do token")
                    .build());
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
