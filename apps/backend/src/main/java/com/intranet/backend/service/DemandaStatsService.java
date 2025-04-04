package com.intranet.backend.service;

import java.util.Map;
import java.util.UUID;

/**
 * Serviço para obter estatísticas relacionadas a demandas
 */
public interface DemandaStatsService {

    /**
     * Obtém estatísticas gerais para o dashboard
     */
    Map<String, Object> getEstatisticasGerais();

    /**
     * Obtém estatísticas para um usuário específico
     */
    Map<String, Object> getEstatisticasUsuario(UUID userId);

    /**
     * Obtém estatísticas para o usuário atual
     */
    Map<String, Object> getEstatisticasUsuarioAtual();

    /**
     * Obtém estatísticas para uma equipe
     */
    Map<String, Object> getEstatisticasEquipe(UUID equipeId);
}