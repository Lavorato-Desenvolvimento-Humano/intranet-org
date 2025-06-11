package com.intranet.backend.events;

import com.intranet.backend.model.StatusHistory;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Evento disparado quando há mudança de status em guias ou fichas
 * Permite desacoplamento entre os serviços
 */
@Getter
public class StatusChangeEvent extends ApplicationEvent {

    private final StatusHistory.EntityType entityType;
    private final UUID entityId;
    private final String statusAnterior;
    private final String statusNovo;
    private final String motivo;
    private final String observacoes;
    private final UUID alteradoPorId;
    private final LocalDateTime eventTimestamp;

    public StatusChangeEvent(Object source, StatusHistory.EntityType entityType, UUID entityId,
                             String statusAnterior, String statusNovo, String motivo, String observacoes,
                             UUID alteradoPorId) {
        super(source);
        this.entityType = entityType;
        this.entityId = entityId;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.motivo = motivo;
        this.observacoes = observacoes;
        this.alteradoPorId = alteradoPorId;
        this.eventTimestamp = LocalDateTime.now();
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    @Override
    public String toString() {
        return String.format("StatusChangeEvent{entityType=%s, entityId=%s, statusAnterior='%s', statusNovo='%s', eventTimestamp=%s}",
                entityType, entityId, statusAnterior, statusNovo, eventTimestamp);
    }
}