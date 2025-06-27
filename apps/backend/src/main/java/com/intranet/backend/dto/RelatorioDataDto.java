package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class RelatorioDataDto {

    // Informações gerais
    private String titulo;
    private String usuarioGerador;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private Integer totalRegistros;
    private LocalDateTime dataGeracao;

    // Filtros aplicados
    private Map<String, Object> filtrosAplicados;

    // Dados das entidades
    private List<RelatorioItemDto> itens;

    // Estatísticas
    private Map<String, Long> distribuicaoPorStatus;
    private Map<String, Long> distribuicaoPorEspecialidade;
    private Map<String, Long> distribuicaoPorConvenio;
    private Map<String, Long> distribuicaoPorUnidade;

    // Dados para gráficos
    private List<GraficoTimelineDto> timelineData;
}