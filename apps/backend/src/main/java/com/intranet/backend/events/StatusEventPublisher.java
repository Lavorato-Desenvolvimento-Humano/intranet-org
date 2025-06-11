package com.intranet.backend.events;

import com.intranet.backend.model.StatusHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Componente responsável por publicar eventos de mudança de status
 * Centraliza a lógica de publicação de eventos
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StatusEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * Publica evento de mudança de status para guia
     */
    public void publishGuiaStatusChange(UUID guiaId, String statusAnterior, String statusNovo,
                                        String motivo, String observacoes, UUID alteradoPorId) {
        log.debug("Publicando evento de mudança de status para guia ID: {} - {} -> {}",
                guiaId, statusAnterior, statusNovo);

        StatusChangeEvent event = new StatusChangeEvent(
                this,
                StatusHistory.EntityType.GUIA,
                guiaId,
                statusAnterior,
                statusNovo,
                motivo,
                observacoes,
                alteradoPorId
        );

        eventPublisher.publishEvent(event);
        log.debug("Evento publicado com sucesso: {}", event);
    }

    /**
     * Publica evento de mudança de status para ficha
     */
    public void publishFichaStatusChange(UUID fichaId, String statusAnterior, String statusNovo,
                                         String motivo, String observacoes, UUID alteradoPorId) {
        log.debug("Publicando evento de mudança de status para ficha ID: {} - {} -> {}",
                fichaId, statusAnterior, statusNovo);

        StatusChangeEvent event = new StatusChangeEvent(
                this,
                StatusHistory.EntityType.FICHA,
                fichaId,
                statusAnterior,
                statusNovo,
                motivo,
                observacoes,
                alteradoPorId
        );

        eventPublisher.publishEvent(event);
        log.debug("Evento publicado com sucesso: {}", event);
    }

    /**
     * Publica evento genérico de mudança de status
     */
    public void publishStatusChange(StatusHistory.EntityType entityType, UUID entityId,
                                    String statusAnterior, String statusNovo, String motivo,
                                    String observacoes, UUID alteradoPorId) {
        log.debug("Publicando evento de mudança de status para {} ID: {} - {} -> {}",
                entityType, entityId, statusAnterior, statusNovo);

        StatusChangeEvent event = new StatusChangeEvent(
                this,
                entityType,
                entityId,
                statusAnterior,
                statusNovo,
                motivo,
                observacoes,
                alteradoPorId
        );

        eventPublisher.publishEvent(event);
        log.debug("Evento publicado com sucesso: {}", event);
    }
}
