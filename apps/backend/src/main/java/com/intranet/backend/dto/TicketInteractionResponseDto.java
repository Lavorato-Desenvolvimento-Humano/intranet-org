package com.intranet.backend.dto;

import com.intranet.backend.model.InteractionType;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketInteractionResponseDto(
        Long id,
        Long ticketId,

        // Dados do Usuário (Flattened)
        UUID userId,
        String userName,
        String userEmail,
        String userProfileImage,

        InteractionType type,
        String content,
        String attachmentUrl,
        LocalDateTime createdAt
) {
}
