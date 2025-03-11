package com.intranet.backend.security;

import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("Tentando carregar usuário pelo email: {}", email);

        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> {
                    logger.error("Usuário não encontrado com o email: {}", email);
                    return new UsernameNotFoundException("Usuário não encontrado com o email: " + email);
                });

        logger.info("Usuário encontrado: {} (ID: {})", user.getEmail(), user.getId());

        List<GrantedAuthority> authorities = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .map(role -> {
                    logger.debug("Adicionando papel: {}", role.getName());
                    return new SimpleGrantedAuthority("ROLE_" + role.getName());
                })
                .collect(Collectors.toList());

        logger.info("Usuário {} tem {} papéis", user.getEmail(), authorities.size());

        // Agora exibindo a senha hash para debug (remova em produção)
        logger.debug("Hash de senha para usuário {}: {}", user.getEmail(), user.getPasswordHash());

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
    }
}
