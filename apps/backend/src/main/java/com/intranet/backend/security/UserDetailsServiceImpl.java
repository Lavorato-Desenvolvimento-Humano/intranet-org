package com.intranet.backend.security;

import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("Tentando carregar usuário pelo email: {}", email);

        try {
            User user = userRepository.findByEmailWithRoles(email)
                    .orElseThrow(() -> {
                        logger.error("Usuário não encontrado com o email: {}", email);
                        return new UsernameNotFoundException("Usuário não encontrado com o email: " + email);
                    });

            logger.info("Usuário encontrado: ID={}, Nome={}", user.getId(), user.getFullName());

            // Criar uma lista de autoridades a partir das roles do usuário
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            // Buscar os papéis do usuário e convertê-los em autoridades
            List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
            if (roles != null && !roles.isEmpty()) {
                for (String role : roles) {
                    // Garantir que as roles têm o prefixo ROLE_
                    String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    authorities.add(new SimpleGrantedAuthority(roleWithPrefix));
                    logger.debug("Adicionando autoridade: {}", roleWithPrefix);
                }
            } else {
                // Adicionar role padrão USER se o usuário não tiver roles
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                logger.debug("Nenhuma role encontrada, adicionando autoridade padrão ROLE_USER");
            }

            // Criar UserDetails com as informações do usuário e suas autoridades
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPasswordHash())
                    .authorities(authorities)
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();

            logger.info("UserDetails criado com sucesso para: {}", user.getEmail());
            return userDetails;
        } catch (UsernameNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao carregar usuário: {}", e.getMessage(), e);
            throw new UsernameNotFoundException("Erro ao carregar usuário: " + e.getMessage());
        }
    }
}