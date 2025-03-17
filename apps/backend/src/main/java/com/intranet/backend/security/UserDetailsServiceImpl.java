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
    @Transactional(readOnly = true) // Usando readOnly para prevenir modificações durante a busca
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("Tentando carregar usuário pelo email: {}", email);

        try {
            // Usando findByEmail básico em vez de findByEmailWithRoles
            // Isso evita carregar coleções que causam ConcurrentModificationException
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("Usuário não encontrado com o email: {}", email);
                        return new UsernameNotFoundException("Usuário não encontrado com o email: " + email);
                    });

            logger.info("Usuário encontrado: ID={}, Nome={}", user.getId(), user.getFullName());

            // Criar uma lista simples de autoridades
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            // Adicionar um papel padrão - vamos evitar carregar papéis do banco de dados por enquanto
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

            logger.debug("Usando autoridade padrão ROLE_USER para o usuário: {}", user.getEmail());

            // Criar UserDetails com as informações básicas do usuário
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