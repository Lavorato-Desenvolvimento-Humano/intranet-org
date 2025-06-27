package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.RelatorioCompartilhamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RelatorioService {

    /**
     * Gera relatório geral baseado nos filtros fornecidos
     */
    RelatorioGeralDto gerarRelatorioGeral(RelatorioFilterRequest filters);

    /**
     * Gera relatório específico de um usuário
     */
    RelatorioGeralDto gerarRelatorioUsuario(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim);

    /**
     * Gera relatório de mudanças de status por período
     */
    RelatorioGeralDto gerarRelatorioMudancasStatus(LocalDateTime dataInicio, LocalDateTime dataFim, UUID usuarioId);

    /**
     * Gera relatório de criações (novas guias/fichas) por usuário
     */
    RelatorioGeralDto gerarRelatorioCriacoes(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim);

    /**
     * Gera relatório de edições por usuário
     */
    RelatorioGeralDto gerarRelatorioEdicoes(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim);

    /**
     * Gera relatório comparativo entre usuários
     */
    RelatorioGeralDto gerarRelatorioComparativo(List<UUID> usuarioIds, LocalDateTime dataInicio, LocalDateTime dataFim);

    /**
     * Compartilha um relatório com outro usuário
     */
    RelatorioCompartilhamentoDto compartilharRelatorio(RelatorioCompartilhamentoCreateRequest request);

    /**
     * Responde a um compartilhamento de relatório (aceitar/rejeitar)
     */
    RelatorioCompartilhamentoDto responderCompartilhamento(UUID compartilhamentoId, RelatorioCompartilhamentoResponseRequest request);

    /**
     * Lista relatórios recebidos pelo usuário atual
     */
    Page<RelatorioCompartilhamentoDto> getRelatoriosRecebidos(Pageable pageable);

    /**
     * Lista relatórios enviados pelo usuário atual
     */
    Page<RelatorioCompartilhamentoDto> getRelatoriosEnviados(Pageable pageable);

    /**
     * Lista relatórios pendentes para o usuário atual (notificações)
     */
    List<RelatorioCompartilhamentoDto> getRelatoriosPendentes();

    /**
     * Obtém um compartilhamento específico
     */
    RelatorioCompartilhamentoDto getCompartilhamento(UUID compartilhamentoId);

    /**
     * Exclui um compartilhamento (apenas o remetente pode excluir)
     */
    void excluirCompartilhamento(UUID compartilhamentoId);

    /**
     * Gera estatísticas de relatórios
     */
    Map<String, Object> getEstatisticasRelatorios(LocalDateTime dataInicio, LocalDateTime dataFim);

    /**
     * Busca relatórios com filtros avançados (para admins)
     */
    Page<RelatorioCompartilhamentoDto> buscarCompartilhamentosComFiltros(
            UUID usuarioOrigemId, UUID usuarioDestinoId, RelatorioCompartilhamento.StatusCompartilhamento status,
            LocalDateTime dataInicio, LocalDateTime dataFim, Pageable pageable);

    /**
     * Conta relatórios pendentes para o usuário atual
     */
    long countRelatoriosPendentes();

    /**
     * Exporta relatório para JSON (para integração com frontend)
     */
    String exportarRelatorioJson(UUID relatorioId);

    /**
     * Valida se o usuário tem permissão para visualizar o relatório
     */
    boolean validarPermissaoVisualizacao(UUID compartilhamentoId, UUID usuarioId);
}