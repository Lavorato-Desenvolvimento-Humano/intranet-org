package com.intranet.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

    private static final Logger logger = LoggerFactory.getLogger(PasswordEncoderConfig.class);

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Criar uma implementação personalizada que faz log de todas as operações
        return new BCryptPasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                logger.debug("Codificando senha: {}", rawPassword.toString().substring(0, 2) + "***");
                String encoded = super.encode(rawPassword);
                logger.debug("Senha codificada para: {}", encoded);
                return encoded;
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                logger.debug("Verificando senha: {} contra hash: {}...",
                        rawPassword.toString().substring(0, 2) + "***",
                        encodedPassword.substring(0, 10) + "...");
                boolean matches = super.matches(rawPassword, encodedPassword);
                logger.debug("Resultado da verificação: {}", matches ? "CORRESPONDE" : "NÃO CORRESPONDE");
                return matches;
            }
        };
    }
}
