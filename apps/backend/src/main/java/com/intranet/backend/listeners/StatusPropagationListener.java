package com.intranet.backend.listeners;

import com.intranet.backend.events.StatusChangeEvent;
import com.intranet.backend.model.Ficha;
import com.intranet.backend.model.StatusHistory;
import com.intranet.backend.repository.FichaRepository;
import com.intranet.backend.service.FichaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StatusPropagationListener {

    private static final Logger logger = LoggerFactory.getLogger(StatusPropagationListener.class);

    private final FichaRepository fichasRepository;
    private final FichaService fichaService;

    @EventListener
    @Async
    @Transactional
    public void handleGuiaStatusChange(StatusChangeEvent event) {
        if (event.getEntityType() == StatusHistory.EntityType.GUIA) {
            logger.info("Propagando status '{}' da Guia {} para suas fichas...",
                    event.getStatusNovo(), event.getEntityType());

            List<Ficha> fichas = fichasRepository.findByGuiaId(event.getEntityId());

            if (fichas.isEmpty()) {
                logger.info("Nenhuma ficha encontrada para a guia {}", event.getEntityId());
                return;
            }

            for (Ficha ficha : fichas) {
                if (!ficha.getStatus().equals(event.getStatusNovo())) {
                    try {
                        fichaService.updateFichaStatus(
                                ficha.getId(),
                                event.getStatusNovo(),
                                "Propagação automática: Status da guia alterado",
                                "Status atualizado automaticamente via alteração na Guia Pai"
                        );
                        logger.debug("Ficha {} atualizada com sucesso.", ficha.getCodigoFicha());
                    } catch (Exception e) {
                        logger.error("Erro ao propagar status para ficha {}: {}", ficha.getId(), e.getMessage());
                    }
                }
            }
        }
    }
}
