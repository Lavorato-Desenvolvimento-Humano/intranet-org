package com.intranet.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefixo para as mensagens que vão para o cliente (frontend)
        config.enableSimpleBroker("/topic");
        // Prefixo para mensagens que vêm do cliente para o servidor (se houver)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint de conexão inicial do WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Permite conexão do Next.js
                .withSockJS(); // Fallback para navegadores antigos/proxies
    }
}