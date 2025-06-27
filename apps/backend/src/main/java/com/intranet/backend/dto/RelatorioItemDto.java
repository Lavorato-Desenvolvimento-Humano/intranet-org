package com.intranet.backend.dto;

import com.intranet.backend.model.StatusHistory;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioItemDto {
    private UUID id;
    private StatusHistory.EntityType tipoEntidade;
    private UUID entidadeId;
    private String entidadeDescricao;
    private String numeroGuia;
    private String codigoFicha;
    private String pacienteNome;
    private String convenioNome;
    private String especialidade;
    private String tipoAcao;
    private String statusAnterior;
    private String statusNovo;
    private String motivo;
    private String observacoes;
    private String usuarioResponsavel;
    private LocalDateTime dataAcao;
}