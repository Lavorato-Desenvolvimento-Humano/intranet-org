package com.intranet.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

        // Verificar e criar diretórios necessários
        createDirectoriesIfNeeded();

        // Configurações comuns para todos os handlers de recursos
        CacheControl cacheControl = CacheControl.maxAge(1, TimeUnit.HOURS)
                .cachePublic();

        // Path para imagens de perfil - assegurar consistência
        registry.addResourceHandler("/api/profile-images/**")
                .addResourceLocations("file:" + uploadDir + "/profiles/")
                .setCacheControl(cacheControl);

        // Manter o mesmo pattern para compatibilidade com URLs antigas
        registry.addResourceHandler("/profile-images/**")
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

        registry.addResourceHandler("/profiles/**")
                .addResourceLocations("file:" + uploadDir + "/profiles/")
                .setCacheControl(cacheControl);

        logger.info("Configuração de recursos estáticos concluída");
    }

    /**
     * Verifica e cria os diretórios necessários caso não existam
     */
    private void createDirectoriesIfNeeded() {
        try {
            // Diretório base
            Path basePath = Paths.get(uploadDir);
            if (!Files.exists(basePath)) {
                Files.createDirectories(basePath);
                logger.info("Diretório base criado: {}", basePath);
            }

            // Diretório de perfis
            Path profilesPath = Paths.get(uploadDir, "profiles");
            if (!Files.exists(profilesPath)) {
                Files.createDirectories(profilesPath);
                logger.info("Diretório de perfis criado: {}", profilesPath);
            }

            // Diretório de imagens
            Path imagesPath = Paths.get(uploadDir, "images");
            if (!Files.exists(imagesPath)) {
                Files.createDirectories(imagesPath);
                logger.info("Diretório de imagens criado: {}", imagesPath);
            }

            // Verificar permissões de escrita
            if (!Files.isWritable(basePath)) {
                logger.warn("Diretório base sem permissão de escrita: {}", basePath);
            }
            if (!Files.isWritable(profilesPath)) {
                logger.warn("Diretório de perfis sem permissão de escrita: {}", profilesPath);
            }
            if (!Files.isWritable(imagesPath)) {
                logger.warn("Diretório de imagens sem permissão de escrita: {}", imagesPath);
            }

        } catch (Exception e) {
            logger.error("Erro ao verificar/criar diretórios: {}", e.getMessage(), e);
        }
    }
}