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
    private UUID convenioId;
    private String convenioName;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private boolean hasImagens;
    private boolean hasAnexos;
    private boolean hasTabelas;
}
