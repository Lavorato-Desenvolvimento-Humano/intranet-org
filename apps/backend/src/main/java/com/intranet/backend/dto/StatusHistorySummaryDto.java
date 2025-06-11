package com.intranet.backend.dto;

import com.intranet.backend.model.StatusHistory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistorySummaryDto {
    private UUID id;
    private StatusHistory.EntityType entityType;
    private UUID entityId;
    private String statusAnterior;
    private String statusNovo;
    private String motivo;
    private String alteradoPorNome;
    private LocalDateTime dataAlteracao;
    private String entityDescricao; // Nome do paciente, número da guia, etc.
}