package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "relatorios_logs")
public class RelatorioLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatorio_id", nullable = false)
    private Relatorio relatorio;

    @Column(nullable = false, length = 50)
    private String acao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private User usuario;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalhes", columnDefinition = "jsonb")
    private String detalhes;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Factory methods para diferentes tipos de log
    public static RelatorioLog gerado(Relatorio relatorio, User usuario, String ipAddress) {
        RelatorioLog log = new RelatorioLog();
        log.setRelatorio(relatorio);
        log.setAcao("GERADO");
        log.setUsuario(usuario);
        log.setIpAddress(ipAddress);
        return log;
    }

    public static RelatorioLog compartilhado(Relatorio relatorio, User usuarioOrigem, User usuarioDestino, String ipAddress) {
        RelatorioLog log = new RelatorioLog();
        log.setRelatorio(relatorio);
        log.setAcao("COMPARTILHADO");
        log.setUsuario(usuarioOrigem);
        log.setIpAddress(ipAddress);
        // Aqui você precisará serializar o Map para String JSON
        log.setDetalhes("{\"usuarioDestinoId\":\"" + usuarioDestino.getId() + "\",\"usuarioDestinoNome\":\"" + usuarioDestino.getFullName() + "\"}");
        return log;
    }

    public static RelatorioLog visualizado(Relatorio relatorio, User usuario, String ipAddress) {
        RelatorioLog log = new RelatorioLog();
        log.setRelatorio(relatorio);
        log.setAcao("VISUALIZADO");
        log.setUsuario(usuario);
        log.setIpAddress(ipAddress);
        return log;
    }

    public static RelatorioLog download(Relatorio relatorio, User usuario, String ipAddress) {
        RelatorioLog log = new RelatorioLog();
        log.setRelatorio(relatorio);
        log.setAcao("DOWNLOAD");
        log.setUsuario(usuario);
        log.setIpAddress(ipAddress);
        return log;
    }
}