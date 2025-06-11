package com.intranet.backend.dto;

import com.intranet.backend.model.StatusHistory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistoryCreateRequest {

    @NotNull(message = "O tipo de entidade é obrigatório")
    private StatusHistory.EntityType entityType;

    @NotNull(message = "O ID da entidade é obrigatório")
    private UUID entityId;

    @Size(max = 100, message = "O status anterior deve ter no máximo 100 caracteres")
    private String statusAnterior;

    @NotBlank(message = "O novo status é obrigatório")
    @Size(max = 100, message = "O novo status deve ter no máximo 100 caracteres")
    private String statusNovo;

    @Size(max = 1000, message = "O motivo deve ter no máximo 1000 caracteres")
    private String motivo;

    @Size(max = 2000, message = "As observações devem ter no máximo 2000 caracteres")
    private String observacoes;
}