package com.intranet.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.exception.EmailNotVerifiedException;
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
import com.intranet.backend.service.*;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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

    @Autowired
    private GitHubService gitHubService;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private EmailVerificationService emailVerificationService;

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

                // Verificar se o email foi verificado
                if (!user.isEmailVerified()) {
                    logger.warn("[{}] Tentativa de login com email não verificado: {}", requestId, loginRequest.getEmail());
                    throw new EmailNotVerifiedException("Por favor, verifique seu email antes de fazer login.");
                }

            } catch (Exception e) {
                logger.error("[{}] Erro ao buscar usuário: {}", requestId, e.getMessage(), e);
                if (e instanceof BadCredentialsException || e instanceof EmailNotVerifiedException) {
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

                // Definir o status de verificação do email
                response.setEmailVerified(user.isEmailVerified());

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
        } catch (EmailNotVerifiedException e) {
            // Email não verificado - retorna 403
            logger.warn("[{}] Email não verificado: {}", requestId, loginRequest.getEmail());
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
        user.setEmailVerified(false); // Definir como não verificado inicialmente

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

        // Enviar email de verificação
        emailVerificationService.createVerificationTokenAndSendEmail(savedUser);
        logger.info("Email de verificação enviado para: {}", savedUser.getEmail());

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

            JwtResponse response = new JwtResponse(
                    jwt,
                    savedUser.getId(),
                    savedUser.getFullName(),
                    savedUser.getEmail(),
                    savedUser.getProfileImage(),
                    roles
            );

            // Definir o status de verificação do email
            response.setEmailVerified(false);

            return response;
        } catch (AuthenticationException e) {
            logger.error("Falha ao autenticar novo usuário: {}, causa: {}", savedUser.getEmail(), e.getMessage());
            throw new RuntimeException("Erro ao autenticar o novo usuário: " + e.getMessage());
        }
    }

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
    @Transactional
    public JwtResponse authenticateWithGithub(String code) {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        logger.info("[{}] Iniciando autenticação com GitHub para código: {}", requestId, code);

        try {
            // 1. Trocar o código por um token de acesso
            String accessToken = gitHubService.exchangeCodeForToken(code);

            // 2. Obter informações do usuário
            JsonNode userInfo = gitHubService.getUserInfo(accessToken);

            String githubId = userInfo.get("id").asText();
            String githubLogin = userInfo.get("login").asText();
            String email = userInfo.has("email") && !userInfo.get("email").isNull()
                    ? userInfo.get("email").asText()
                    : githubLogin + "@github.user";
            String name = userInfo.has("name") && !userInfo.get("name").isNull()
                    ? userInfo.get("name").asText()
                    : githubLogin;
            String avatarUrl = userInfo.has("avatar_url") ? userInfo.get("avatar_url").asText() : null;

            logger.info("[{}] Informações do usuário GitHub obtidas: login={}, name={}, email={}",
                    requestId, githubLogin, name, email);

            // 3. Verificar se o usuário está na lista de permitidos
            if (!gitHubService.isUserAllowed(githubLogin)) {
                logger.warn("[{}] Usuário GitHub não autorizado: {}", requestId, githubLogin);
                throw new RuntimeException("Usuário GitHub não autorizado. Apenas usuários específicos podem acessar.");
            }

            // 4. Gerenciar usuário - criando um novo método separado e mais simples
            User user = manageGithubUser(githubId, email, name, avatarUrl, requestId);

            // 5. Buscar papéis do usuário diretamente do banco de dados
            List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());
            List<String> roles = new ArrayList<>();

            // Adicionar prefixo ROLE_ a cada papel encontrado
            if (roleNames != null && !roleNames.isEmpty()) {
                for (String roleName : roleNames) {
                    roles.add("ROLE_" + roleName);
                }
            }

            // Se não tiver papéis, adicionar o papel USER padrão
            if (roles.isEmpty()) {
                roles.add("ROLE_USER");
            }

            // 6. Criar autenticação e gerar token JWT
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            for (String role : roles) {
                authorities.add(new SimpleGrantedAuthority(role));
            }

            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPasswordHash(),
                    authorities);

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            logger.info("[{}] Autenticação GitHub concluída com sucesso para: {}", requestId, user.getEmail());

            return new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles
            );
        } catch (Exception e) {
            logger.error("[{}] Erro durante autenticação GitHub: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Falha na autenticação com GitHub: " + e.getMessage(), e);
        }
    }

    /**
     * Método separado para gerenciar o usuário GitHub
     */
    private User manageGithubUser(String githubId, String email, String name, String avatarUrl, String requestId) {
        // Verificar se o usuário já existe pelo githubId
        Optional<User> existingUserByGithub = userRepository.findByGithubId(githubId);
        User user;

        if (existingUserByGithub.isPresent()) {
            // Usuário já existe, atualizar informações se necessário
            user = existingUserByGithub.get();
            logger.info("[{}] Usuário GitHub encontrado: {}", requestId, user.getEmail());

            // Atualizar informações básicas
            user.setFullName(name);
            if (avatarUrl != null) {
                user.setProfileImage(avatarUrl);
            }

            user = userRepository.saveAndFlush(user);
        } else {
            // Verificar se existe usuário com o mesmo email
            Optional<User> existingUserByEmail = userRepository.findByEmail(email);

            if (existingUserByEmail.isPresent()) {
                // Vincular conta GitHub a usuário existente
                user = existingUserByEmail.get();
                user.setGithubId(githubId);
                logger.info("[{}] Vinculando conta GitHub ao usuário existente: {}", requestId, email);
                user = userRepository.saveAndFlush(user);
            } else {
                // Criar novo usuário
                logger.info("[{}] Criando novo usuário a partir da conta GitHub: {}", requestId, email);
                user = new User();
                user.setEmail(email);
                user.setFullName(name);
                user.setGithubId(githubId);
                user.setProfileImage(avatarUrl);

                // Gerar uma senha aleatória
                String randomPassword = UUID.randomUUID().toString();
                user.setPasswordHash(passwordEncoder.encode(randomPassword));

                user = userRepository.saveAndFlush(user);

                // Atribuir o papel de usuário padrão
                try {
                    Role userRole = roleRepository.findByName("USER")
                            .orElseThrow(() -> new RuntimeException("Erro: Papel 'USER' não encontrado."));

                    UserRole newUserRole = new UserRole();
                    newUserRole.setUser(user);
                    newUserRole.setRole(userRole);
                    userRoleRepository.saveAndFlush(newUserRole);
                    logger.info("[{}] Papel USER atribuído ao novo usuário GitHub: {}", requestId, email);
                } catch (Exception e) {
                    logger.error("[{}] Erro ao atribuir papel USER: {}", requestId, e.getMessage());
                    // Continuar mesmo sem atribuir papel
                }
            }
        }

        return user;
    }
}