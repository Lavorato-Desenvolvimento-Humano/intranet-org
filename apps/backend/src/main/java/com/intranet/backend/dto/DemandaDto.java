package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandaDto {
    private UUID id;
    private String titulo;
    private String descricao;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private UUID criadoPorId;
    private String criadoPorNome;
    private UUID atribuidoParaId;
    private String atribuidoParaNome;
    private String status;
    private String prioridade;
    private LocalDateTime criadaEm;
    private LocalDateTime atualizadaEm;
    private boolean podeEditar;
}
