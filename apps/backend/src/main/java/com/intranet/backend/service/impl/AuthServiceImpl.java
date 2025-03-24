package com.intranet.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.exception.EmailNotVerifiedException;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.RoleRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.UserRoleRepository;
import com.intranet.backend.security.JwtUtils;
import com.intranet.backend.service.*;
import com.intranet.backend.util.FileHelper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final GitHubService gitHubService;

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        logger.info("[{}] Iniciando processo de login para email: {}", requestId, loginRequest.getEmail());

        try {
            // Verificar se o usuário existe
            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> {
                        logger.warn("[{}] Usuário não encontrado com email: {}", requestId, loginRequest.getEmail());
                        return new BadCredentialsException("Email ou senha incorretos");
                    });

            // Verificar se o email foi verificado
            if (!user.isEmailVerified()) {
                logger.warn("[{}] Tentativa de login com email não verificado: {}", requestId, loginRequest.getEmail());
                throw new EmailNotVerifiedException("Por favor, verifique seu email antes de fazer login.");
            }

            // Tentar autenticar
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            // Se autenticação bem-sucedida, configurar o contexto de segurança
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Gerar token JWT
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Obter papéis do usuário
            List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
            roles = roles.stream()
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                    .collect(Collectors.toList());

            if (roles.isEmpty()) {
                roles.add("ROLE_USER");
            }

            // Criar e retornar resposta JWT
            JwtResponse response = new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles
            );
            response.setEmailVerified(user.isEmailVerified());

            logger.info("[{}] Login concluído com sucesso para: {}", requestId, loginRequest.getEmail());
            return response;
        } catch (BadCredentialsException e) {
            logger.warn("[{}] Credenciais inválidas para: {}", requestId, loginRequest.getEmail());
            throw e;
        } catch (EmailNotVerifiedException e) {
            logger.warn("[{}] Email não verificado: {}", requestId, loginRequest.getEmail());
            throw e;
        } catch (Exception e) {
            logger.error("[{}] Erro durante autenticação: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Erro durante autenticação", e);
        }
    }

    @Override
    @Transactional
    public JwtResponse register(RegisterRequest registerRequest) {
        logger.info("Processando solicitação de registro para: {}", registerRequest.getEmail());

        // Validar email
        if (!registerRequest.getEmail().endsWith("@lavorato.com.br")) {
            logger.warn("Tentativa de registro com domínio de email não permitido {}", registerRequest.getEmail());
            throw new RuntimeException("Erro: Apenas emails com domínio @lavorato.com.br são permitidos!");
        }

        // Verificar se email já está em uso
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            logger.warn("Email já está em uso: {}", registerRequest.getEmail());
            throw new RuntimeException("Erro: Email já está em uso!");
        }

        // Verificar se GitHub ID já está em uso
        if (registerRequest.getGithubId() != null &&
                !registerRequest.getGithubId().isEmpty() &&
                userRepository.existsByGithubId(registerRequest.getGithubId())) {
            logger.warn("ID do GitHub já está em uso: {}", registerRequest.getGithubId());
            throw new RuntimeException("Erro: ID do GitHub já está em uso!");
        }

        // Processar imagem de perfil
        String profileImagePath = null;
        if (registerRequest.getProfileImage() != null && !registerRequest.getProfileImage().isEmpty()) {
            String errorMessage = FileHelper.validateFile(registerRequest.getProfileImage(), true);
            if (errorMessage != null) {
                throw new RuntimeException("Erro na imagem de perfil: " + errorMessage);
            }
            profileImagePath = fileStorageService.storeFile(registerRequest.getProfileImage());
        }

        // Criar novo usuário
        User user = new User();
        user.setFullName(registerRequest.getFullName());
        user.setEmail(registerRequest.getEmail());
        user.setEmailVerified(false);
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setGithubId(registerRequest.getGithubId());
        user.setProfileImage(profileImagePath);
        user.setActive(true);

        User savedUser = userRepository.save(user);
        logger.info("Usuário salvo no banco de dados: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        // Atribuir papel USER
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Erro: Papel 'USER' não encontrado."));

        UserRole newUserRole = new UserRole();
        newUserRole.setUser(savedUser);
        newUserRole.setRole(userRole);
        userRoleRepository.save(newUserRole);

        // Enviar email de verificação
        tokenService.createOrReuseEmailVerificationToken(savedUser);

        // Autenticar o novo usuário para gerar token JWT
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getEmail(),
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Criar e retornar resposta JWT
        JwtResponse response = new JwtResponse(
                jwt,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getProfileImage(),
                List.of("ROLE_USER")
        );
        response.setEmailVerified(false);

        return response;
    }

    @Override
    @Transactional
    public JwtResponse registerWithImage(String fullName, String email, String password,
                                         String githubId, MultipartFile profileImage) {
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
        tokenService.createOrReusePasswordResetToken(email);
    }

    @Override
    @Transactional
    public void verifyResetCode(String email, String code) {
        logger.info("Verificando código de redefinição para: {}", email);
        tokenService.verifyPasswordResetToken(email, code);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        logger.info("Redefinindo senha para: {}", resetPasswordRequest.getEmail());

        // Verificar código de redefinição
        User user = tokenService.verifyPasswordResetToken(
                resetPasswordRequest.getEmail(),
                resetPasswordRequest.getVerificationCode()
        );

        // Atualizar a senha
        user.setPasswordHash(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        userRepository.save(user);

        // Marcar o token como usado
        tokenService.markPasswordResetTokenAsUsed(resetPasswordRequest.getVerificationCode());

        // Enviar email de confirmação
        emailService.sendPasswordResetConfirmationEmail(user.getEmail(), user.getFullName());
    }

    @Override
    @Transactional
    public JwtResponse authenticateWithGithub(String code) {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        logger.info("[{}] Iniciando autenticação com GitHub para código: {}", requestId, code);

        try {
            // Trocar o código por um token de acesso
            String accessToken = gitHubService.exchangeCodeForToken(code);

            // Obter informações do usuário
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

            // Verificar se o usuário está na lista de permitidos
            if (!gitHubService.isUserAllowed(githubLogin)) {
                logger.warn("[{}] Usuário GitHub não autorizado: {}", requestId, githubLogin);
                throw new RuntimeException("Usuário GitHub não autorizado. Apenas usuários específicos podem acessar.");
            }

            // Gerenciar usuário - criando novo ou atualizando existente
            User user = manageGithubUser(githubId, email, name, avatarUrl);

            // Buscar papéis do usuário
            List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());
            List<String> roles = new ArrayList<>();

            // Adicionar prefixo ROLE_ a cada papel
            if (roleNames != null && !roleNames.isEmpty()) {
                for (String roleName : roleNames) {
                    roles.add("ROLE_" + roleName);
                }
            }

            // Se não tiver papéis, adicionar o papel USER padrão
            if (roles.isEmpty()) {
                roles.add("ROLE_USER");
            }

            // Criar autenticação e gerar token JWT
            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPasswordHash(),
                    authorities);

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Criar e retornar resposta JWT
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
     * Método auxiliar para gerenciar usuário GitHub
     */
    private User manageGithubUser(String githubId, String email, String name, String avatarUrl) {
        // Verificar se o usuário já existe pelo githubId
        return userRepository.findByGithubId(githubId)
                .map(existingUser -> {
                    // Usuário já existe, atualizar informações
                    existingUser.setFullName(name);
                    if (avatarUrl != null) {
                        existingUser.setProfileImage(avatarUrl);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Verificar se existe usuário com o mesmo email
                    return userRepository.findByEmail(email)
                            .map(existingUser -> {
                                // Vincular conta GitHub a usuário existente
                                existingUser.setGithubId(githubId);
                                return userRepository.save(existingUser);
                            })
                            .orElseGet(() -> {
                                // Criar novo usuário
                                User newUser = new User();
                                newUser.setEmail(email);
                                newUser.setFullName(name);
                                newUser.setGithubId(githubId);
                                newUser.setProfileImage(avatarUrl);
                                newUser.setEmailVerified(true); // GitHub já verificou o email
                                newUser.setActive(true);

                                // Gerar uma senha aleatória
                                String randomPassword = UUID.randomUUID().toString();
                                newUser.setPasswordHash(passwordEncoder.encode(randomPassword));

                                User savedUser = userRepository.save(newUser);

                                // Atribuir o papel USER
                                Role userRole = roleRepository.findByName("USER")
                                        .orElseThrow(() -> new RuntimeException("Papel 'USER' não encontrado"));

                                UserRole newUserRole = new UserRole();
                                newUserRole.setUser(savedUser);
                                newUserRole.setRole(userRole);
                                userRoleRepository.save(newUserRole);

                                return savedUser;
                            });
                });
    }
}