package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO para criação de tabela
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TabelaPostagemCreateRequest {
    @NotBlank(message = "O conteúdo da tabela é obrigatório")
    private String conteudo; // Conteúdo JSON como string
}
