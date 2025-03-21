package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemSimpleDto {
    private UUID id;
    private String title;
    private String createdByName;
    private LocalDateTime createdAt;
    private boolean hasImagens;
    private boolean hasTabelas;
    private boolean hasAnexos;
}