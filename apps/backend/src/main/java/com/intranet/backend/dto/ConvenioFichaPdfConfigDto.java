package com.intranet.backend.dto;

import lombok.Data;

@Data
public class ConvenioFichaPdfConfigDto {
    private String id;
    private String convenioId;
    private String convenioNome;
    private Boolean habilitado;
    private String templatePersonalizado;
    private Integer diasAtividade;
    private String formatoPadrao;
    private Boolean incluirLogo;
    private Boolean incluirCarimbo;
    private String observacoes;
    private String createdAt;
    private String updatedAt;
}
