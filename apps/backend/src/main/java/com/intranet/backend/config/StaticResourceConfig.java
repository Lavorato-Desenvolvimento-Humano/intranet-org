package com.intranet.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Configuração para servir arquivos estáticos, incluindo imagens de perfil
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(StaticResourceConfig.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        logger.info("Configurando servir arquivos estáticos a partir de: {}", uploadDir);

        // Configurações comuns para todos os handlers de recursos
        CacheControl cacheControl = CacheControl.maxAge(1, TimeUnit.HOURS)
                .cachePublic();

        // Opção 1: Servir imagens em /uploads/images/**
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 2: Servir imagens em /api/uploads/images/**
        registry.addResourceHandler("/api/uploads/images/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 3: Servir imagens em /images/**
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 4: Servir imagens para o endpoint de verificação de arquivo
        registry.addResourceHandler("/api/files/check/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 5: Servir imagens para o endpoint de imagens de perfil
        registry.addResourceHandler("/api/profile-images/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 6: Servir imagens diretamente de /profile-images/**
        registry.addResourceHandler("/profile-images/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        // Opção 7: Servir arquivos temporários
        registry.addResourceHandler("/api/postagens/temp/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        registry.addResourceHandler("/api/postagens/temp/imagens/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        registry.addResourceHandler("/postagens/temp/imagens/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        logger.info("Configuração de recursos estáticos concluída");
    }
}