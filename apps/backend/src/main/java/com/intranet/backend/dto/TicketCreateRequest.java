package com.intranet.backend.dto;

import com.intranet.backend.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TicketCreateRequest(
        @NotBlank(message = "O título é obrigatório") String title,
        @NotBlank(message = "A descrição é obrigatória") String description,
        @NotNull(message = "A prioridade é obrigatória")TicketPriority priority,
        @NotNull(message = "A equipe de destino é obrigatória") UUID targetTeamId
        ) {}
