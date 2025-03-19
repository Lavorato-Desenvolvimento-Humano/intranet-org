package com.intranet.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração para servir arquivos estáticos, incluindo imagens de perfil
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Adicionar mapeamento para servir arquivos de imagem
        // Este é o ponto mais importante: o caminho de URL deve corresponder àquele que o frontend espera

        // Opção 1: Servir imagens diretamente em /uploads/images/**
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations("file:" + uploadDir + "/");

        // Opção 2: Servir imagens em /api/uploads/images/**
        registry.addResourceHandler("/api/uploads/images/**")
                .addResourceLocations("file:" + uploadDir + "/");

        // Opção 3: Servir imagens em /images/**
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + uploadDir + "/");

        // Note que podemos adicionar vários mapeamentos para a mesma pasta física,
        // permitindo que o frontend acesse as imagens por qualquer um dos caminhos acima
    }
}