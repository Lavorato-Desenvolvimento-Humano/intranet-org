package com.intranet.backend.dto;

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
public class TabelaValoresCreateDto {
    @NotBlank(message = "O nome da tabela é obrigatório")
    @Size(min = 3, max = 255, message = "O nome deve ter entre 3 e 255 caracteres")
    private String nome;

    private String descricao;

    @NotBlank(message = "O conteúdo da tabela é obrigatório")
    private String conteudo;

    @NotNull(message = "O ID do convênio é obrigatório")
    private UUID convenioId;
}
