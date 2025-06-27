package com.intranet.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class RelatorioCompartilhamentoRequest {

    @NotNull(message = "ID do usuário destino é obrigatório")
    private UUID usuarioDestinoId;

    private String observacao;
}