package com.intranet.backend.controllers;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth/simple")
public class SimpleLoginController {

    private static final Logger logger = LoggerFactory.getLogger(SimpleLoginController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> simpleLogin(@RequestBody LoginRequest loginRequest) {
        logger.info("SimpleLoginController: Recebendo solicitação de login para {}", loginRequest.getEmail());

        try {
            // Busca o usuário pelo email
            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElse(null);

            if (user == null) {
                logger.warn("SimpleLoginController: Usuário não encontrado: {}", loginRequest.getEmail());
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "Email ou senha incorretos");
                return ResponseEntity.status(401).body(errorResponse);
            }

            logger.info("SimpleLoginController: Usuário encontrado: {} (ID: {})", user.getFullName(), user.getId());

            // Verifica a senha
            boolean senhaCorreta = passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash());

            if (!senhaCorreta) {
                logger.warn("SimpleLoginController: Senha incorreta para usuário: {}", loginRequest.getEmail());
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "Email ou senha incorretos");
                return ResponseEntity.status(401).body(errorResponse);
            }

            logger.info("SimpleLoginController: Senha correta para usuário: {}", loginRequest.getEmail());

            // Busca os papéis do usuário
            User userWithRoles = userRepository.findByIdWithRoles(user.getId())
                    .orElse(user);

            List<String> roles = new ArrayList<>();
            if (userWithRoles.getUserRoles() != null && !userWithRoles.getUserRoles().isEmpty()) {
                roles = userWithRoles.getUserRoles().stream()
                        .map(userRole -> {
                            try {
                                Role role = userRole.getRole();
                                return "ROLE_" + (role != null ? role.getName() : "UNKNOWN");
                            } catch (Exception e) {
                                logger.error("Erro ao obter papel: {}", e.getMessage());
                                return "ROLE_USER";
                            }
                        })
                        .collect(Collectors.toList());
            } else {
                roles.add("ROLE_USER");
            }

            logger.info("SimpleLoginController: Papéis do usuário: {}", roles);

            // Cria um token de autenticação
            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getEmail(), null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Gera o token JWT
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Cria a resposta
            JwtResponse response = new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles
            );

            logger.info("SimpleLoginController: Login bem-sucedido para: {}", loginRequest.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("SimpleLoginController: Erro durante o login: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Erro durante o processamento do login: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}