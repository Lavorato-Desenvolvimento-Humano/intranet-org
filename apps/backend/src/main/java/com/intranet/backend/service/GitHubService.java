package com.intranet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
public class GitHubService {

    private static final Logger logger = LoggerFactory.getLogger(GitHubService.class);

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.client.secret}")
    private String clientSecret;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    @Value("${github.allowed.users}")
    private String allowedUsersString;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GitHubService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Troca o código de autorização por um token de acesso
     */
    public String exchangeCodeForToken(String code) {
        logger.info("Trocando código de autorização por token de acesso");

        String tokenUrl = "https://github.com/login/oauth/access_token";

        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "application/json");

        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("client_id", clientId);
        requestBody.add("client_secret", clientSecret);
        requestBody.add("code", code);
        requestBody.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                tokenUrl,
                HttpMethod.POST,
                requestEntity,
                JsonNode.class
        );

        JsonNode responseBody = response.getBody();
        if (responseBody != null && responseBody.has("access_token")) {
            logger.info("Token de acesso obtido com sucesso");
            return responseBody.get("access_token").asText();
        } else {
            logger.error("Falha ao obter token de acesso: {}", responseBody);
            throw new RuntimeException("Falha ao obter token de acesso do GitHub");
        }
    }

    /**
     * Obtém informações do usuário usando o token de acesso
     */
    public JsonNode getUserInfo(String accessToken) {
        logger.info("Obtendo informações do usuário do GitHub");

        String userApiUrl = "https://api.github.com/user";

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "token " + accessToken);
        headers.add("Accept", "application/json");

        HttpEntity<String> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                userApiUrl,
                HttpMethod.GET,
                requestEntity,
                JsonNode.class
        );

        JsonNode userInfo = response.getBody();
        logger.info("Informações do usuário obtidas: {}", userInfo);
        return userInfo;
    }

    /**
     * Verifica se o usuário está na lista de permitidos
     */
    public boolean isUserAllowed(String githubUsername) {
        List<String> allowedUsers = Arrays.asList(allowedUsersString.split(","));
        logger.info("Verificando se o usuário {} está na lista de permitidos: {}", githubUsername, allowedUsers);
        return allowedUsers.contains(githubUsername);
    }
}
