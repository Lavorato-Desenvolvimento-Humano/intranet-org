package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class FichaAssinaturaCreateRequest {

    @NotNull(message = "O paciente é obrigatório")
    private UUID pacienteId;

    @NotBlank(message = "A especialidade é obrigatória")
    private String especialidade;

    @NotNull(message = "A quantidade é obrigatória")
    private Integer quantidadeAutorizada;

    @NotNull(message = "O convênio é obrigatório")
    private UUID convenioId;

    @NotNull
    private Integer mes;

    @NotNull
    private Integer ano;
}
