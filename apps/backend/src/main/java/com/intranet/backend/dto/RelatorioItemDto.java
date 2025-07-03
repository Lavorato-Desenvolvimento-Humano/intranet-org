package com.intranet.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RelatorioItemDto {

    private String tipoEntidade; // GUIA, FICHA
    private UUID entidadeId;
    private String pacienteNome;
    private UUID pacienteId;
    private String convenioNome;
    private String numeroGuia;
    private UUID guiaId;
    private String codigoFicha;
    private UUID fichaId;
    private String status;
    private String especialidade;
    private Integer mes;
    private Integer ano;
    private Integer quantidadeAutorizada;
    private LocalDateTime dataAtualizacao;
    private String unidade;
    private String usuarioResponsavelNome;
    private String statusAnterior;
    private String statusNovo;
    private String motivoMudanca;
    private LocalDateTime dataMudancaStatus;
}