package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.service.FichaPdfService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/fichas-pdf")
@RequiredArgsConstructor
public class FichaPdfController {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfController.class);
    private final FichaPdfService fichaPdfService;

    /**
     * Gera fichas PDF para um paciente específico
     */
    @PostMapping("/paciente")
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<FichaPdfResponseDto> gerarFichasPaciente(@Valid @RequestBody FichaPdfPacienteRequest request) {
        logger.info("Requisição para gerar fichas do paciente: {}", request.getPacienteId());

        FichaPdfResponseDto response = fichaPdfService.gerarFichasPaciente(request);
        return ResponseUtil.created(response);
    }

    /**
     * Gera fichas PDF para um convênio específico (assíncrono)
     */
    @PostMapping("/convenio")
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<CompletableFuture<FichaPdfResponseDto>> gerarFichasConvenio(@Valid @RequestBody FichaPdfConvenioRequest request) {
        logger.info("Requisição para gerar fichas do convênio: {}", request.getConvenioId());

        CompletableFuture<FichaPdfResponseDto> response = fichaPdfService.gerarFichasConvenio(request);
        return ResponseUtil.accepted(response);
    }

    /**
     * Gera fichas PDF para múltiplos convênios (batch assíncrono)
     */
    @PostMapping("/lote")
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<CompletableFuture<FichaPdfResponseDto>> gerarFichasLote(@Valid @RequestBody FichaPdfLoteRequest request) {
        logger.info("Requisição para gerar fichas em lote para {} convênios", request.getConvenioIds().size());

        CompletableFuture<FichaPdfResponseDto> response = fichaPdfService.gerarFichasLote(request);
        return ResponseUtil.accepted(response);
    }

    /**
     * Consulta status de uma geração assíncrona
     */
    @GetMapping("/status/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<FichaPdfStatusDto> getStatusGeracao(@PathVariable String jobId) {
        logger.info("Requisição para status do job: {}", jobId);

        FichaPdfStatusDto status = fichaPdfService.getStatusGeracao(jobId);
        return ResponseUtil.success(status);
    }

    /**
     * Lista jobs de geração do usuário atual
     */
    @GetMapping("/meus-jobs")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<FichaPdfJobDto>> getMeusJobs() {
        logger.info("Requisição para listar meus jobs de fichas PDF");

        List<FichaPdfJobDto> jobs = fichaPdfService.getJobsUsuario();
        return ResponseUtil.success(jobs);
    }

    /**
     * Baixa PDF gerado
     */
    @GetMapping("/download/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:download') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<byte[]> baixarPdfGerado(@PathVariable String jobId) {
        logger.info("Requisição para baixar PDF do job: {}", jobId);

        byte[] pdfBytes = fichaPdfService.baixarPdfGerado(jobId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "fichas-" + jobId + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Lista convênios habilitados para geração de PDF
     */
    @GetMapping("/convenios-habilitados")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<ConvenioDto>> getConveniosHabilitados() {
        logger.info("Requisição para listar convênios habilitados para fichas PDF");

        List<ConvenioDto> convenios = fichaPdfService.getConveniosHabilitados();
        return ResponseUtil.success(convenios);
    }

    /**
     * Habilita/desabilita convênio para geração de PDF (apenas admins)
     */
    @PutMapping("/convenios/{convenioId}/toggle")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<Void> toggleConvenioHabilitado(
            @PathVariable UUID convenioId,
            @RequestParam boolean habilitado) {
        logger.info("Requisição para {} convênio {} para fichas PDF",
                habilitado ? "habilitar" : "desabilitar", convenioId);

        fichaPdfService.toggleConvenioHabilitado(convenioId, habilitado);
        return ResponseUtil.noContent();
    }

    /**
     * Lista todas as configurações de convênios (apenas admins)
     */
    @GetMapping("/configuracoes")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<List<ConvenioFichaPdfConfigDto>> getConfiguracoes() {
        logger.info("Requisição para listar configurações de fichas PDF");

        // Este método precisa ser implementado no service
        // List<ConvenioFichaPdfConfigDto> configs = fichaPdfService.getTodasConfiguracoes();
        // return ResponseUtil.success(configs);

        // Por enquanto, retorna lista vazia
        return ResponseUtil.success(List.of());
    }

    /**
     * Valida parâmetros antes de gerar fichas
     */
    @PostMapping("/validar")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> validarParametros(@RequestBody Map<String, Object> parametros) {
        logger.info("Requisição para validar parâmetros de geração de fichas");

        // Implementar validações customizadas
        Map<String, Object> resultado = Map.of(
                "valido", true,
                "mensagem", "Parâmetros válidos",
                "fichasEstimadas", 0 // Calcular estimativa baseada nos parâmetros
        );

        return ResponseUtil.success(resultado);
    }

    /**
     * Obtém estatísticas de fichas geradas
     */
    @GetMapping("/estatisticas")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getEstatisticas(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano) {
        logger.info("Requisição para estatísticas de fichas PDF");

        // Este método precisa ser implementado no service
        Map<String, Object> estatisticas = Map.of(
                "totalFichasGeradas", 0,
                "conveniosAtivos", 0,
                "jobsConcluidos", 0,
                "jobsEmAndamento", 0
        );

        return ResponseUtil.success(estatisticas);
    }

    /**
     * Cancela job em processamento (apenas o próprio usuário ou admin)
     */
    @PostMapping("/cancelar/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:cancel') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> cancelarJob(@PathVariable String jobId) {
        logger.info("Requisição para cancelar job: {}", jobId);

        // Este método precisa ser implementado no service
        // fichaPdfService.cancelarJob(jobId);

        return ResponseUtil.noContent();
    }

    /**
     * Gera preview de uma ficha (apenas HTML, sem PDF)
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> gerarPreview(@RequestBody Map<String, Object> parametros) {
        logger.info("Requisição para preview de ficha PDF");

        // Este método precisa ser implementado
        Map<String, Object> preview = Map.of(
                "html", "<html><body>Preview da ficha...</body></html>",
                "parametros", parametros
        );

        return ResponseUtil.success(preview);
    }

    /**
     * Testa geração para um paciente específico (modo debug)
     */
    @PostMapping("/teste/{pacienteId}")
    @PreAuthorize("hasAnyAuthority('ficha:test') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> testarGeracao(@PathVariable UUID pacienteId) {
        logger.info("Requisição para teste de geração para paciente: {}", pacienteId);

        // Este método seria útil para debug
        Map<String, Object> teste = Map.of(
                "pacienteId", pacienteId,
                "guiasEncontradas", 0,
                "especialidades", List.of(),
                "fichasQueSeriam", List.of()
        );

        return ResponseUtil.success(teste);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Argumento inválido na requisição de fichas PDF: {}", e.getMessage());

        Map<String, String> error = Map.of(
                "error", "INVALID_ARGUMENT",
                "message", e.getMessage()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        logger.warn("Estado inválido na requisição de fichas PDF: {}", e.getMessage());

        Map<String, String> error = Map.of(
                "error", "INVALID_STATE",
                "message", e.getMessage()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        logger.error("Erro interno na geração de fichas PDF: {}", e.getMessage(), e);

        Map<String, String> error = Map.of(
                "error", "INTERNAL_ERROR",
                "message", "Erro interno do servidor"
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}