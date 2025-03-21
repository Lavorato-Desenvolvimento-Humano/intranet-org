package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TabelaPostagemDto {
    private UUID id;
    private UUID postagemId;
    private String conteudo; // JSON como string
}
