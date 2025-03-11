package com.intranet.backend.service.impl;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiretaAuthService {

    private static final Logger logger = LoggerFactory.getLogger(DiretaAuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Serviço de autenticação direta que depura todo o processo passo a passo.
     */
    public JwtResponse autenticarDiretamente(LoginRequest loginRequest) {
        logger.info("### INÍCIO DO PROCESSO DE AUTENTICAÇÃO DIRETA ###");
        logger.info("Email recebido: {}", loginRequest.getEmail());

        // PASSO 1: Buscar o usuário no banco de dados
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> {
                    logger.error("Usuário não encontrado com email: {}", loginRequest.getEmail());
                    return new RuntimeException("Email ou senha incorretos");
                });

        logger.info("Usuário encontrado: ID={}, Nome={}", user.getId(), user.getFullName());

        // PASSO 2: Verificar a senha - com logs detalhados
        String rawPassword = loginRequest.getPassword();
        String storedHash = user.getPasswordHash();

        logger.info("Senha fornecida: {}", maskPassword(rawPassword));
        logger.info("Hash armazenado: {}", maskHash(storedHash));

        boolean senhaCorreta = passwordEncoder.matches(rawPassword, storedHash);
        logger.info("Resultado da verificação de senha: {}", senhaCorreta ? "CORRETA" : "INCORRETA");

        if (!senhaCorreta) {
            // Tentativa com a senha sem processamento (para debug)
            boolean senhaIgualHash = rawPassword.equals(storedHash);
            logger.info("Comparação direta senha-hash: {}", senhaIgualHash ? "IGUAL" : "DIFERENTE");

            throw new RuntimeException("Email ou senha incorretos");
        }

        // PASSO 3: Carregar papéis do usuário
        List<String> roles = new ArrayList<>();
        try {
            // Carregando papéis novamente do banco de dados para ter certeza
            User userWithRoles = userRepository.findByIdWithRoles(user.getId())
                    .orElse(user);

            if (userWithRoles.getUserRoles() != null && !userWithRoles.getUserRoles().isEmpty()) {
                roles = userWithRoles.getUserRoles().stream()
                        .map(userRole -> {
                            Role role = userRole.getRole();
                            String roleName = role != null ? role.getName() : "UNKNOWN";
                            return "ROLE_" + roleName;
                        })
                        .collect(Collectors.toList());
                logger.info("Papéis carregados: {}", roles);
            } else {
                // Se não houver papéis, adicionar ROLE_USER por padrão
                roles.add("ROLE_USER");
                logger.info("Nenhum papel encontrado, adicionando ROLE_USER por padrão");
            }
        } catch (Exception e) {
            logger.error("Erro ao carregar papéis: {}", e.getMessage());
            // Em caso de erro, definir ROLE_USER por padrão
            roles.add("ROLE_USER");
        }

        // PASSO 4: Criar autenticação e gerar token JWT
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, authorities);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);
        logger.info("Token JWT gerado com sucesso");

        // PASSO 5: Retornar resposta
        JwtResponse response = new JwtResponse(
                jwt,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getProfileImage(),
                roles
        );

        logger.info("### FIM DO PROCESSO DE AUTENTICAÇÃO DIRETA - SUCESSO ###");
        return response;
    }

    // Método auxiliar para mascarar a senha nos logs
    private String maskPassword(String password) {
        if (password == null || password.length() <= 4) {
            return "****";
        }
        return password.substring(0, 2) + "****" + password.substring(password.length() - 2);
    }

    // Método auxiliar para mascarar o hash nos logs
    private String maskHash(String hash) {
        if (hash == null || hash.length() <= 10) {
            return "****";
        }
        return hash.substring(0, 5) + "..." + hash.substring(hash.length() - 5);
    }
}

/**
 * Controlador para autenticação direta - endpoint alternativo para login
 */
@RestController
@RequestMapping("/auth/direta")
@RequiredArgsConstructor
class DiretaAuthController {

    private final DiretaAuthService diretaAuthService;

    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest loginRequest) {
        return diretaAuthService.autenticarDiretamente(loginRequest);
    }
}
