package com.intranet.backend.service;

import com.intranet.backend.dto.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DemandaService {

    /**
     * Obtém todas as demandas visíveis para o usuário atual
     */
    List<DemandaDto> getAllDemandas();

    /**
     * Obtém uma demanda pelo ID
     */
    DemandaDto getDemandaById(UUID id);

    /**
     * Cria uma nova demanda
     */
    DemandaDto createDemanda(DemandaCreateDto demandaCreateDto);

    /**
     * Atualiza uma demanda existente
     */
    DemandaDto updateDemanda(UUID id, DemandaUpdateDto demandaUpdateDto);

    /**
     * Exclui uma demanda
     */
    void deleteDemanda(UUID id);

    /**
     * Obtém as demandas atribuídas ao usuário atual
     */
    List<DemandaDto> getMinhasDemandas();

    /**
     * Obtém as demandas criadas pelo usuário atual
     */
    List<DemandaDto> getDemandasCriadasPorMim();

    /**
     * Obtém as demandas com base nos filtros
     */
    List<DemandaDto> getDemandasFiltradas(DemandaFilterDto filtros);

    /**
     * Obtém as demandas de uma equipe
     */
    List<DemandaDto> getDemandasByEquipeId(UUID equipeId);

    /**
     * Obtém as demandas dentro de um período (para agenda)
     */
    List<DemandaDto> getDemandasByPeriodo(LocalDateTime inicio, LocalDateTime fim);

    /**
     * Altera o status de uma demanda
     */
    DemandaDto alterarStatus(UUID id, String novoStatus);

    /**
     * Atribui uma demanda a outro usuário
     */
    DemandaDto atribuirDemanda(UUID demandaId, UUID usuarioId);
}