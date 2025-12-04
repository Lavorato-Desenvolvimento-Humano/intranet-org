package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaItemDto {
    private UUID id;
    private String especialidade;
    private Integer quantidadeAutorizada;
}