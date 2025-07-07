package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.FichaPdfGeneratorService;
import com.intranet.backend.service.FichaPdfService;
import com.intranet.backend.service.FichaPdfTemplateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.pdf.storage.path:/tmp/fichas-pdf}")
    private String pdfStoragePath;

    // =================================================================================
    // MÉTODOS PÚBLICOS DA INTERFACE
    // =================================================================================

    @Override
    @Transactional
    public FichaPdfResponseDto gerarFichasPaciente(FichaPdfPacienteRequest request) {
        logger.info("Iniciando geração de fichas para paciente: {}", request.getPacienteId());

        User currentUser = getCurrentUser();
        String jobId = UUID.randomUUID().toString();

        // Criar job
        FichaPdfJob job = criarJob(jobId, FichaPdfJob.TipoGeracao.PACIENTE, currentUser);
        job.setTitulo(buildTituloPaciente(request));
        job.setParametros(buildParametrosPaciente(request));

        try {
            // Buscar dados para geração
            List<FichaPdfItemDto> itens = buscarItensParaPaciente(request);

            if (itens.isEmpty()) {
                job.setStatus(FichaPdfJob.StatusJob.ERRO);
                job.setErro("Nenhuma ficha encontrada para os critérios especificados");
                jobRepository.save(job);

                return buildResponse(job, "Nenhuma ficha encontrada");
            }

            job.setTotalFichas(itens.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // Gerar PDF (síncrono para paciente individual)
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompleto(itens, request.getMes(), request.getAno());

            // Salvar arquivo
            String nomeArquivo = String.format("fichas_%s_%02d_%d.pdf",
                    slugify(getCurrentUser().getFullName()), request.getMes(), request.getAno());
            String caminhoArquivo = salvarArquivoPdf(jobId, nomeArquivo, pdfBytes);

            // Registrar logs
            registrarLogs(job, itens);

            // Finalizar job
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setFichasProcessadas(itens.size());
            job.setConcluido(LocalDateTime.now());
            job.setArquivoPath(caminhoArquivo);
            job.setArquivoNome(nomeArquivo);
            job.setArquivoTamanho((long) pdfBytes.length);
            jobRepository.save(job);

            logger.info("Geração concluída para paciente. JobId: {}, Fichas: {}", jobId, itens.size());
            return buildResponse(job, "PDF gerado com sucesso");

        } catch (Exception e) {
            logger.error("Erro na geração de fichas para paciente: {}", e.getMessage(), e);
            finalizarJobComErro(job, e);
            throw new RuntimeException("Erro na geração do PDF: " + e.getMessage());
        }
    }

    @Override
    @Async
    @Transactional
    public CompletableFuture<FichaPdfResponseDto> gerarFichasConvenio(FichaPdfConvenioRequest request) {
        logger.info("Iniciando geração assíncrona de fichas para convênio: {}", request.getConvenioId());

        User currentUser = getCurrentUser();
        String jobId = UUID.randomUUID().toString();

        // Criar job
        FichaPdfJob job = criarJob(jobId, FichaPdfJob.TipoGeracao.CONVENIO, currentUser);
        job.setTitulo(buildTituloConvenio(request));
        job.setParametros(buildParametrosConvenio(request));

        try {
            // Verificar se convênio está habilitado
            if (!isConvenioHabilitado(request.getConvenioId())) {
                job.setStatus(FichaPdfJob.StatusJob.ERRO);
                job.setErro("Convênio não habilitado para geração de fichas PDF");
                jobRepository.save(job);
                return CompletableFuture.completedFuture(buildResponse(job, "Convênio não habilitado"));
            }

            // Buscar dados para geração
            List<FichaPdfItemDto> itens = buscarItensParaConvenio(request);

            if (itens.isEmpty()) {
                job.setStatus(FichaPdfJob.StatusJob.ERRO);
                job.setErro("Nenhuma ficha encontrada para os critérios especificados");
                jobRepository.save(job);
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma ficha encontrada"));
            }

            job.setTotalFichas(itens.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            logger.info("Processando {} fichas para convênio. JobId: {}", itens.size(), jobId);

            // Gerar PDF em lotes para performance
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(itens, request.getMes(), request.getAno(),
                    (processadas) -> atualizarProgressoJob(jobId, processadas));

            // Salvar arquivo
            Convenio convenio = convenioRepository.findById(request.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado"));

            String nomeArquivo = String.format("fichas_%s_%02d_%d.pdf",
                    slugify(convenio.getName()), request.getMes(), request.getAno());
            String caminhoArquivo = salvarArquivoPdf(jobId, nomeArquivo, pdfBytes);

            // Registrar logs
            registrarLogs(job, itens);

            // Finalizar job
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setFichasProcessadas(itens.size());
            job.setConcluido(LocalDateTime.now());
            job.setArquivoPath(caminhoArquivo);
            job.setArquivoNome(nomeArquivo);
            job.setArquivoTamanho((long) pdfBytes.length);
            jobRepository.save(job);

            logger.info("Geração assíncrona concluída. JobId: {}, Fichas: {}", jobId, itens.size());
            return CompletableFuture.completedFuture(buildResponse(job, "PDF gerado com sucesso"));

        } catch (Exception e) {
            logger.error("Erro na geração assíncrona de fichas: {}", e.getMessage(), e);
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
        job.setTitulo(buildTituloLote(request));
        job.setParametros(buildParametrosLote(request));

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
                convenioRequest.setUnidade(request.getUnidade());
                convenioRequest.setEspecialidades(request.getEspecialidades());
                convenioRequest.setIncluirInativos(request.getIncluirInativos());

                List<FichaPdfItemDto> itensConvenio = buscarItensParaConvenio(convenioRequest);
                todosItens.addAll(itensConvenio);
            }

            if (todosItens.isEmpty()) {
                job.setStatus(FichaPdfJob.StatusJob.ERRO);
                job.setErro("Nenhuma ficha encontrada para os convênios especificados");
                jobRepository.save(job);
                return CompletableFuture.completedFuture(buildResponse(job, "Nenhuma ficha encontrada"));
            }

            job.setTotalFichas(todosItens.size());
            job.setStatus(FichaPdfJob.StatusJob.PROCESSANDO);
            jobRepository.save(job);

            // Gerar PDF
            byte[] pdfBytes = pdfGeneratorService.gerarPdfCompletoAsync(todosItens, request.getMes(), request.getAno(),
                    (processadas) -> atualizarProgressoJob(jobId, processadas));

            // Salvar arquivo
            String nomeArquivo = String.format("fichas_lote_%02d_%d.pdf", request.getMes(), request.getAno());
            String caminhoArquivo = salvarArquivoPdf(jobId, nomeArquivo, pdfBytes);

            // Registrar logs
            registrarLogs(job, todosItens);

            // Finalizar job
            job.setStatus(FichaPdfJob.StatusJob.CONCLUIDO);
            job.setFichasProcessadas(todosItens.size());
            job.setConcluido(LocalDateTime.now());
            job.setArquivoPath(caminhoArquivo);
            job.setArquivoNome(nomeArquivo);
            job.setArquivoTamanho((long) pdfBytes.length);
            jobRepository.save(job);

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
            config.setPrefixoIdentificacao("PNE"); // Padrão
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

    // =================================================================================
    // MÉTODOS PRIVADOS - BUSCA DE DADOS
    // =================================================================================

    private List<FichaPdfItemDto> buscarItensParaPaciente(FichaPdfPacienteRequest request) {
        logger.info("Buscando itens para paciente: {}", request.getPacienteId());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado"));

        // Buscar guias ativas do paciente
        List<Guia> guiasAtivas = buscarGuiasAtivasParaFichas(
                request.getPacienteId(),
                request.getMes(),
                request.getAno(),
                request.getEspecialidades(),
                request.getIncluirInativos()
        );

        return processarGuiasParaFichas(guiasAtivas, request.getMes(), request.getAno());
    }

    private List<FichaPdfItemDto> buscarItensParaConvenio(FichaPdfConvenioRequest request) {
        logger.info("Buscando itens para convênio: {}", request.getConvenioId());

        // Buscar pacientes do convênio
        List<Paciente> pacientes = pacienteRepository.findByConvenioId(request.getConvenioId());

        if (request.getUnidade() != null) {
            Paciente.UnidadeEnum unidadeEnum = Paciente.UnidadeEnum.valueOf(request.getUnidade());
            pacientes = pacientes.stream()
                    .filter(p -> p.getUnidade() == unidadeEnum)
                    .collect(Collectors.toList());
        }

        List<FichaPdfItemDto> todosItens = new ArrayList<>();

        for (Paciente paciente : pacientes) {
            List<Guia> guiasAtivas = buscarGuiasAtivasParaFichas(
                    paciente.getId(),
                    request.getMes(),
                    request.getAno(),
                    request.getEspecialidades(),
                    request.getIncluirInativos()
            );

            List<FichaPdfItemDto> itensPaciente = processarGuiasParaFichas(guiasAtivas, request.getMes(), request.getAno());
            todosItens.addAll(itensPaciente);
        }

        return todosItens;
    }

    private List<Guia> buscarGuiasAtivasParaFichas(UUID pacienteId, Integer mes, Integer ano,
                                                   List<String> especialidades, Boolean incluirInativos) {

        // Critérios de busca baseados nas regras de negócio
        List<String> statusPermitidos = incluirInativos ?
                Arrays.asList("ATIVO", "EM_ANDAMENTO", "PENDENTE", "PAUSADO") :
                Arrays.asList("ATIVO", "EM_ANDAMENTO");

        // Buscar guias do paciente no período
        List<Guia> guias = guiaRepository.findGuiasAtivasParaFichas(
                pacienteId,
                statusPermitidos,
                especialidades
        );

        // Filtrar por atividade recente (últimos 30 dias)
        LocalDateTime dataLimite = LocalDateTime.now().minusDays(30);

        return guias.stream()
                .filter(guia -> {
                    // Verificar se a guia está dentro da validade
                    if (!isGuiaValidaParaMes(guia, mes, ano)) {
                        return false;
                    }

                    // Verificar se teve atividade recente
                    return temAtividadeRecente(guia, dataLimite);
                })
                .collect(Collectors.toList());
    }

    private List<FichaPdfItemDto> processarGuiasParaFichas(List<Guia> guias, Integer mes, Integer ano) {
        List<FichaPdfItemDto> itens = new ArrayList<>();

        for (Guia guia : guias) {
            // Para cada especialidade da guia, criar uma ficha
            for (String especialidade : guia.getEspecialidades()) {
                // Verificar se deve criar ficha para esta especialidade
                if (deveGerarFichaParaEspecialidade(guia, especialidade, mes, ano)) {
                    FichaPdfItemDto item = criarItemFicha(guia, especialidade, mes, ano);
                    itens.add(item);
                }
            }
        }

        return itens;
    }

    private boolean deveGerarFichaParaEspecialidade(Guia guia, String especialidade, Integer mes, Integer ano) {
        // Verificar se já existe ficha gerada para esta especialidade no mês
        boolean jaExisteFicha = logRepository.existsByPacienteIdAndEspecialidadeAndMesAndAno(
                guia.getPaciente().getId(), especialidade, mes, ano
        );

        if (jaExisteFicha) {
            logger.debug("Ficha já existe para paciente {} especialidade {} no mês {}/{}",
                    guia.getPaciente().getNome(), especialidade, mes, ano);
            return false;
        }

        // Verificar se teve atividade na especialidade nos últimos 30 dias
        return temAtividadeNaEspecialidade(guia.getPaciente().getId(), especialidade);
    }

    private boolean temAtividadeRecente(Guia guia, LocalDateTime dataLimite) {
        // Verificar se teve fichas criadas ou atualizadas recentemente
        long atividadeRecente = fichaRepository.countByGuiaIdAndUpdatedAtAfter(guia.getId(), dataLimite);
        return atividadeRecente > 0 || guia.getUpdatedAt().isAfter(dataLimite);
    }

    private boolean temAtividadeNaEspecialidade(UUID pacienteId, String especialidade) {
        LocalDateTime dataLimite = LocalDateTime.now().minusDays(30);

        // Verificar se teve fichas da especialidade nos últimos 30 dias
        long fichasRecentes = fichaRepository.countByPacienteIdAndEspecialidadeAndCreatedAtAfter(
                pacienteId, especialidade, dataLimite
        );

        return fichasRecentes > 0;
    }

    private boolean isGuiaValidaParaMes(Guia guia, Integer mes, Integer ano) {
        // Verificar se a guia está válida para o mês/ano especificado
        // Pode ser baseado na validade da guia, quantidade restante, etc.

        // Verificar validade
        LocalDate dataGuia = LocalDate.of(ano, mes, 1);
        if (guia.getValidade() != null && guia.getValidade().isBefore(dataGuia)) {
            return false;
        }

        // Verificar se ainda tem quantidade disponível
        if (guia.getQuantidadeRestante() != null && guia.getQuantidadeRestante() <= 0) {
            return false;
        }

        return true;
    }

    private FichaPdfItemDto criarItemFicha(Guia guia, String especialidade, Integer mes, Integer ano) {
        FichaPdfItemDto item = new FichaPdfItemDto();

        // Dados básicos
        item.setPacienteId(guia.getPaciente().getId());
        item.setPacienteNome(guia.getPaciente().getNome());
        item.setEspecialidade(especialidade);
        item.setMes(mes);
        item.setAno(ano);
        item.setMesExtenso(getMesExtenso(mes));

        // Gerar número de identificação único
        String prefixo = getPrefixoIdentificacao(guia.getConvenio().getId());
        item.setNumeroIdentificacao(prefixo + gerarNumeroAleatorio());

        // Dados do convênio
        item.setConvenioId(guia.getConvenio().getId());
        item.setConvenioNome(guia.getConvenio().getName());

        // Dados da unidade
        if (guia.getPaciente().getUnidade() != null) {
            item.setUnidade(guia.getPaciente().getUnidade().name());
        }

        // Dados da guia
        item.setGuiaId(guia.getId());
        item.setNumeroGuia(guia.getNumeroGuia());
        item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());
        item.setUltimaAtividade(guia.getUpdatedAt());

        return item;
    }

    // =================================================================================
    // MÉTODOS PRIVADOS - UTILITÁRIOS
    // =================================================================================

    private FichaPdfJob criarJob(String jobId, FichaPdfJob.TipoGeracao tipo, User usuario) {
        FichaPdfJob job = new FichaPdfJob();
        job.setJobId(jobId);
        job.setTipo(tipo);
        job.setUsuario(usuario);
        job.setStatus(FichaPdfJob.StatusJob.INICIADO);
        job.setIniciado(LocalDateTime.now());
        job.setFichasProcessadas(0);

        return jobRepository.save(job);
    }

    private void finalizarJobComErro(FichaPdfJob job, Exception e) {
        job.setStatus(FichaPdfJob.StatusJob.ERRO);
        job.setErro(e.getMessage());
        job.setStackTrace(getStackTrace(e));
        job.setConcluido(LocalDateTime.now());
        jobRepository.save(job);
    }

    private void atualizarProgressoJob(String jobId, Integer fichasProcessadas) {
        Optional<FichaPdfJob> jobOpt = jobRepository.findByJobId(jobId);
        if (jobOpt.isPresent()) {
            FichaPdfJob job = jobOpt.get();
            job.setFichasProcessadas(fichasProcessadas);
            jobRepository.save(job);
        }
    }

    private void registrarLogs(FichaPdfJob job, List<FichaPdfItemDto> itens) {
        List<FichaPdfLog> logs = itens.stream()
                .map(item -> criarLog(job, item))
                .collect(Collectors.toList());

//        logRepository.saveAll(logs);
    }

    private FichaPdfLog criarLog(FichaPdfJob job, FichaPdfItemDto item) {
        FichaPdfLog log = new FichaPdfLog();
        log.setJob(job);

        Paciente paciente = pacienteRepository.getReferenceById(item.getPacienteId());
        log.setPaciente(paciente);

        if (item.getGuiaId() != null) {
            Guia guia = guiaRepository.getReferenceById(item.getGuiaId());
            log.setGuiaOrigem(guia);
        }

        log.setEspecialidade(item.getEspecialidade());
        log.setNumeroIdentificacao(item.getNumeroIdentificacao());
        log.setMes(item.getMes());
        log.setAno(item.getAno());
        log.setQuantidadeAutorizada(item.getQuantidadeAutorizada());
        log.setProcessadoComSucesso(true);

        return log;
    }

    private String salvarArquivoPdf(String jobId, String nomeArquivo, byte[] pdfBytes) {
        // Implementação do salvamento do arquivo PDF
        // Retorna o caminho onde foi salvo
        String caminhoCompleto = pdfStoragePath + "/" + jobId + "_" + nomeArquivo;

        try {
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(pdfStoragePath));
            java.nio.file.Files.write(java.nio.file.Paths.get(caminhoCompleto), pdfBytes);
            logger.info("PDF salvo em: {}", caminhoCompleto);
            return caminhoCompleto;
        } catch (Exception e) {
            logger.error("Erro ao salvar PDF: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar arquivo PDF", e);
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
                .orElse("PNE");
    }

    private String gerarNumeroAleatorio() {
        return String.valueOf(new Random().nextInt(9000) + 1000); // 1000-9999
    }

    private String getMesExtenso(Integer mes) {
        return java.time.Month.of(mes).getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
    }

    private String slugify(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "_")
                .replaceAll("-+", "_");
    }

    private FichaPdfResponseDto buildResponse(FichaPdfJob job, String mensagem) {
        FichaPdfResponseDto response = new FichaPdfResponseDto();
        response.setJobId(job.getJobId());
        response.setStatus(job.getStatus().name());
        response.setMensagem(mensagem);
        response.setTotalFichas(job.getTotalFichas());
        response.setFichasProcessadas(job.getFichasProcessadas());
        response.setIniciado(job.getIniciado());
        response.setConcluido(job.getConcluido());
        response.setErro(job.getErro());

        if (job.isPodeDownload()) {
            response.setDownloadUrl("/api/fichas-pdf/download/" + job.getJobId());
        }

        return response;
    }

    private FichaPdfStatusDto buildStatusDto(FichaPdfJob job) {
        FichaPdfStatusDto status = new FichaPdfStatusDto();
        status.setJobId(job.getJobId());
        status.setStatus(job.getStatus().name());
        status.setTotalFichas(job.getTotalFichas());
        status.setFichasProcessadas(job.getFichasProcessadas());
        status.setPercentualConcluido(job.getPercentualConcluido());
        status.setIniciado(job.getIniciado());
        status.setUltimaAtualizacao(job.getUpdatedAt());
        status.setErro(job.getErro());

        if (job.isPodeDownload()) {
            status.setDownloadUrl("/api/fichas-pdf/download/" + job.getJobId());
        }

        // Mensagem atual baseada no status
        switch (job.getStatus()) {
            case INICIADO:
                status.setMensagemAtual("Iniciando processamento...");
                break;
            case PROCESSANDO:
                status.setMensagemAtual(String.format("Processando fichas... (%d/%d)",
                        job.getFichasProcessadas(), job.getTotalFichas()));
                break;
            case CONCLUIDO:
                status.setMensagemAtual("Processamento concluído com sucesso!");
                break;
            case ERRO:
                status.setMensagemAtual("Erro no processamento: " + job.getErro());
                break;
            default:
                status.setMensagemAtual("Status desconhecido");
        }

        return status;
    }

    private FichaPdfJobDto mapJobToDto(FichaPdfJob job) {
        FichaPdfJobDto dto = new FichaPdfJobDto();
        dto.setJobId(job.getJobId());
        dto.setTipo(job.getTipo().name());
        dto.setTitulo(job.getTitulo());
        dto.setStatus(job.getStatus().name());
        dto.setTotalFichas(job.getTotalFichas());
        dto.setIniciado(job.getIniciado());
        dto.setConcluido(job.getConcluido());
        dto.setPodeDownload(job.isPodeDownload());

        if (job.isPodeDownload()) {
            dto.setDownloadUrl("/api/fichas-pdf/download/" + job.getJobId());
        }

        return dto;
    }

    private ConvenioDto mapConvenioToDto(Convenio convenio) {
        ConvenioDto dto = new ConvenioDto();
        dto.setId(convenio.getId());
        dto.setName(convenio.getName());
//        dto.setActive(convenio.getActive());
        return dto;
    }

    private String buildTituloPaciente(FichaPdfPacienteRequest request) {
        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElse(null);
        String nomePaciente = paciente != null ? paciente.getNome() : "Paciente";
        return String.format("Fichas - %s - %s/%d", nomePaciente, getMesExtenso(request.getMes()), request.getAno());
    }

    private String buildTituloConvenio(FichaPdfConvenioRequest request) {
        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElse(null);
        String nomeConvenio = convenio != null ? convenio.getName() : "Convênio";
        return String.format("Fichas - %s - %s/%d", nomeConvenio, getMesExtenso(request.getMes()), request.getAno());
    }

    private String buildTituloLote(FichaPdfLoteRequest request) {
        return String.format("Fichas Lote - %s/%d - %d convênios",
                getMesExtenso(request.getMes()), request.getAno(), request.getConvenioIds().size());
    }

    private String buildParametrosPaciente(FichaPdfPacienteRequest request) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String buildParametrosConvenio(FichaPdfConvenioRequest request) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String buildParametrosLote(FichaPdfLoteRequest request) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);
        } catch (Exception e) {
            return "{}";
        }
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    private boolean isAdmin(User user) {
        // Implementação posterior
       return false;
    }

    private String getStackTrace(Exception e) {
        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }
}