package com.intranet.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.RelatorioService;
import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.layout.properties.UnitValue;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RelatorioServiceImpl implements RelatorioService {

    private static final Logger logger = LoggerFactory.getLogger(RelatorioServiceImpl.class);

    private final RelatorioRepository relatorioRepository;
    private final RelatorioCompartilhamentoRepository compartilhamentoRepository;
    private final RelatorioLogRepository logRepository;
    private final UserRepository userRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final GuiaRepository guiaRepository;
    private final FichaRepository fichaRepository;
    private final PacienteRepository pacienteRepository;

    @Autowired
    private HttpServletRequest httpServletRequest;

    @Override
    @Transactional
    public RelatorioDto gerarRelatorio(RelatorioCreateRequest request) {
        logger.info("Iniciando geração de relatório: {} - Nova regra: estado atual", request.getTitulo());

        User currentUser = getCurrentUser();

        // Verificar se o usuário pode gerar relatório para outro usuário
        UUID usuarioAlvo = request.getUsuarioResponsavelId() != null ?
                request.getUsuarioResponsavelId() : currentUser.getId();

        if (!usuarioAlvo.equals(currentUser.getId()) && !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para gerar relatórios de outros usuários");
        }

        try {
            // Criar o registro do relatório
            Relatorio relatorio = new Relatorio();
            relatorio.setTitulo(request.getTitulo());
            relatorio.setDescricao(request.getDescricao());
            relatorio.setUsuarioGerador(currentUser);
            relatorio.setPeriodoInicio(request.getPeriodoInicio());
            relatorio.setPeriodoFim(request.getPeriodoFim());
            relatorio.setFiltros(buildFiltrosJson(request));
            relatorio.gerarHashCompartilhamento();
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.PROCESSANDO);

            relatorio = relatorioRepository.save(relatorio);
            logger.info("Relatório criado com ID: {}", relatorio.getId());

            try {
                RelatorioDataDto dados = processarDadosRelatorioEstadoAtual(request, usuarioAlvo);

                // Armazenar dados do relatório
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                String dadosJson = mapper.writeValueAsString(dados);

                relatorio.setDadosRelatorio(dadosJson);
                relatorio.setTotalRegistros(dados.getTotalRegistros());
                relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO);

                relatorio = relatorioRepository.save(relatorio);

                registrarLog(RelatorioLog.gerado(relatorio, currentUser, getClientIpAddress()));

                logger.info("Relatório processado com sucesso. Total de registros: {}", dados.getTotalRegistros());

            } catch (Exception e) {
                logger.error("Erro ao processar relatório {}: {}", relatorio.getId(), e.getMessage(), e);
                relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.ERRO);
                relatorioRepository.save(relatorio);
                throw e;
            }

            return mapToDto(relatorio);

        } catch (Exception e) {
            logger.error("Erro ao gerar relatório: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }

    @Override
    public RelatorioDto getRelatorioById(UUID id) {
        logger.info("Buscando relatório por ID: {}", id);

        Relatorio relatorio = relatorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado com ID: " + id));

        // Verificar permissão de acesso
        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para acessar este relatório");
        }

        // Registrar log de visualização
        registrarLog(RelatorioLog.visualizado(relatorio, currentUser, getClientIpAddress()));

        return mapToDto(relatorio);
    }

    @Override
    public RelatorioDto getRelatorioByHash(String hash) {
        logger.info("Buscando relatório por hash: {}", hash);

        Relatorio relatorio = relatorioRepository.findByHashCompartilhamento(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado para o hash fornecido"));

        User currentUser = getCurrentUser();

        registrarLog(RelatorioLog.visualizado(relatorio, currentUser, getClientIpAddress()));

        return mapToDto(relatorio);
    }

    @Override
    public Page<RelatorioSummaryDto> getMeusRelatorios(Pageable pageable) {
        logger.info("Buscando relatórios do usuário atual");

        User currentUser = getCurrentUser();
        Page<Relatorio> relatorios = relatorioRepository.findByUsuarioGeradorId(currentUser.getId(), pageable);

        return relatorios.map(this::mapToSummaryDto);
    }

    @Override
    @PreAuthorize("hasAnyAuthority('relatorio:view_all') or hasAnyRole('ADMIN', 'SUPERVISOR')")
    public Page<RelatorioSummaryDto> getAllRelatorios(Pageable pageable) {
        logger.info("Buscando todos os relatórios");

        Page<Relatorio> relatorios = relatorioRepository.findAll(pageable);
        return relatorios.map(this::mapToSummaryDto);
    }

    @Override
    public Page<RelatorioSummaryDto> getRelatoriosComFiltros(RelatorioFilterRequest filter, Pageable pageable) {
        logger.info("Buscando relatórios com filtros");

        User currentUser = getCurrentUser();
        UUID usuarioFiltro = isUserAdminOrSupervisor(currentUser) ?
                filter.getUsuarioId() : currentUser.getId();

        Page<Relatorio> relatorios = relatorioRepository.findByUsuarioGeradorId(usuarioFiltro, pageable);
        return relatorios.map(this::mapToSummaryDto);
    }

    @Override
    public RelatorioDataDto getDadosRelatorio(UUID relatorioId) {
        logger.info("Obtendo dados do relatório: {}", relatorioId);

        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para acessar os dados deste relatório");
        }

        return convertFromJsonString(relatorio.getDadosRelatorio());
    }

    @Override
    @Transactional
    public RelatorioCompartilhamentoDto compartilharRelatorio(UUID relatorioId, RelatorioCompartilhamentoRequest request) {
        logger.info("Compartilhando relatório {} com usuário {}", relatorioId, request.getUsuarioDestinoId());

        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para compartilhar este relatório");
        }

        User usuarioDestino = userRepository.findById(request.getUsuarioDestinoId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário destino não encontrado"));

        // Verificar se já foi compartilhado
        if (compartilhamentoRepository.existsByRelatorioIdAndUsuarioOrigemIdAndUsuarioDestinoId(
                relatorioId, currentUser.getId(), request.getUsuarioDestinoId())) {
            throw new IllegalArgumentException("Relatório já foi compartilhado com este usuário");
        }

        RelatorioCompartilhamento compartilhamento = new RelatorioCompartilhamento();
        compartilhamento.setRelatorio(relatorio);
        compartilhamento.setUsuarioOrigem(currentUser);
        compartilhamento.setUsuarioDestino(usuarioDestino);
        compartilhamento.setObservacao(request.getObservacao());

        compartilhamento = compartilhamentoRepository.save(compartilhamento);

        // Registrar log
        registrarLog(RelatorioLog.compartilhado(relatorio, currentUser, usuarioDestino, getClientIpAddress()));

        logger.info("Relatório compartilhado com sucesso. ID: {}", compartilhamento.getId());

        return mapToCompartilhamentoDto(compartilhamento);
    }

    @Override
    public Page<RelatorioCompartilhamentoDto> getCompartilhamentosRecebidos(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<RelatorioCompartilhamento> compartilhamentos =
                compartilhamentoRepository.findByUsuarioDestinoId(currentUser.getId(), pageable);

        return compartilhamentos.map(this::mapToCompartilhamentoDto);
    }

    @Override
    public Page<RelatorioCompartilhamentoDto> getCompartilhamentosEnviados(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<RelatorioCompartilhamento> compartilhamentos =
                compartilhamentoRepository.findByUsuarioOrigemId(currentUser.getId(), pageable);

        return compartilhamentos.map(this::mapToCompartilhamentoDto);
    }

    @Override
    @Transactional
    public void marcarCompartilhamentoComoVisualizado(UUID compartilhamentoId) {
        RelatorioCompartilhamento compartilhamento = compartilhamentoRepository.findById(compartilhamentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartilhamento não encontrado"));

        User currentUser = getCurrentUser();
        if (!compartilhamento.getUsuarioDestino().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Usuário não tem permissão para marcar este compartilhamento");
        }

        compartilhamento.marcarComoVisualizado();
        compartilhamentoRepository.save(compartilhamento);
    }

    @Override
    public long countCompartilhamentosNaoVisualizados() {
        User currentUser = getCurrentUser();
        return compartilhamentoRepository.countByUsuarioDestinoIdAndVisualizadoFalse(currentUser.getId());
    }

    @Override
    @Transactional
    public void excluirRelatorio(UUID relatorioId) {
        logger.info("Excluindo relatório: {}", relatorioId);

        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para excluir este relatório");
        }

        relatorioRepository.delete(relatorio);
        logger.info("Relatório excluído com sucesso: {}", relatorioId);
    }

    @Override
    public byte[] gerarRelatorioPDF(UUID relatorioId) {
        logger.info("Gerando PDF do relatório: {}", relatorioId);

        RelatorioDataDto dados = getDadosRelatorio(relatorioId);
        User currentUser = getCurrentUser();

        // Registrar log de download
        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));
        registrarLog(RelatorioLog.download(relatorio, currentUser, getClientIpAddress()));

        return generatePDF(dados);
    }

    @Override
    public byte[] gerarRelatorioPDFByHash(String hash) {
        logger.info("Gerando PDF do relatório por hash: {}", hash);

        if (hash == null || hash.trim().isEmpty()) {
            throw new IllegalArgumentException("Hash de compartilhamento é obrigatório");
        }

        try {
            Relatorio relatorio = relatorioRepository.findByHashCompartilhamento(hash)
                    .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

            if (relatorio.getStatusRelatorio() != Relatorio.StatusRelatorio.CONCLUIDO) {
                throw new IllegalStateException("Relatório ainda não foi processado");
            }

            // Obter dados do relatório
            RelatorioDataDto dados = convertFromJsonString(relatorio.getDadosRelatorio());

            // Registrar log de download
            try {
                User currentUser = getCurrentUser();
                registrarLog(RelatorioLog.download(relatorio, currentUser, getClientIpAddress()));
            } catch (Exception e) {
                logger.warn("Erro ao registrar log: {}", e.getMessage());
            }

            // Gerar e retornar PDF
            return generatePDF(dados);

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF por hash {}: {}", hash, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }

    private byte[] generatePDF(RelatorioDataDto dados) {
        logger.info("Gerando PDF para relatório: {}", dados.getTitulo());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Título
            document.add(new Paragraph(dados.getTitulo())
                    .setFontSize(18)
                    .setBold()
                    .setMarginBottom(20));

            // Informações gerais
            document.add(new Paragraph("Usuário Gerador: " + dados.getUsuarioGerador()));
            document.add(new Paragraph("Período: " + dados.getPeriodoInicio() + " a " + dados.getPeriodoFim()));
            document.add(new Paragraph("Total de Registros: " + dados.getTotalRegistros()));
            document.add(new Paragraph("Data de Geração: " + dados.getDataGeracao()));

            // Estatísticas
            if (dados.getDistribuicaoPorStatus() != null && !dados.getDistribuicaoPorStatus().isEmpty()) {
                document.add(new Paragraph("\nDistribuição por Status:").setBold());
                dados.getDistribuicaoPorStatus().forEach((status, count) ->
                        document.add(new Paragraph("• " + status + ": " + count))
                );
            }

            // Tabela de itens (primeiros 100 para não sobrecarregar)
            if (dados.getItens() != null && !dados.getItens().isEmpty()) {
                document.add(new Paragraph("\nDetalhes dos Itens:").setBold().setMarginTop(20));

                Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2, 2}));
                table.setWidth(UnitValue.createPercentValue(100));

                // Cabeçalho
                table.addHeaderCell("Tipo");
                table.addHeaderCell("Status");
                table.addHeaderCell("Paciente");
                table.addHeaderCell("Convênio");
                table.addHeaderCell("Data");

                // Dados (limitado a 100 itens)
                dados.getItens().stream()
                        .limit(100)
                        .forEach(item -> {
                            table.addCell(item.getTipoEntidade() != null ? item.getTipoEntidade() : "-");
                            table.addCell(item.getStatusNovo() != null ? item.getStatusNovo() : "-");
                            table.addCell(item.getPacienteNome() != null ? item.getPacienteNome() : "-");
                            table.addCell(item.getConvenioNome() != null ? item.getConvenioNome() : "-");
                            table.addCell(item.getDataMudancaStatus() != null ?
                                    item.getDataMudancaStatus().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-");
                        });

                document.add(table);

                if (dados.getItens().size() > 100) {
                    document.add(new Paragraph("... e mais " + (dados.getItens().size() - 100) + " itens")
                            .setItalic().setMarginTop(10));
                }
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
    }

    private List<GraficoTimelineDto> generateTimelineDataEstadoAtual(List<RelatorioItemDto> itens,
                                                                     LocalDateTime periodoInicio,
                                                                     LocalDateTime periodoFim) {
        if (itens == null || itens.isEmpty()) {
            return new ArrayList<>();
        }

        // Agrupa por data de atualização
        Map<LocalDate, Long> timelineMap = itens.stream()
                .filter(item -> item.getDataAtualizacao() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getDataAtualizacao().toLocalDate(),
                        Collectors.counting()
                ));

        return timelineMap.entrySet().stream()
                .map(entry -> {
                    GraficoTimelineDto dto = new GraficoTimelineDto();
                    dto.setData(entry.getKey());
                    dto.setQuantidade(entry.getValue());
                    return dto;
                })
                .sorted(Comparator.comparing(GraficoTimelineDto::getData))
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getEstatisticasRelatorios() {
        logger.info("Obtendo estatísticas de relatórios");

        User currentUser = getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        try {
            if (isUserAdminOrSupervisor(currentUser)) {
                // Estatísticas globais para admins/supervisores
                stats.put("totalRelatorios", relatorioRepository.count());

                // Verificar se métodos existem antes de usar
                try {
                    stats.put("relatoriosConcluidos", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO));
                    stats.put("relatoriosProcessando", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.PROCESSANDO));
                    stats.put("relatoriosComErro", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.ERRO));
                } catch (Exception e) {
                    logger.warn("Métodos de contagem por status não implementados no repository: {}", e.getMessage());
                    // Calcular manualmente como fallback
                    long concluidos = relatorioRepository.findAll().stream()
                            .mapToLong(r -> r.getStatusRelatorio() == Relatorio.StatusRelatorio.CONCLUIDO ? 1 : 0)
                            .sum();
                    stats.put("relatoriosConcluidos", concluidos);

                    long processando = relatorioRepository.findAll().stream()
                            .mapToLong(r -> r.getStatusRelatorio() == Relatorio.StatusRelatorio.PROCESSANDO ? 1 : 0)
                            .sum();
                    stats.put("relatoriosProcessando", processando);

                    long erros = relatorioRepository.findAll().stream()
                            .mapToLong(r -> r.getStatusRelatorio() == Relatorio.StatusRelatorio.ERRO ? 1 : 0)
                            .sum();
                    stats.put("relatoriosComErro", erros);
                }
            } else {
                // Estatísticas do usuário atual
                try {
                    stats.put("meusRelatorios", relatorioRepository.countByUsuarioGeradorId(currentUser.getId()));
                } catch (Exception e) {
                    logger.warn("Método countByUsuarioGeradorId não implementado: {}", e.getMessage());
                    // Fallback manual
                    long meusRelatorios = relatorioRepository.findAll().stream()
                            .mapToLong(r -> r.getUsuarioGerador().getId().equals(currentUser.getId()) ? 1 : 0)
                            .sum();
                    stats.put("meusRelatorios", meusRelatorios);
                }
            }

            // Estatísticas de compartilhamento
            stats.put("compartilhamentosRecebidos",
                    compartilhamentoRepository.findByUsuarioDestinoId(currentUser.getId(), Pageable.unpaged()).getTotalElements());
            stats.put("compartilhamentosEnviados",
                    compartilhamentoRepository.findByUsuarioOrigemId(currentUser.getId(), Pageable.unpaged()).getTotalElements());
            stats.put("compartilhamentosNaoVisualizados", countCompartilhamentosNaoVisualizados());

        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas: {}", e.getMessage(), e);
            stats.put("erro", "Erro ao carregar estatísticas");
        }

        return stats;
    }

    @Override
    @Transactional
    public RelatorioDto reprocessarRelatorio(UUID relatorioId) {
        logger.info("Reprocessando relatório: {}", relatorioId);

        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para reprocessar este relatório");
        }

        // Recriar request baseado nos filtros salvos
        RelatorioCreateRequest request = recreateRequestFromFilters(relatorio);

        relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.PROCESSANDO);
        relatorio = relatorioRepository.save(relatorio);

        try {
            RelatorioDataDto dadosRelatorio = processarDadosRelatorioEstadoAtual(request, relatorio.getUsuarioGerador().getId());
            relatorio.setTotalRegistros(dadosRelatorio.getTotalRegistros());
            relatorio.setDadosRelatorio(convertToJsonString(dadosRelatorio));
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO);

            relatorio = relatorioRepository.save(relatorio);

            logger.info("Relatório reprocessado com sucesso: {}", relatorioId);

        } catch (Exception e) {
            logger.error("Erro ao reprocessar relatório: {}", e.getMessage(), e);
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.ERRO);
            relatorioRepository.save(relatorio);
            throw new RuntimeException("Erro ao reprocessar relatório: " + e.getMessage(), e);
        }

        return mapToDto(relatorio);
    }

    @Override
    public List<RelatorioLogDto> getLogsRelatorio(UUID relatorioId) {
        logger.info("Buscando logs do relatório: {}", relatorioId);

        Relatorio relatorio = relatorioRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!relatorio.getUsuarioGerador().getId().equals(currentUser.getId()) &&
                !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para ver logs deste relatório");
        }

        List<RelatorioLog> logs = logRepository.findByRelatorioId(relatorioId);
        return logs.stream().map(this::mapToLogDto).collect(Collectors.toList());
    }

    // =================================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // =================================================================================

    private RelatorioDataDto processarDadosRelatorioEstadoAtual(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Processando dados do relatório - Estado atual das entidades para usuário: {}", usuarioAlvo);

        RelatorioDataDto dados = new RelatorioDataDto();
        dados.setTitulo(request.getTitulo());
        dados.setUsuarioGerador(getCurrentUser().getFullName());
        dados.setPeriodoInicio(request.getPeriodoInicio());
        dados.setPeriodoFim(request.getPeriodoFim());
        dados.setDataGeracao(LocalDateTime.now());

        // Configurar filtros aplicados
        Map<String, Object> filtrosAplicados = new HashMap<>();
        filtrosAplicados.put("usuarioResponsavelId", request.getUsuarioResponsavelId());
        filtrosAplicados.put("status", request.getStatus());
        filtrosAplicados.put("especialidades", request.getEspecialidades());
        filtrosAplicados.put("convenioIds", request.getConvenioIds());
        filtrosAplicados.put("unidades", request.getUnidades());
        filtrosAplicados.put("tipoEntidade", request.getTipoEntidade());
        filtrosAplicados.put("regra", "ESTADO_ATUAL");
        dados.setFiltrosAplicados(filtrosAplicados);

        List<RelatorioItemDto> itens = new ArrayList<>();

        // Buscar guias se solicitado
        if (request.getTipoEntidade() == null ||
                "TODOS".equals(request.getTipoEntidade()) ||
                "GUIA".equals(request.getTipoEntidade())) {

            logger.info("Buscando guias para o relatório...");
            List<RelatorioItemDto> itensGuias = buscarGuiasComEstadoAtual(request, usuarioAlvo);
            itens.addAll(itensGuias);
            logger.info("Encontradas {} guias", itensGuias.size());
        }

        // Buscar fichas se solicitado
        if (request.getTipoEntidade() == null ||
                "TODOS".equals(request.getTipoEntidade()) ||
                "FICHA".equals(request.getTipoEntidade())) {

            logger.info("Buscando fichas para o relatório...");
            List<RelatorioItemDto> itensFichas = buscarFichasComEstadoAtual(request, usuarioAlvo);
            itens.addAll(itensFichas);
            logger.info("Encontradas {} fichas", itensFichas.size());
        }

        // Ordenar por data de atualização (mais recentes primeiro)
        itens.sort((a, b) -> {
            LocalDateTime dateA = a.getDataAtualizacao();
            LocalDateTime dateB = b.getDataAtualizacao();
            if (dateA == null && dateB == null) return 0;
            if (dateA == null) return 1;
            if (dateB == null) return -1;
            return dateB.compareTo(dateA);
        });

        dados.setItens(itens);
        dados.setTotalRegistros(itens.size());

        // Calcular estatísticas baseadas no estado atual
        dados.setDistribuicaoPorStatus(calculateStatusDistribution(itens));
        dados.setDistribuicaoPorEspecialidade(calculateEspecialidadeDistribution(itens));
        dados.setDistribuicaoPorConvenio(calculateConvenioDistribution(itens));
        dados.setDistribuicaoPorUnidade(calculateUnidadeDistribution(itens));

        // Timeline baseada em datas de criação/atualização
        dados.setTimelineData(generateTimelineDataEstadoAtual(itens, request.getPeriodoInicio(), request.getPeriodoFim()));

        logger.info("Processamento concluído. Total de itens: {}", itens.size());
        return dados;
    }

    private List<RelatorioItemDto> buscarGuiasComEstadoAtual(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Buscando guias com estado atual para relatório");

        List<Guia> guias = guiaRepository.findGuiasForRelatorio(
                usuarioAlvo,
                request.getPeriodoInicio(),
                request.getPeriodoFim(),
                request.getStatus(),
                request.getEspecialidades(),
                request.getConvenioIds(),
                request.getUnidades()
        );

        return guias.stream()
                .map(this::mapGuiaToRelatorioItem)
                .collect(Collectors.toList());
    }

    private List<RelatorioItemDto> buscarFichasComEstadoAtual(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Buscando fichas com estado atual para relatório");

        List<Ficha> fichas = fichaRepository.findFichasForRelatorio(
                usuarioAlvo,
                request.getPeriodoInicio(),
                request.getPeriodoFim(),
                request.getStatus(),
                request.getEspecialidades(),
                request.getConvenioIds(),
                request.getUnidades()
        );

        return fichas.stream()
                .map(this::mapFichaToRelatorioItem)
                .collect(Collectors.toList());
    }

    private List<StatusHistory> aplicarFiltros(List<StatusHistory> historicoStatus, RelatorioCreateRequest request) {
        return historicoStatus.stream()
                .filter(history -> {
                    // Filtro por tipo de entidade
                    if (request.getTipoEntidade() != null &&
                            !"TODOS".equals(request.getTipoEntidade())) {
                        if (!history.getEntityType().name().equals(request.getTipoEntidade())) {
                            return false;
                        }
                    }

                    // Filtro por status
                    if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                        if (!request.getStatus().contains(history.getStatusNovo())) {
                            return false;
                        }
                    }

                    return true;
                })
                .collect(Collectors.toList());
    }

    private void enrichItemWithEntityData(RelatorioItemDto item, StatusHistory history) {
        try {
            switch (history.getEntityType()) {
                case GUIA:
                    guiaRepository.findById(history.getEntityId()).ifPresent(guia -> {
                        item.setNumeroGuia(guia.getNumeroGuia());
                        item.setGuiaId(guia.getId());

                        if (guia.getPaciente() != null) {
                            item.setPacienteNome(guia.getPaciente().getNome());
                            item.setPacienteId(guia.getPaciente().getId());

                            try {
                                item.setUnidade(guia.getPaciente().getUnidade().name());
                            } catch (Exception e) {
                                logger.warn("Método getUnidade() não existe no Paciente. Usando valor padrão.");
                                item.setUnidade("N/A");
                            }
                        }

                        if (guia.getConvenio() != null) {
                            try {
                                item.setConvenioNome(guia.getConvenio().getName());
                            } catch (Exception e) {
                                logger.warn("Erro ao obter nome do convênio: {}", e.getMessage());
                                item.setConvenioNome("N/A");
                            }
                        }

                        item.setMes(guia.getMes());
                        item.setAno(guia.getAno());
                        item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());
                        item.setStatus(guia.getStatus());

                        if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                            item.setEspecialidade(String.join(", ", guia.getEspecialidades()));
                        }

                        item.setDataAtualizacao(guia.getUpdatedAt());
                    });
                    break;

                case FICHA:
                    fichaRepository.findById(history.getEntityId()).ifPresent(ficha -> {
                        item.setCodigoFicha(ficha.getCodigoFicha());
                        item.setFichaId(ficha.getId());
                        item.setEspecialidade(ficha.getEspecialidade());
                        item.setPacienteNome(ficha.getPacienteNome());

                        UUID pacienteId = null;
                        if (ficha.getPaciente() != null) {
                            pacienteId = ficha.getPaciente().getId();
                        } else if (ficha.getGuia() != null && ficha.getGuia().getPaciente() != null) {
                            pacienteId = ficha.getGuia().getPaciente().getId();
                        }
                        item.setPacienteId(pacienteId);

                        item.setDataAtualizacao(ficha.getUpdatedAt());
                    });
                    break;

                default:
                    logger.warn("Tipo de entidade não suportado para enriquecimento: {}", history.getEntityType());
            }
        } catch (Exception e) {
            logger.error("Erro ao enriquecer dados da entidade {}: {}", history.getEntityType(), e.getMessage());
            // Continuar processamento mesmo com erro
        }
    }

    private Map<String, Long> calculateStatusDistribution(List<RelatorioItemDto> itens) {
        return itens.stream()
                .filter(item -> item.getStatusNovo() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getStatusNovo,
                        Collectors.counting()
                ));
    }

    private Map<String, Long> calculateEspecialidadeDistribution(List<RelatorioItemDto> itens) {
        return itens.stream()
                .filter(item -> item.getEspecialidade() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getEspecialidade,
                        Collectors.counting()
                ));
    }

    private Map<String, Long> calculateConvenioDistribution(List<RelatorioItemDto> itens) {
        return itens.stream()
                .filter(item -> item.getConvenioNome() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getConvenioNome,
                        Collectors.counting()
                ));
    }

    private Map<String, Long> calculateUnidadeDistribution(List<RelatorioItemDto> itens) {
        return itens.stream()
                .filter(item -> item.getUnidade() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getUnidade,
                        Collectors.counting()
                ));
    }

    private List<GraficoTimelineDto> generateTimelineData(List<RelatorioItemDto> itens,
                                                          LocalDateTime periodoInicio,
                                                          LocalDateTime periodoFim) {
        if (itens == null || itens.isEmpty()) {
            return new ArrayList<>();
        }

        Map<LocalDate, Long> timelineMap = itens.stream()
                .filter(item -> item.getDataMudancaStatus() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getDataMudancaStatus().toLocalDate(),
                        Collectors.counting()
                ));

        return timelineMap.entrySet().stream()
                .map(entry -> {
                    GraficoTimelineDto dto = new GraficoTimelineDto();
                    dto.setData(entry.getKey());
                    dto.setQuantidade(entry.getValue());
                    return dto;
                })
                .sorted(Comparator.comparing(GraficoTimelineDto::getData))
                .collect(Collectors.toList());
    }

    private String buildFiltrosJson(RelatorioCreateRequest request) {
        try {
            Map<String, Object> filtros = new HashMap<>();
            filtros.put("usuarioResponsavelId", request.getUsuarioResponsavelId());
            filtros.put("status", request.getStatus());
            filtros.put("especialidades", request.getEspecialidades());
            filtros.put("convenioIds", request.getConvenioIds());
            filtros.put("unidades", request.getUnidades());
            filtros.put("tipoEntidade", request.getTipoEntidade());
            filtros.put("incluirGraficos", request.getIncluirGraficos());
            filtros.put("incluirEstatisticas", request.getIncluirEstatisticas());
            filtros.put("formatoSaida", request.getFormatoSaida());

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            return objectMapper.writeValueAsString(filtros);
        } catch (Exception e) {
            logger.error("Erro ao converter filtros para JSON: {}", e.getMessage(), e);
            return "{}";
        }
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            // CORREÇÃO: Usar método que existe no UserRepository
            return userRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalStateException("Usuário não encontrado: " + username));
        }

        throw new IllegalStateException("Usuário não autenticado");
    }

    private boolean isUserAdminOrSupervisor(User user) {
        try {
            List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());
            return roleNames.contains("ADMIN") || roleNames.contains("SUPERVISOR");
        } catch (Exception e) {
            logger.warn("Erro ao verificar roles do usuário {}: {}", user.getId(), e.getMessage());
            return false;
        }
    }

    private String getClientIpAddress() {
        try {
            // Verificar headers de proxy
            String xForwardedFor = httpServletRequest.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = httpServletRequest.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                return xRealIp;
            }

            return httpServletRequest.getRemoteAddr();
        } catch (Exception e) {
            logger.warn("Erro ao obter IP do cliente: {}", e.getMessage());
            return "127.0.0.1"; // Fallback
        }
    }

    private void registrarLog(RelatorioLog log) {
        try {
            logRepository.save(log);
            logger.debug("Log registrado: {}", log.getAcao());
        } catch (Exception e) {
            logger.warn("Erro ao registrar log: {}", e.getMessage());
            // Não propagar exceção para não quebrar o processo principal
        }
    }

    // =================================================================================
    // MÉTODOS DE MAPEAMENTO DTO
    // =================================================================================

    private RelatorioItemDto mapGuiaToRelatorioItem(Guia guia) {
        RelatorioItemDto item = new RelatorioItemDto();

        item.setTipoEntidade("GUIA");
        item.setEntidadeId(guia.getId());
        item.setNumeroGuia(guia.getNumeroGuia());
        item.setGuiaId(guia.getId());

        // Status atual (sem anterior pois não é mudança)
        item.setStatus(guia.getStatus());
        item.setStatusNovo(guia.getStatus());
        item.setStatusAnterior(null);

        // Dados do paciente
        if (guia.getPaciente() != null) {
            item.setPacienteNome(guia.getPaciente().getNome());
            item.setPacienteId(guia.getPaciente().getId());

            try {
                item.setUnidade(guia.getPaciente().getUnidade().name());
            } catch (Exception e) {
                logger.warn("Erro ao obter unidade do paciente da guia {}: {}", guia.getId(), e.getMessage());
                item.setUnidade("N/A");
            }
        }

        // Dados do convênio
        if (guia.getConvenio() != null) {
            try {
                item.setConvenioNome(guia.getConvenio().getName());
            } catch (Exception e) {
                logger.warn("Erro ao obter nome do convênio da guia {}: {}", guia.getId(), e.getMessage());
                item.setConvenioNome("N/A");
            }
        }

        // Outros dados
        item.setMes(guia.getMes());
        item.setAno(guia.getAno());
        item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());

        if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
            item.setEspecialidade(String.join(", ", guia.getEspecialidades()));
        }

        // Usuário responsável
        if (guia.getUsuarioResponsavel() != null) {
            item.setUsuarioResponsavelNome(guia.getUsuarioResponsavel().getFullName());
        }

        // Data de atualização (não é mudança de status)
        item.setDataAtualizacao(guia.getUpdatedAt());
        item.setDataMudancaStatus(null); // Não há mudança específica, é estado atual
        item.setMotivoMudanca(null);

        return item;
    }

    private RelatorioItemDto mapFichaToRelatorioItem(Ficha ficha) {
        RelatorioItemDto item = new RelatorioItemDto();

        item.setTipoEntidade("FICHA");
        item.setEntidadeId(ficha.getId());
        item.setCodigoFicha(ficha.getCodigoFicha());
        item.setFichaId(ficha.getId());

        // Status atual
        item.setStatus(ficha.getStatus());
        item.setStatusNovo(ficha.getStatus());
        item.setStatusAnterior(null);

        // Dados do paciente
        item.setPacienteNome(ficha.getPacienteNome());

        UUID pacienteId = null;
        if (ficha.getPaciente() != null) {
            pacienteId = ficha.getPaciente().getId();
            try {
                item.setUnidade(ficha.getPaciente().getUnidade().name());
            } catch (Exception e) {
                logger.warn("Erro ao obter unidade do paciente da ficha {}: {}", ficha.getId(), e.getMessage());
                item.setUnidade("N/A");
            }
        } else if (ficha.getGuia() != null && ficha.getGuia().getPaciente() != null) {
            pacienteId = ficha.getGuia().getPaciente().getId();
            try {
                item.setUnidade(ficha.getGuia().getPaciente().getUnidade().name());
            } catch (Exception e) {
                logger.warn("Erro ao obter unidade do paciente via guia da ficha {}: {}", ficha.getId(), e.getMessage());
                item.setUnidade("N/A");
            }
        }
        item.setPacienteId(pacienteId);

        // Especialidade
        item.setEspecialidade(ficha.getEspecialidade());

        // Dados do convênio
        if (ficha.getConvenio() != null) {
            try {
                item.setConvenioNome(ficha.getConvenio().getName());
            } catch (Exception e) {
                logger.warn("Erro ao obter nome do convênio da ficha {}: {}", ficha.getId(), e.getMessage());
                item.setConvenioNome("N/A");
            }
        }

        // Outros dados
        item.setMes(ficha.getMes());
        item.setAno(ficha.getAno());
        item.setQuantidadeAutorizada(ficha.getQuantidadeAutorizada());

        // Usuário responsável
        if (ficha.getUsuarioResponsavel() != null) {
            item.setUsuarioResponsavelNome(ficha.getUsuarioResponsavel().getFullName());
        }

        // Data de atualização
        item.setDataAtualizacao(ficha.getUpdatedAt());
        item.setDataMudancaStatus(null);
        item.setMotivoMudanca(null);

        return item;
    }


    private RelatorioDto mapToDto(Relatorio relatorio) {
        RelatorioDto dto = new RelatorioDto();
        dto.setId(relatorio.getId());
        dto.setTitulo(relatorio.getTitulo());
        dto.setDescricao(relatorio.getDescricao());
        dto.setUsuarioGeradorId(relatorio.getUsuarioGerador().getId());
        dto.setUsuarioGeradorNome(relatorio.getUsuarioGerador().getFullName());
        dto.setPeriodoInicio(relatorio.getPeriodoInicio());
        dto.setPeriodoFim(relatorio.getPeriodoFim());

        // Converter JSON string para Map
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            Map<String, Object> filtrosMap = objectMapper.readValue(relatorio.getFiltros(),
                    new TypeReference<Map<String, Object>>() {});
            dto.setFiltros(filtrosMap);
        } catch (Exception e) {
            logger.warn("Erro ao converter filtros JSON: {}", e.getMessage());
            dto.setFiltros(new HashMap<>());
        }

        dto.setTotalRegistros(relatorio.getTotalRegistros());
        dto.setHashCompartilhamento(relatorio.getHashCompartilhamento());
        // CORREÇÃO: Usar enum direto em vez de .name() se DTO espera enum
        dto.setStatusRelatorio(relatorio.getStatusRelatorio());
        dto.setCreatedAt(relatorio.getCreatedAt());
        dto.setUpdatedAt(relatorio.getUpdatedAt());
        return dto;
    }

    private RelatorioSummaryDto mapToSummaryDto(Relatorio relatorio) {
        RelatorioSummaryDto dto = new RelatorioSummaryDto();
        dto.setId(relatorio.getId());
        dto.setTitulo(relatorio.getTitulo());
        dto.setUsuarioGeradorNome(relatorio.getUsuarioGerador().getFullName());
        dto.setPeriodoInicio(relatorio.getPeriodoInicio());
        dto.setPeriodoFim(relatorio.getPeriodoFim());
        dto.setTotalRegistros(relatorio.getTotalRegistros());
        dto.setStatusRelatorio(relatorio.getStatusRelatorio());
        dto.setCreatedAt(relatorio.getCreatedAt());

        // Verificar se tem compartilhamentos
        boolean hasCompartilhamentos = !compartilhamentoRepository.findByRelatorioId(relatorio.getId()).isEmpty();
        dto.setPossuiCompartilhamento(hasCompartilhamentos);

        return dto;
    }

    private RelatorioCompartilhamentoDto mapToCompartilhamentoDto(RelatorioCompartilhamento compartilhamento) {
        RelatorioCompartilhamentoDto dto = new RelatorioCompartilhamentoDto();
        dto.setId(compartilhamento.getId());
        dto.setRelatorioId(compartilhamento.getRelatorio().getId());
        dto.setRelatorioTitulo(compartilhamento.getRelatorio().getTitulo());
        dto.setUsuarioOrigemId(compartilhamento.getUsuarioOrigem().getId());
        dto.setUsuarioOrigemNome(compartilhamento.getUsuarioOrigem().getFullName());
        dto.setUsuarioDestinoId(compartilhamento.getUsuarioDestino().getId());
        dto.setUsuarioDestinoNome(compartilhamento.getUsuarioDestino().getFullName());
        dto.setObservacao(compartilhamento.getObservacao());
        dto.setDataCompartilhamento(compartilhamento.getDataCompartilhamento());
        dto.setVisualizado(compartilhamento.getVisualizado());
        dto.setDataVisualizacao(compartilhamento.getDataVisualizacao());
        // CORREÇÃO: Removido setCreatedAt pois método não existe no DTO
        return dto;
    }

    private RelatorioLogDto mapToLogDto(RelatorioLog log) {
        RelatorioLogDto dto = new RelatorioLogDto();
        dto.setId(log.getId());
        dto.setAcao(log.getAcao());
        if (log.getUsuario() != null) {
            dto.setUsuarioId(log.getUsuario().getId());
            dto.setUsuarioNome(log.getUsuario().getFullName());
        }

        // CORREÇÃO: Converter String JSON para Map<String, Object>
        if (log.getDetalhes() != null && !log.getDetalhes().trim().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.registerModule(new JavaTimeModule());
                Map<String, Object> detalhesMap = objectMapper.readValue(log.getDetalhes(),
                        new TypeReference<Map<String, Object>>() {});
                dto.setDetalhes(detalhesMap);
            } catch (Exception e) {
                logger.warn("Erro ao converter detalhes JSON para Map: {}", e.getMessage());
                // Se não conseguir converter, criar um Map com a string original
                Map<String, Object> detalhesMap = new HashMap<>();
                detalhesMap.put("detalhes", log.getDetalhes());
                dto.setDetalhes(detalhesMap);
            }
        } else {
            dto.setDetalhes(new HashMap<>());
        }

        dto.setIpAddress(log.getIpAddress());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }

    // =================================================================================
    // MÉTODOS DE CONVERSÃO JSON
    // =================================================================================

    private String convertToJsonString(RelatorioDataDto dados) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            return objectMapper.writeValueAsString(dados);
        } catch (Exception e) {
            logger.error("Erro ao converter dados para JSON: {}", e.getMessage(), e);
            return "{}";
        }
    }

    private RelatorioDataDto convertFromJsonString(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            throw new IllegalStateException("Dados do relatório não encontrados");
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            return objectMapper.readValue(jsonString, RelatorioDataDto.class);
        } catch (Exception e) {
            logger.error("Erro ao converter JSON para dados: {}", e.getMessage(), e);
            throw new IllegalStateException("Erro ao processar dados do relatório", e);
        }
    }

    private RelatorioCreateRequest recreateRequestFromFilters(Relatorio relatorio) {
        RelatorioCreateRequest request = new RelatorioCreateRequest();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            Map<String, Object> filtros = objectMapper.readValue(relatorio.getFiltros(),
                    new TypeReference<Map<String, Object>>() {});

            request.setTitulo(relatorio.getTitulo());
            request.setDescricao(relatorio.getDescricao());
            request.setPeriodoInicio(relatorio.getPeriodoInicio());
            request.setPeriodoFim(relatorio.getPeriodoFim());

            if (filtros != null) {
                // Conversão segura dos filtros
                Object usuarioId = filtros.get("usuarioResponsavelId");
                if (usuarioId != null) {
                    if (usuarioId instanceof String) {
                        request.setUsuarioResponsavelId(UUID.fromString((String) usuarioId));
                    } else if (usuarioId instanceof UUID) {
                        request.setUsuarioResponsavelId((UUID) usuarioId);
                    }
                }

                Object status = filtros.get("status");
                if (status instanceof List) {
                    request.setStatus((List<String>) status);
                }

                Object especialidades = filtros.get("especialidades");
                if (especialidades instanceof List) {
                    request.setEspecialidades((List<String>) especialidades);
                }

                Object convenioIds = filtros.get("convenioIds");
                if (convenioIds instanceof List) {
                    List<UUID> convenioUuids = new ArrayList<>();
                    for (Object id : (List<?>) convenioIds) {
                        if (id instanceof String) {
                            convenioUuids.add(UUID.fromString((String) id));
                        } else if (id instanceof UUID) {
                            convenioUuids.add((UUID) id);
                        }
                    }
                    request.setConvenioIds(convenioUuids);
                }

                Object unidades = filtros.get("unidades");
                if (unidades instanceof List) {
                    request.setUnidades((List<String>) unidades);
                }

                Object tipoEntidade = filtros.get("tipoEntidade");
                if (tipoEntidade instanceof String) {
                    request.setTipoEntidade((String) tipoEntidade);
                }

                Object incluirGraficos = filtros.get("incluirGraficos");
                if (incluirGraficos instanceof Boolean) {
                    request.setIncluirGraficos((Boolean) incluirGraficos);
                }

                Object incluirEstatisticas = filtros.get("incluirEstatisticas");
                if (incluirEstatisticas instanceof Boolean) {
                    request.setIncluirEstatisticas((Boolean) incluirEstatisticas);
                }

                Object formatoSaida = filtros.get("formatoSaida");
                if (formatoSaida instanceof String) {
                    request.setFormatoSaida((String) formatoSaida);
                }
            }

        } catch (Exception e) {
            logger.error("Erro ao recriar request dos filtros: {}", e.getMessage(), e);
            // Usar valores padrão em caso de erro
            request.setIncluirGraficos(true);
            request.setIncluirEstatisticas(true);
            request.setFormatoSaida("PDF");
        }

        return request;
    }
}