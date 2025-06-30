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
    private String statusGuia; // STATUS ESPECÍFICO DA GUIA

    // Informações da ficha
    private String codigoFicha;
    private UUID fichaId;
    private String statusFicha; // STATUS ESPECÍFICO DA FICHA
    private String tipoFicha; // COM_GUIA, ASSINATURA

    // Relacionamento Ficha-Guia - NOVO
    private String relacaoFichaGuia; // "Ficha F123456 vinculada à Guia G789012"
    private String identificadorCompleto; // "F123456 → G789012 - João Silva"

    // Informações gerais
    private String convenioNome;
    private UUID convenioId; // NOVO
    private String status; // Status atual (pode ser da guia ou ficha)
    private String especialidade;
    private String unidade;
    private Integer mes;
    private Integer ano;
    private Integer quantidadeAutorizada;
    private String usuarioResponsavelNome;
    private UUID usuarioResponsavelId; // NOVO
    private LocalDateTime dataAtualizacao;

    // Informações de mudança de status
    private String statusAnterior;
    private String statusNovo;
    private String motivoMudanca;
    private LocalDateTime dataMudancaStatus;

    private String descricaoCompleta; // "Paciente João Silva - Ficha F123456 - Guia G789012 - Cardiologia"
    private String vinculacaoInfo; // "Ficha de Cardiologia vinculada à Guia G789012"
}