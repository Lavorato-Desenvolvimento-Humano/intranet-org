package com.intranet.backend.dto;

import com.intranet.backend.model.RelatorioCompartilhamento;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioCompartilhamentoResponseRequest {
    @NotNull(message = "Status é obrigatório")
    private RelatorioCompartilhamento.StatusCompartilhamento status;

    private String observacaoResposta;
}