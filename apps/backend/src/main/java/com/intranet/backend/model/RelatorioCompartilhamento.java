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
@Table(name = "relatorio_compartilhamentos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class RelatorioCompartilhamento {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Lob
    @Column(name = "dados_relatorio", nullable = false)
    private String dadosRelatorio; // JSON com os dados do relatório

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origem", nullable = false)
    private User usuarioOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino", nullable = false)
    private User usuarioDestino;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusCompartilhamento status = StatusCompartilhamento.PENDENTE;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "observacao_resposta", columnDefinition = "TEXT")
    private String observacaoResposta;

    @Column(name = "data_compartilhamento", nullable = false)
    private LocalDateTime dataCompartilhamento;

    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum para status do compartilhamento
     */
    public enum StatusCompartilhamento {
        PENDENTE("Pendente"),
        CONFIRMADO("Confirmado"),
        REJEITADO("Rejeitado");

        private final String displayName;

        StatusCompartilhamento(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Método conveniente para criar um novo compartilhamento
     */
    public static RelatorioCompartilhamento create(String titulo, String dadosRelatorio,
                                                   User usuarioOrigem, User usuarioDestino,
                                                   String observacao) {
        RelatorioCompartilhamento compartilhamento = new RelatorioCompartilhamento();
        compartilhamento.setTitulo(titulo);
        compartilhamento.setDadosRelatorio(dadosRelatorio);
        compartilhamento.setUsuarioOrigem(usuarioOrigem);
        compartilhamento.setUsuarioDestino(usuarioDestino);
        compartilhamento.setObservacao(observacao);
        compartilhamento.setDataCompartilhamento(LocalDateTime.now());
        compartilhamento.setStatus(StatusCompartilhamento.PENDENTE);
        return compartilhamento;
    }

    /**
     * Método para confirmar o compartilhamento
     */
    public void confirmar(String observacaoResposta) {
        this.status = StatusCompartilhamento.CONFIRMADO;
        this.observacaoResposta = observacaoResposta;
        this.dataResposta = LocalDateTime.now();
    }

    /**
     * Método para rejeitar o compartilhamento
     */
    public void rejeitar(String observacaoResposta) {
        this.status = StatusCompartilhamento.REJEITADO;
        this.observacaoResposta = observacaoResposta;
        this.dataResposta = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RelatorioCompartilhamento that = (RelatorioCompartilhamento) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}