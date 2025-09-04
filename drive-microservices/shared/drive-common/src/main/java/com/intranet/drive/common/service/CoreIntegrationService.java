package com.intranet.drive.common.service;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.security.JwtTokenUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Optional;

/**
 * Serviço para integração com o Intranet Core Service
 * Responsável por validar tokens e buscar informações de usuários
 */
@Service
public class CoreIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(CoreIntegrationService.class);

    @Value("${intranet.core.url}")
    private String coreUrl;

    @Value("${intranet.core.auth-endpoint:/api/auth/validate}")
    private String authEndpoint;

    private final RestTemplate restTemplate;
    private final JwtTokenUtil jwtTokenUtil;

    public CoreIntegrationService(RestTemplate restTemplate, JwtTokenUtil jwtTokenUtil) {
        this.restTemplate = restTemplate;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    /**
     * Valida o token JWT com o Core Service
     * Implementa RF01.1 - Integração com Sistema existente
     */
    public Optional<UserDto> validateTokenWithCore(String token) {
        try {
            // Validação local do token
            if (!isTokenValidLocally(token)) {
                logger.debug("Token invalido na validação local");
                return Optional.empty();
            }

            // Confirma se o usuário ainda está ativo
            return validateTokenWithRemoteCore(token);
        } catch (Exception e) {
            logger.error("Erro na validação do token: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    // Validação local
    private boolean isTokenValidLocally(String token) {
        try {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            return username != null && !jwtTokenUtil.isTokenExpired(token);
        } catch (Exception e) {
            logger.debug("Token inválido localmente: {}", e.getMessage(), e);
            return false;
        }
    }

    // Valida com o core para ver se o usuário ainda é ativo
    private Optional<UserDto> validateTokenWithRemoteCore(String token) {
        try {
            String url = coreUrl + authEndpoint;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<UserDto> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, UserDto.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                logger.debug("Token validado com sucesso para usuário: {}",
                        response.getBody().getUsername());
                return Optional.of(response.getBody());
            }

            logger.debug("Validação do token falhou - resposta: {}", response.getStatusCode());
            return Optional.empty();

        } catch (RestClientException e) {
            logger.warn("Erro na comunicação com Core Service: {}", e.getMessage());
            // Em caso de erro de comunicação, permite validação local apenas
            return createLocalUserFromToken(token);
        }
    }

    // Fallback: cria usuário baseado apenas no token (para casos de erro de rede)
    private Optional<UserDto> createLocalUserFromToken(String token) {
        try {
            String username = jwtTokenUtil.getUsernameFromToken(token);

            UserDto user = new UserDto();
            user.setUsername(username);
            user.setActive(true);

            // Roles padrão em caso de fallback
            user.setRoles(java.util.Set.of("USER"));
            user.setAuthorities(java.util.Set.of("drive:read", "drive:write"));

            logger.info("Usando validação local (fallback) para usuário: {}", username);
            return Optional.of(user);

        } catch (Exception e) {
            logger.error("Erro no fallback local: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Busca informações completas do usuário pelo username
     */
    public Optional<UserDto> getUserByUsername(String username) {
        try {
            String url = coreUrl + "/api/users/username/" + username;

            ResponseEntity<UserDto> response = restTemplate.getForEntity(url, UserDto.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return Optional.of(response.getBody());
            }

            return Optional.empty();

        } catch (RestClientException e) {
            logger.error("Erro ao buscar usuário {}: {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    public boolean hasRole(UserDto user, String roleName) {
        return user.getRoles() != null &&
                user.getRoles().stream().anyMatch(role -> role.equalsIgnoreCase(roleName));
    }
}