package com.intranet.backend.config;

import com.intranet.backend.security.JwtAuthenticationEntryPoint;
import com.intranet.backend.security.JwtAuthenticationFilter;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public HttpServletRequest httpServletRequest(HttpServletRequest request) {
        return request;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("https://dev.lavorato.app.br", "http://localhost:3000", "http://localhost:3001", "https://localhost:3000", "https://localhost:3001", "https://lavorato.app.br", "https://drive.lavorato.app.br"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers", "X-Requested-With", "X-Forwarded-For", "X-Forwarded-Proto", "X-Forwarded-Host"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        logger.info("CORS configurado para origens: {}", configuration.getAllowedOrigins());
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("Configurando regras de segurança");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                    .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                )
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth ->
                        auth
                                .requestMatchers("/api/auth/**", "/auth/**").permitAll()
                                .requestMatchers("/api/public/**", "/public/**").permitAll()

                                // Public access to image and file resources
                                .requestMatchers("/api/uploads/**").permitAll()
                                .requestMatchers("/api/uploads/temp/**").permitAll()
                                .requestMatchers("/uploads/temp/**").permitAll() // Permitir acesso a todos os arquivos temporários
                                .requestMatchers("/uploads/temp/anexos/**").permitAll()
                                .requestMatchers("/uploads/temp/imagens/**").permitAll()
                                .requestMatchers("/api/images/**").permitAll()
                                .requestMatchers("/api/files/check/**").permitAll()
                                .requestMatchers("/api/profile-images/**", "/profile-images/**").permitAll()
                                .requestMatchers("/profiles/**").permitAll()
                                .requestMatchers("/auth/validate-token").authenticated()
                                .requestMatchers("/drive-integration/**").authenticated()
                                .requestMatchers("/api/tickets/**").authenticated()
                                .requestMatchers("/ws/**").permitAll()

                                // Permitir uploads temporários para usuários autenticados
                                .requestMatchers("/api/postagens/temp/**").authenticated()
                                .requestMatchers("/api/temp/**").authenticated()

                                // For debugging purposes
                                .requestMatchers("/api/diagnostic/**").permitAll()

                                // All other requests need authentication
                                .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        logger.info("Configuração de segurança concluída");
        return http.build();
    }

    @PostConstruct
    public void configureSecurityContextStrategy() {
        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
        logger.info("SecurityContext configurado para MODE_INHERITABLETHREADLOCAL");
    }

    @Bean(name = "secureAsyncTaskExecutor")
    public DelegatingSecurityContextAsyncTaskExecutor secureAsyncTaskExecutor() {
        ThreadPoolTaskExecutor delegate = new ThreadPoolTaskExecutor();
        delegate.setCorePoolSize(2);
        delegate.setMaxPoolSize(5);
        delegate.setQueueCapacity(100);
        delegate.setThreadNamePrefix("SecureAsync-");
        delegate.initialize();

        return new DelegatingSecurityContextAsyncTaskExecutor(delegate);
    }

    @PostConstruct
    public void logSecurityConfiguration() {
        logger.info("=== CONFIGURAÇÃO DE SEGURANÇA INICIALIZADA ===");
        logger.info("CORS habilitado para:");
        logger.info("- https://lavorato.app.br");
        logger.info("- https://dev.lavorato.app.br");
        logger.info("- https://drive.lavorato.app.br");
        logger.info("- http://localhost:3000");
        logger.info("JWT Authentication habilitado");
        logger.info("==============================");
    }
}