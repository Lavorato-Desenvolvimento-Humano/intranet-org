package com.intranet.backend.service.impl;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.RoleRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.UserRoleRepository;
import com.intranet.backend.security.JwtUtils;
import com.intranet.backend.service.AuthService;
import com.intranet.backend.service.FileStorageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Erro: Usuário não encontrado."));

        return new JwtResponse(
                jwt,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getProfileImage(),
                roles
        );
    }

    @Override
    @Transactional
    public JwtResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Erro: Email já está em uso!");
        }

        if (registerRequest.getGithubId() != null &&
                !registerRequest.getGithubId().isEmpty() &&
                userRepository.existsByGithubId(registerRequest.getGithubId())) {
            throw new RuntimeException("Erro: ID do GitHub já está em uso!");
        }

        // Processa a imagem de perfil
        String profileImagePath = null;
        if (registerRequest.getProfileImage() != null && !registerRequest.getProfileImage().isEmpty()) {
            profileImagePath = fileStorageService.storeFile(registerRequest.getProfileImage());
        }

        // Cria o novo usuário
        User user = new User();
        user.setFullName(registerRequest.getFullName());
        user.setEmail(registerRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setGithubId(registerRequest.getGithubId());
        user.setProfileImage(profileImagePath);

        User savedUser = userRepository.save(user);

        // Atribui o papel de usuário padrão
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Erro: Papel 'USER' não encontrado."));

        UserRole newUserRole = new UserRole();
        newUserRole.setUser(savedUser);
        newUserRole.setRole(userRole);
        userRoleRepository.save(newUserRole);

        // Gera o token JWT para o novo usuário
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = List.of("ROLE_USER");

        return new JwtResponse(
                jwt,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getProfileImage(),
                roles
        );
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
    public void requestPasswordReset(String email) {
        // Implementação para gerar e enviar código de redefinição de senha
        // Normalmente enviaria um email com o código, mas aqui apenas simulamos
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        // Simulação: em uma implementação real, você geraria um código, salvaria no banco
        // e enviaria por email para o usuário
        System.out.println("Código de redefinição de senha gerado para " + email);
    }

    @Override
    public void verifyResetCode(String email, String code) {
        // Implementação para verificar o código de redefinição
        // Em uma aplicação real, verificaria o código no banco de dados
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        // Simulação: em uma implementação real, verificaria se o código é válido
        // Se o código fosse inválido, lançaria uma exceção
        System.out.println("Código verificado para " + email);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        // Implementação para redefinir a senha
        User user = userRepository.findByEmail(resetPasswordRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + resetPasswordRequest.getEmail()));

        // Em uma aplicação real, verificaria o código antes de prosseguir
        // Atualizando a senha
        user.setPasswordHash(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        userRepository.save(user);

        System.out.println("Senha redefinida para " + resetPasswordRequest.getEmail());
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