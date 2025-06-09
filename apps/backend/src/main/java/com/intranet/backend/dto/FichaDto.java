package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FichaDto {
    private UUID id;
    private UUID guiaId;
    private String codigoFicha;
    private String status;
    private String pacienteNome;
    private String especialidade;
    private Integer quantidadeAutorizada;
    private UUID convenioId;
    private String convenioNome;
    private Integer mes;
    private Integer ano;
    private UUID usuarioResponsavelId;
    private String usuarioResponsavelNome;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
