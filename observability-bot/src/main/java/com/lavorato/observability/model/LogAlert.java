package com.lavorato.observability.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Representa um alerta de log crítico
 */
@Data
@Builder
public class LogAlert {
    private String type; //Tipo de alerta (Falha de Autenticação, Erro de DB, etc)
    private String level; //ERROR, WARN, INFO, DEBUG
    private String service; //Backend, Database, etc
    private LocalDateTime timestamp;
    private String message; // Mensagem completa da log
    private String logger; //Nome da logger
    private String exception; // Detalhes da exceção se houver
    private int count; //Números de ocorrências
}
