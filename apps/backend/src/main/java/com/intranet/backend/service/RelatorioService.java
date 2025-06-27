package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RelatorioService {

    /**
     * Gera um novo relatório baseado nos filtros fornecidos
     */
    RelatorioDto gerarRelatorio(RelatorioCreateRequest request);

    /**
     * Busca relatório por ID
     */
    RelatorioDto getRelatorioById(UUID id);

    /**
     * Busca relatório por hash de compartilhamento
     */
    RelatorioDto getRelatorioByHash(String hash);

    /**
     * Lista relatórios do usuário atual
     */
    Page<RelatorioSummaryDto> getMeusRelatorios(Pageable pageable);

    /**
     * Lista todos os relatórios (apenas para admins/supervisores)
     */
    Page<RelatorioSummaryDto> getAllRelatorios(Pageable pageable);

    /**
     * Busca relatórios com filtros
     */
    Page<RelatorioSummaryDto> getRelatoriosComFiltros(RelatorioFilterRequest filter, Pageable pageable);

    /**
     * Obtém os dados completos de um relatório para visualização/exportação
     */
    RelatorioDataDto getDadosRelatorio(UUID relatorioId);

    /**
     * Compartilha um relatório com outro usuário
     */
    RelatorioCompartilhamentoDto compartilharRelatorio(UUID relatorioId, RelatorioCompartilhamentoRequest request);

    /**
     * Lista compartilhamentos recebidos pelo usuário atual
     */
    Page<RelatorioCompartilhamentoDto> getCompartilhamentosRecebidos(Pageable pageable);

    /**
     * Lista compartilhamentos enviados pelo usuário atual
     */
    Page<RelatorioCompartilhamentoDto> getCompartilhamentosEnviados(Pageable pageable);

    /**
     * Marca um compartilhamento como visualizado
     */
    void marcarCompartilhamentoComoVisualizado(UUID compartilhamentoId);

    /**
     * Conta compartilhamentos não visualizados do usuário atual
     */
    long countCompartilhamentosNaoVisualizados();

    /**
     * Exclui um relatório (apenas o próprio usuário ou admin)
     */
    void excluirRelatorio(UUID relatorioId);

    /**
     * Gera PDF do relatório
     */
    byte[] gerarRelatorioPDF(UUID relatorioId);

    /**
     * Gera PDF do relatório via hash de compartilhamento
     */
    byte[] gerarRelatorioPDFByHash(String hash);

    /**
     * Obtém estatísticas de relatórios do usuário
     */
    Map<String, Object> getEstatisticasRelatorios();

    /**
     * Reprocessa um relatório (caso tenha falhado)
     */
    RelatorioDto reprocessarRelatorio(UUID relatorioId);

    /**
     * Lista logs de um relatório específico
     */
    List<RelatorioLogDto> getLogsRelatorio(UUID relatorioId);
}
