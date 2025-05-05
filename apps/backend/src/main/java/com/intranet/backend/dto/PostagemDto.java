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
    private String tipoDestino; // "geral", "equipe", "convenio"
    private UUID convenioId; // Pode ser null dependendo do tipoDestino
    private String convenioName; // Pode ser null dependendo do tipoDestino
    private UUID equipeId; // Pode ser null dependendo do tipoDestino
    private String equipeName; // Pode ser null dependendo do tipoDestino
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ImagemDto> imagens;
    private List<AnexoDto> anexos;
    private List<TabelaPostagemDto> tabelas;
    private String createdByProfileImage;
}
