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
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Paths;
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
        logger.info("Paciente: {}, Período: {}/{}", request.getPacienteId(), request.getMes(), request.getAno());

        try {
            // PASSO 1: Buscar itens
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

            List<FichaPdfLog> logs = new ArrayList<>();

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

                    // Adicionar referência à guia se disponível
                    if (item.getGuiaId() != null) {
                        Optional<Guia> guiaOpt = guiaRepository.findById(item.getGuiaId());
                        guiaOpt.ifPresent(log::setGuiaOrigem);
                    }

                    logs.add(log);

                } catch (Exception e) {
                    logger.warn("Erro ao criar log para item {}: {}",
                            item.getNumeroIdentificacao(), e.getMessage());
                    // Continuar com próximo item
                }
            }

            if (!logs.isEmpty()) {
                logRepository.saveAll(logs);
                logger.info("Registrados {} logs para o job {}", logs.size(), job.getJobId());
            }

        } catch (Exception e) {
            logger.error("Erro geral ao registrar logs: {}", e.getMessage(), e);
            // Não interromper o processo principal
        }
    }

    /**
     * NOVO MÉTODO: Gera fichas PDF para um convênio específico com jobId fornecido
     *
     */
    @Override
    @Async("fichaPdfTaskExecutor")
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasConvenioComJobId(FichaPdfConvenioRequest request, String jobId) {
        logger.info("Iniciando geração assíncrona de fichas por convênio com jobId fornecido: {} - {}/{} - JobId: {}",
                request.getConvenioId(), request.getMes(), request.getAno(), jobId);

        try {
            // Obter o usuário ANTES de criar o job (SecurityContext ainda disponível)
            User usuarioAtual = getCurrentUser();
            logger.info("Usuário obtido com sucesso: {}", usuarioAtual.getEmail());

            // Criar job com usuário já obtido
            FichaPdfJob job = criarJobComUsuario(jobId, FichaPdfJob.TipoGeracao.CONVENIO, usuarioAtual);
            logger.info("Job criado com sucesso: {}", job.getJobId());

            // Buscar todos os itens do convênio
            List<FichaPdfItemDto> todosItens = buscarItensParaConvenio(request);

            if (todosItens.isEmpty()) {
                finalizarJobComErro(job, new RuntimeException("Nenhuma guia ativa encontrada para o convênio"));
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma guia encontrada"));
            }

            // Filtrar pacientes que já possuem fichas
            List<UUID> pacientesOriginais = todosItens.stream()
                    .map(FichaPdfItemDto::getPacienteId)
                    .distinct()
                    .collect(Collectors.toList());

            List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                    request.getConvenioId(), request.getMes(), request.getAno(), pacientesOriginais);

            // Filtrar itens apenas para pacientes sem fichas
            List<FichaPdfItemDto> itensParaProcessar = todosItens.stream()
                    .filter(item -> pacientesSemFichas.contains(item.getPacienteId()))
                    .collect(Collectors.toList());

            if (itensParaProcessar.isEmpty()) {
                finalizarJobComSucesso(job, "Todos os pacientes já possuem fichas geradas para este período");
                return CompletableFuture.completedFuture(buildResponse(job, "Fichas já existem"));
            }

            // Atualizar job com total de fichas
            job.setTotalFichas(itensParaProcessar.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // CORREÇÃO 1: Usar o método correto do generator
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(
                    itensParaProcessar,
                    request.getMes(),
                    request.getAno(),
                    progresso -> {
                        // Callback de progresso se necessário
                        logger.debug("Progresso da geração: {}/{} fichas", progresso, itensParaProcessar.size());
                        atualizarProgressoJob(jobId, progresso);
                    }
            );

            // CORREÇÃO 2: Usar o método próprio para salvar arquivo
            String caminhoArquivo = salvarArquivoPdf(pdfBytes, jobId);

            // Finalizar job com sucesso
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setArquivoPath(caminhoArquivo);
            job.setPodeDownload(true);
            job.setConcluido(LocalDateTime.now());
            job.setFichasProcessadas(itensParaProcessar.size());
            jobRepository.save(job);

            // Registrar logs
            registrarLogsFichasSeguro(job, itensParaProcessar);

            logger.info("✅ Fichas geradas com sucesso para o convênio {} - JobId: {}",
                    request.getConvenioId(), jobId);

            return CompletableFuture.completedFuture(buildResponse(job, "Sucesso"));

        } catch (Exception e) {
            logger.error("❌ Erro na geração assíncrona de fichas: {}", e.getMessage(), e);

            // Tentar buscar o job para marcar como erro
            try {
                Optional<FichaPdfJob> jobOpt = jobRepository.findByJobId(jobId);
                if (jobOpt.isPresent()) {
                    finalizarJobComErro(jobOpt.get(), e);
                } else {
                    // Se o job não foi criado, criar um job de erro
                    FichaPdfJob errorJob = new FichaPdfJob();
                    errorJob.setJobId(jobId);
                    errorJob.setTipo(FichaPdfJob.TipoGeracao.CONVENIO);
                    errorJob.setStatus(FichaPdfJob.StatusJob.ERRO);
                    errorJob.setIniciado(LocalDateTime.now());
                    errorJob.setConcluido(LocalDateTime.now());
                    errorJob.setErro(e.getMessage());
                    errorJob.setTotalFichas(0);
                    errorJob.setFichasProcessadas(0);

                    // Tentar definir usuário se possível
                    try {
                        User usuario = getCurrentUser();
                        errorJob.setUsuario(usuario);
                    } catch (Exception ex) {
                        logger.warn("Não foi possível definir usuário para job de erro: {}", ex.getMessage());
                    }

                    jobRepository.save(errorJob);
                }
            } catch (Exception ex) {
                logger.error("Erro adicional ao marcar job como erro: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(FichaPdfResponseDto.builder()
                    .sucesso(false)
                    .mensagem("Erro interno: " + e.getMessage())
                    .build());
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

            //Filtrar pacientes que já possuem fichas
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
                        // Callback se necessário será implementado
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

    /**
     * MÉTODO ALTERNATIVO: Gera fichas PDF para um convênio com usuário fornecido explicitamente
     * Esta versão resolve o problema do SecurityContext perdido em threads assíncronas
     */
    @Override
    @Async("fichaPdfTaskExecutor")
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasConvenioComJobIdEUsuario(
            FichaPdfConvenioRequest request, String jobId, User usuario) {

        logger.info("Iniciando geração assíncrona com usuário fornecido: {} - {}/{} - JobId: {} - Usuário: {}",
                request.getConvenioId(), request.getMes(), request.getAno(), jobId, usuario.getEmail());

        try {
            // Criar job com usuário já fornecido (sem usar getCurrentUser())
            FichaPdfJob job = criarJobComUsuario(jobId, FichaPdfJob.TipoGeracao.CONVENIO, usuario);
            logger.info("Job criado com sucesso: {}", job.getJobId());

            // Buscar todos os itens do convênio
            List<FichaPdfItemDto> todosItens = buscarItensParaConvenio(request);

            if (todosItens.isEmpty()) {
                finalizarJobComErro(job, new RuntimeException("Nenhuma guia ativa encontrada para o convênio"));
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma guia encontrada"));
            }

            // Filtrar pacientes que já possuem fichas
            List<UUID> pacientesOriginais = todosItens.stream()
                    .map(FichaPdfItemDto::getPacienteId)
                    .distinct()
                    .collect(Collectors.toList());

            List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                    request.getConvenioId(), request.getMes(), request.getAno(), pacientesOriginais);

            // Filtrar itens apenas para pacientes sem fichas
            List<FichaPdfItemDto> itensParaProcessar = todosItens.stream()
                    .filter(item -> pacientesSemFichas.contains(item.getPacienteId()))
                    .collect(Collectors.toList());

            if (itensParaProcessar.isEmpty()) {
                finalizarJobComSucesso(job, "Todos os pacientes já possuem fichas geradas para este período");
                return CompletableFuture.completedFuture(buildResponse(job, "Fichas já existem"));
            }

            // Atualizar job com total de fichas
            job.setTotalFichas(itensParaProcessar.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // Gerar PDF
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(
                    itensParaProcessar,
                    request.getMes(),
                    request.getAno(),
                    progresso -> {
                        logger.debug("Progresso da geração: {}/{} fichas", progresso, itensParaProcessar.size());
                        atualizarProgressoJob(jobId, progresso);
                    }
            );

            // Salvar arquivo
            String caminhoArquivo = salvarArquivoPdf(pdfBytes, jobId);

            // Finalizar job com sucesso
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setArquivoPath(caminhoArquivo);
            job.setPodeDownload(true);
            job.setConcluido(LocalDateTime.now());
            job.setFichasProcessadas(itensParaProcessar.size());
            jobRepository.save(job);

            // Registrar logs
            registrarLogsFichasSeguro(job, itensParaProcessar);

            logger.info("✅ Fichas geradas com sucesso para o convênio {} - JobId: {} - Usuário: {}",
                    request.getConvenioId(), jobId, usuario.getEmail());

            return CompletableFuture.completedFuture(buildResponse(job, "Sucesso"));

        } catch (Exception e) {
            logger.error("❌ Erro na geração assíncrona de fichas com usuário fornecido: {}", e.getMessage(), e);

            // Tentar buscar o job para marcar como erro
            try {
                Optional<FichaPdfJob> jobOpt = jobRepository.findByJobId(jobId);
                if (jobOpt.isPresent()) {
                    finalizarJobComErro(jobOpt.get(), e);
                } else {
                    // Se o job não foi criado, criar um job de erro
                    FichaPdfJob errorJob = new FichaPdfJob();
                    errorJob.setJobId(jobId);
                    errorJob.setTipo(FichaPdfJob.TipoGeracao.CONVENIO);
                    errorJob.setStatus(FichaPdfJob.StatusJob.ERRO);
                    errorJob.setIniciado(LocalDateTime.now());
                    errorJob.setConcluido(LocalDateTime.now());
                    errorJob.setErro(e.getMessage());
                    errorJob.setTotalFichas(0);
                    errorJob.setFichasProcessadas(0);
                    errorJob.setUsuario(usuario); // Usar o usuário fornecido

                    jobRepository.save(errorJob);
                }
            } catch (Exception ex) {
                logger.error("Erro adicional ao marcar job como erro: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(FichaPdfResponseDto.builder()
                    .sucesso(false)
                    .mensagem("Erro interno: " + e.getMessage())
                    .build());
        }
    }

    @Override
    @Async
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasLoteComJobId(FichaPdfLoteRequest request, String jobId) {
        logger.info("Iniciando geração em lote para {} convênios com jobId fornecido: {}", request.getConvenioIds().size(), jobId);

        User currentUser = getCurrentUser();
        FichaPdfJob job = criarJob(jobId, FichaPdfJob.TipoGeracao.LOTE, currentUser);

        try {
            List<FichaPdfItemDto> todosItens = new ArrayList<>();

            // Processar cada convênio
            for (UUID convenioId : request.getConvenioIds()) {
                FichaPdfConvenioRequest convenioRequest = new FichaPdfConvenioRequest();
                convenioRequest.setConvenioId(convenioId);
                convenioRequest.setMes(request.getMes());
                convenioRequest.setAno(request.getAno());

                List<FichaPdfItemDto> itensConvenio = buscarItensParaConvenio(convenioRequest);

                // Filtrar pacientes que já possuem fichas
                List<UUID> pacientesOriginais = itensConvenio.stream()
                        .map(FichaPdfItemDto::getPacienteId)
                        .distinct()
                        .collect(Collectors.toList());

                List<UUID> pacientesSemFichas = fichaVerificationService.filtrarPacientesSemFichas(
                        convenioId, request.getMes(), request.getAno(), pacientesOriginais);

                List<FichaPdfItemDto> itensFiltrados = itensConvenio.stream()
                        .filter(item -> pacientesSemFichas.contains(item.getPacienteId()))
                        .collect(Collectors.toList());

                // Verificar e corrigir duplicatas
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

        if (!job.isPodeDownloadLogico()) {
            logger.warn("Job {} não está disponível para download - Status: {}, podeDownload: {}, arquivo: {}",
                    jobId, job.getStatus(), job.getPodeDownload(), job.getArquivoPath());
            throw new IllegalStateException("PDF não está disponível para download");
        }

        // Verificar se é o próprio usuário ou admin
        User currentUser = getCurrentUser();
        if (!job.getUsuario().getId().equals(currentUser.getId()) && !isAdmin(currentUser)) {
            throw new IllegalStateException("Sem permissão para baixar este arquivo");
        }

        if (!Files.exists(Paths.get(job.getArquivoPath()))) {
            logger.error("Arquivo físico não encontrado para job {}: {}", jobId, job.getArquivoPath());

            // CORREÇÃO AUTOMÁTICA: Marcar o job como sem download disponível
            job.setPodeDownload(false);
            job.setObservacoes("Arquivo físico não encontrado - removido automaticamente");
            jobRepository.save(job);

            throw new IllegalStateException("Arquivo PDF não encontrado no sistema");
        }

        try {
            return pdfGeneratorService.lerArquivoPdf(job.getArquivoPath());
        } catch (Exception e) {
            logger.error("Erro ao ler arquivo PDF {}: {}", job.getArquivoPath(), e.getMessage(), e);

            // Se houve erro ao ler, também marcar como indisponível
            job.setPodeDownload(false);
            job.setObservacoes("Erro ao ler arquivo: " + e.getMessage());
            jobRepository.save(job);

            throw new RuntimeException("Erro ao ler arquivo PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void verificarIntegridadeJobs() {
        logger.info("Iniciando verificação de integridade dos jobs PDF");

        List<FichaPdfJob> jobsComDownload = jobRepository.findAll().stream()
                .filter(job -> job.getPodeDownload() != null && job.getPodeDownload())
                .collect(Collectors.toList());

        int jobsCorrigidos = 0;

        for (FichaPdfJob job : jobsComDownload) {
            if (job.getArquivoPath() != null && !Files.exists(Paths.get(job.getArquivoPath()))) {
                logger.warn("Arquivo não encontrado para job {}: {}", job.getJobId(), job.getArquivoPath());

                job.setPodeDownload(false);
                job.setObservacoes("Arquivo removido automaticamente - integridade verificada em " + LocalDateTime.now());
                jobRepository.save(job);

                jobsCorrigidos++;
            }
        }

        logger.info("Verificação de integridade concluída - {} jobs corrigidos", jobsCorrigidos);
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
        logger.info("Paciente: {}, Período: {}/{}", request.getPacienteId(), request.getMes(), request.getAno());

        // Verificar se paciente existe
        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado"));

        logger.info("Paciente encontrado: {} (Convênio: {})",
                paciente.getNome(),
                paciente.getConvenio() != null ? paciente.getConvenio().getName() : "Não informado");

        List<Guia> guias = buscarGuiasCorrigidas(request.getPacienteId(), request.getMes(), request.getAno(),
                request.getEspecialidades(), request.getIncluirInativos());

        logger.info("Guias encontradas após busca corrigida: {}", guias.size());

        if (guias.isEmpty()) {
            logger.warn("Nenhuma guia encontrada com busca corrigida");
            return new ArrayList<>();
        }

        // Processar guias para fichas com configuração de template
        return processarGuiasParaFichasComTemplate(guias, request.getMes(), request.getAno());
    }

    private List<FichaPdfItemDto> buscarItensParaConvenio(FichaPdfConvenioRequest request) {
        logger.info("=== BUSCAR ITENS PARA CONVÊNIO ===");
        logger.info("Convênio: {}, Período: {}/{}", request.getConvenioId(), request.getMes(), request.getAno());

        // Verificar se o convênio está habilitado
        if (!isConvenioHabilitado(request.getConvenioId())) {
            throw new IllegalArgumentException("Convênio não habilitado para geração de fichas PDF");
        }

        // NOVA LÓGICA: Obter configuração específica do convênio UMA VEZ
        Optional<ConvenioFichaPdfConfig> configOpt = configRepository.findByConvenioId(request.getConvenioId());
        ConvenioFichaPdfConfig config = configOpt.orElse(null);

        List<FichaPdfItemDto> todosItens = new ArrayList<>();

        // LÓGICA ORIGINAL: Buscar guias por convênio usando método existente
        List<String> statusAtivos = Arrays.asList(
                "EMITIDO", "SUBIU", "ANALISE", "ASSINADO", "FATURADO", "ENVIADO A BM"
        );

        List<Guia> guiasConvenio = guiaRepository.findByConvenioIdAndStatusIn(
                request.getConvenioId(), statusAtivos);

        logger.info("Guias ativas encontradas para o convênio: {}", guiasConvenio.size());

        // Filtrar por período se especificado
        Integer mes = request.getMes();
        Integer ano = request.getAno();

        if (mes != null && ano != null) {
            guiasConvenio = guiasConvenio.stream()
                    .filter(guia -> {
                        // Verificar se a guia está no período correto
                        return (guia.getMes() != null && guia.getMes().equals(mes) &&
                                guia.getAno() != null && guia.getAno().equals(ano)) ||
                                // OU se foi criada/atualizada no período
                                isGuiaNoMesAno(guia, mes, ano);
                    })
                    .collect(Collectors.toList());
        }

        logger.info("Guias após filtro de período: {}", guiasConvenio.size());

        // Processar cada guia para gerar itens (LÓGICA ORIGINAL)
        for (Guia guia : guiasConvenio) {
            if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                // Gerar uma ficha por especialidade
                for (String especialidade : guia.getEspecialidades()) {
                    FichaPdfItemDto item = criarItemFicha(guia, especialidade, mes, ano);

                    // ÚNICA MUDANÇA: Usar configuração específica do convênio
                    String htmlGerado = templateService.gerarHtmlComConfiguracaoConvenio(item, config);

                    // Armazenar o HTML no item para uso posterior
                    item.setHtmlGerado(htmlGerado);

                    todosItens.add(item);
                }
            } else {
                // Criar ficha sem especialidade específica
                FichaPdfItemDto item = criarItemFicha(guia, "Não informado", mes, ano);

                // ÚNICA MUDANÇA: Usar configuração específica do convênio
                String htmlGerado = templateService.gerarHtmlComConfiguracaoConvenio(item, config);

                // Armazenar o HTML no item para uso posterior
                item.setHtmlGerado(htmlGerado);

                todosItens.add(item);
            }
        }

        logger.info("Total de itens gerados para o convênio: {}", todosItens.size());
        return todosItens;
    }

    @Override
    @Transactional
    public void atualizarTemplateConvenio(UUID convenioId, String templatePersonalizado) {
        logger.info("Atualizando template do convênio {} para: {}", convenioId, templatePersonalizado);

        Convenio convenio = convenioRepository.findById(convenioId)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado: " + convenioId));

        // Buscar ou criar configuração
        ConvenioFichaPdfConfig config = configRepository.findByConvenioId(convenioId)
                .orElse(new ConvenioFichaPdfConfig());

        // Se não existe, criar nova configuração
        if (config.getId() == null) {
            config.setConvenio(convenio);
            config.setHabilitado(true); // Habilitar automaticamente quando configura template
            config.setDiasAtividade(30);
            config.setPrefixoIdentificacao("");
        }

        // Validar template se fornecido
        if (StringUtils.hasText(templatePersonalizado)) {
            boolean templateValido = templateService.temTemplateEspecificoPorConfig(config);
            if (!templateValido) {
                // Criar config temporária para teste
                ConvenioFichaPdfConfig tempConfig = new ConvenioFichaPdfConfig();
                tempConfig.setConvenio(convenio);
                tempConfig.setTemplatePersonalizado(templatePersonalizado);

                if (!templateService.temTemplateEspecificoPorConfig(tempConfig)) {
                    logger.warn("Template '{}' não encontrado, mas será salvo na configuração", templatePersonalizado);
                }
            }
        }

        config.setTemplatePersonalizado(templatePersonalizado);
        configRepository.save(config);

        logger.info("✅ Template do convênio {} atualizado com sucesso", convenio.getName());
    }

    @Override
    public List<Map<String, Object>> getTemplatesDisponiveis() {
        logger.info("Listando templates disponíveis");

        List<Map<String, Object>> templates = new ArrayList<>();

        // Template padrão (sempre disponível)
        templates.add(Map.of(
                "nome", "padrao",
                "descricao", "Template padrão do sistema",
                "disponivel", true,
                "tipo", "sistema"
        ));

        // Template FUSEX (hardcoded)
        templates.add(Map.of(
                "nome", "fusex",
                "descricao", "Template específico para FUSEX",
                "disponivel", true,
                "tipo", "sistema"
        ));

        // Buscar templates personalizados em arquivos (se habilitado)
        try {
            // Aqui você pode implementar busca por templates em diretório
            // Por exemplo: classpath:templates/fichas/*.html
            logger.debug("Busca por templates personalizados não implementada ainda");
        } catch (Exception e) {
            logger.warn("Erro ao buscar templates personalizados: {}", e.getMessage());
        }

        logger.info("✅ {} templates encontrados", templates.size());
        return templates;
    }


    private List<Guia> buscarGuiasCorrigidas(UUID pacienteId, Integer mes, Integer ano,
                                             List<String> especialidades, Boolean incluirInativos) {

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
//    private List<FichaPdfItemDto> buscarItensParaConvenio(FichaPdfConvenioRequest request) {
//        logger.info("Buscando itens para convênio: {} - {}/{}", request.getConvenioId(), request.getMes(), request.getAno());
//
//        // Buscar pacientes do convênio
//        List<Paciente> pacientes = pacienteRepository.findByConvenioId(request.getConvenioId());
//
//        if (pacientes.isEmpty()) {
//            logger.warn("Nenhum paciente encontrado para o convênio: {}", request.getConvenioId());
//            return new ArrayList<>();
//        }
//
//        List<FichaPdfItemDto> todosItens = new ArrayList<>();
//
//        for (Paciente paciente : pacientes) {
//            // Para geração por convênio, considerar guias que podem ser antecipadas
//            List<Guia> guiasAntecipadas = buscarGuiasParaAntecipacao(
//                    paciente.getId(),
//                    request.getMes(),
//                    request.getAno(),
//                    request.getEspecialidades()
//            );
//
//            for (Guia guia : guiasAntecipadas) {
//                List<FichaPdfItemDto> itensGuia = processarGuiasParaFichas(Arrays.asList(guia), request.getMes(), request.getAno());
//                todosItens.addAll(itensGuia);
//            }
//        }
//
//        logger.info("Encontrados {} itens para antecipação no convênio", todosItens.size());
//        return todosItens;
//    }

    /**
     * Busca guias que podem ser antecipadas para o próximo mês
     */
    private List<Guia> buscarGuiasParaAntecipacao(UUID pacienteId, Integer mes, Integer ano, List<String> especialidades) {
        // Status mais permissivos para antecipação
        List<String> statusAntecipacao = Arrays.asList(
                "EMITIDO", "SUBIU", "ANALISE", "ASSINADO", "FATURADO", "ENVIADO A BM"
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

    private List<FichaPdfItemDto> processarGuiasParaFichas(List<Guia> guias, Integer mes, Integer ano) {
        List<FichaPdfItemDto> itens = new ArrayList<>();

        for (Guia guia : guias) {
            // Processar cada especialidade da guia
            if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                for (String especialidade : guia.getEspecialidades()) {
                    FichaPdfItemDto item = criarItemFicha(guia, especialidade, mes, ano);

                    // NOVO: Gerar HTML usando template específico do convênio
                    String convenioNome = guia.getConvenio() != null ? guia.getConvenio().getName() : null;
                    String htmlGerado = templateService.gerarHtmlComTemplateConvenio(item, convenioNome);

                    // Armazenar o HTML no item para uso posterior
                    item.setHtmlGerado(htmlGerado);

                    itens.add(item);
                }
            } else {
                // Criar ficha sem especialidade específica
                FichaPdfItemDto item = criarItemFicha(guia, "Não informado", mes, ano);

                // NOVO: Gerar HTML usando template específico do convênio
                String convenioNome = guia.getConvenio() != null ? guia.getConvenio().getName() : null;
                String htmlGerado = templateService.gerarHtmlComTemplateConvenio(item, convenioNome);

                // Armazenar o HTML no item para uso posterior
                item.setHtmlGerado(htmlGerado);

                itens.add(item);
            }
        }

        return itens;
    }

    private List<FichaPdfItemDto> processarGuiasParaFichasComTemplate(List<Guia> guias, Integer mes, Integer ano) {
        List<FichaPdfItemDto> itens = new ArrayList<>();

        for (Guia guia : guias) {
            Optional<ConvenioFichaPdfConfig> configOpt = configRepository.findByConvenioId(guia.getConvenio().getId());
            ConvenioFichaPdfConfig config = configOpt.orElse(null);

            // Processar cada especialidade da guia (LÓGICA ORIGINAL)
            if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                for (String especialidade : guia.getEspecialidades()) {
                    FichaPdfItemDto item = criarItemFicha(guia, especialidade, mes, ano);

                    String htmlGerado = templateService.gerarHtmlComConfiguracaoConvenio(item, config);

                    // Armazenar o HTML no item para uso posterior
                    item.setHtmlGerado(htmlGerado);

                    itens.add(item);
                }
            } else {
                FichaPdfItemDto item = criarItemFicha(guia, "Não informado", mes, ano);

                String htmlGerado = templateService.gerarHtmlComConfiguracaoConvenio(item, config);

                // Armazenar o HTML no item para uso posterior
                item.setHtmlGerado(htmlGerado);

                itens.add(item);
            }
        }

        return itens;
    }

    private boolean isGuiaNoMesAno(Guia guia, Integer mes, Integer ano) {
        if (guia.getCreatedAt() != null) {
            int mesGuia = guia.getCreatedAt().getMonthValue();
            int anoGuia = guia.getCreatedAt().getYear();
            if (mesGuia == mes && anoGuia == ano) {
                return true;
            }
        }
        if (guia.getUpdatedAt() != null) {
            int mesGuia = guia.getUpdatedAt().getMonthValue();
            int anoGuia = guia.getUpdatedAt().getYear();
            if (mesGuia == mes && anoGuia == ano) {
                return true;
            }
        }
        return false;
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

    @Override
    public ConvenioFichaPdfConfigDto getConvenioConfig(UUID convenioId) {
        logger.info("Obtendo configuração PDF do convênio: {}", convenioId);

        Convenio convenio = convenioRepository.findById(convenioId)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado: " + convenioId));

        Optional<ConvenioFichaPdfConfig> configOpt = configRepository.findByConvenioId(convenioId);

        if (configOpt.isPresent()) {
            ConvenioFichaPdfConfig config = configOpt.get();
            return mapConfigToDto(config);
        } else {
            // Retornar configuração padrão para convênio não configurado ainda
            ConvenioFichaPdfConfigDto defaultConfig = new ConvenioFichaPdfConfigDto();
            defaultConfig.setConvenioId(convenioId.toString());
            defaultConfig.setConvenioNome(convenio.getName());
            defaultConfig.setHabilitado(false);
            defaultConfig.setDiasAtividade(30);
            defaultConfig.setFormatoPadrao("A4");
            defaultConfig.setIncluirLogo(true);
            defaultConfig.setIncluirCarimbo(true);
            defaultConfig.setObservacoes("");
            return defaultConfig;
        }
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

        FichaPdfJob jobSalvo = jobRepository.save(job);

        return jobSalvo;
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

    private FichaPdfJob criarJobComUsuario(String jobId, FichaPdfJob.TipoGeracao tipo, User usuario) {
        try {
            FichaPdfJob job = new FichaPdfJob();
            job.setJobId(jobId);
            job.setTipo(tipo);
            job.setUsuario(usuario);
            job.setStatus(FichaPdfJob.StatusJob.INICIADO);
            job.setIniciado(LocalDateTime.now());
            job.setTotalFichas(0);
            job.setFichasProcessadas(0);

            return jobRepository.save(job);

        } catch (Exception e) {
            logger.error("Erro crítico ao criar job: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao criar job: " + e.getMessage(), e);
        }
    }

    private void finalizarJobComSucesso(FichaPdfJob job, String mensagem) {
        job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
        job.setConcluido(LocalDateTime.now());
        job.setObservacoes(mensagem);
        job.setPodeDownload(false);
        jobRepository.save(job);
    }

    private void finalizarJobComErro(FichaPdfJob job, Exception e) {
        job.setStatus(FichaPdfJob.StatusJob.ERRO);
        job.setErro(e.getMessage());
        job.setConcluido(LocalDateTime.now());
        job.setPodeDownload(false);
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
        try {
            if (pdfBytes == null || pdfBytes.length == 0) {
                throw new IllegalArgumentException("PDF bytes não podem estar vazios");
            }

            String nomeArquivo = String.format("fichas_%s_%d.pdf", jobId, System.currentTimeMillis());
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
        status.setTipo(job.getTipo());
        status.setTotalItens(job.getTotalFichas());
        status.setItensProcessados(job.getFichasProcessadas());
        status.setIniciadoEm(job.getIniciado());
        status.setAtualizadoEm(job.getUpdatedAt());
        status.setPodeDownload(job.isPodeDownload());

        if (job.getUsuario() != null) {
            status.setUsuarioNome(job.getUsuario().getFullName());
            status.setUsuarioEmail(job.getUsuario().getEmail());
        }

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

        status.setDadosJob(buscarDadosContextuaisJob(job));

        status.setObservacoes(job.getObservacoes());
        return status;
    }

    private FichaPdfStatusDto.DadosJobDto buscarDadosContextuaisJob(FichaPdfJob job) {
        FichaPdfStatusDto.DadosJobDto dadosJob = new FichaPdfStatusDto.DadosJobDto();

        try {
            // Buscar logs do job para extrair informações contextuais
            List<FichaPdfLog> logs = logRepository.findByJobIdOrderByCreatedAtAsc(job.getId());

            if (!logs.isEmpty()) {
                FichaPdfLog primeiroLog = logs.get(0);

                // Dados do período
                if (primeiroLog.getMes() != null && primeiroLog.getAno() != null) {
                    dadosJob.setMes(primeiroLog.getMes());
                    dadosJob.setAno(primeiroLog.getAno());
                    dadosJob.setMesExtenso(getMesExtenso(primeiroLog.getMes()));
                    dadosJob.setPeriodo(dadosJob.getMesExtenso() + "/" + primeiroLog.getAno());
                }

                // Dados específicos por tipo de job
                switch (job.getTipo()) {
                    case PACIENTE:
                        // Para job de paciente, pegar dados do primeiro log
                        if (primeiroLog.getPaciente() != null) {
                            dadosJob.setPacienteNome(primeiroLog.getPaciente().getNome());
                            dadosJob.setPacienteId(primeiroLog.getPaciente().getId().toString());

                            // Pegar convênio do paciente
                            if (primeiroLog.getPaciente().getConvenio() != null) {
                                dadosJob.setConvenioNome(primeiroLog.getPaciente().getConvenio().getName());
                                dadosJob.setConvenioId(primeiroLog.getPaciente().getConvenio().getId().toString());
                            }
                        }
                        break;

                    case CONVENIO:
                        // Para job de convênio, buscar dados do convênio dos logs
                        buscarDadosConvenioDoJob(logs, dadosJob);
                        break;

                    case LOTE:
                        // Para job de lote, contar convênios únicos
                        Set<String> conveniosUnicos = logs.stream()
                                .filter(log -> log.getPaciente() != null &&
                                        log.getPaciente().getConvenio() != null)
                                .map(log -> log.getPaciente().getConvenio().getId().toString())
                                .collect(Collectors.toSet());

                        dadosJob.setTotalConvenios(conveniosUnicos.size());

                        // Se for apenas um convênio, mostrar o nome
                        if (conveniosUnicos.size() == 1) {
                            Optional<FichaPdfLog> logConvenio = logs.stream()
                                    .filter(log -> log.getPaciente() != null &&
                                            log.getPaciente().getConvenio() != null)
                                    .findFirst();

                            if (logConvenio.isPresent()) {
                                dadosJob.setConvenioNome(logConvenio.get().getPaciente().getConvenio().getName());
                                dadosJob.setConvenioId(logConvenio.get().getPaciente().getConvenio().getId().toString());
                            }
                        }
                        break;
                }
            }

        } catch (Exception e) {
            logger.warn("Erro ao buscar dados contextuais do job {}: {}", job.getJobId(), e.getMessage());
            // Em caso de erro, definir valores padrão se possível
            dadosJob.setMes(LocalDateTime.now().getMonthValue());
            dadosJob.setAno(LocalDateTime.now().getYear());
            dadosJob.setMesExtenso(getMesExtenso(dadosJob.getMes()));
            dadosJob.setPeriodo(dadosJob.getMesExtenso() + "/" + dadosJob.getAno());
        }

        return dadosJob;
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

        // Usar verificação mais robusta
        dto.setPodeDownload(job.isPodeDownload()); // Agora inclui verificação de arquivo físico
        dto.setObservacoes(job.getObservacoes());

        if (job.getTotalFichas() != null && job.getTotalFichas() > 0 && job.getFichasProcessadas() != null) {
            int progresso = (int) ((double) job.getFichasProcessadas() / job.getTotalFichas() * 100);
            dto.setProgresso(progresso);
        } else {
            dto.setProgresso(0);
        }

        // Só definir URL de download se realmente pode baixar
        if (dto.getPodeDownload()) {
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

    private ConvenioFichaPdfConfigDto mapConfigToDto(ConvenioFichaPdfConfig config) {
        ConvenioFichaPdfConfigDto dto = new ConvenioFichaPdfConfigDto();
        dto.setId(config.getId().toString());
        dto.setConvenioId(config.getConvenio().getId().toString());
        dto.setConvenioNome(config.getConvenio().getName());
        dto.setHabilitado(config.getHabilitado());
        dto.setTemplatePersonalizado(config.getTemplatePersonalizado());
        dto.setDiasAtividade(config.getDiasAtividade());
        dto.setFormatoPadrao("A4"); // Por enquanto fixo
        dto.setIncluirLogo(true); // Por enquanto fixo
        dto.setIncluirCarimbo(true); // Por enquanto fixo
        dto.setObservacoes(config.getObservacoes() != null ? config.getObservacoes() : "");
        dto.setCreatedAt(config.getCreatedAt().toString());
        dto.setUpdatedAt(config.getUpdatedAt().toString());
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
                .orElse("");
    }

    private String gerarNumeroUnico() {
        // Gerar número único com timestamp para evitar duplicatas
        long timestamp = System.currentTimeMillis();
        int random = new Random().nextInt(1000);
        return String.format("%d%03d", timestamp % 10000, random);
    }

    private void buscarDadosConvenioDoJob(List<FichaPdfLog> logs, FichaPdfStatusDto.DadosJobDto dadosJob) {
        // Buscar o convênio mais comum nos logs (caso haja dados de múltiplos convênios)
        Map<String, Long> conveniosPorFrequencia = logs.stream()
                .filter(log -> log.getPaciente() != null &&
                        log.getPaciente().getConvenio() != null)
                .collect(Collectors.groupingBy(
                        log -> log.getPaciente().getConvenio().getId().toString(),
                        Collectors.counting()
                ));

        if (!conveniosPorFrequencia.isEmpty()) {
            // Pegar o convênio com mais logs (mais comum)
            String convenioIdMaisComum = conveniosPorFrequencia.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            if (convenioIdMaisComum != null) {
                Optional<FichaPdfLog> logConvenio = logs.stream()
                        .filter(log -> log.getPaciente() != null &&
                                log.getPaciente().getConvenio() != null &&
                                log.getPaciente().getConvenio().getId().toString().equals(convenioIdMaisComum))
                        .findFirst();

                if (logConvenio.isPresent()) {
                    dadosJob.setConvenioNome(logConvenio.get().getPaciente().getConvenio().getName());
                    dadosJob.setConvenioId(convenioIdMaisComum);
                }
            }
        }
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