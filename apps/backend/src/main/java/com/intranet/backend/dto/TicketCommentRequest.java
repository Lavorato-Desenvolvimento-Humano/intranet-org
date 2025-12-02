package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketCommentRequest(
        @NotBlank(message = "O comentário não pode estar vazio")
        String content
) {
}
