package com.intranet.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.util.List;
import java.util.UUID;

@Data
public class FichaPdfLoteRequest {
    @NotNull(message = "Lista de convênios é obrigatória")
    private List<UUID> convenioIds;

    @NotNull(message = "Mês é obrigatório")
    @Min(value = 1, message = "Mês deve ser entre 1 e 12")
    @Max(value = 12, message = "Mês deve ser entre 1 e 12")
    private Integer mes;

    @NotNull(message = "Ano é obrigatório")
    @Min(value = 2024, message = "Ano deve ser maior ou igual a 2024")
    private Integer ano;

    private String unidade;
    private List<String> especialidades;
    private Boolean incluirInativos = false;
}
