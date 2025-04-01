package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemSummaryDto {
    private UUID id;
    private String title;
    private String tipoDestino; // "geral", "equipe", "convenio"
    private UUID convenioId; // Pode ser null dependendo do tipoDestino
    private String convenioName; // Pode ser null dependendo do tipoDestino
    private UUID equipeId; // Pode ser null dependendo do tipoDestino
    private String equipeName; // Pode ser null dependendo do tipoDestino
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private boolean hasImagens;
    private boolean hasAnexos;
    private boolean hasTabelas;
}
