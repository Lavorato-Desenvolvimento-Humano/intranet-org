package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.FichaPdfGeneratorService;
import com.intranet.backend.service.FichaPdfService;
import com.intranet.backend.service.FichaPdfTemplateService;
import com.intranet.backend.service.FichaVerificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FichaPdfServiceImpl implements FichaPdfService {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfServiceImpl.class);

    // Repositories
    private final FichaPdfJobRepository jobRepository;
    private final ConvenioFichaPdfConfigRepository configRepository;
    private final FichaPdfLogRepository logRepository;
    private final FichaRepository fichaRepository;
    private final UserRepository userRepository;
    private final PacienteRepository pacienteRepository;
    private final GuiaRepository guiaRepository;
    private final ConvenioRepository convenioRepository;

    // Services auxiliares
    private final FichaPdfGeneratorService pdfGeneratorService;
    private final FichaPdfTemplateService templateService;
    private final FichaVerificationService fichaVerificationService;

    @Value("${app.pdf.storage.path:/tmp/fichas-pdf}")
    private String pdfStoragePath;

    @Override
    @Transactional
    public FichaPdfResponseDto gerarFichasPaciente(FichaPdfPacienteRequest request) {
        logger.info("=== IMPLEMENTAÇÃO GRADUAL: Gerando fichas PDF ===");
        logger.info("Paciente: {}, Período: {}/{}", request.getPacienteId(), request.getMes(), request.getAno());

        try {
            // PASSO 1: Buscar itens (já confirmado que funciona)
            List<FichaPdfItemDto> itens = buscarItensParaPaciente(request);
            logger.info("✅ PASSO 1: {} itens encontrados", itens.size());

            if (itens.isEmpty()) {
                return FichaPdfResponseDto.builder()
                        .sucesso(false)
                        .mensagem("Nenhuma guia ativa encontrada para o paciente no período informado")
                        .build();
            }

            // PASSO 2: Processar duplicatas (simplificado por enquanto)
            logger.info("🔄 PASSO 2: Processando duplicatas...");
            List<FichaPdfItemDto> itensCorrigidos;
            try {
                // Tentar usar o serviço de verificação, mas com fallback
                if (fichaVerificationService != null) {
                    itensCorrigidos = fichaVerificationService.verificarECorrigirDuplicatas(itens);
                    logger.info("✅ PASSO 2: Verificação de duplicatas concluída - {} itens corrigidos", itensCorrigidos.size());
                } else {
                    logger.warn("⚠️ PASSO 2: Serviço de verificação não disponível, usando itens originais");
                    itensCorrigidos = itens;
                }
            } catch (Exception e) {
                logger.warn("⚠️ PASSO 2: Erro na verificação de duplicatas, usando itens originais: {}", e.getMessage());
                itensCorrigidos = itens;
            }

            // PASSO 3: Gerar PDF
            logger.info("🔄 PASSO 3: Iniciando geração de PDF...");
            byte[] pdfBytes;
            try {
                pdfBytes = pdfGeneratorService.gerarPdfCompleto(itensCorrigidos, request.getMes(), request.getAno());
                logger.info("✅ PASSO 3: PDF gerado com sucesso - {} bytes", pdfBytes.length);
            } catch (Exception e) {
                logger.error("❌ PASSO 3: Erro na geração do PDF: {}", e.getMessage(), e);

                // Retornar erro específico da geração de PDF
                return FichaPdfResponseDto.builder()
                        .sucesso(false)
                        .mensagem("Erro na geração do PDF: " + e.getMessage())
                        .totalFichas(itensCorrigidos.size())
                        .build();
            }

            // PASSO 4: Criar job
            logger.info("🔄 PASSO 4: Criando job...");
            String jobId = UUID.randomUUID().toString();
            FichaPdfJob job;
            try {
                job = criarJobSeguro(jobId, FichaPdfJob.TipoGeracao.PACIENTE);
                logger.info("✅ PASSO 4: Job criado - ID: {}", jobId);
            } catch (Exception e) {
                logger.error("❌ PASSO 4: Erro ao criar job: {}", e.getMessage(), e);

                return FichaPdfResponseDto.builder()
                        .sucesso(false)
                        .mensagem("Erro ao criar job: " + e.getMessage())
                        .totalFichas(itensCorrigidos.size())
                        .build();
            }

            // PASSO 5: Salvar arquivo
            logger.info("🔄 PASSO 5: Salvando arquivo PDF...");
            String fileName;
            try {
                fileName = salvarArquivoPdfSeguro(pdfBytes, jobId);
                logger.info("✅ PASSO 5: Arquivo salvo - {}", fileName);
            } catch (Exception e) {
                logger.error("❌ PASSO 5: Erro ao salvar arquivo: {}", e.getMessage(), e);

                // Marcar job como erro
                job.setStatus(FichaPdfJob.StatusJob.ERRO);
                job.setObservacoes("Erro ao salvar arquivo: " + e.getMessage());
                jobRepository.save(job);

                return FichaPdfResponseDto.builder()
                        .sucesso(false)
                        .mensagem("Erro ao salvar arquivo: " + e.getMessage())
                        .jobId(jobId)
                        .totalFichas(itensCorrigidos.size())
                        .build();
            }

            // PASSO 6: Finalizar job
            logger.info("🔄 PASSO 6: Finalizando job...");
            try {
                job.setArquivoPath(fileName);
                job.setPodeDownload(true);
                job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
                job.setConcluido(LocalDateTime.now());
                job.setTotalFichas(itensCorrigidos.size());
                job.setFichasProcessadas(itensCorrigidos.size());

                jobRepository.save(job);
                logger.info("✅ PASSO 6: Job finalizado com sucesso");
            } catch (Exception e) {
                logger.error("❌ PASSO 6: Erro ao finalizar job: {}", e.getMessage(), e);

                return FichaPdfResponseDto.builder()
                        .sucesso(false)
                        .mensagem("Erro ao finalizar job: " + e.getMessage())
                        .jobId(jobId)
                        .totalFichas(itensCorrigidos.size())
                        .build();
            }

            // PASSO 7: Registrar logs (opcional)
            logger.info("🔄 PASSO 7: Registrando logs...");
            try {
                registrarLogsFichasSeguro(job, itensCorrigidos);
                logger.info("✅ PASSO 7: Logs registrados");
            } catch (Exception e) {
                logger.warn("⚠️ PASSO 7: Erro ao registrar logs (não crítico): {}", e.getMessage());
                // Não interromper o processo por causa dos logs
            }

            // SUCESSO TOTAL!
            logger.info("🎉 SUCESSO TOTAL: Fichas PDF geradas - JobId: {}, Fichas: {}", jobId, itensCorrigidos.size());

            return FichaPdfResponseDto.builder()
                    .sucesso(true)
                    .mensagem("Fichas PDF geradas com sucesso!")
                    .jobId(jobId)
                    .arquivo(fileName)
                    .totalFichas(itensCorrigidos.size())
                    .build();

        } catch (Exception e) {
            logger.error("❌ ERRO GERAL na geração de fichas: {}", e.getMessage(), e);

            return FichaPdfResponseDto.builder()
                    .sucesso(false)
                    .mensagem("Erro interno geral: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Método seguro para criar job
     */
    private FichaPdfJob criarJobSeguro(String jobId, FichaPdfJob.TipoGeracao tipo) {
        try {
            FichaPdfJob job = new FichaPdfJob();
            job.setJobId(jobId);
            job.setTipo(tipo);
            job.setStatus(FichaPdfJob.StatusJob.INICIADO);
            job.setIniciado(LocalDateTime.now());
            job.setTotalFichas(0);
            job.setFichasProcessadas(0);

            // Tentar obter usuário atual
            try {
                User usuario = getCurrentUser();
                job.setUsuario(usuario);
                logger.debug("Usuário definido para o job: {}", usuario.getEmail());
            } catch (Exception e) {
                logger.warn("Não foi possível obter usuário atual para o job: {}", e.getMessage());
                // Continuar sem usuário
            }

            return jobRepository.save(job);

        } catch (Exception e) {
            logger.error("Erro crítico ao criar job: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao criar job: " + e.getMessage(), e);
        }
    }

    /**
     * Método seguro para salvar arquivo PDF
     */
    private String salvarArquivoPdfSeguro(byte[] pdfBytes, String jobId) {
        try {
            if (pdfBytes == null || pdfBytes.length == 0) {
                throw new IllegalArgumentException("PDF bytes não podem estar vazios");
            }

            // Gerar nome do arquivo
            String nomeArquivo = String.format("fichas_paciente_%s_%s.pdf",
                    jobId, System.currentTimeMillis());

            // Criar caminho completo
            String caminhoCompleto = pdfStoragePath + java.io.File.separator + nomeArquivo;

            // Criar diretórios se não existirem
            java.nio.file.Path diretorio = java.nio.file.Paths.get(pdfStoragePath);
            if (!java.nio.file.Files.exists(diretorio)) {
                java.nio.file.Files.createDirectories(diretorio);
                logger.info("Diretório criado: {}", pdfStoragePath);
            }

            // Salvar arquivo
            java.nio.file.Files.write(java.nio.file.Paths.get(caminhoCompleto), pdfBytes);
            logger.info("PDF salvo: {} ({} bytes)", caminhoCompleto, pdfBytes.length);

            return caminhoCompleto;

        } catch (Exception e) {
            logger.error("Erro crítico ao salvar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar arquivo PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Método seguro para registrar logs
     */
    private void registrarLogsFichasSeguro(FichaPdfJob job, List<FichaPdfItemDto> itens) {
        try {
            if (logRepository == null) {
                logger.warn("Repository de logs não disponível");
                return;
            }

            for (FichaPdfItemDto item : itens) {
                try {
                    FichaPdfLog log = new FichaPdfLog();
                    log.setJob(job);

                    // Buscar paciente
                    Optional<Paciente> pacienteOpt = pacienteRepository.findById(item.getPacienteId());
                    if (pacienteOpt.isPresent()) {
                        log.setPaciente(pacienteOpt.get());
                    }

                    log.setEspecialidade(item.getEspecialidade());
                    log.setNumeroIdentificacao(item.getNumeroIdentificacao());
                    log.setMes(item.getMes());
                    log.setAno(item.getAno());
                    log.setQuantidadeAutorizada(item.getQuantidadeAutorizada());
                    log.setProcessadoComSucesso(true);

                    logRepository.save(log);

                } catch (Exception e) {
                    logger.warn("Erro ao registrar log para item {}: {}",
                            item.getNumeroIdentificacao(), e.getMessage());
                    // Continuar com próximo item
                }
            }

        } catch (Exception e) {
            logger.error("Erro geral ao registrar logs: {}", e.getMessage(), e);
            // Não interromper o processo principal
        }
    }


    @Override
    @Async
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasConvenio(FichaPdfConvenioRequest request) {
        logger.info("Iniciando geração assíncrona de fichas por convênio: {} - {}/{}",
                request.getConvenioId(), request.getMes(), request.getAno());

        String jobId = UUID.randomUUID().toString();
        FichaPdfJob job = criarJob(jobId, FichaPdfJob.TipoGeracao.CONVENIO, getCurrentUser());

        try {
            // Buscar todos os itens do convênio
            List<FichaPdfItemDto> todosItens = buscarItensParaConvenio(request);

            if (todosItens.isEmpty()) {
                finalizarJobComErro(job, new RuntimeException("Nenhuma guia ativa encontrada para o convênio"));
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma guia encontrada"));
            }

            // NOVA FUNCIONALIDADE: Filtrar pacientes que já possuem fichas
            List<UUID> pacientesOriginais = todosItens.stream()
                    .map(FichaPdfItemDto::getPacienteId)
                    .distinct()
                    .collect(Collectors.toList());

            List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                    request.getConvenioId(), request.getMes(), request.getAno(), pacientesOriginais);

            // Filtrar itens apenas para pacientes sem fichas
            List<FichaPdfItemDto> itensFiltrados = todosItens.stream()
                    .filter(item -> pacientesSemFichas.contains(item.getPacienteId()))
                    .collect(Collectors.toList());

            if (itensFiltrados.isEmpty()) {
                job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
                job.setObservacoes("Todos os pacientes já possuem fichas para o período informado");
                job.setConcluido(LocalDateTime.now());
                job.setTotalFichas(0);
                job.setFichasProcessadas(0);
                jobRepository.save(job);

                logger.info("Geração por convênio finalizada - todos os pacientes já possuem fichas: JobId: {}", jobId);
                return CompletableFuture.completedFuture(buildResponse(job, "Todos os pacientes já possuem fichas"));
            }

            // Verificar e corrigir duplicatas nos itens filtrados
            List<FichaPdfItemDto> itensFinais = fichaVerificationService.verificarECorrigirDuplicatas(itensFiltrados);

            // Atualizar job com totais corretos
            job.setTotalFichas(itensFinais.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // Gerar PDF
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(
                    itensFinais, request.getMes(), request.getAno(),
                    progresso -> {
                        // Callback de progresso pode ser implementado aqui
                        logger.debug("Progresso da geração: {}%", progresso);
                    }
            );

            // Salvar arquivo e finalizar job
            String fileName = salvarArquivoPdf(pdfBytes, jobId);
            job.setArquivoPath(fileName);
            job.setPodeDownload(true);
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setConcluido(LocalDateTime.now());
            job.setFichasProcessadas(itensFinais.size());
            job.setObservacoes(String.format("Geradas %d fichas para %d pacientes. %d pacientes já possuíam fichas.",
                    itensFinais.size(), pacientesSemFichas.size(), pacientesOriginais.size() - pacientesSemFichas.size()));

            jobRepository.save(job);

            // Registrar logs
            registrarLogsFichas(job, itensFinais);

            logger.info("Fichas por convênio geradas com sucesso - JobId: {}, Fichas: {}, Pacientes novos: {}, Pacientes com fichas: {}",
                    jobId, itensFinais.size(), pacientesSemFichas.size(), pacientesOriginais.size() - pacientesSemFichas.size());

            return CompletableFuture.completedFuture(buildResponse(job, "Fichas geradas com sucesso"));

        } catch (Exception e) {
            logger.error("Erro na geração por convênio: {}", e.getMessage(), e);
            finalizarJobComErro(job, e);
            return CompletableFuture.completedFuture(buildResponse(job, "Erro na geração: " + e.getMessage()));
        }
    }

    @Override
    @Async
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasLote(FichaPdfLoteRequest request) {
        logger.info("Iniciando geração em lote para {} convênios", request.getConvenioIds().size());

        User currentUser = getCurrentUser();
        String jobId = UUID.randomUUID().toString();

        FichaPdfJob job = criarJob(jobId, FichaPdfJob.TipoGeracao.LOTE, currentUser);

        try {
            List<FichaPdfItemDto> todosItens = new ArrayList<>();

            // Processar cada convênio
            for (UUID convenioId : request.getConvenioIds()) {
                if (!isConvenioHabilitado(convenioId)) {
                    logger.warn("Convênio {} não habilitado, pulando...", convenioId);
                    continue;
                }

                FichaPdfConvenioRequest convenioRequest = new FichaPdfConvenioRequest();
                convenioRequest.setConvenioId(convenioId);
                convenioRequest.setMes(request.getMes());
                convenioRequest.setAno(request.getAno());
                convenioRequest.setEspecialidades(request.getEspecialidades());
                convenioRequest.setIncluirInativos(request.getIncluirInativos());

                List<FichaPdfItemDto> itensConvenio = buscarItensParaConvenio(convenioRequest);

                // Aplicar verificação de duplicatas por convênio
                List<UUID> pacientesConvenio = itensConvenio.stream()
                        .map(FichaPdfItemDto::getPacienteId)
                        .distinct()
                        .collect(Collectors.toList());

                List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                        convenioId, request.getMes(), request.getAno(), pacientesConvenio);

                List<FichaPdfItemDto> itensFiltrados = itensConvenio.stream()
                        .filter(item -> pacientesSemFichas.contains(item.getPacienteId()))
                        .collect(Collectors.toList());

                List<FichaPdfItemDto> itensCorrigidos = fichaVerificationService.verificarECorrigirDuplicatas(itensFiltrados);
                todosItens.addAll(itensCorrigidos);
            }

            if (todosItens.isEmpty()) {
                job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
                job.setObservacoes("Nenhuma ficha nova encontrada para os convênios especificados");
                job.setTotalFichas(0);
                job.setFichasProcessadas(0);
                job.setConcluido(LocalDateTime.now());
                jobRepository.save(job);
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma ficha nova encontrada"));
            }

            job.setTotalFichas(todosItens.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // Gerar PDF
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(todosItens, request.getMes(), request.getAno(),
                    (processadas) -> atualizarProgressoJob(jobId, processadas));

            // Salvar arquivo
            String fileName = salvarArquivoPdf(pdfBytes, jobId);

            // Finalizar job
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setFichasProcessadas(todosItens.size());
            job.setConcluido(LocalDateTime.now());
            job.setArquivoPath(fileName);
               job.setPodeDownload(true);
            jobRepository.save(job);

            // Registrar logs
            registrarLogsFichas(job, todosItens);

            logger.info("Geração em lote concluída. JobId: {}, Fichas: {}", jobId, todosItens.size());
            return CompletableFuture.completedFuture(buildResponse(job, "PDF de lote gerado com sucesso"));

        } catch (Exception e) {
            logger.error("Erro na geração em lote: {}", e.getMessage(), e);
            finalizarJobComErro(job, e);
            return CompletableFuture.completedFuture(buildResponse(job, "Erro na geração: " + e.getMessage()));
        }
    }

    @Override
    public FichaPdfStatusDto getStatusGeracao(String jobId) {
        FichaPdfJob job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job não encontrado: " + jobId));

        return buildStatusDto(job);
    }

    @Override
    public List<ConvenioDto> getConveniosHabilitados() {
        List<ConvenioFichaPdfConfig> configs = configRepository.findByHabilitadoTrue();
        return configs.stream()
                .map(config -> mapConvenioToDto(config.getConvenio()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void toggleConvenioHabilitado(UUID convenioId, boolean habilitado) {
        logger.info("Alterando status do convênio {} para habilitado: {}", convenioId, habilitado);

        Convenio convenio = convenioRepository.findById(convenioId)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado: " + convenioId));

        ConvenioFichaPdfConfig config = configRepository.findByConvenioId(convenioId)
                .orElse(new ConvenioFichaPdfConfig());

        config.setConvenio(convenio);
        config.setHabilitado(habilitado);

        if (config.getDiasAtividade() == null) {
            config.setDiasAtividade(30); // Padrão
        }
        if (config.getPrefixoIdentificacao() == null) {
            config.setPrefixoIdentificacao(""); // Padrão
        }

        configRepository.save(config);
    }

    @Override
    public byte[] baixarPdfGerado(String jobId) {
        FichaPdfJob job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job não encontrado: " + jobId));

        if (!job.isPodeDownload()) {
            throw new IllegalStateException("PDF não está disponível para download");
        }

        // Verificar se é o próprio usuário ou admin
        User currentUser = getCurrentUser();
        if (!job.getUsuario().getId().equals(currentUser.getId()) && !isAdmin(currentUser)) {
            throw new IllegalStateException("Sem permissão para baixar este arquivo");
        }

        return pdfGeneratorService.lerArquivoPdf(job.getArquivoPath());
    }

    @Override
    public List<FichaPdfJobDto> getJobsUsuario() {
        User currentUser = getCurrentUser();
        List<FichaPdfJob> jobs = jobRepository.findByUsuarioIdOrderByCreatedAtDesc(currentUser.getId());

        return jobs.stream()
                .map(this::mapJobToDto)
                .collect(Collectors.toList());
    }

    private List<FichaPdfItemDto> buscarItensParaPaciente(FichaPdfPacienteRequest request) {
        logger.info("=== BUSCA CORRIGIDA DE ITENS ===");
        logger.info("Paciente: {}, Período: {}/{}", request.getPacienteId(), request.getMes(), request.getAno());

        // Verificar se paciente existe
        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado"));

        logger.info("Paciente encontrado: {} (Convênio: {})",
                paciente.getNome(),
                paciente.getConvenio() != null ? paciente.getConvenio().getName() : "Não informado");

        // USAR A BUSCA CORRIGIDA (não o método original que está falhando)
        List<Guia> guias = buscarGuiasCorrigidas(request.getPacienteId(), request.getMes(), request.getAno(),
                request.getEspecialidades(), request.getIncluirInativos());

        logger.info("Guias encontradas após busca corrigida: {}", guias.size());

        if (guias.isEmpty()) {
            logger.warn("Nenhuma guia encontrada com busca corrigida");
            return new ArrayList<>();
        }

        // Processar guias para fichas
        return processarGuiasParaFichas(guias, request.getMes(), request.getAno());
    }

    private List<Guia> buscarGuiasCorrigidas(UUID pacienteId, Integer mes, Integer ano,
                                             List<String> especialidades, Boolean incluirInativos) {

        logger.info("=== BUSCA CORRIGIDA DE GUIAS ===");
        logger.info("Paciente: {}, Período: {}/{}, Especialidades: {}, Incluir Inativos: {}",
                pacienteId, mes, ano, especialidades, incluirInativos);

        try {
            // PASSO 1: Buscar TODAS as guias do paciente primeiro
            List<Guia> todasGuias = guiaRepository.findAll().stream()
                    .filter(g -> g.getPaciente() != null && g.getPaciente().getId().equals(pacienteId))
                    .collect(Collectors.toList());

            logger.info("Total de guias do paciente: {}", todasGuias.size());

            if (todasGuias.isEmpty()) {
                logger.warn("Paciente não possui nenhuma guia cadastrada");
                return new ArrayList<>();
            }

            // PASSO 2: Aplicar filtros progressivamente com logs
            List<Guia> guiasFiltradas = todasGuias;

            // Filtro 1: Status (mais permissivo)
            List<String> statusPermitidos = Arrays.asList(
                    "EMITIDO", "SUBIU", "ANALISE", "ASSINADO", "FATURADO",
                    "ENVIADO A BM", "DEVOLVIDO A BM", "APROVADO", "PENDENTE"
            );

            if (incluirInativos != null && incluirInativos) {
                statusPermitidos = Arrays.asList(
                        "EMITIDO", "SUBIU", "ANALISE", "CANCELADO", "RETORNOU",
                        "ASSINADO", "FATURADO", "ENVIADO A BM", "DEVOLVIDO A BM",
                        "APROVADO", "PENDENTE", "REJEITADO", "SUSPENSO"
                );
            }
            final List<String> statusFinais = statusPermitidos;

            guiasFiltradas = guiasFiltradas.stream()
                    .filter(g -> statusFinais.contains(g.getStatus()))
                    .collect(Collectors.toList());

            logger.info("Após filtro de status: {} guias (status permitidos: {})",
                    guiasFiltradas.size(), statusPermitidos);

            // Filtro 2: Especialidades (mais flexível)
            if (especialidades != null && !especialidades.isEmpty()) {
                List<Guia> guiasAntes = new ArrayList<>(guiasFiltradas);

                guiasFiltradas = guiasFiltradas.stream()
                        .filter(g -> {
                            // Se guia não tem especialidades definidas, aceitar
                            if (g.getEspecialidades() == null || g.getEspecialidades().isEmpty()) {
                                logger.debug("Guia {} aceita: sem especialidades definidas", g.getId());
                                return true;
                            }

                            // Verificar se alguma especialidade da guia corresponde ao solicitado
                            boolean match = g.getEspecialidades().stream()
                                    .anyMatch(esp -> especialidades.stream()
                                            .anyMatch(solicitada ->
                                                    esp.toLowerCase().contains(solicitada.toLowerCase()) ||
                                                            solicitada.toLowerCase().contains(esp.toLowerCase())));

                            logger.debug("Guia {} especialidades {} vs solicitadas {} = {}",
                                    g.getId(), g.getEspecialidades(), especialidades, match);

                            return match;
                        })
                        .collect(Collectors.toList());

                logger.info("Após filtro de especialidades: {} guias (de {} antes do filtro)",
                        guiasFiltradas.size(), guiasAntes.size());
            }

            // Filtro 3: Atividade (MUITO flexível - últimos 12 meses)
            LocalDateTime dataLimite = LocalDateTime.now().minusMonths(12);

            List<Guia> guiasAntes = new ArrayList<>(guiasFiltradas);
            guiasFiltradas = guiasFiltradas.stream()
                    .filter(g -> {
                        boolean temAtividade = (g.getCreatedAt() != null && g.getCreatedAt().isAfter(dataLimite)) ||
                                (g.getUpdatedAt() != null && g.getUpdatedAt().isAfter(dataLimite));

                        if (!temAtividade) {
                            logger.debug("Guia {} rejeitada por falta de atividade (última atividade: {})",
                                    g.getId(), g.getUpdatedAt() != null ? g.getUpdatedAt() : g.getCreatedAt());
                        }

                        return temAtividade;
                    })
                    .collect(Collectors.toList());

            logger.info("Após filtro de atividade (12 meses): {} guias (de {} antes do filtro)",
                    guiasFiltradas.size(), guiasAntes.size());

            // Se ainda não temos guias, ser AINDA MAIS flexível
            if (guiasFiltradas.isEmpty() && !todasGuias.isEmpty()) {
                logger.warn("Filtros normais não retornaram guias. Aplicando filtros ultra-flexíveis...");

                // Filtro ultra-flexível: apenas status não-excluído e atividade nos últimos 2 anos
                LocalDateTime doisAnosAtras = LocalDateTime.now().minusYears(2);

                guiasFiltradas = todasGuias.stream()
                        .filter(g -> !Arrays.asList("EXCLUIDO", "CANCELADO_DEFINITIVO").contains(g.getStatus()))
                        .filter(g -> (g.getCreatedAt() != null && g.getCreatedAt().isAfter(doisAnosAtras)) ||
                                (g.getUpdatedAt() != null && g.getUpdatedAt().isAfter(doisAnosAtras)))
                        .sorted((g1, g2) -> {
                            // Ordenar por data de atualização mais recente
                            LocalDateTime d1 = g1.getUpdatedAt() != null ? g1.getUpdatedAt() : g1.getCreatedAt();
                            LocalDateTime d2 = g2.getUpdatedAt() != null ? g2.getUpdatedAt() : g2.getCreatedAt();
                            return d2 != null && d1 != null ? d2.compareTo(d1) : 0;
                        })
                        .collect(Collectors.toList());

                logger.info("Após filtros ultra-flexíveis: {} guias", guiasFiltradas.size());
            }

            // Log final detalhado
            if (!guiasFiltradas.isEmpty()) {
                logger.info("=== GUIAS APROVADAS ===");
                for (Guia guia : guiasFiltradas) {
                    logger.info("Guia APROVADA: ID={}, Status={}, Especialidades={}, Validade={}, Atualizada={}",
                            guia.getId(), guia.getStatus(), guia.getEspecialidades(),
                            guia.getValidade(), guia.getUpdatedAt());
                }
                logger.info("=== FIM GUIAS APROVADAS ===");
            } else {
                logger.warn("=== NENHUMA GUIA APROVADA ===");
                logger.warn("Detalhes das guias originais:");
                for (Guia guia : todasGuias) {
                    logger.warn("Guia REJEITADA: ID={}, Status={}, Especialidades={}, Validade={}, Criada={}, Atualizada={}",
                            guia.getId(), guia.getStatus(), guia.getEspecialidades(),
                            guia.getValidade(), guia.getCreatedAt(), guia.getUpdatedAt());
                }
            }

            return guiasFiltradas;

        } catch (Exception e) {
            logger.error("Erro na busca corrigida de guias: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Busca itens para convênio (para antecipação de fichas)
     */
    private List<FichaPdfItemDto> buscarItensParaConvenio(FichaPdfConvenioRequest request) {
        logger.info("Buscando itens para convênio: {} - {}/{}", request.getConvenioId(), request.getMes(), request.getAno());

        // Buscar pacientes do convênio
        List<Paciente> pacientes = pacienteRepository.findByConvenioId(request.getConvenioId());

        if (pacientes.isEmpty()) {
            logger.warn("Nenhum paciente encontrado para o convênio: {}", request.getConvenioId());
            return new ArrayList<>();
        }

        List<FichaPdfItemDto> todosItens = new ArrayList<>();

        for (Paciente paciente : pacientes) {
            // Para geração por convênio, considerar guias que podem ser antecipadas
            List<Guia> guiasAntecipadas = buscarGuiasParaAntecipacao(
                    paciente.getId(),
                    request.getMes(),
                    request.getAno(),
                    request.getEspecialidades()
            );

            for (Guia guia : guiasAntecipadas) {
                List<FichaPdfItemDto> itensGuia = processarGuiasParaFichas(Arrays.asList(guia), request.getMes(), request.getAno());
                todosItens.addAll(itensGuia);
            }
        }

        logger.info("Encontrados {} itens para antecipação no convênio", todosItens.size());
        return todosItens;
    }

    /**
     * Busca guias que podem ser antecipadas para o próximo mês
     */
    private List<Guia> buscarGuiasParaAntecipacao(UUID pacienteId, Integer mes, Integer ano, List<String> especialidades) {
        // Status mais permissivos para antecipação
        List<String> statusAntecipacao = Arrays.asList(
                "EMITIDO", "SUBIU", "ANALISE", "ASSINADO", "FATURADO"
        );

        List<Guia> guias = guiaRepository.findGuiasAtivasParaFichas(pacienteId, statusAntecipacao, especialidades);

        // Filtrar guias que são válidas para antecipação
        return guias.stream()
                .filter(guia -> isGuiaValidaParaAntecipacao(guia, mes, ano))
                .collect(Collectors.toList());
    }

    /**
     * Verifica se guia é válida para antecipação
     */
    private boolean isGuiaValidaParaAntecipacao(Guia guia, Integer mes, Integer ano) {
        // Verificar se a guia não vence antes do mês de antecipação
        LocalDate dataAntecipacao = LocalDate.of(ano, mes, 1);

        if (guia.getValidade() != null && guia.getValidade().isBefore(dataAntecipacao)) {
            return false;
        }

        // Verificar se ainda possui quantidade disponível
        if (guia.getQuantidadeRestante() != null && guia.getQuantidadeRestante() <= 0) {
            return false;
        }

        // Guias mais recentes têm prioridade para antecipação
        LocalDateTime tresMesesAtras = LocalDateTime.now().minusMonths(3);
        return guia.getCreatedAt() != null && guia.getCreatedAt().isAfter(tresMesesAtras);
    }

    private boolean isGuiaValidaBasica(Guia guia) {
        // Verificar se guia não está expirada há muito tempo
        if (guia.getValidade() != null) {
            LocalDate dataLimite = LocalDate.now().minusMonths(12); // 12 meses de tolerância
            if (guia.getValidade().isBefore(dataLimite)) {
                return false;
            }
        }

        // Verificar quantidade (mais flexível)
        if (guia.getQuantidadeRestante() != null && guia.getQuantidadeRestante() < -10) {
            // Permitir até -10 de quantidade (tolerância para casos especiais)
            return false;
        }

        return true;
    }

    private boolean isGuiaValidaParaPeriodo(Guia guia, Integer mes, Integer ano) {
        // Caso 1: Guia específica para o mês/ano
        if (guia.getMes() != null && guia.getAno() != null) {
            return guia.getMes().equals(mes) && guia.getAno().equals(ano);
        }

        // Caso 2: Guia válida por validade
        LocalDate dataRequerida = LocalDate.of(ano, mes, 1);
        LocalDate fimMes = dataRequerida.withDayOfMonth(dataRequerida.lengthOfMonth());

        if (guia.getValidade() != null) {
            // Guia deve estar válida durante todo o mês solicitado
            return !guia.getValidade().isBefore(dataRequerida);
        }

        // Caso 3: Para guias sem validade específica, verificar se é do período recente
        if (guia.getCreatedAt() != null) {
            LocalDate dataCriacao = guia.getCreatedAt().toLocalDate();
            LocalDate limitePosterior = dataRequerida.plusMonths(3); // Permitir 3 meses para frente
            LocalDate limiteAnterior = dataRequerida.minusMonths(6);  // Permitir 6 meses para trás

            return !dataCriacao.isBefore(limiteAnterior) && !dataCriacao.isAfter(limitePosterior);
        }

        return true; // Se não há critérios específicos, aceitar
    }

    private boolean temAtividadeRecenteFlexivel(Guia guia, LocalDateTime dataLimite) {
        // Verificar criação OU atualização
        boolean atividadeRecente = false;

        if (guia.getCreatedAt() != null && guia.getCreatedAt().isAfter(dataLimite)) {
            atividadeRecente = true;
        }

        if (guia.getUpdatedAt() != null && guia.getUpdatedAt().isAfter(dataLimite)) {
            atividadeRecente = true;
        }

        // Se não tem atividade recente, mas foi criada recentemente, aceitar
        if (!atividadeRecente && guia.getCreatedAt() != null) {
            LocalDateTime umAnoAtras = LocalDateTime.now().minusYears(1);
            atividadeRecente = guia.getCreatedAt().isAfter(umAnoAtras);
        }

        return atividadeRecente;
    }

    private void logDetalhesGuiasPaciente(UUID pacienteId, List<Guia> guiasEncontradas) {
        logger.info("=== DEBUGGING: Detalhes das guias encontradas para paciente {} ===", pacienteId);

        for (Guia guia : guiasEncontradas) {
            logger.info("Guia ID: {} | Status: {} | Validade: {} | Criada: {} | Atualizada: {} | Qtd Restante: {}",
                    guia.getId(),
                    guia.getStatus(),
                    guia.getValidade(),
                    guia.getCreatedAt(),
                    guia.getUpdatedAt(),
                    guia.getQuantidadeRestante()
            );

            if (guia.getEspecialidades() != null) {
                logger.info("  Especialidades: {}", String.join(", ", guia.getEspecialidades()));
            }
        }

        logger.info("=== FIM DEBUGGING ===");
    }


    private List<FichaPdfItemDto> processarGuiasParaFichas(List<Guia> guias, Integer mes, Integer ano) {
        List<FichaPdfItemDto> itens = new ArrayList<>();

        for (Guia guia : guias) {
            // Processar cada especialidade da guia
            if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                for (String especialidade : guia.getEspecialidades()) {
                    FichaPdfItemDto item = criarItemFicha(guia, especialidade, mes, ano);
                    itens.add(item);
                }
            } else {
                // Criar ficha sem especialidade específica
                FichaPdfItemDto item = criarItemFicha(guia, "Não informado", mes, ano);
                itens.add(item);
            }
        }

        return itens;
    }

    private boolean temAtividadeRecente(Guia guia, LocalDateTime dataLimite) {
        return temAtividadeRecenteFlexivel(guia, dataLimite);
    }

    private boolean isGuiaValidaParaMes(Guia guia, Integer mes, Integer ano) {
        return isGuiaValidaParaPeriodo(guia, mes, ano);
    }

    private FichaPdfItemDto criarItemFicha(Guia guia, String especialidade, Integer mes, Integer ano) {
        FichaPdfItemDto item = new FichaPdfItemDto();

        item.setPacienteId(guia.getPaciente().getId());
        item.setPacienteNome(guia.getPaciente().getNome());
        item.setEspecialidade(especialidade);
        item.setMes(mes);
        item.setAno(ano);
        item.setMesExtenso(getMesExtenso(mes));

        // Gerar número de identificação único
        String prefixo = getPrefixoIdentificacao(guia.getConvenio().getId());
        item.setNumeroIdentificacao(prefixo + gerarNumeroUnico());

        item.setConvenioId(guia.getConvenio().getId());
        item.setConvenioNome(guia.getConvenio().getName());

        if (guia.getPaciente().getUnidade() != null) {
            item.setUnidade(guia.getPaciente().getUnidade().name());
        }

        item.setGuiaId(guia.getId());
        item.setNumeroGuia(guia.getNumeroGuia());
        item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());
        item.setUltimaAtividade(guia.getUpdatedAt());

        return item;
    }

    private FichaPdfJob criarJob(String jobId, FichaPdfJob.TipoGeracao tipo, User usuario) {
        FichaPdfJob job = new FichaPdfJob();
        job.setJobId(jobId);
        job.setTipo(tipo);
        job.setUsuario(usuario);
        job.setStatus(FichaPdfJob.StatusJob.INICIADO);
        job.setIniciado(LocalDateTime.now());
        job.setTotalFichas(0);
        job.setFichasProcessadas(0);

        return jobRepository.save(job);
    }

    private void atualizarProgressoJob(String jobId, int processadas) {
        try {
            Optional<FichaPdfJob> jobOpt = jobRepository.findByJobId(jobId);
            if (jobOpt.isPresent()) {
                FichaPdfJob job = jobOpt.get();
                job.setFichasProcessadas(processadas);
                jobRepository.save(job);
                logger.debug("Progresso atualizado - Job: {}, Processadas: {}", jobId, processadas);
            }
        } catch (Exception e) {
            logger.warn("Erro ao atualizar progresso do job {}: {}", jobId, e.getMessage());
        }
    }

    private void finalizarJobComErro(FichaPdfJob job, Exception e) {
        job.setStatus(FichaPdfJob.StatusJob.ERRO);
        job.setErro(e.getMessage());
        job.setConcluido(LocalDateTime.now());
        jobRepository.save(job);
    }

    private void registrarLogsFichas(FichaPdfJob job, List<FichaPdfItemDto> itens) {
        List<FichaPdfLog> logs = new ArrayList<>();

        for (FichaPdfItemDto item : itens) {
            FichaPdfLog log = criarLogItem(job, item);
            logs.add(log);
        }

        logRepository.saveAll(logs);
        logger.info("Registrados {} logs para o job {}", logs.size(), job.getJobId());
    }

    private FichaPdfLog criarLogItem(FichaPdfJob job, FichaPdfItemDto item) {
        Paciente paciente = pacienteRepository.findById(item.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado: " + item.getPacienteId()));

        FichaPdfLog log = new FichaPdfLog();
        log.setJob(job);
        log.setPaciente(paciente);
        log.setEspecialidade(item.getEspecialidade());
        log.setNumeroIdentificacao(item.getNumeroIdentificacao());
        log.setMes(item.getMes());
        log.setAno(item.getAno());
        log.setQuantidadeAutorizada(item.getQuantidadeAutorizada());
        log.setProcessadoComSucesso(true);

        // Adicionar referência à guia se disponível
        if (item.getGuiaId() != null) {
            Guia guia = guiaRepository.findById(item.getGuiaId()).orElse(null);
            log.setGuiaOrigem(guia);
        }

        return log;
    }

    private String salvarArquivoPdf(byte[] pdfBytes, String jobId) {
        String nomeArquivo = String.format("fichas_%s.pdf", jobId);
        String caminhoCompleto = pdfStoragePath + "/" + nomeArquivo;

        try {
            // Criar diretórios se não existirem
            java.nio.file.Path diretorio = java.nio.file.Paths.get(pdfStoragePath);
            if (!java.nio.file.Files.exists(diretorio)) {
                java.nio.file.Files.createDirectories(diretorio);
            }

            java.nio.file.Files.write(java.nio.file.Paths.get(caminhoCompleto), pdfBytes);
            logger.info("PDF salvo em: {}", caminhoCompleto);
            return caminhoCompleto;
        } catch (Exception e) {
            logger.error("Erro ao salvar PDF: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar arquivo PDF", e);
        }
    }

    private FichaPdfResponseDto buildResponse(FichaPdfJob job, String mensagem) {
        return FichaPdfResponseDto.builder()
                .sucesso(job.getStatus() != FichaPdfJob.StatusJob.ERRO)
                .mensagem(mensagem)
                .jobId(job.getJobId())
                .totalFichasGeradas(job.getFichasProcessadas())
                .totalPacientesProcessados(calcularTotalPacientes(job))
                .iniciadoEm(job.getIniciado())
                .concluidoEm(job.getConcluido())
                .build();
    }

    private Integer calcularTotalPacientes(FichaPdfJob job) {
        try {
            List<FichaPdfLog> logs = logRepository.findByJobIdOrderByCreatedAtAsc(job.getId());
            return (int) logs.stream()
                    .map(log -> log.getPaciente().getId())
                    .distinct()
                    .count();
        } catch (Exception e) {
            logger.warn("Erro ao calcular total de pacientes para job {}: {}", job.getJobId(), e.getMessage());
            return 0;
        }
    }

    private FichaPdfStatusDto buildStatusDto(FichaPdfJob job) {
        FichaPdfStatusDto status = new FichaPdfStatusDto();
        status.setJobId(job.getJobId());
        status.setStatus(job.getStatus());
        status.setTotalItens(job.getTotalFichas());
        status.setItensProcessados(job.getFichasProcessadas());
        status.setIniciadoEm(job.getIniciado());
        status.setAtualizadoEm(job.getUpdatedAt());
        status.setPodeDownload(job.isPodeDownload());

        // Calcular progresso
        if (job.getTotalFichas() != null && job.getTotalFichas() > 0) {
            int progresso = (int) ((double) job.getFichasProcessadas() / job.getTotalFichas() * 100);
            status.setProgresso(progresso);
        } else {
            status.setProgresso(0);
        }

        // Mensagem baseada no status
        switch (job.getStatus()) {
            case INICIADO:
                status.setMensagem("Preparando geração...");
                break;
            case PROCESSANDO:
                status.setMensagem(String.format("Processando fichas: %d/%d",
                        job.getFichasProcessadas(), job.getTotalFichas()));
                break;
            case CONCLUIDO:
                status.setMensagem("Geração concluída com sucesso");
                break;
            case ERRO:
                status.setMensagem("Erro no processamento: " + job.getErro());
                break;
            default:
                status.setMensagem("Status desconhecido");
        }

        status.setObservacoes(job.getObservacoes());
        return status;
    }

    private FichaPdfJobDto mapJobToDto(FichaPdfJob job) {
        FichaPdfJobDto dto = new FichaPdfJobDto();
        dto.setJobId(job.getJobId());
        dto.setTipo(job.getTipo().name());
        dto.setStatus(job.getStatus().name());
        dto.setTotalFichas(job.getTotalFichas());
        dto.setFichasProcessadas(job.getFichasProcessadas());
        dto.setIniciado(job.getIniciado());
        dto.setConcluido(job.getConcluido());
        dto.setPodeDownload(job.isPodeDownload());
        dto.setObservacoes(job.getObservacoes());

        if (job.isPodeDownload()) {
            dto.setDownloadUrl("/api/fichas-pdf/download/" + job.getJobId());
        }

        return dto;
    }

    private ConvenioDto mapConvenioToDto(Convenio convenio) {
        ConvenioDto dto = new ConvenioDto();
        dto.setId(convenio.getId());
        dto.setName(convenio.getName());
        return dto;
    }

    private User getCurrentUser() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            if (principal instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) principal;
                return userRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userDetails.getUsername()));
            } else {
                throw new RuntimeException("Principal não é uma instância de UserDetails");
            }
        } catch (Exception e) {
            logger.error("Erro ao obter usuário atual: {}", e.getMessage());
            throw new RuntimeException("Erro ao obter usuário atual", e);
        }
    }

    private boolean isAdmin(User user) {
        try {
            List<String> userRoles = userRepository.findRoleNamesByUserId(user.getId());

            return userRoles.stream()
                    .anyMatch(role -> role.equalsIgnoreCase("ADMIN") ||
                            role.equalsIgnoreCase("ROLE_ADMIN") ||
                            role.equalsIgnoreCase("ADMINISTRATOR"));
        } catch (Exception e) {
            logger.warn("Erro ao verificar se usuário é admin: {}", e.getMessage());
            return false;
        }
    }

    private boolean isConvenioHabilitado(UUID convenioId) {
        return configRepository.findByConvenioId(convenioId)
                .map(ConvenioFichaPdfConfig::getHabilitado)
                .orElse(false);
    }

    private String getPrefixoIdentificacao(UUID convenioId) {
        return configRepository.findByConvenioId(convenioId)
                .map(ConvenioFichaPdfConfig::getPrefixoIdentificacao)
                .filter(prefixo -> prefixo != null && !prefixo.trim().isEmpty())
                .orElse("PNE");
    }

    private String gerarNumeroUnico() {
        // Gerar número único com timestamp para evitar duplicatas
        long timestamp = System.currentTimeMillis();
        int random = new Random().nextInt(1000);
        return String.format("%d%03d", timestamp % 10000, random);
    }

    private String getMesExtenso(Integer mes) {
        try {
            return java.time.Month.of(mes).getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
        } catch (Exception e) {
            logger.warn("Erro ao obter mês por extenso para {}: {}", mes, e.getMessage());
            return "Mês " + mes;
        }
    }
}