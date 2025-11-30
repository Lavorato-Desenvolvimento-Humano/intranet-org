package com.intranet.backend.dto;

import com.intranet.backend.model.TicketPriority;
import com.intranet.backend.model.TicketStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketResponseDto(
        Long id,
        String title,
        String description,
        TicketPriority priority,
        TicketStatus status,
        LocalDateTime createdAt,
        LocalDateTime dueDate,
        LocalDateTime closedAt,
        Integer rating,
        String ratingComment,

        // Dados simplificados do Solicitante
        UUID requesterId,
        String requesterName,
        String requesterEmail,

        // Dados simplificados do Técnico
        UUID assigneeId,
        String assigneeName,

        // Dados simplificados da Equipe
        UUID targetTeamId,
        String targetTeamNome
) {
}
