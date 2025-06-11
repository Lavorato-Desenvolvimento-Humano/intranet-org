package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusChangeRequest {

    @NotBlank(message = "O novo status é obrigatório")
    @Size(max = 100, message = "O status deve ter no máximo 100 caracteres")
    private String novoStatus;

    @Size(max = 1000, message = "O motivo deve ter no máximo 1000 caracteres")
    private String motivo;

    @Size(max = 2000, message = "As observações devem ter no máximo 2000 caracteres")
    private String observacoes;
}