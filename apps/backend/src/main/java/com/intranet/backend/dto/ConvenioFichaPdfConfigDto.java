package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ConvenioFichaPdfConfigDto {
    private UUID convenioId;
    private String convenioNome;
    private Boolean habilitado;
    private String template; // Template específico do convênio (futuro)
    private Integer diasAtividade; // Dias para considerar atividade recente
    private LocalDateTime ultimaAtualizacao;
    private String observacoes;
}
