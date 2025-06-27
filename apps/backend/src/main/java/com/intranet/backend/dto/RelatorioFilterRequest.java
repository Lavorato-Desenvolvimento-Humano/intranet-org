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
public class RelatorioFilterRequest {
    private UUID usuarioId;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private StatusHistory.EntityType tipoEntidade; // GUIA, FICHA ou null para ambos
    private String status;
    private UUID convenioId;
    private UUID pacienteId;
    private String especialidade;
    private String tipoAcao; // CRIACAO, EDICAO, MUDANCA_STATUS
}