package com.intranet.drive.file;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.intranet.drive.file",
        "com.intranet.drive.common"
})
@EntityScan(basePackages = {
        "com.intranet.drive.file.entity",
        "com.intranet.drive.common.entity"
})
public class DriveFileServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DriveFileServiceApplication.class, args);
    }
}
