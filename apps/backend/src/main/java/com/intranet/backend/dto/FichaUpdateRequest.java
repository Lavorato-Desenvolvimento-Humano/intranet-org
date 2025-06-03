package com.intranet.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FichaUpdateRequest {

    @Size(max = 100, message = "A especialidade deve ter no máximo 100 caracteres")
    private String especialidade;

    @Min(value = 1, message = "A quantidade autorizada deve ser pelo menos 1")
    @Max(value = 999, message = "A quantidade autorizada não pode ser maior que 999")
    private Integer quantidadeAutorizada;

    private UUID convenioId;

    @Min(value = 1, message = "Mês deve estar entre 1 e 12")
    @Max(value = 12, message = "Mês deve estar entre 1 e 12")
    private Integer mes;

    @Min(value = 2020, message = "Ano deve ser a partir de 2020")
    private Integer ano;
}
