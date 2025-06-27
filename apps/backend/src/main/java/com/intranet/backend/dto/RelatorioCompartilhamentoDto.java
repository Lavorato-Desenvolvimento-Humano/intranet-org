package com.intranet.backend.dto;

import com.intranet.backend.model.RelatorioCompartilhamento;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioCompartilhamentoDto {
    private UUID id;
    private String titulo;
    private String dadosRelatorio;
    private UUID usuarioOrigemId;
    private String usuarioOrigemNome;
    private UUID usuarioDestinoId;
    private String usuarioDestinoNome;
    private RelatorioCompartilhamento.StatusCompartilhamento status;
    private String observacao;
    private String observacaoResposta;
    private LocalDateTime dataCompartilhamento;
    private LocalDateTime dataResposta;
}
