package com.intranet.backend.dto;

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

    // Método helper para obter número/código unificado
    public String getNumeroOuCodigo() {
        if ("GUIA".equals(tipoEntidade) && numeroGuia != null) {
            return numeroGuia;
        } else if ("FICHA".equals(tipoEntidade) && codigoFicha != null) {
            return codigoFicha;
        }
        return "-";
    }

    private String status;
    private String especialidade;
    private Integer mes;
    private Integer ano;

    // Método helper para obter mês formatado
    public String getMesFormatado() {
        if (mes != null && ano != null) {
            return String.format("%02d/%d", mes, ano);
        }
        return "-";
    }

    private Integer quantidadeAutorizada;

    // Método helper para quantidade formatada
    public String getQuantidadeFormatada() {
        if (quantidadeAutorizada != null) {
            return quantidadeAutorizada.toString();
        }
        return "-";
    }

    private LocalDateTime dataAtualizacao;

    // Outros campos auxiliares
    private String unidade;
    private String usuarioResponsavelNome;

    // Campos para histórico de mudanças
    private String statusAnterior;
    private String statusNovo;
    private String motivoMudanca;
    private LocalDateTime dataMudancaStatus;
}