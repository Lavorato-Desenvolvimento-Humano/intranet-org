package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FichaPdfItemDto {
    private UUID pacienteId;
    private String pacienteNome;
    private String especialidade;
    private String numeroIdentificacao; // Gerado automaticamente
    private Integer mes;
    private Integer ano;
    private String mesExtenso; // "Janeiro", "Fevereiro", etc.
    private UUID convenioId;
    private String convenioNome;
    private String unidade;

    // Dados da guia de origem
    private UUID guiaId;
    private String numeroGuia;
    private Integer quantidadeAutorizada;
    private LocalDateTime ultimaAtividade;
}
