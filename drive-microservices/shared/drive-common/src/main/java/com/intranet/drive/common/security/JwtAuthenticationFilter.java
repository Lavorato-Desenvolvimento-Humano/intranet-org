package com.intranet.drive.common.security;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.service.CoreIntegrationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Filtro de autenticação JWT com integração ao Core Service
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER = "Authorization";

    private final CoreIntegrationService coreIntegrationService;

    public JwtAuthenticationFilter(CoreIntegrationService coreIntegrationService) {
        this.coreIntegrationService = coreIntegrationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        try {
            String jwtToken = extractTokenFromRequest(request);

            if (jwtToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                authenticateUser(request, jwtToken);
            }
        } catch (Exception e) {
            logger.error("Erro no filtro de autenticação JWT: {}", e.getMessage(), e);
            // Não bloqueia o request - deixa o Spring Security decidir
        }

        chain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTH_HEADER);

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }

        return null;
    }

    private void authenticateUser(HttpServletRequest request, String jwtToken) {
        Optional<UserDto> userOpt = coreIntegrationService.validateTokenWithCore(jwtToken);

        if (userOpt.isPresent()) {
            UserDto user = userOpt.get();

            List<GrantedAuthority> authorities = buildAuthorities(user);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Adiciona o UserDto como atributo do request para uso posterior
            request.setAttribute("currentUser", user);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            logger.debug("Usuário '{}' autenticado com sucesso - Roles: {} - Authorities: {}", user.getUsername(), user.getRoles(), user.getAuthorities());
        }
    }

    private List<GrantedAuthority> buildAuthorities(UserDto user) {
        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toSet());

        if (user.getAuthorities() != null) {
            authorities.addAll(user.getAuthorities().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toSet()));
        }

        return authorities.stream().collect(Collectors.toList());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();

        return path.startsWith("/actuator") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui") ||
                path.equals("/swagger-ui.html") ||
                path.startsWith("/api/*/auth/") ||
                path.equals("/api/drive/files/health");
    }
}
