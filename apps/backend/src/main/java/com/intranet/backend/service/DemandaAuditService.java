package com.intranet.backend.service;

import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.DemandaAudit;
import com.intranet.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciar operações de auditoria de demandas
 */
public interface DemandaAuditService {

    /**
     * Registra a criação de uma nova demanda
     */
    void registrarCriacaoDemanda(Demanda demanda, User criadoPor);

    /**
     * Registra a atualização de uma demanda
     */
    void registrarAtualizacaoDemanda(Demanda demandaAntiga, Demanda demandaNova, User atualizadoPor);

    /**
     * Registra a alteração de status de uma demanda
     */
    void registrarAlteracaoStatus(Demanda demanda, String statusAntigo, String statusNovo, User alteradoPor);

    /**
     * Registra a reatribuição de uma demanda
     */
    void registrarReatribuicao(Demanda demanda, User usuarioAntigo, User usuarioNovo, User alteradoPor);

    /**
     * Obtém o histórico de alterações de uma demanda
     */
    List<DemandaAudit> getHistoricoAlteracoes(UUID demandaId);

    /**
     * Obtém o histórico de alterações de uma demanda paginado
     */
    Page<DemandaAudit> getHistoricoAlteracoesPaginado(UUID demandaId, Pageable pageable);

    /**
     * Obtém o histórico de alterações feitas por um usuário
     */
    List<DemandaAudit> getHistoricoAlteracoesPorUsuario(UUID usuarioId);

    /**
     * Obtém apenas o histórico de alterações de status de uma demanda
     */
    List<DemandaAudit> getHistoricoAlteracoesStatus(UUID demandaId);

    /**
     * Obtém apenas o histórico de reatribuições de uma demanda
     */
    List<DemandaAudit> getHistoricoReatribuicoes(UUID demandaId);
}