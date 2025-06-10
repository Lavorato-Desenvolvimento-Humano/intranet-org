
package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusDto {
    private UUID id;
    private String status;
    private String descricao;
    private Boolean ativo;
    private Integer ordemExibicao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}