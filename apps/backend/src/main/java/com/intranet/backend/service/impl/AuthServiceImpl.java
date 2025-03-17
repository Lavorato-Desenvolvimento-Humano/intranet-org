package com.intranet.backend.service.impl;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.PasswordResetToken;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.PasswordResetTokenRepository;
import com.intranet.backend.repository.RoleRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.UserRoleRepository;
import com.intranet.backend.security.JwtUtils;
import com.intranet.backend.service.AuthService;
import com.intranet.backend.service.EmailService;
import com.intranet.backend.service.FileStorageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        // ID de log único para acompanhar toda a requisição
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        logger.info("[{}] Iniciando processo de login para email: {}", requestId, loginRequest.getEmail());

        try {
            // Passo 1: Verificar se o usuário existe
            logger.debug("[{}] Buscando usuário no banco de dados", requestId);
            User user = null;
            try {
                user = userRepository.findByEmail(loginRequest.getEmail())
                        .orElseThrow(() -> {
                            logger.warn("[{}] Usuário não encontrado com email: {}", requestId, loginRequest.getEmail());
                            return new BadCredentialsException("Email ou senha incorretos");
                        });
                logger.debug("[{}] Usuário encontrado: {} (ID: {})", requestId, user.getEmail(), user.getId());
            } catch (Exception e) {
                logger.error("[{}] Erro ao buscar usuário: {}", requestId, e.getMessage(), e);
                if (e instanceof BadCredentialsException) {
                    throw e;
                }
                throw new RuntimeException("Erro ao verificar credenciais: " + e.getMessage(), e);
            }

            // Passo 2: Tentar autenticar com AuthenticationManager
            logger.debug("[{}] Tentando autenticar com AuthenticationManager", requestId);
            Authentication authentication = null;
            try {
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                loginRequest.getEmail(),
                                loginRequest.getPassword()  // Senha em texto puro
                        )
                );

                // Se chegou aqui, a autenticação foi bem-sucedida
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("[{}] Autenticação bem-sucedida para: {}", requestId, loginRequest.getEmail());

            } catch (BadCredentialsException e) {
                // Erro específico de credenciais inválidas
                logger.warn("[{}] Credenciais inválidas para usuário: {}", requestId, loginRequest.getEmail());
                throw new BadCredentialsException("Email ou senha incorretos");
            } catch (AuthenticationException e) {
                // Outros erros de autenticação
                logger.error("[{}] Erro de autenticação: {}", requestId, e.getMessage(), e);
                throw new RuntimeException("Falha na autenticação: " + e.getMessage(), e);
            } catch (Exception e) {
                // Erros inesperados
                logger.error("[{}] Erro inesperado durante autenticação: {}", requestId, e.getMessage(), e);
                throw new RuntimeException("Erro inesperado durante autenticação", e);
            }

            // Passo 3: Gerar token JWT
            logger.debug("[{}] Gerando token JWT", requestId);
            String jwt = null;
            try {
                jwt = jwtUtils.generateJwtToken(authentication);
                logger.debug("[{}] Token JWT gerado com sucesso", requestId);
            } catch (Exception e) {
                logger.error("[{}] Erro ao gerar token JWT: {}", requestId, e.getMessage(), e);
                throw new RuntimeException("Erro ao gerar token de autenticação: " + e.getMessage(), e);
            }

            // Passo 4: Obter papéis do usuário
            logger.debug("[{}] Obtendo papéis do usuário", requestId);
            List<String> roles = new ArrayList<>();
            try {
                roles = user.getUserRoles().stream()
                        .map(role -> {
                            try {
                                return "ROLE_" + role.getRole().getName();
                            } catch (Exception e) {
                                logger.warn("[{}] Erro ao processar papel: {}", requestId, e.getMessage());
                                return "ROLE_UNKNOWN";
                            }
                        })
                        .collect(Collectors.toList());

                if (roles.isEmpty()) {
                    logger.warn("[{}] Usuário não possui papéis atribuídos", requestId);
                    roles.add("ROLE_USER"); // Papel padrão
                }

                logger.debug("[{}] Papéis do usuário: {}", requestId, roles);
            } catch (Exception e) {
                logger.error("[{}] Erro ao processar papéis do usuário: {}", requestId, e.getMessage(), e);
                // Mesmo com erro, não impede o login
                roles.add("ROLE_USER"); // Papel padrão em caso de erro
            }

            // Passo 5: Criar e retornar resposta JWT
            try {
                JwtResponse response = new JwtResponse(
                        jwt,
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getProfileImage(),
                        roles
                );

                logger.info("[{}] Login concluído com sucesso para: {}", requestId, loginRequest.getEmail());
                return response;
            } catch (Exception e) {
                logger.error("[{}] Erro ao criar resposta JWT: {}", requestId, e.getMessage(), e);
                throw new RuntimeException("Erro ao processar resposta de login: " + e.getMessage(), e);
            }

        } catch (BadCredentialsException e) {
            // Erros de credenciais - retorna 401
            logger.warn("[{}] Falha de autenticação: {}", requestId, e.getMessage());
            throw e;
        } catch (Exception e) {
            // Todos os outros erros - registra detalhes completos e retorna mensagem genérica
            logger.error("[{}] Erro fatal durante o processo de login: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Ocorreu um erro durante o processo de login. Por favor, tente novamente.", e);
        }
    }

    @Override
    @Transactional
    public JwtResponse register(RegisterRequest registerRequest) {
        logger.info("Processando solicitação de registro para: {}", registerRequest.getEmail());

        if (!registerRequest.getEmail().endsWith("@lavorato.com.br")) {
            logger.warn("Tentativa de registro com domínio de email não permitido {}", registerRequest.getEmail());
            throw new RuntimeException("Erro: Apenas emails com domínio @lavorato.com.br são permitidos!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            logger.warn("Email já está em uso: {}", registerRequest.getEmail());
            throw new RuntimeException("Erro: Email já está em uso!");
        }

        if (registerRequest.getGithubId() != null &&
                !registerRequest.getGithubId().isEmpty() &&
                userRepository.existsByGithubId(registerRequest.getGithubId())) {
            logger.warn("ID do GitHub já está em uso: {}", registerRequest.getGithubId());
            throw new RuntimeException("Erro: ID do GitHub já está em uso!");
        }

        // Processa a imagem de perfil
        String profileImagePath = null;
        if (registerRequest.getProfileImage() != null && !registerRequest.getProfileImage().isEmpty()) {
            logger.debug("Processando imagem de perfil");
            profileImagePath = fileStorageService.storeFile(registerRequest.getProfileImage());
        }

        // Cria o novo usuário
        User user = new User();
        user.setFullName(registerRequest.getFullName());
        user.setEmail(registerRequest.getEmail());

        // Codifica a senha
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());
        logger.debug("Senha codificada para usuário: {}", registerRequest.getEmail());
        user.setPasswordHash(encodedPassword);

        user.setGithubId(registerRequest.getGithubId());
        user.setProfileImage(profileImagePath);

        User savedUser = userRepository.save(user);
        logger.info("Usuário salvo no banco de dados: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        // Atribui o papel de usuário padrão
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Erro: Papel 'USER' não encontrado."));

        UserRole newUserRole = new UserRole();
        newUserRole.setUser(savedUser);
        newUserRole.setRole(userRole);
        userRoleRepository.save(newUserRole);
        logger.debug("Papel USER atribuído ao usuário: {}", savedUser.getEmail());

        // Gera o token JWT para o novo usuário
        try {
            logger.debug("Tentando autenticar o novo usuário: {}", savedUser.getEmail());

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            List<String> roles = List.of("ROLE_USER");

            logger.info("Registro concluído com sucesso para: {}", savedUser.getEmail());

            return new JwtResponse(
                    jwt,
                    savedUser.getId(),
                    savedUser.getFullName(),
                    savedUser.getEmail(),
                    savedUser.getProfileImage(),
                    roles
            );
        } catch (AuthenticationException e) {
            logger.error("Falha ao autenticar novo usuário: {}, causa: {}", savedUser.getEmail(), e.getMessage());
            throw new RuntimeException("Erro ao autenticar o novo usuário: " + e.getMessage());
        }
    }

    // Restante dos métodos permanece o mesmo...
    @Override
    @Transactional
    public JwtResponse registerWithImage(String fullName, String email, String password, String githubId, MultipartFile profileImage) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName(fullName);
        request.setEmail(email);
        request.setPassword(password);
        request.setGithubId(githubId);
        request.setProfileImage(profileImage);

        return register(request);
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        logger.info("Processando solicitação de redefinição de senha para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Tentativa de redefinição de senha para email inexistente: {}", email);
                    return new ResourceNotFoundException("Usuário não encontrado com o email: " + email);
                });

        // Verifica se já existe um token ativo
        Optional<PasswordResetToken> existingToken = passwordResetTokenRepository.findByUserAndUsedFalse(user);
        PasswordResetToken resetToken;

        if (existingToken.isPresent() && !existingToken.get().isExpired()) {
            // Reutiliza o token existente se ainda for válido
            resetToken = existingToken.get();
            logger.info("Reutilizando token existente para: {}", email);
        } else {
            // Cria um novo token
            resetToken = new PasswordResetToken(user);
            passwordResetTokenRepository.save(resetToken);
            logger.info("Novo token de redefinição criado para: {}", email);
        }

        // Envia o email com o token
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken(), user.getFullName());
    }

    @Override
    @Transactional
    public void verifyResetCode(String email, String code) {
        logger.info("Verificando código de redefinição para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(code)
                .orElseThrow(() -> {
                    logger.warn("Código de verificação inválido para: {}", email);
                    return new RuntimeException("Código de verificação inválido");
                });

        if (!resetToken.getUser().getId().equals(user.getId())) {
            logger.warn("Tentativa de usar token de outro usuário: {}", email);
            throw new RuntimeException("Código de verificação inválido");
        }

        if (resetToken.isUsed()) {
            logger.warn("Tentativa de usar token já utilizado: {}", email);
            throw new RuntimeException("Este código já foi utilizado");
        }

        if (resetToken.isExpired()) {
            logger.warn("Tentativa de usar token expirado: {}", email);
            throw new RuntimeException("O código de verificação expirou");
        }

        logger.info("Código de redefinição verificado com sucesso para: {}", email);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        logger.info("Redefinindo senha para: {}", resetPasswordRequest.getEmail());

        User user = userRepository.findByEmail(resetPasswordRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + resetPasswordRequest.getEmail()));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(resetPasswordRequest.getVerificationCode())
                .orElseThrow(() -> new RuntimeException("Código de verificação inválido"));

        if (!resetToken.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Código de verificação inválido");
        }

        if (resetToken.isUsed()) {
            throw new RuntimeException("Este código já foi utilizado");
        }

        if (resetToken.isExpired()) {
            throw new RuntimeException("O código de verificação expirou");
        }

        // Atualizar a senha
        user.setPasswordHash(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        userRepository.save(user);

        // Marcar o token como usado
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Enviar email de confirmação
        emailService.sendPasswordResetConfirmationEmail(user.getEmail(), user.getFullName());

        logger.info("Senha redefinida com sucesso para: {}", resetPasswordRequest.getEmail());
    }

    @Override
    public JwtResponse authenticateWithGithub(String code) {
        // Implementação para autenticação com GitHub
        // Em uma aplicação real, trocaria o código por um token de acesso,
        // obteria as informações do usuário da API do GitHub e autenticaria ou registraria o usuário

        // Simulação: apenas retornamos uma resposta mock
        return new JwtResponse(
                "github_mock_token",
                UUID.randomUUID(),
                "Usuário GitHub",
                "github@example.com",
                null,
                List.of("ROLE_USER")
        );
    }
}