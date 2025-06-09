package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FichaSummaryDto {
    private UUID id;
    private String codigoFicha;
    private String status;
    private String pacienteNome;
    private String especialidade;
    private Integer quantidadeAutorizada;
    private String convenioNome;
    private Integer mes;
    private Integer ano;
    private String usuarioResponsavelNome;
    private LocalDateTime createdAt;
}
