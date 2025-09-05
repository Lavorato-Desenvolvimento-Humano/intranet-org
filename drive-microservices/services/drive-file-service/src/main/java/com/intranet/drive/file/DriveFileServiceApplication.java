package com.intranet.drive.file;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.ApplicationContext;

@SpringBootApplication(scanBasePackages = {
        "com.intranet.drive.file",
        "com.intranet.drive.common"
},
exclude = {UserDetailsServiceAutoConfiguration.class}
)
@EntityScan(basePackages = {
        "com.intranet.drive.file.entity",
        "com.intranet.drive.common.entity"
})
public class DriveFileServiceApplication {

    @Autowired
    private ApplicationContext applicationContext;

    @PostConstruct
    public void debugBeans() {
        System.out.println("=== DEBUG: VERIFICANDO BEANS DE SEGURANÇA ===");

        try {
            Object securityConfig = applicationContext.getBean("securityConfig");
            System.out.println("✅ SecurityConfig encontrado: " + securityConfig.getClass().getName());
        } catch (Exception e) {
            System.out.println("❌ SecurityConfig NÃO encontrado: " + e.getMessage());
        }

        try {
            Object jwtFilter = applicationContext.getBean("jwtAuthenticationFilter");
            System.out.println("✅ JwtAuthenticationFilter encontrado: " + jwtFilter.getClass().getName());
        } catch (Exception e) {
            System.out.println("❌ JwtAuthenticationFilter NÃO encontrado: " + e.getMessage());
        }

        //Listar todos os beans com "security" no nome
        System.out.println("\n=== BEANS COM 'SECURITY' NO NOME ===");
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        for (String beanName : beanNames) {
            if (beanName.toLowerCase().contains("securityConfig")) {
                System.out.println("Bean: " + beanName);
            }
        }

        System.out.println("=== FIM DEBUG ===\n");
    }

    public static void main(String[] args) {
        SpringApplication.run(DriveFileServiceApplication.class, args);
    }
}
