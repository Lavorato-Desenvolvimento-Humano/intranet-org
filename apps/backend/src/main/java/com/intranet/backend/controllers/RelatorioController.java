package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.RelatorioCompartilhamento;
import com.intranet.backend.service.RelatorioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private static final Logger logger = LoggerFactory.getLogger(RelatorioController.class);
    private final RelatorioService relatorioService;

    @PostMapping("/gerar")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioGeral(
            @Valid @RequestBody RelatorioFilterRequest filters) {
        logger.info("Requisição para gerar relatório geral com filtros: {}", filters);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioGeral(filters);

        logger.info("Relatório gerado com sucesso. Total de itens: {}", relatorio.getItens().size());
        return ResponseEntity.ok(relatorio);
    }

    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN') or #usuarioId == authentication.principal.id")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioUsuario(
            @PathVariable UUID usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {

        logger.info("Requisição para gerar relatório do usuário {} no período {} a {}", usuarioId, dataInicio, dataFim);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioUsuario(usuarioId, dataInicio, dataFim);

        logger.info("Relatório do usuário gerado com sucesso. Total de itens: {}", relatorio.getItens().size());
        return ResponseEntity.ok(relatorio);
    }

    @GetMapping("/mudancas-status")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioMudancasStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
            @RequestParam(required = false) UUID usuarioId) {

        logger.info("Requisição para gerar relatório de mudanças de status. Período: {} a {}, Usuário: {}",
                dataInicio, dataFim, usuarioId);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioMudancasStatus(dataInicio, dataFim, usuarioId);

        return ResponseEntity.ok(relatorio);
    }

    @GetMapping("/criacoes")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioCriacoes(
            @RequestParam UUID usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {

        logger.info("Requisição para gerar relatório de criações do usuário {} no período {} a {}",
                usuarioId, dataInicio, dataFim);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioCriacoes(usuarioId, dataInicio, dataFim);

        return ResponseEntity.ok(relatorio);
    }

    @GetMapping("/edicoes")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioEdicoes(
            @RequestParam UUID usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {

        logger.info("Requisição para gerar relatório de edições do usuário {} no período {} a {}",
                usuarioId, dataInicio, dataFim);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioEdicoes(usuarioId, dataInicio, dataFim);

        return ResponseEntity.ok(relatorio);
    }

    @PostMapping("/comparativo")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN')")
    public ResponseEntity<RelatorioGeralDto> gerarRelatorioComparativo(
            @RequestBody List<UUID> usuarioIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {

        logger.info("Requisição para gerar relatório comparativo entre {} usuários no período {} a {}",
                usuarioIds.size(), dataInicio, dataFim);

        RelatorioGeralDto relatorio = relatorioService.gerarRelatorioComparativo(usuarioIds, dataInicio, dataFim);

        return ResponseEntity.ok(relatorio);
    }

    // === ENDPOINTS DE COMPARTILHAMENTO ===

    @PostMapping("/compartilhar")
    @PreAuthorize("hasAnyAuthority('relatorio:share') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> compartilharRelatorio(
            @Valid @RequestBody RelatorioCompartilhamentoCreateRequest request) {

        logger.info("Requisição para compartilhar relatório: {}", request.getTitulo());

        RelatorioCompartilhamentoDto compartilhamento = relatorioService.compartilharRelatorio(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Relatório compartilhado com sucesso");
        response.put("compartilhamento", compartilhamento);

        logger.info("Relatório compartilhado com sucesso. ID: {}", compartilhamento.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/compartilhamentos/{compartilhamentoId}/responder")
    @PreAuthorize("hasAnyAuthority('relatorio:respond') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> responderCompartilhamento(
            @PathVariable UUID compartilhamentoId,
            @Valid @RequestBody RelatorioCompartilhamentoResponseRequest request) {

        logger.info("Requisição para responder compartilhamento {} com status {}",
                compartilhamentoId, request.getStatus());

        RelatorioCompartilhamentoDto compartilhamento = relatorioService.responderCompartilhamento(
                compartilhamentoId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Resposta registrada com sucesso");
        response.put("compartilhamento", compartilhamento);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/compartilhamentos/recebidos")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<RelatorioCompartilhamentoDto>> getRelatoriosRecebidos(
            @PageableDefault(size = 20) Pageable pageable) {

        logger.info("Requisição para listar relatórios recebidos - página: {}, tamanho: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<RelatorioCompartilhamentoDto> relatorios = relatorioService.getRelatoriosRecebidos(pageable);

        return ResponseEntity.ok(relatorios);
    }

    @GetMapping("/compartilhamentos/enviados")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<RelatorioCompartilhamentoDto>> getRelatoriosEnviados(
            @PageableDefault(size = 20) Pageable pageable) {

        logger.info("Requisição para listar relatórios enviados - página: {}, tamanho: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<RelatorioCompartilhamentoDto> relatorios = relatorioService.getRelatoriosEnviados(pageable);

        return ResponseEntity.ok(relatorios);
    }

    @GetMapping("/compartilhamentos/pendentes")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<RelatorioCompartilhamentoDto>> getRelatoriosPendentes() {

        logger.info("Requisição para listar relatórios pendentes");

        List<RelatorioCompartilhamentoDto> pendentes = relatorioService.getRelatoriosPendentes();

        return ResponseEntity.ok(pendentes);
    }

    @GetMapping("/compartilhamentos/pendentes/count")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> countRelatoriosPendentes() {

        long count = relatorioService.countRelatoriosPendentes();

        Map<String, Object> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/compartilhamentos/{compartilhamentoId}")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<RelatorioCompartilhamentoDto> getCompartilhamento(
            @PathVariable UUID compartilhamentoId) {

        logger.info("Requisição para obter compartilhamento ID: {}", compartilhamentoId);

        RelatorioCompartilhamentoDto compartilhamento = relatorioService.getCompartilhamento(compartilhamentoId);

        return ResponseEntity.ok(compartilhamento);
    }

    @DeleteMapping("/compartilhamentos/{compartilhamentoId}")
    @PreAuthorize("hasAnyAuthority('relatorio:delete') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> excluirCompartilhamento(
            @PathVariable UUID compartilhamentoId) {

        logger.info("Requisição para excluir compartilhamento ID: {}", compartilhamentoId);

        relatorioService.excluirCompartilhamento(compartilhamentoId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Compartilhamento excluído com sucesso");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/compartilhamentos/{compartilhamentoId}/exportar")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<String> exportarRelatorioJson(
            @PathVariable UUID compartilhamentoId) {

        logger.info("Requisição para exportar relatório ID: {}", compartilhamentoId);

        String json = relatorioService.exportarRelatorioJson(compartilhamentoId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Content-Disposition", "attachment; filename=relatorio_" + compartilhamentoId + ".json")
                .body(json);
    }

    // === ENDPOINTS ADMINISTRATIVOS ===

    @GetMapping("/estatisticas")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> getEstatisticasRelatorios(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {

        logger.info("Requisição para obter estatísticas de relatórios no período {} a {}", dataInicio, dataFim);

        Map<String, Object> estatisticas = relatorioService.getEstatisticasRelatorios(dataInicio, dataFim);

        return ResponseEntity.ok(estatisticas);
    }

    @GetMapping("/admin/compartilhamentos")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Page<RelatorioCompartilhamentoDto>> buscarCompartilhamentosComFiltros(
            @RequestParam(required = false) UUID usuarioOrigemId,
            @RequestParam(required = false) UUID usuarioDestinoId,
            @RequestParam(required = false) RelatorioCompartilhamento.StatusCompartilhamento status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
            @PageableDefault(size = 20) Pageable pageable) {

        logger.info("Requisição administrativa para buscar compartilhamentos com filtros");

        Page<RelatorioCompartilhamentoDto> compartilhamentos = relatorioService.buscarCompartilhamentosComFiltros(
                usuarioOrigemId, usuarioDestinoId, status, dataInicio, dataFim, pageable);

        return ResponseEntity.ok(compartilhamentos);
    }

    // === ENDPOINT DE VALIDAÇÃO ===

    @GetMapping("/compartilhamentos/{compartilhamentoId}/validar-permissao")
    @PreAuthorize("hasAnyAuthority('relatorio:read') or hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> validarPermissaoVisualizacao(
            @PathVariable UUID compartilhamentoId) {

        // Obter usuário atual através do serviço (que já faz a validação)
        try {
            relatorioService.getCompartilhamento(compartilhamentoId);

            Map<String, Object> response = new HashMap<>();
            response.put("temPermissao", true);
            response.put("message", "Usuário tem permissão para visualizar este relatório");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("temPermissao", false);
            response.put("message", "Usuário não tem permissão para visualizar este relatório");

            return ResponseEntity.ok(response);
        }
    }

    // === TRATAMENTO DE ERROS ===

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        logger.error("Erro no controller de relatórios: {}", e.getMessage(), e);

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Erro interno do servidor");
        response.put("error", e.getMessage());

        return ResponseEntity.internalServerError().body(response);
    }
}