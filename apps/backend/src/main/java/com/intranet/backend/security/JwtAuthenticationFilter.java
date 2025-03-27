package com.intranet.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    // Lista de prefixos de caminhos que devem ser excluídos da autenticação
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/auth/**",
            "/public/**",
            "/api/uploads/images/**",
            "/uploads/images/**",
            "/images/**",
            "/api/files/check/**",
            "/api/profile-images/**",
            "/profile-images/**",
            "/api/postagens/temp/imagens",
            "/profiles/**",
            "/uploads/temp/anexos/**", // Adicionar esta linha
            "/api/uploads/temp/anexos/**" // Adicionar esta linha
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        //Lista de caminhos excluídos do filtro de autenticação (recursos públicos)
        boolean shouldExclude = EXCLUDED_PATHS.stream().anyMatch(pattern -> pathMatcher.match(path, pattern));

        // Verifica se é uma imagem de perfil
        boolean isProfileImage = path.startsWith("/api/profile-images/");

        // Verifica se é um arquivo de imagem
        boolean isImageFile = path.matches(".*\\.(jpg|jpeg|png|gif|bmp|webp)$");

        return shouldExclude || isProfileImage || isImageFile;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Verificar se o usuário está ativo
                if (!userDetails.isAccountNonLocked()) {
                    logger.warn("Usuário desativado tentando acessar: {}", username);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"error\":\"Conta desativada. Entre em contato com o administrador.\"}");
                    return;
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Usuário autenticado: {}", username);
            }
        } catch (Exception e) {
            logger.error("Não foi possível definir a autenticação do usuário: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}