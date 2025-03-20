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
            // Usando findByEmail básico para obter o usuário
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("Usuário não encontrado com o email: {}", email);
                        return new UsernameNotFoundException("Usuário não encontrado com o email: " + email);
                    });

            logger.info("Usuário encontrado: ID={}, Nome={}", user.getId(), user.getFullName());

            // Buscar as roles reais do usuário
            List<String> userRoles = userRepository.findRoleNamesByUserId(user.getId());
            logger.debug("Roles do usuário obtidas do banco: {}", userRoles);

            // Criar lista de autoridades com as roles do usuário
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            if (userRoles != null && !userRoles.isEmpty()) {
                // Adicionar cada role com o prefixo ROLE_ se não existir
                for (String role : userRoles) {
                    String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    authorities.add(new SimpleGrantedAuthority(roleWithPrefix));
                    logger.debug("Adicionando autoridade: {}", roleWithPrefix);
                }
            } else {
                // Se o usuário não tiver roles, adicionar ROLE_USER como padrão
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                logger.debug("Usuário sem roles, adicionando ROLE_USER padrão");
            }

            // Criar UserDetails com as informações do usuário
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPasswordHash())
                    .authorities(authorities)
                    .accountExpired(false)
                    .accountLocked(!user.isActive())
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();

            logger.info("UserDetails criado com sucesso para: {}, autoridades: {}",
                    user.getEmail(), authorities);
            return userDetails;
        } catch (UsernameNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao carregar usuário: {}", e.getMessage(), e);
            throw new UsernameNotFoundException("Erro ao carregar usuário: " + e.getMessage());
        }
    }
}