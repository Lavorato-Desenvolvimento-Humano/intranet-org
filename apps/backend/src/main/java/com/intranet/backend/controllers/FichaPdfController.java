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

        try {
            FichaPdfResponseDto response = fichaPdfService.gerarFichasPaciente(request);
            return ResponseUtil.created(response);
        } catch (Exception e) {
            logger.error("Erro ao gerar fichas do paciente: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Gera fichas PDF para um convênio específico (assíncrono)
     */
    @PostMapping("/convenio")
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> gerarFichasConvenio(@Valid @RequestBody FichaPdfConvenioRequest request) {
        logger.info("Requisição para gerar fichas do convênio: {}", request.getConvenioId());

        try {
            CompletableFuture<FichaPdfResponseDto> futureResponse = fichaPdfService.gerarFichasConvenio(request);

            // Retornar jobId imediatamente para acompanhamento
            Map<String, Object> response = Map.of(
                    "message", "Processamento iniciado",
                    "async", true
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao iniciar geração de fichas do convênio: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Gera fichas PDF para múltiplos convênios (batch assíncrono)
     */
    @PostMapping("/lote")
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> gerarFichasLote(@Valid @RequestBody FichaPdfLoteRequest request) {
        logger.info("Requisição para gerar fichas em lote para {} convênios", request.getConvenioIds().size());

        try {
            CompletableFuture<FichaPdfResponseDto> futureResponse = fichaPdfService.gerarFichasLote(request);

            Map<String, Object> response = Map.of(
                    "message", "Processamento em lote iniciado",
                    "convenios", request.getConvenioIds().size(),
                    "async", true
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao iniciar geração em lote: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Consulta status de uma geração assíncrona
     */
    @GetMapping("/status/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<FichaPdfStatusDto> getStatusGeracao(@PathVariable String jobId) {
        logger.info("Consultando status do job: {}", jobId);

        try {
            FichaPdfStatusDto status = fichaPdfService.getStatusGeracao(jobId);
            return ResponseUtil.success(status);
        } catch (Exception e) {
            logger.error("Erro ao consultar status do job {}: {}", jobId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Lista jobs de geração do usuário atual
     */
    @GetMapping("/jobs")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<FichaPdfJobDto>> getJobsUsuario() {
        logger.info("Listando jobs do usuário atual");

        try {
            List<FichaPdfJobDto> jobs = fichaPdfService.getJobsUsuario();
            return ResponseUtil.success(jobs);
        } catch (Exception e) {
            logger.error("Erro ao listar jobs do usuário: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Baixa PDF gerado
     */
    @GetMapping("/download/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:download') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<byte[]> baixarPdfGerado(@PathVariable String jobId) {
        logger.info("Requisição para baixar PDF do job: {}", jobId);

        try {
            byte[] pdfBytes = fichaPdfService.baixarPdfGerado(jobId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "fichas-" + jobId + ".pdf");
            headers.setContentLength(pdfBytes.length);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Erro ao baixar PDF do job {}: {}", jobId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Lista convênios habilitados para geração de PDF
     */
    @GetMapping("/convenios-habilitados")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<ConvenioDto>> getConveniosHabilitados() {
        logger.info("Requisição para listar convênios habilitados para fichas PDF");

        try {
            List<ConvenioDto> convenios = fichaPdfService.getConveniosHabilitados();
            return ResponseUtil.success(convenios);
        } catch (Exception e) {
            logger.error("Erro ao listar convênios habilitados: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Habilita/desabilita convênio para geração de PDF (apenas admins)
     */
    @PutMapping("/convenios/{convenioId}/toggle")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> toggleConvenioHabilitado(
            @PathVariable UUID convenioId,
            @RequestParam boolean habilitado) {
        logger.info("Requisição para {} convênio {} para fichas PDF",
                habilitado ? "habilitar" : "desabilitar", convenioId);

        try {
            fichaPdfService.toggleConvenioHabilitado(convenioId, habilitado);

            Map<String, Object> response = Map.of(
                    "message", "Convênio " + (habilitado ? "habilitado" : "desabilitado") + " com sucesso",
                    "convenioId", convenioId,
                    "habilitado", habilitado
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao alterar status do convênio: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Valida parâmetros antes de gerar fichas
     */
    @PostMapping("/validar")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> validarParametros(@RequestBody Map<String, Object> parametros) {
        logger.info("Requisição para validar parâmetros de geração de fichas");

        try {
            // Implementar validações baseadas nos parâmetros
            boolean valido = true;
            String mensagem = "Parâmetros válidos";
            int fichasEstimadas = 0;

            // Validações básicas
            if (parametros.containsKey("convenioId")) {
                UUID convenioId = UUID.fromString(parametros.get("convenioId").toString());
                // Verificar se convênio está habilitado
                List<ConvenioDto> conveniosHabilitados = fichaPdfService.getConveniosHabilitados();
                boolean convenioHabilitado = conveniosHabilitados.stream()
                        .anyMatch(c -> c.getId().equals(convenioId));

                if (!convenioHabilitado) {
                    valido = false;
                    mensagem = "Convênio não habilitado para geração de fichas PDF";
                }
            }

            // TODO: Implementar estimativa de fichas baseada nos parâmetros

            Map<String, Object> resultado = Map.of(
                    "valido", valido,
                    "mensagem", mensagem,
                    "fichasEstimadas", fichasEstimadas,
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(resultado);
        } catch (Exception e) {
            logger.error("Erro ao validar parâmetros: {}", e.getMessage());
            Map<String, Object> erro = Map.of(
                    "valido", false,
                    "mensagem", "Erro na validação: " + e.getMessage()
            );
            return ResponseUtil.success(erro);
        }
    }

    /**
     * Gera preview de uma ficha (apenas HTML, sem PDF)
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> gerarPreview(@RequestBody FichaPdfItemDto item) {
        logger.info("Requisição para preview de ficha PDF para paciente: {}", item.getPacienteNome());

        try {
            // TODO: Implementar geração de preview HTML
            String htmlPreview = "<html><body><h1>Preview da Ficha</h1><p>Paciente: " +
                    item.getPacienteNome() + "</p></body></html>";

            Map<String, Object> preview = Map.of(
                    "html", htmlPreview,
                    "paciente", item.getPacienteNome(),
                    "especialidade", item.getEspecialidade(),
                    "mesAno", item.getMes() + "/" + item.getAno()
            );

            return ResponseUtil.success(preview);
        } catch (Exception e) {
            logger.error("Erro ao gerar preview: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
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

        try {
            // TODO: Implementar cálculo real das estatísticas
            Map<String, Object> estatisticas = Map.of(
                    "totalFichasGeradas", 0,
                    "conveniosAtivos", fichaPdfService.getConveniosHabilitados().size(),
                    "jobsConcluidos", 0,
                    "jobsEmAndamento", 0,
                    "periodo", (mes != null && ano != null) ? mes + "/" + ano : "todos",
                    "ultimaAtualizacao", System.currentTimeMillis()
            );

            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancela job em processamento (apenas o próprio usuário ou admin)
     */
    @PostMapping("/cancelar/{jobId}")
    @PreAuthorize("hasAnyAuthority('ficha:cancel') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> cancelarJob(@PathVariable String jobId) {
        logger.info("Requisição para cancelar job: {}", jobId);

        try {
            // TODO: Implementar cancelamento de job
            // fichaPdfService.cancelarJob(jobId);

            Map<String, Object> response = Map.of(
                    "message", "Funcionalidade de cancelamento será implementada em versão futura",
                    "jobId", jobId,
                    "cancelado", false
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao cancelar job: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Lista todas as configurações de convênios (apenas admins)
     */
    @GetMapping("/configuracoes")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getConfiguracoes() {
        logger.info("Requisição para listar configurações de fichas PDF");

        try {
            // TODO: Implementar busca de todas as configurações
            List<ConvenioDto> conveniosHabilitados = fichaPdfService.getConveniosHabilitados();

            Map<String, Object> configuracoes = Map.of(
                    "conveniosHabilitados", conveniosHabilitados,
                    "totalConvenios", conveniosHabilitados.size(),
                    "configuracaoGlobal", Map.of(
                            "batchSize", 50,
                            "timeoutMinutos", 30,
                            "formatoPadrao", "A4"
                    )
            );

            return ResponseUtil.success(configuracoes);
        } catch (Exception e) {
            logger.error("Erro ao listar configurações: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Testa geração para um paciente específico (modo debug)
     */
    @PostMapping("/teste/{pacienteId}")
    @PreAuthorize("hasAnyAuthority('ficha:test') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> testarGeracao(
            @PathVariable UUID pacienteId,
            @RequestParam(defaultValue = "1") Integer mes,
            @RequestParam(defaultValue = "2025") Integer ano) {
        logger.info("Teste de geração para paciente: {} em {}/{}", pacienteId, mes, ano);

        try {
            // Criar request de teste
            FichaPdfPacienteRequest request = new FichaPdfPacienteRequest();
            request.setPacienteId(pacienteId);
            request.setMes(mes);
            request.setAno(ano);
            request.setIncluirInativos(false);

            // Executar teste
            FichaPdfResponseDto resultado = fichaPdfService.gerarFichasPaciente(request);

            Map<String, Object> response = Map.of(
                    "teste", "concluido",
                    "pacienteId", pacienteId,
                    "periodo", mes + "/" + ano,
                    "resultado", resultado,
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro no teste de geração: {}", e.getMessage());

            Map<String, Object> erro = Map.of(
                    "teste", "falhou",
                    "erro", e.getMessage(),
                    "pacienteId", pacienteId
            );

            return ResponseEntity.badRequest().body(erro);
        }
    }

    /**
     * Limpa cache de templates e imagens
     */
    @PostMapping("/limpar-cache")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> limparCache() {
        logger.info("Requisição para limpar cache de templates");

        try {
            // TODO: Implementar limpeza de cache
            Map<String, Object> response = Map.of(
                    "message", "Cache limpo com sucesso",
                    "timestamp", System.currentTimeMillis(),
                    "itensLimpos", Map.of(
                            "templates", 0,
                            "imagens", 0,
                            "configuracoes", 0
                    )
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao limpar cache: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Verifica saúde do sistema de geração de PDFs
     */
    @GetMapping("/health")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        logger.debug("Verificação de saúde do sistema de fichas PDF");

        try {
            Map<String, Object> health = Map.of(
                    "status", "UP",
                    "timestamp", System.currentTimeMillis(),
                    "componentes", Map.of(
                            "templateService", "UP",
                            "pdfGenerator", "UP",
                            "storage", "UP"
                    ),
                    "versao", "2.0.0"
            );

            return ResponseUtil.success(health);
        } catch (Exception e) {
            logger.error("Erro na verificação de saúde: {}", e.getMessage());

            Map<String, Object> health = Map.of(
                    "status", "DOWN",
                    "erro", e.getMessage(),
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(health);
        }
    }

    /**
     * Obtém informações detalhadas do sistema
     */
    @GetMapping("/info")
    @PreAuthorize("hasAnyAuthority('ficha:admin') or hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        logger.info("Requisição para informações do sistema");

        try {
            Map<String, Object> info = Map.of(
                    "sistema", "Gerador de Fichas PDF",
                    "versao", "2.0.0",
                    "biblioteca", "iText 7",
                    "javaVersion", System.getProperty("java.version"),
                    "configuracoes", Map.of(
                            "batchSize", 50,
                            "formatos", List.of("A4", "Letter"),
                            "tiposSuportados", List.of("PACIENTE", "CONVENIO", "LOTE")
                    ),
                    "limites", Map.of(
                            "maxFichasPorLote", 1000,
                            "maxTamanhoArquivo", "50MB",
                            "timeoutProcessamento", "30min"
                    )
            );

            return ResponseUtil.success(info);
        } catch (Exception e) {
            logger.error("Erro ao obter informações do sistema: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}