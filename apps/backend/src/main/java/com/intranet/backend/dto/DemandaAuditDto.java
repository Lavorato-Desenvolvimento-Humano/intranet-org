package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para representar uma entrada de auditoria de demanda
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandaAuditDto {
    private UUID id;
    private UUID demandaId;
    private String campoAlterado;
    private String valorAnterior;
    private String valorNovo;
    private UUID alteradoPorId;
    private String alteradoPorNome;
    private LocalDateTime dataAlteracao;
    private String operacao;
    private String descricaoOperacao;

    /**
     * Obtém uma descrição textual da operação para exibição
     */
    public static String getDescricaoOperacao(String operacao) {
        switch (operacao) {
            case "criacao":
                return "Criação da demanda";
            case "atualizacao":
                return "Atualização da demanda";
            case "atribuicao":
                return "Reatribuição da demanda";
            case "mudanca_status":
                return "Alteração de status";
            default:
                return "Operação desconhecida";
        }
    }
}