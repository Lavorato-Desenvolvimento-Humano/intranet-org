package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para auditoria de alterações em demandas
 */
@Entity
@Table(name = "demandas_audit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DemandaAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "demanda_id", nullable = false)
    private UUID demandaId;

    @Column(name = "campo_alterado", nullable = false)
    private String campoAlterado;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_novo", columnDefinition = "TEXT")
    private String valorNovo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por", nullable = false)
    private User alteradoPor;

    @CreatedDate
    @Column(name = "data_alteracao", nullable = false, updatable = false)
    private LocalDateTime dataAlteracao;

    /**
     * Tipo de operação realizada
     */
    @Column(name = "operacao", nullable = false, length = 20)
    private String operacao;

    /**
     * Enum para os possíveis tipos de operação
     */
    public enum Operacao {
        CRIACAO("criacao"),
        ATUALIZACAO("atualizacao"),
        ATRIBUICAO("atribuicao"),
        MUDANCA_STATUS("mudanca_status");

        private final String valor;

        Operacao(String valor) {
            this.valor = valor;
        }

        public String getValor() {
            return valor;
        }

        public static Operacao fromValor(String valor) {
            for (Operacao op : Operacao.values()) {
                if (op.getValor().equals(valor)) {
                    return op;
                }
            }
            throw new IllegalArgumentException("Operação inválida: " + valor);
        }
    }
}