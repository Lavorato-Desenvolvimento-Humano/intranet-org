package com.intranet.drive.file.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import com.intranet.drive.common.security.SecurityConfig;
import com.intranet.drive.common.security.JwtAuthenticationFilter;
import com.intranet.drive.common.service.CoreIntegrationService;
import com.intranet.drive.common.security.JwtTokenUtil;
import com.intranet.drive.common.config.JpaAuditConfig;
import com.intranet.drive.common.config.RetryConfig;

@Configuration
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        CoreIntegrationService.class,
        JwtTokenUtil.class,
        JpaAuditConfig.class,
        RetryConfig.class,
})
public class DriveFileServiceConfig {
    //Configuração específica para fazer carregar as classes do drive-common
}
