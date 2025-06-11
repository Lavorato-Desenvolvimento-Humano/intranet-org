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
public class StatusHistoryDto {
    private UUID id;
    private StatusHistory.EntityType entityType;
    private UUID entityId;
    private String statusAnterior;
    private String statusNovo;
    private String motivo;
    private String observacoes;
    private UUID alteradoPorId;
    private String alteradoPorNome;
    private String alteradoPorEmail;
    private LocalDateTime dataAlteracao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Campos adicionais para contexto
    private String entityDescricao; // Nome do paciente para guias/fichas
    private String numeroGuia; // Para quando for uma guia
    private String codigoFicha; // Para quando for uma ficha
}