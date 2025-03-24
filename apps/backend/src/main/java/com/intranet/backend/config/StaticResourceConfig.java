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

        // Configuração principal para servir imagens
        configureResourceHandler(registry, "/api/uploads/**", cacheControl);

        // Manter compatibilidade com endpoints existentes
        configureResourceHandler(registry, "/uploads/**", cacheControl);
        configureResourceHandler(registry, "/images/**", cacheControl);
        configureResourceHandler(registry, "/api/files/check/**", cacheControl);
        configureResourceHandler(registry, "/api/profile-images/**", cacheControl);
        configureResourceHandler(registry, "/profile-images/**", cacheControl);
        configureResourceHandler(registry, "/api/postagens/temp/**", cacheControl);
        configureResourceHandler(registry, "/postagens/temp/imagens/**", cacheControl);

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