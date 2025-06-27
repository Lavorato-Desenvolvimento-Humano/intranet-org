package com.intranet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioCompartilhamentoCreateRequest {
    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    @NotNull(message = "Dados do relatório são obrigatórios")
    private RelatorioGeralDto dadosRelatorio;

    @NotNull(message = "Usuário destino é obrigatório")
    private UUID usuarioDestinoId;

    private String observacao;
}