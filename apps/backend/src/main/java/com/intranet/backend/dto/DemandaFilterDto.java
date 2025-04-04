package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandaFilterDto {
    private UUID atribuidoParaId;
    private UUID criadoPorId;
    private String status;
    private String prioridade;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private LocalDateTime criadaApos;
    private LocalDateTime criadaAntes;
}