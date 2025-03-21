package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemDto {
    private UUID id;
    private String title;
    private String text;
    private UUID convenioId;
    private String convenioName;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ImagemDto> imagens;
    private List<AnexoDto> anexos;
    private List<TabelaPostagemDto> tabelas;
}