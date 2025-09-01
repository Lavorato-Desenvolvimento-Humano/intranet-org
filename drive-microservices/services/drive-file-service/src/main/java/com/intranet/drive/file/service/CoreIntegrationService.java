package com.intranet.drive.file.service;

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
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token.replace("Bearer ", ""));
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            String url = coreUrl + authEndpoint;

            ResponseEntity<UserDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    UserDto.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                logger.debug("Token validado com sucesso no Core Service para usuário: {}",
                        response.getBody().getUsername());
                return Optional.of(response.getBody());
            }

            logger.warn("Core Service retornou status inválido: {}", response.getStatusCode());
            return Optional.empty();

        } catch (RestClientException e) {
            logger.warn("Falha na comunicação com Core Service: {}. Usando validação local.", e.getMessage());

            // Fallback: usar validação local se Core Service estiver indisponível
            return getUserFromTokenLocally(token);
        }
    }

    // Extração direto do token, Fallback
    private Optional<UserDto> getUserFromTokenLocally(String token) {
        try {
            UserDto user = jwtTokenUtil.getUserFromToken(token);
            logger.debug("Usando dados locais do token para usuário: {}", user.getUsername());
            return Optional.of(user);
        } catch (Exception e) {
            logger.error("Erro ao extrair dados do token localmente: {}", e.getMessage());
            return Optional.empty();
        }
    }

    // Busca informações detalhadas no core service
    public Optional<UserDto> getUserById(Long userId, String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(bearerToken.replace("Bearer ", ""));

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            String url = coreUrl + "/api/users/" + userId;

            ResponseEntity<UserDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    UserDto.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return Optional.ofNullable(response.getBody());
            }

            return Optional.empty();

        } catch (RestClientException e) {
            logger.warn("Erro ao buscar usuário {} no Core Service: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Verifica se o usuário tem uma role específica
     * Integra com o sistema de roles do Core Service
     */
    public boolean hasRole(UserDto user, String roleName) {
        return user.getRoles() != null &&
                user.getRoles().stream().anyMatch(role -> role.equalsIgnoreCase(roleName));
    }

    /**
     * Verifica se o usuário tem uma authority específica
     */
    public boolean hasAuthority(UserDto user, String authorityName) {
        return user.getAuthorities() != null &&
                user.getAuthorities().contains(authorityName);
    }
}
