package com.intranet.drive.collaboration.dto;

import java.time.LocalDateTime;

public record CommentResponseDto(
        Long id,
        Long fileId,
        Long userId,
        String username,
        String content,
        Long parentCommentId,
        LocalDateTime createdAt
) {}
