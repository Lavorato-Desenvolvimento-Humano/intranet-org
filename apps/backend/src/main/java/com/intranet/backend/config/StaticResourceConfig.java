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
 * Configuração para servir arquivos estáticos
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

        // Path unificado para imagens de perfil
        registry.addResourceHandler("/api/profile-images/**")
                .addResourceLocations("file:" + uploadDir + "/profiles/")
                .setCacheControl(cacheControl);

        // Configuração para outros recursos
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        registry.addResourceHandler("/api/images/**")
                .addResourceLocations("file:" + uploadDir + "/images/")
                .setCacheControl(cacheControl);

        registry.addResourceHandler("/api/files/check/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);

        logger.info("Configuração de recursos estáticos concluída");
    }

    /**
     * Helper method to configure resource handlers with consistent settings
     */
    private void configureResourceHandler(ResourceHandlerRegistry registry, String pathPattern, CacheControl cacheControl) {
        registry.addResourceHandler(pathPattern)
                .addResourceLocations("file:" + uploadDir + "/")
                .setCacheControl(cacheControl);
        logger.debug("Configurado path pattern: {}", pathPattern);
    }
}