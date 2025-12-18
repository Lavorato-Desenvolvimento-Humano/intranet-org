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
    private String previewText;
    private String coverImageUrl;
    private String tipoDestino;
    private String convenioName;
    private String equipeName;
    private String createdByName;
    private String createdByProfileImage;
    private LocalDateTime createdAt;

    // Flags visuais para o Card
    private boolean hasImagens;
    private boolean hasAnexos;
    private boolean hasTabelas;

    private String categoria;
    private boolean pinned;

    // Contadores e Estados
    private long viewsCount;
    private long likesCount;
    private boolean likedByCurrentUser;
    private long comentariosCount;
}