package com.intranet.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FichaCreateRequest {

    @NotNull(message = "A guia é obrigatória")
    private UUID guiaId;

    @NotBlank(message = "A especialidade é obrigatória")
    @Size(max = 100, message = "A especialidade deve ter no máximo 100 caracteres")
    private String especialidade;

    @NotNull(message = "A quantidade autorizada é obrigatória")
    @Min(value = 1, message = "A quantidade autorizada deve ser maior que zero")
    @Max(value = 999, message = "A quantidade autorizada não pode ser maior que 999")
    private Integer quantidadeAutorizada;

    @NotNull(message = "O convênio é obrigatório")
    private UUID convenioId;

    @NotNull(message = "O mês é obrigatório")
    @Min(value = 1, message = "O mês deve ser pelo menos 1")
    @Max(value = 12, message = "O mês não pode ser maior que 12")
    private Integer mes;

    @NotNull(message = "O ano é obrigatório")
    @Min(value = 2020, message = "O ano deve ser pelo menos 2020")
    private Integer ano;
}
