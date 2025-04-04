package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "demandas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Demanda {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "titulo", nullable = false, length = 100)
    private String titulo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data_inicio")
    private LocalDateTime dataInicio;

    @Column(name = "data_fim")
    private LocalDateTime dataFim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por", nullable = false)
    private User criadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atribuido_para", nullable = false)
    private User atribuidoPara;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "pendente";

    @Column(name = "prioridade", nullable = false, length = 30)
    private String prioridade = "media";

    @CreatedDate
    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @LastModifiedDate
    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    // Enum para os possíveis valores de status
    public enum Status {
        PENDENTE("pendente"),
        EM_ANDAMENTO("em_andamento"),
        CONCLUIDA("concluida"),
        CANCELADA("cancelada");

        private final String valor;

        Status(String valor) {
            this.valor = valor;
        }

        public String getValor() {
            return valor;
        }

        public static Status fromValor(String valor) {
            for (Status s : Status.values()) {
                if (s.getValor().equals(valor)) {
                    return s;
                }
            }
            throw new IllegalArgumentException("Status inválido: " + valor);
        }
    }

    // Enum para os possíveis valores de prioridade
    public enum Prioridade {
        BAIXA("baixa"),
        MEDIA("media"),
        ALTA("alta"),
        URGENTE("urgente");

        private final String valor;

        Prioridade(String valor) {
            this.valor = valor;
        }

        public String getValor() {
            return valor;
        }

        public static Prioridade fromValor(String valor) {
            for (Prioridade p : Prioridade.values()) {
                if (p.getValor().equals(valor)) {
                    return p;
                }
            }
            throw new IllegalArgumentException("Prioridade inválida: " + valor);
        }
    }
}