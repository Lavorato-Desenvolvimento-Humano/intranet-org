package com.intranet.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    // Lista de prefixos de caminhos que devem ser excluídos da autenticação
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/auth/",
            "/public/",
            "/api/uploads/images/",
            "/uploads/images/",
            "/images/",
            "/api/files/check/",
            "/api/profile-images/",
            "/profile-images/"
    );

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Obter o caminho completo do servlet (incluindo context-path)
            String path = request.getServletPath();
            logger.debug("Processando requisição para o caminho: {}", path);

            // Verificar se o caminho deve ser excluído da autenticação
            if (isExcludedPath(path)) {
                logger.debug("Pulando autenticação para caminho excluído: {}", path);
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = parseJwt(request);

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                logger.debug("Token JWT válido para usuário: {}", username);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Registrar as autoridades carregadas para depuração
                logger.debug("Autoridades carregadas para {}: {}", username,
                        userDetails.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toList()));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Usuário autenticado: {} com autoridades: {}", username,
                        authentication.getAuthorities());
            } else {
                logger.debug("Token JWT inválido ou ausente");
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

    /**
     * Verifica se o caminho fornecido deve ser excluído da autenticação
     */
    private boolean isExcludedPath(String path) {
        // Verifica diretamente se o caminho corresponde a algum de nossos padrões de recursos estáticos
        if (path.matches(".*\\.(jpg|jpeg|png|gif|bmp|webp)$")) {
            logger.debug("Excluindo arquivo de imagem da autenticação: {}", path);
            return true;
        }

        // Verifica contra nossa lista de prefixos de caminhos excluídos
        for (String excludedPath : EXCLUDED_PATHS) {
            if (path.startsWith(excludedPath)) {
                return true;
            }
        }

        return false;
    }
}