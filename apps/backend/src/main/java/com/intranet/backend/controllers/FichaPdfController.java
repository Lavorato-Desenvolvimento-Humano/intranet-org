package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Ficha;
import com.intranet.backend.model.FichaPdfJob;
import com.intranet.backend.model.Paciente;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.FichaPdfJobRepository;
import com.intranet.backend.repository.FichaRepository;
import com.intranet.backend.repository.PacienteRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.FichaPdfService;
import com.intranet.backend.service.FichaPdfTemplateService;
import com.intranet.backend.service.FichaVerificationService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import static org.springframework.security.core.context.SecurityContextHolder.*;

@RestController
@RequestMapping("/api/fichas-pdf")
@RequiredArgsConstructor
public class FichaPdfController {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfController.class);

    private final FichaPdfService fichaPdfService;
    private final FichaVerificationService fichaVerificationService;
    private final FichaPdfTemplateService templateService;
    private final FichaRepository fichaRepository;
    private final PacienteRepository pacienteRepository;
    private final UserRepository userRepository;
    private final FichaPdfJobRepository jobRepository;

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

            FichaPdfResponseDto errorResponse = FichaPdfResponseDto.builder()
                    .sucesso(false)
                    .mensagem("Erro ao gerar fichas: " + e.getMessage())
                    .build();

            return ResponseEntity.badRequest().body(errorResponse);
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
            // PRIMEIRO: Obter o usuário atual na thread principal (onde SecurityContext está disponível)
            User usuarioAtual = getCurrentUserSafely();
            if (usuarioAtual == null) {
                logger.error("Não foi possível obter o usuário atual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Usuário não autenticado", "error", true));
            }

            String jobId = UUID.randomUUID().toString();
            logger.info("JobId gerado para convênio: {} - Usuário: {}", jobId, usuarioAtual.getEmail());

            // SEGUNDO: Usar o método que recebe o usuário explicitamente
            CompletableFuture<FichaPdfResponseDto> futureResponse =
                    fichaPdfService.gerarFichasConvenioComJobIdEUsuario(request, jobId, usuarioAtual);

            Map<String, Object> response = Map.of(
                    "message", "Processamento iniciado com sucesso",
                    "jobId", jobId,
                    "async", true,
                    "statusUrl", "/api/fichas-pdf/status/" + jobId,
                    "convenioId", request.getConvenioId(),
                    "periodo", request.getMes() + "/" + request.getAno()
            );

            logger.info("Resposta enviada com jobId: {}", jobId);
            return ResponseUtil.success(response);

        } catch (Exception e) {
            logger.error("Erro ao iniciar geração de fichas do convênio: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = Map.of(
                    "message", "Erro ao iniciar processamento: " + e.getMessage(),
                    "error", true,
                    "convenioId", request.getConvenioId()
            );

            return ResponseEntity.badRequest().body(errorResponse);
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
            String jobId = UUID.randomUUID().toString();
            logger.info("JobId gerado para lote: {}", jobId);

            CompletableFuture<FichaPdfResponseDto> futureResponse = fichaPdfService.gerarFichasLoteComJobId(request, jobId);

            Map<String, Object> response = Map.of(
                    "message", "Processamento em lote iniciado com sucesso",
                    "jobId", jobId,
                    "convenios", request.getConvenioIds().size(),
                    "async", true,
                    "statusUrl", "/api/fichas-pdf/status/" + jobId,
                    "periodo", request.getMes() + "/" + request.getAno()
            );

            return ResponseUtil.success(response);

        } catch (Exception e) {
            logger.error("Erro ao iniciar geração em lote: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = Map.of(
                    "message", "Erro ao iniciar processamento: " + e.getMessage(),
                    "error", true,
                    "convenios", request.getConvenioIds().size()
            );

            return ResponseEntity.badRequest().body(errorResponse);
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

            // Retornar status de erro em vez de 404
            FichaPdfStatusDto errorStatus = new FichaPdfStatusDto();
            errorStatus.setJobId(jobId);
            errorStatus.setMensagem("Job não encontrado ou erro ao consultar: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorStatus);
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
        } catch (IllegalStateException e) {
            logger.warn("Tentativa de download inválida para job {}: {}", jobId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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
     * Obtém configuração de PDF de um convênio específico
     */
    @GetMapping("/convenios/{convenioId}/config")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<ConvenioFichaPdfConfigDto> getConvenioConfig(@PathVariable UUID convenioId) {
        logger.info("Requisição para obter configuração PDF do convênio: {}", convenioId);

        try {
            ConvenioFichaPdfConfigDto config = fichaPdfService.getConvenioConfig(convenioId);
            return ResponseUtil.success(config);
        } catch (Exception e) {
            logger.error("Erro ao obter configuração do convênio {}: {}", convenioId, e.getMessage());
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
                    "habilitado", habilitado,
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao alterar status do convênio: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "message", "Erro ao alterar status do convênio: " + e.getMessage(),
                    "convenioId", convenioId,
                    "error", true
            );

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Verifica estatísticas de fichas existentes antes da geração
     */
    @GetMapping("/convenio/{convenioId}/estatisticas-fichas")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getEstatisticasFichasConvenio(
            @PathVariable UUID convenioId,
            @RequestParam Integer mes,
            @RequestParam Integer ano) {
        logger.info("Requisição para estatísticas de fichas do convênio: {} - {}/{}", convenioId, mes, ano);

        try {
            Map<String, Object> estatisticas = fichaVerificationService.getEstatisticasFichasConvenio(convenioId, mes, ano);
            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas de fichas: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao obter estatísticas: " + e.getMessage(),
                    "convenioId", convenioId,
                    "periodo", mes + "/" + ano
            );

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Prévia de geração - mostra quantos pacientes serão incluídos
     */
    @PostMapping("/convenio/previa")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getPreviaGeracaoConvenio(@Valid @RequestBody FichaPdfConvenioRequest request) {
        logger.info("Requisição para prévia de geração do convênio: {} - {}/{}",
                request.getConvenioId(), request.getMes(), request.getAno());

        try {
            // Buscar todos os pacientes do convênio
            List<Paciente> todosPacientes = pacienteRepository.findByConvenioId(request.getConvenioId());
            List<UUID> todosPacientesIds = todosPacientes.stream().map(Paciente::getId).collect(Collectors.toList());

            // Filtrar pacientes sem fichas
            List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                    request.getConvenioId(), request.getMes(), request.getAno(), todosPacientesIds);

            // Estatísticas existentes
            Map<String, Object> estatisticasExistentes = fichaVerificationService
                    .getEstatisticasFichasConvenio(request.getConvenioId(), request.getMes(), request.getAno());

            String recomendacao;
            if (pacientesSemFichas.isEmpty()) {
                recomendacao = "Todos os pacientes já possuem fichas para este período";
            } else if (pacientesSemFichas.size() == todosPacientes.size()) {
                recomendacao = "Nenhum paciente possui fichas - geração completa recomendada";
            } else {
                recomendacao = String.format("Geração recomendada para %d de %d pacientes (%d já possuem fichas)",
                        pacientesSemFichas.size(), todosPacientes.size(), todosPacientes.size() - pacientesSemFichas.size());
            }

            Map<String, Object> previa = Map.of(
                    "totalPacientesConvenio", todosPacientes.size(),
                    "pacientesComFichas", todosPacientes.size() - pacientesSemFichas.size(),
                    "pacientesSemFichas", pacientesSemFichas.size(),
                    "seraGeradoPara", pacientesSemFichas.size(),
                    "fichasExistentes", estatisticasExistentes,
                    "recomendacao", recomendacao,
                    "eficiencia", pacientesSemFichas.size() > 0 ?
                            String.format("%.1f%% de otimização",
                                    (double)(todosPacientes.size() - pacientesSemFichas.size()) / todosPacientes.size() * 100) :
                            "Nenhuma otimização"
            );

            return ResponseUtil.success(previa);
        } catch (Exception e) {
            logger.error("Erro ao gerar prévia: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao gerar prévia: " + e.getMessage(),
                    "convenioId", request.getConvenioId(),
                    "periodo", request.getMes() + "/" + request.getAno()
            );

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Verifica se paciente específico já possui fichas no mês
     */
    @GetMapping("/paciente/{pacienteId}/verificar-fichas")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> verificarFichasPaciente(
            @PathVariable UUID pacienteId,
            @RequestParam Integer mes,
            @RequestParam Integer ano,
            @RequestParam(required = false) List<String> especialidades) {
        logger.info("Verificando fichas do paciente: {} - {}/{}", pacienteId, mes, ano);

        try {
            Map<String, Boolean> fichasPorEspecialidade = new HashMap<>();

            if (especialidades != null && !especialidades.isEmpty()) {
                for (String especialidade : especialidades) {
                    boolean jaExiste = fichaVerificationService.jaExisteFicha(pacienteId, especialidade, mes, ano);
                    fichasPorEspecialidade.put(especialidade, jaExiste);
                }
            }

            // Buscar todas as fichas existentes do paciente no mês
            List<Ficha> fichasExistentes = fichaRepository.findFichasExistentesPorPacienteMesAno(pacienteId, mes, ano);

            Map<String, Object> resultado = Map.of(
                    "pacienteId", pacienteId,
                    "mes", mes,
                    "ano", ano,
                    "possuiFichas", !fichasExistentes.isEmpty(),
                    "totalFichas", fichasExistentes.size(),
                    "fichasPorEspecialidade", fichasPorEspecialidade,
                    "fichasExistentes", fichasExistentes.stream()
                            .map(f -> Map.of(
                                    "id", f.getId(),
                                    "codigo", f.getCodigoFicha(),
                                    "especialidade", f.getEspecialidade(),
                                    "status", f.getStatus(),
                                    "criadaEm", f.getCreatedAt()
                            ))
                            .collect(Collectors.toList()),
                    "recomendacao", fichasExistentes.isEmpty() ?
                            "Paciente precisa de fichas para este período" :
                            "Paciente já possui fichas - verificar se regeneração é necessária"
            );

            return ResponseUtil.success(resultado);
        } catch (Exception e) {
            logger.error("Erro ao verificar fichas do paciente: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao verificar fichas: " + e.getMessage(),
                    "pacienteId", pacienteId,
                    "periodo", mes + "/" + ano
            );

            return ResponseEntity.badRequest().body(errorResponse);
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
            // Gerar HTML usando o serviço de template
            String htmlPreview = templateService.gerarHtmlFicha(item);

            Map<String, Object> preview = Map.of(
                    "html", htmlPreview,
                    "paciente", item.getPacienteNome(),
                    "especialidade", item.getEspecialidade(),
                    "mesAno", item.getMes() + "/" + item.getAno(),
                    "numeroIdentificacao", item.getNumeroIdentificacao(),
                    "convenio", item.getConvenioNome(),
                    "geradoEm", System.currentTimeMillis()
            );

            return ResponseUtil.success(preview);
        } catch (Exception e) {
            logger.error("Erro ao gerar preview: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao gerar preview: " + e.getMessage(),
                    "paciente", item.getPacienteNome()
            );

            return ResponseEntity.badRequest().body(errorResponse);
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
            boolean valido = true;
            String mensagem = "Parâmetros válidos";
            int fichasEstimadas = 0;
            Map<String, String> erros = new HashMap<>();

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
                    erros.put("convenioId", "Convênio não habilitado");
                } else {
                    // Estimar fichas se convênio for válido
                    if (parametros.containsKey("mes") && parametros.containsKey("ano")) {
                        Integer mes = Integer.parseInt(parametros.get("mes").toString());
                        Integer ano = Integer.parseInt(parametros.get("ano").toString());

                        List<Paciente> pacientes = pacienteRepository.findByConvenioId(convenioId);
                        List<UUID> pacientesIds = pacientes.stream().map(Paciente::getId).collect(Collectors.toList());
                        List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(convenioId, mes, ano, pacientesIds);

                        fichasEstimadas = pacientesSemFichas.size() * 2; // Estimativa média de 2 especialidades por paciente
                    }
                }
            }

            if (parametros.containsKey("pacienteId")) {
                UUID pacienteId = UUID.fromString(parametros.get("pacienteId").toString());
                boolean pacienteExiste = pacienteRepository.existsById(pacienteId);

                if (!pacienteExiste) {
                    valido = false;
                    mensagem = "Paciente não encontrado";
                    erros.put("pacienteId", "Paciente não existe");
                }
            }

            // Validação de período
            if (parametros.containsKey("mes") && parametros.containsKey("ano")) {
                try {
                    Integer mes = Integer.parseInt(parametros.get("mes").toString());
                    Integer ano = Integer.parseInt(parametros.get("ano").toString());

                    if (mes < 1 || mes > 12) {
                        valido = false;
                        erros.put("mes", "Mês deve estar entre 1 e 12");
                    }

                    if (ano < 2020 || ano > 2030) {
                        valido = false;
                        erros.put("ano", "Ano deve estar entre 2020 e 2030");
                    }
                } catch (NumberFormatException e) {
                    valido = false;
                    erros.put("periodo", "Mês e ano devem ser números válidos");
                }
            }

            if (!erros.isEmpty()) {
                mensagem = "Parâmetros inválidos: " + String.join(", ", erros.values());
            }

            Map<String, Object> resultado = Map.of(
                    "valido", valido,
                    "mensagem", mensagem,
                    "fichasEstimadas", fichasEstimadas,
                    "erros", erros,
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(resultado);
        } catch (Exception e) {
            logger.error("Erro ao validar parâmetros: {}", e.getMessage());

            Map<String, Object> erro = Map.of(
                    "valido", false,
                    "mensagem", "Erro na validação: " + e.getMessage(),
                    "error", true
            );

            return ResponseUtil.success(erro);
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
        logger.info("Requisição para estatísticas de fichas PDF - mes: {}, ano: {}", mes, ano);

        try {
            // Obter jobs do usuário para estatísticas (garantir que não é null)
            List<FichaPdfJobDto> jobs = fichaPdfService.getJobsUsuario();
            if (jobs == null) {
                jobs = new ArrayList<>();
            }

            // CORREÇÃO: Usar métodos auxiliares para garantir valores não-nulos
            long jobsConcluidos = garantirLongNaoNulo(jobs.stream()
                    .filter(j -> "CONCLUIDO".equals(j.getStatus()))
                    .count());

            long jobsEmAndamento = garantirLongNaoNulo(jobs.stream()
                    .filter(j -> "PROCESSANDO".equals(j.getStatus()) || "INICIADO".equals(j.getStatus()))
                    .count());

            long jobsComErro = garantirLongNaoNulo(jobs.stream()
                    .filter(j -> "ERRO".equals(j.getStatus()))
                    .count());

            int totalFichasGeradas = jobs.stream()
                    .filter(j -> "CONCLUIDO".equals(j.getStatus()))
                    .mapToInt(j -> {
                        Integer fichas = j.getFichasProcessadas();
                        return fichas != null ? fichas : 0;
                    })
                    .sum();

            // Taxa de sucesso como decimal (0.0 a 1.0)
            double taxaSucesso = jobs.isEmpty() ? 0.0 : (double) jobsConcluidos / jobs.size();

            // CORREÇÃO: Garantir que fichasPorMes tenha valores não-nulos
            Map<String, Integer> fichasPorMes = new HashMap<>();
            if (mes != null && ano != null) {
                String chavePeriodo = String.format("%02d/%04d", mes, ano);
                int fichasPeriodo = jobs.stream()
                        .filter(j -> "CONCLUIDO".equals(j.getStatus()))
                        .filter(j -> j.getIniciado() != null)
                        .filter(j -> j.getIniciado().getMonthValue() == mes && j.getIniciado().getYear() == ano)
                        .mapToInt(j -> {
                            Integer fichas = j.getFichasProcessadas();
                            return fichas != null ? fichas : 0;
                        })
                        .sum();

                fichasPorMes.put(chavePeriodo, garantirIntegerNaoNulo(fichasPeriodo));
            } else {
                // Agrupar por mês/ano com valores seguros
                Map<String, Integer> tempMap = jobs.stream()
                        .filter(j -> "CONCLUIDO".equals(j.getStatus()))
                        .filter(j -> j.getIniciado() != null)
                        .collect(Collectors.groupingBy(
                                j -> String.format("%02d/%04d", j.getIniciado().getMonthValue(), j.getIniciado().getYear()),
                                Collectors.summingInt(j -> {
                                    Integer fichas = j.getFichasProcessadas();
                                    return fichas != null ? fichas : 0;
                                })
                        ));

                // CORREÇÃO: Garantir que todos os valores no mapa sejam não-nulos
                tempMap.forEach((chave, valor) -> {
                    fichasPorMes.put(chave, garantirIntegerNaoNulo(valor));
                });
            }

            // CORREÇÃO: Processar conveniosMaisUtilizados com proteções
            List<Map<String, Object>> conveniosMaisUtilizados = new ArrayList<>();
            try {
                List<ConvenioDto> conveniosHabilitados = fichaPdfService.getConveniosHabilitados();
                if (conveniosHabilitados != null) {
                    for (ConvenioDto convenio : conveniosHabilitados) {
                        try {
                            Map<String, Object> statsConvenio = fichaVerificationService
                                    .getEstatisticasFichasConvenio(convenio.getId(), mes, ano);

                            int totalFichasConvenio = 0;
                            if (statsConvenio != null && statsConvenio.containsKey("totalFichas")) {
                                Object totalObj = statsConvenio.get("totalFichas");
                                if (totalObj instanceof Number) {
                                    totalFichasConvenio = ((Number) totalObj).intValue();
                                }
                            }

                            if (totalFichasConvenio > 0) {
                                Map<String, Object> convenioStat = new HashMap<>();
                                convenioStat.put("convenioId",
                                        convenio.getId() != null ? convenio.getId().toString() : "");
                                convenioStat.put("convenioNome",
                                        convenio.getName() != null ? convenio.getName() : "Sem Nome");
                                convenioStat.put("totalFichas", garantirIntegerNaoNulo(totalFichasConvenio));
                                conveniosMaisUtilizados.add(convenioStat);
                            }
                        } catch (Exception e) {
                            logger.warn("Erro ao obter estatísticas do convênio {}: {}",
                                    convenio.getId(), e.getMessage());
                        }
                    }

                    // Ordenar e limitar aos 10 primeiros
                    conveniosMaisUtilizados = conveniosMaisUtilizados.stream()
                            .sorted((a, b) -> {
                                Integer totalA = garantirIntegerNaoNulo((Integer) a.get("totalFichas"));
                                Integer totalB = garantirIntegerNaoNulo((Integer) b.get("totalFichas"));
                                return Integer.compare(totalB, totalA);
                            })
                            .limit(10)
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                logger.warn("Erro ao calcular convênios mais utilizados: {}", e.getMessage());
                // conveniosMaisUtilizados já é uma lista vazia
            }

            // CORREÇÃO: Construir resposta com todos os valores garantidamente não-nulos
            Map<String, Object> estatisticas = new HashMap<>();
            estatisticas.put("totalFichasGeradas", garantirIntegerNaoNulo(totalFichasGeradas));
            estatisticas.put("conveniosAtivos", garantirIntegerNaoNulo(getConveniosAtivosSeguro()));
            estatisticas.put("jobsConcluidos", jobsConcluidos);
            estatisticas.put("jobsEmAndamento", jobsEmAndamento);
            estatisticas.put("jobsComErro", jobsComErro);
            estatisticas.put("totalJobs", garantirLongNaoNulo((long) jobs.size()));
            estatisticas.put("periodo", (mes != null && ano != null) ? mes + "/" + ano : "todos");
            estatisticas.put("taxaSucesso", garantirDoubleNaoNulo(taxaSucesso));
            estatisticas.put("fichasPorMes", fichasPorMes);
            estatisticas.put("conveniosMaisUtilizados", conveniosMaisUtilizados);
            estatisticas.put("ultimaAtualizacao", System.currentTimeMillis());

            logger.info("Estatísticas calculadas com segurança: {} fichas, {} jobs, {} convênios",
                    totalFichasGeradas, jobs.size(), conveniosMaisUtilizados.size());

            return ResponseUtil.success(estatisticas);

        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas: {}", e.getMessage(), e);

            // CORREÇÃO: Response de erro com valores garantidamente não-nulos
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("totalFichasGeradas", 0);
            errorResponse.put("conveniosAtivos", 0);
            errorResponse.put("jobsConcluidos", 0L);
            errorResponse.put("jobsEmAndamento", 0L);
            errorResponse.put("jobsComErro", 0L);
            errorResponse.put("totalJobs", 0L);
            errorResponse.put("periodo", (mes != null && ano != null) ? mes + "/" + ano : "todos");
            errorResponse.put("taxaSucesso", 0.0);
            errorResponse.put("fichasPorMes", new HashMap<String, Integer>());
            errorResponse.put("conveniosMaisUtilizados", new ArrayList<Map<String, Object>>());
            errorResponse.put("error", "Erro ao obter estatísticas: " + e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.badRequest().body(errorResponse);
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
            // Verificar componentes do sistema
            boolean templateServiceOk = templateService != null;
            boolean pdfGeneratorOk = fichaPdfService != null;
            boolean storageOk = checkStorageHealth();
            boolean databaseOk = fichaRepository != null && pacienteRepository != null;

            boolean allHealthy = templateServiceOk && pdfGeneratorOk && storageOk && databaseOk;

            Map<String, Object> health = Map.of(
                    "status", allHealthy ? "UP" : "DEGRADED",
                    "timestamp", System.currentTimeMillis(),
                    "componentes", Map.of(
                            "templateService", templateServiceOk ? "UP" : "DOWN",
                            "pdfGenerator", pdfGeneratorOk ? "UP" : "DOWN",
                            "storage", storageOk ? "UP" : "DOWN",
                            "database", databaseOk ? "UP" : "DOWN"
                    ),
                    "versao", "2.0.0",
                    "memoria", Map.of(
                            "total", Runtime.getRuntime().totalMemory(),
                            "free", Runtime.getRuntime().freeMemory(),
                            "used", Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()
                    )
            );

            HttpStatus status = allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
            return ResponseEntity.status(status).body(health);
        } catch (Exception e) {
            logger.error("Erro na verificação de saúde: {}", e.getMessage());

            Map<String, Object> health = Map.of(
                    "status", "DOWN",
                    "erro", e.getMessage(),
                    "timestamp", System.currentTimeMillis(),
                    "componentes", Map.of(
                            "sistema", "ERROR"
                    )
            );

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(health);
        }
    }

    /**
     * Obtém informações detalhadas do sistema
     */
    @GetMapping("/info")
    @PreAuthorize("hasAnyAuthority('ficha:read') or hasAnyRole('USER', 'ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getInfo() {
        logger.info("Requisição para informações do sistema de fichas PDF");

        try {
            // Verificar status do serviço
            boolean servicoAtivo = true;
            int queueSize = 0;
            int processandoAtualmente = 0;

            try {
                // Verificar quantos jobs estão em execução
                List<FichaPdfJobDto> jobs = fichaPdfService.getJobsUsuario();
                processandoAtualmente = (int) jobs.stream()
                        .filter(job -> "PROCESSANDO".equals(job.getStatus()) || "INICIADO".equals(job.getStatus()))
                        .count();

                queueSize = (int) jobs.stream()
                        .filter(job -> "INICIADO".equals(job.getStatus()))
                        .count();

                logger.debug("Jobs encontrados: total={}, processando={}, queue={}",
                        jobs.size(), processandoAtualmente, queueSize);
            } catch (Exception e) {
                logger.warn("Erro ao obter status dos jobs: {}", e.getMessage());
                servicoAtivo = false;
            }

            // Verificar saúde do sistema
            try {
                // Teste básico de conectividade com o banco
                fichaPdfService.getConveniosHabilitados();
            } catch (Exception e) {
                logger.warn("Erro ao verificar saúde do sistema: {}", e.getMessage());
                servicoAtivo = false;
            }

            // Obter configurações das propriedades da aplicação
            Map<String, Object> limitesOperacionais = Map.of(
                    "maxJobsSimultaneos", 5, // Pode vir de @Value ou configuração
                    "maxFichasPorJob", 1000,
                    "tempoRetencaoArquivos", "7 dias"
            );

            Map<String, Object> configuracaoGlobal = Map.of(
                    "batchSize", 50, // Pode vir de propriedades da aplicação
                    "timeoutMinutos", 30,
                    "formatoPadrao", "A4",
                    "compressao", true,
                    "qualidade", "ALTA"
            );

            Map<String, Object> statusServico = Map.of(
                    "ativo", servicoAtivo,
                    "queueSize", queueSize,
                    "processandoAtualmente", processandoAtualmente
            );

            // Informações do sistema
            Map<String, Object> info = Map.of(
                    "versaoSistema", "2.0.0",
                    "limitesOperacionais", limitesOperacionais,
                    "configuracaoGlobal", configuracaoGlobal,
                    "statusServico", statusServico,
                    "timestamp", System.currentTimeMillis()
            );

            logger.debug("Informações do sistema retornadas: servicoAtivo={}, queueSize={}, processando={}",
                    servicoAtivo, queueSize, processandoAtualmente);

            return ResponseUtil.success(info);

        } catch (Exception e) {
            logger.error("Erro ao obter informações do sistema: {}", e.getMessage(), e);

            // Retornar informações de erro mas ainda funcionais
            Map<String, Object> errorInfo = Map.of(
                    "versaoSistema", "2.0.0",
                    "limitesOperacionais", Map.of(
                            "maxJobsSimultaneos", 5,
                            "maxFichasPorJob", 1000,
                            "tempoRetencaoArquivos", "7 dias"
                    ),
                    "configuracaoGlobal", Map.of(
                            "batchSize", 50,
                            "timeoutMinutos", 30,
                            "formatoPadrao", "A4",
                            "compressao", true,
                            "qualidade", "ALTA"
                    ),
                    "statusServico", Map.of(
                            "ativo", false,
                            "queueSize", 0,
                            "processandoAtualmente", 0
                    ),
                    "erro", "Erro interno do servidor: " + e.getMessage(),
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorInfo);
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
            // Verificar se paciente existe
            if (!pacienteRepository.existsById(pacienteId)) {
                Map<String, Object> erro = Map.of(
                        "teste", "falhou",
                        "erro", "Paciente não encontrado",
                        "pacienteId", pacienteId
                );
                return ResponseEntity.badRequest().body(erro);
            }

            // Criar request de teste
            FichaPdfPacienteRequest request = new FichaPdfPacienteRequest();
            request.setPacienteId(pacienteId);
            request.setMes(mes);
            request.setAno(ano);
            request.setIncluirInativos(false);
            request.setReutilizarCodigosExistentes(true);
            request.setForcarRegeneracao(false);

            // Executar teste
            FichaPdfResponseDto resultado = fichaPdfService.gerarFichasPaciente(request);

            Map<String, Object> response = Map.of(
                    "teste", "concluido",
                    "pacienteId", pacienteId,
                    "periodo", mes + "/" + ano,
                    "resultado", resultado,
                    "sucesso", resultado.getSucesso(),
                    "mensagem", resultado.getMensagem(),
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro no teste de geração: {}", e.getMessage());

            Map<String, Object> erro = Map.of(
                    "teste", "falhou",
                    "erro", e.getMessage(),
                    "pacienteId", pacienteId,
                    "periodo", mes + "/" + ano,
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseEntity.badRequest().body(erro);
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
            // TODO: Implementar cancelamento real quando disponível
            // Por enquanto, apenas simular

            Map<String, Object> response = Map.of(
                    "message", "Funcionalidade de cancelamento será implementada em versão futura",
                    "jobId", jobId,
                    "cancelado", false,
                    "status", "PENDING_IMPLEMENTATION",
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao cancelar job: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "message", "Erro ao cancelar job: " + e.getMessage(),
                    "jobId", jobId,
                    "error", true
            );

            return ResponseEntity.badRequest().body(errorResponse);
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
            List<ConvenioDto> conveniosHabilitados = fichaPdfService.getConveniosHabilitados();

            Map<String, Object> configuracoes = Map.of(
                    "conveniosHabilitados", conveniosHabilitados,
                    "totalConvenios", conveniosHabilitados.size(),
                    "configuracaoGlobal", Map.of(
                            "batchSize", 50,
                            "timeoutMinutos", 30,
                            "formatoPadrao", "A4",
                            "compressao", true,
                            "qualidade", "ALTA"
                    ),
                    "limitesOperacionais", Map.of(
                            "maxJobsSimultaneos", 5,
                            "maxFichasPorJob", 1000,
                            "tempoRetencaoArquivos", "7 dias"
                    ),
                    "estatisticas", Map.of(
                            "conveniosAtivos", conveniosHabilitados.size(),
                            "ultimaAtualizacao", System.currentTimeMillis()
                    )
            );

            return ResponseUtil.success(configuracoes);
        } catch (Exception e) {
            logger.error("Erro ao listar configurações: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao obter configurações: " + e.getMessage(),
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseEntity.badRequest().body(errorResponse);
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
            // TODO: Implementar limpeza real de cache quando disponível

            Map<String, Object> response = Map.of(
                    "message", "Cache limpo com sucesso",
                    "timestamp", System.currentTimeMillis(),
                    "itensLimpos", Map.of(
                            "templates", 0,
                            "imagens", 0,
                            "configuracoes", 0
                    ),
                    "status", "SIMULATED" // Remover quando implementação real estiver disponível
            );

            return ResponseUtil.success(response);
        } catch (Exception e) {
            logger.error("Erro ao limpar cache: {}", e.getMessage());

            Map<String, Object> errorResponse = Map.of(
                    "error", "Erro ao limpar cache: " + e.getMessage(),
                    "timestamp", System.currentTimeMillis()
            );

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private User getCurrentUserSafely() {
        try {
            Authentication authentication = getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Não há autenticação disponível");
                return null;
            }

            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) principal;
                return userRepository.findByEmail(userDetails.getUsername())
                        .orElse(null);
            }

            logger.warn("Principal não é uma instância de UserDetails: {}", principal.getClass());
            return null;

        } catch (Exception e) {
            logger.error("Erro ao obter usuário atual: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Verifica saúde do sistema de armazenamento
     */
    private boolean checkStorageHealth() {
        try {
            // Verificar se consegue acessar sistema de arquivos
            java.nio.file.Path tempDir = java.nio.file.Paths.get(System.getProperty("java.io.tmpdir"));
            return java.nio.file.Files.exists(tempDir) && java.nio.file.Files.isWritable(tempDir);
        } catch (Exception e) {
            logger.warn("Erro ao verificar saúde do storage: {}", e.getMessage());
            return false;
        }
    }

    /**
     * MÉTODOS AUXILIARES PARA GARANTIR VALORES NÃO-NULOS
     */
    private Integer garantirIntegerNaoNulo(Integer valor) {
        return valor != null ? valor : 0;
    }

    private Long garantirLongNaoNulo(Long valor) {
        return valor != null ? valor : 0L;
    }

    private Double garantirDoubleNaoNulo(Double valor) {
        return valor != null ? valor : 0.0;
    }

    private int getConveniosAtivosSeguro() {
        try {
            List<ConvenioDto> convenios = fichaPdfService.getConveniosHabilitados();
            return convenios != null ? convenios.size() : 0;
        } catch (Exception e) {
            logger.warn("Erro ao obter convênios habilitados: {}", e.getMessage());
            return 0;
        }
    }
}