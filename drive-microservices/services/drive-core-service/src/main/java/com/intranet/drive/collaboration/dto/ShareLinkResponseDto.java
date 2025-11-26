package com.intranet.drive.collaboration.dto;

import java.time.LocalDateTime;

public record ShareLinkResponseDto(
        String token,
        String url, //URL completa para o frontend
        LocalDateTime expiresAt,
        Integer maxDownloads,
        Integer downloadCount
) {}
