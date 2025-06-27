package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.service.RelatorioService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private static final Logger logger = LoggerFactory.getLogger(RelatorioController.class);
    private final RelatorioService relatorioService;

    /**
     * Gera um novo relatório
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('relatorio:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<RelatorioDto> gerarRelatorio(@Valid @RequestBody RelatorioCreateRequest request) {
        logger.info("Requisição para gerar relatório: {}", request.getTitulo());

        RelatorioDto relatorio = relatorioService.gerarRelatorio(request);
        return ResponseUtil.created(relatorio);
    }

    /**
     * Busca relatório por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<RelatorioDto> getRelatorioById(@PathVariable UUID id) {
        logger.info("Requisição para buscar relatório: {}", id);

        RelatorioDto relatorio = relatorioService.getRelatorioById(id);
        return ResponseUtil.success(relatorio);
    }

    /**
     * Busca relatório por hash de compartilhamento
     */
    @GetMapping("/compartilhado/{hash}")
    public ResponseEntity<RelatorioDto> getRelatorioByHash(@PathVariable String hash) {
        logger.info("Requisição para buscar relatório compartilhado: {}", hash);

        RelatorioDto relatorio = relatorioService.getRelatorioByHash(hash);
        return ResponseUtil.success(relatorio);
    }

    /**
     * Lista relatórios do usuário atual
     */
    @GetMapping("/meus")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Page<RelatorioSummaryDto>> getMeusRelatorios(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar meus relatórios");

        Page<RelatorioSummaryDto> relatorios = relatorioService.getMeusRelatorios(pageable);
        return ResponseUtil.success(relatorios);
    }

    /**
     * Lista todos os relatórios (apenas admins/supervisores)
     */
    @GetMapping("/todos")
    @PreAuthorize("hasAnyAuthority('relatorio:view_all') or hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Page<RelatorioSummaryDto>> getAllRelatorios(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar todos os relatórios");

        Page<RelatorioSummaryDto> relatorios = relatorioService.getAllRelatorios(pageable);
        return ResponseUtil.success(relatorios);
    }

    /**
     * Busca relatórios com filtros
     */
    @GetMapping("/buscar")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Page<RelatorioSummaryDto>> buscarRelatorios(
            RelatorioFilterRequest filter,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar relatórios com filtros");

        Page<RelatorioSummaryDto> relatorios = relatorioService.getRelatoriosComFiltros(filter, pageable);
        return ResponseUtil.success(relatorios);
    }

    /**
     * Obtém dados completos do relatório
     */
    @GetMapping("/{id}/dados")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<RelatorioDataDto> getDadosRelatorio(@PathVariable UUID id) {
        logger.info("Requisição para obter dados do relatório: {}", id);

        RelatorioDataDto dados = relatorioService.getDadosRelatorio(id);
        return ResponseUtil.success(dados);
    }

    /**
     * Compartilha relatório com outro usuário
     */
    @PostMapping("/{id}/compartilhar")
    @PreAuthorize("hasAnyAuthority('relatorio:share') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<RelatorioCompartilhamentoDto> compartilharRelatorio(
            @PathVariable UUID id,
            @Valid @RequestBody RelatorioCompartilhamentoRequest request) {
        logger.info("Requisição para compartilhar relatório {} com usuário {}", id, request.getUsuarioDestinoId());

        RelatorioCompartilhamentoDto compartilhamento = relatorioService.compartilharRelatorio(id, request);
        return ResponseUtil.created(compartilhamento);
    }

    /**
     * Lista compartilhamentos recebidos
     */
    @GetMapping("/compartilhamentos/recebidos")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Page<RelatorioCompartilhamentoDto>> getCompartilhamentosRecebidos(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar compartilhamentos recebidos");

        Page<RelatorioCompartilhamentoDto> compartilhamentos = relatorioService.getCompartilhamentosRecebidos(pageable);
        return ResponseUtil.success(compartilhamentos);
    }

    /**
     * Lista compartilhamentos enviados
     */
    @GetMapping("/compartilhamentos/enviados")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Page<RelatorioCompartilhamentoDto>> getCompartilhamentosEnviados(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar compartilhamentos enviados");

        Page<RelatorioCompartilhamentoDto> compartilhamentos = relatorioService.getCompartilhamentosEnviados(pageable);
        return ResponseUtil.success(compartilhamentos);
    }

    /**
     * Marca compartilhamento como visualizado
     */
    @PutMapping("/compartilhamentos/{id}/visualizar")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> marcarCompartilhamentoComoVisualizado(@PathVariable UUID id) {
        logger.info("Requisição para marcar compartilhamento como visualizado: {}", id);

        relatorioService.marcarCompartilhamentoComoVisualizado(id);
        return ResponseUtil.noContent();
    }

    /**
     * Conta compartilhamentos não visualizados
     */
    @GetMapping("/compartilhamentos/nao-visualizados/count")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Long>> countCompartilhamentosNaoVisualizados() {
        logger.info("Requisição para contar compartilhamentos não visualizados");

        long count = relatorioService.countCompartilhamentosNaoVisualizados();
        return ResponseUtil.success(Map.of("count", count));
    }

    /**
     * Exclui relatório
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('relatorio:delete') or hasAnyRole('ADMIN')")
    public ResponseEntity<Void> excluirRelatorio(@PathVariable UUID id) {
        logger.info("Requisição para excluir relatório: {}", id);

        relatorioService.excluirRelatorio(id);
        return ResponseUtil.noContent();
    }

    /**
     * Baixa relatório em PDF
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyAuthority('relatorio:download') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<byte[]> baixarRelatorioPDF(@PathVariable UUID id) {
        logger.info("Requisição para baixar PDF do relatório: {}", id);

        byte[] pdfBytes = relatorioService.gerarRelatorioPDF(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "relatorio-" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Baixa relatório em PDF via hash de compartilhamento
     */
    @GetMapping("/compartilhado/{hash}/pdf")
    public ResponseEntity<byte[]> baixarRelatorioPDFByHash(@PathVariable String hash) {
        logger.info("Requisição para baixar PDF do relatório compartilhado: {}", hash);

        byte[] pdfBytes = relatorioService.gerarRelatorioPDFByHash(hash);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "relatorio-compartilhado-" + hash + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Obtém estatísticas de relatórios
     */
    @GetMapping("/estatisticas")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getEstatisticasRelatorios() {
        logger.info("Requisição para obter estatísticas de relatórios");

        Map<String, Object> estatisticas = relatorioService.getEstatisticasRelatorios();
        return ResponseUtil.success(estatisticas);
    }

    /**
     * Reprocessa um relatório
     */
    @PostMapping("/{id}/reprocessar")
    @PreAuthorize("hasAnyAuthority('relatorio:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<RelatorioDto> reprocessarRelatorio(@PathVariable UUID id) {
        logger.info("Requisição para reprocessar relatório: {}", id);

        RelatorioDto relatorio = relatorioService.reprocessarRelatorio(id);
        return ResponseUtil.success(relatorio);
    }

    /**
     * Lista logs de um relatório
     */
    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<RelatorioLogDto>> getLogsRelatorio(@PathVariable UUID id) {
        logger.info("Requisição para obter logs do relatório: {}", id);

        List<RelatorioLogDto> logs = relatorioService.getLogsRelatorio(id);
        return ResponseUtil.success(logs);
    }

    /**
     * Endpoint para preview dos dados do relatório antes de gerar
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyAuthority('relatorio:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> previewRelatorio(@Valid @RequestBody RelatorioCreateRequest request) {
        logger.info("Requisição para preview do relatório: {}", request.getTitulo());

        // Criar um relatório temporário para preview (sem salvar)
        try {
            // Aqui implementaríamos uma versão simplificada do processamento
            // que retorna apenas estatísticas básicas sem salvar o relatório
            Map<String, Object> preview = Map.of(
                    "estimativaRegistros", 0, // Calcular baseado nos filtros
                    "periodoValido", request.getPeriodoInicio().isBefore(request.getPeriodoFim()),
                    "filtrosAplicados", request
            );

            return ResponseUtil.success(preview);
        } catch (Exception e) {
            logger.error("Erro ao gerar preview: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("erro", "Erro ao gerar preview: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obter opções de filtros disponíveis
     */
    @GetMapping("/filtros/opcoes")
    @PreAuthorize("hasAnyAuthority('relatorio:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getOpcoesFiltrosa() {
        logger.info("Requisição para obter opções de filtros");

        // Retornar opções disponíveis para os filtros
        Map<String, Object> opcoes = Map.of(
                "status", List.of("PENDENTE", "EM_ANALISE", "APROVADO", "REJEITADO", "CANCELADO"),
                "unidades", List.of("KIDS", "SENIOR"),
                "tiposEntidade", List.of("GUIA", "FICHA", "PACIENTE", "TODOS")
        );

        return ResponseUtil.success(opcoes);
    }
}