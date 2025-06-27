package com.intranet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioGeralDto {
    private RelatorioMetadataDto metadata;
    private List<RelatorioItemDto> itens;
    private RelatorioTotalizacaoDto totalizacao;
    private Map<String, Object> agrupamentos;
}