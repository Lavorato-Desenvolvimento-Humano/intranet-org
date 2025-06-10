package com.intranet.backend.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Enum que define os status possíveis para guias e fichas
 * Centraliza a validação e garante consistência em todo o sistema
 */
public enum StatusEnum {
    EMITIDO("EMITIDO", "Guia ou ficha foi emitida", 1),
    SUBIU("SUBIU", "Subiu para análise", 2),
    ANALISE("ANALISE", "Em processo de análise", 3),
    CANCELADO("CANCELADO", "Cancelado pelo sistema", 4),
    SAIU("SAIU", "Saiu da agenda", 5),
    RETORNOU("RETORNOU", "Retornou para a recepção", 6),
    NAO_USOU("NAO USOU", "Não foi utilizado", 7),
    ASSINADO("ASSINADO", "Foi assinado completamente pelo responsável", 8),
    FATURADO("FATURADO", "Processo de faturamento concluído", 9),
    ENVIADO_A_BM("ENVIADO A BM", "Enviado para BM", 10),
    DEVOLVIDO_BM("DEVOLVIDO BM", "Devolvido pela BM", 11),
    PERDIDA("PERDIDA", "Guia perdida", 12);

    private final String valor;
    private final String descricao;
    private final int ordem;

    StatusEnum(String valor, String descricao, int ordem) {
        this.valor = valor;
        this.descricao = descricao;
        this.ordem = ordem;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    public String getDescricao() {
        return descricao;
    }

    public int getOrdem() {
        return ordem;
    }

    /**
     * Converte string para enum, tratando casos especiais
     */
    public static StatusEnum fromString(String status) {
        if (status == null) {
            return null;
        }

        for (StatusEnum statusEnum : StatusEnum.values()) {
            if (statusEnum.getValor().equalsIgnoreCase(status.trim())) {
                return statusEnum;
            }
        }

        throw new IllegalArgumentException("Status inválido: " + status);
    }

    /**
     * Verifica se o status é válido
     */
    public static boolean isValid(String status) {
        try {
            fromString(status);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Retorna todos os status em ordem
     */
    public static StatusEnum[] getAllInOrder() {
        StatusEnum[] values = values();
        java.util.Arrays.sort(values, java.util.Comparator.comparingInt(StatusEnum::getOrdem));
        return values;
    }

    @Override
    public String toString() {
        return valor;
    }
}
