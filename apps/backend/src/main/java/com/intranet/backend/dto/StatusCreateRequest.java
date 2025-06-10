package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusCreateRequest {

    @NotBlank(message = "O status não pode ser vazio")
    @Size(max = 50, message = "O status deve ter no máximo 50 caracteres")
    private String status;

    @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres")
    private String descricao;

    private Boolean ativo = true;

    private Integer ordemExibicao;
}