package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemCreateRequest {
    @NotBlank(message = "O título da postagem é obrigatório")
    private String title;

    @NotBlank(message = "O texto da postagem é obrigatório")
    private String text;

    @NotNull(message = "O ID do convênio é obrigatório")
    private UUID convenioId;

    private List<ImagemCreateRequest> imagens;
    private List<AnexoCreateRequest> anexos;
    private List<TabelaPostagemCreateRequest> tabelas;
}