package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RelatorioItemDto {

    // Identificação
    private String tipoEntidade; // GUIA, FICHA, PACIENTE
    private UUID entidadeId;

    // Informações do paciente
    private String pacienteNome;
    private UUID pacienteId;

    // Informações da guia
    private String numeroGuia;
    private UUID guiaId;

    // Informações da ficha
    private String codigoFicha;
    private UUID fichaId;

    // Informações gerais
    private String convenioNome;
    private String status;
    private String especialidade;
    private String unidade;
    private Integer mes;
    private Integer ano;
    private Integer quantidadeAutorizada;
    private String usuarioResponsavelNome;
    private LocalDateTime dataAtualizacao;

    // Informações de mudança de status
    private String statusAnterior;
    private String statusNovo;
    private String motivoMudanca;
    private LocalDateTime dataMudancaStatus;
}
