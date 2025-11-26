package com.intranet.drive.collaboration.dto;

import java.time.LocalDateTime;

public record ShareLinkRequestDto(
        LocalDateTime expiresAt,
        String password,
        Integer maxDownloads
) {}
