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
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.layout.element.Cell;
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
        logger.info("Iniciando geração de relatório: {} - Tipo: {}", request.getTitulo(), request.getTipoRelatorio());

        User currentUser = getCurrentUser();

        // 1. Tratamento de permissões e definição do usuário alvo
        UUID usuarioAlvo;

        if (RelatorioTipo.RELATORIO_GERAL.equals(request.getTipoRelatorio())) {
            // Apenas Admins/Supervisores podem gerar relatório geral (sem restrição de usuário)
            if (!isUserAdminOrSupervisor(currentUser)) {
                throw new IllegalArgumentException("Apenas administradores e supervisores podem gerar o Relatório Geral.");
            }
            
            usuarioAlvo = null;

        } else {
            // Lógica original para os outros tipos de relatório
            usuarioAlvo = request.getUsuarioResponsavelId() != null ?
                    request.getUsuarioResponsavelId() : currentUser.getId();

            if (!usuarioAlvo.equals(currentUser.getId()) && !isUserAdminOrSupervisor(currentUser)) {
                throw new IllegalArgumentException("Usuário não tem permissão para gerar relatórios de outros usuários");
            }
        }

        // 2. Fallback para compatibilidade (se o front não enviar o tipo)
        if (request.getTipoRelatorio() == null) {
            request.setTipoRelatorio(RelatorioTipo.ESTADO_ATUAL);
        }

        try {
            // 3. Criação da entidade Relatório
            Relatorio relatorio = new Relatorio();
            relatorio.setTitulo(request.getTitulo());
            relatorio.setDescricao(request.getDescricao());
            relatorio.setUsuarioGerador(currentUser);
            relatorio.setPeriodoInicio(request.getPeriodoInicio());
            relatorio.setPeriodoFim(request.getPeriodoFim());

            // Salva os filtros incluindo o Tipo, para poder reprocessar depois
            relatorio.setFiltros(buildFiltrosJson(request));

            relatorio.gerarHashCompartilhamento();
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.PROCESSANDO);

            relatorio = relatorioRepository.save(relatorio);
            logger.info("Relatório criado com ID: {}", relatorio.getId());

            try {
                RelatorioDataDto dados;

                // 4. Decisão de qual processamento usar baseada no ENUM
                if (RelatorioTipo.HISTORICO_MUDANCAS.equals(request.getTipoRelatorio())) {
                    dados = processarDadosRelatorioAuditoria(request, usuarioAlvo);
                    dados.setTipoRelatorio(RelatorioTipo.HISTORICO_MUDANCAS.name());

                } else if (RelatorioTipo.RELATORIO_GERAL.equals(request.getTipoRelatorio())) {
                    // Reutiliza a lógica de Estado Atual, mas o usuarioAlvo pode ser null aqui
                    dados = processarDadosRelatorioEstadoAtual(request, usuarioAlvo);
                    dados.setTipoRelatorio(RelatorioTipo.RELATORIO_GERAL.name());

                } else {
                    // Padrão: Estado Atual (usuarioAlvo sempre definido)
                    dados = processarDadosRelatorioEstadoAtual(request, usuarioAlvo);
                    dados.setTipoRelatorio(RelatorioTipo.ESTADO_ATUAL.name());
                }

                // 5. Finalização e salvamento dos dados JSON
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                String dadosJson = mapper.writeValueAsString(dados);

                relatorio.setDadosRelatorio(dadosJson);
                relatorio.setTotalRegistros(dados.getTotalRegistros());
                relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO);

                relatorio = relatorioRepository.save(relatorio);
                registrarLog(RelatorioLog.gerado(relatorio, currentUser, getClientIpAddress()));

                return mapToDto(relatorio);

            } catch (Exception e) {
                logger.error("Erro ao processar dados do relatório {}: {}", relatorio.getId(), e.getMessage(), e);
                relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.ERRO);
                relatorioRepository.save(relatorio);
                throw e;
            }

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
        logger.info("Gerando PDF para relatório: {} - Tipo: {}", dados.getTitulo(), dados.getTipoRelatorio());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);

            // A4 Paisagem
            Document document = new Document(pdf, PageSize.A4.rotate());
            document.setMargins(15, 15, 15, 15);

            // 1. Título e Cabeçalho
            document.add(new Paragraph(dados.getTitulo())
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

            String infoGeral = String.format(
                    "Gerador: %s | Período: %s a %s | Total: %d registros | Gerado em: %s",
                    dados.getUsuarioGerador(),
                    dados.getPeriodoInicio().format(DateTimeFormatter.ofPattern("dd/MM/yy")),
                    dados.getPeriodoFim().format(DateTimeFormatter.ofPattern("dd/MM/yy")),
                    dados.getTotalRegistros(),
                    dados.getDataGeracao().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm"))
            );

            document.add(new Paragraph(infoGeral).setFontSize(8).setMarginBottom(10));

            // 2. Tabela de Dados (Decisão baseada no Tipo)
            if (dados.getItens() != null && !dados.getItens().isEmpty()) {

                // Verificação Robusta usando o campo que gravamos no passo anterior
                boolean isAuditoria = RelatorioTipo.HISTORICO_MUDANCAS.name().equals(dados.getTipoRelatorio())
                        || (dados.getTitulo() != null && dados.getTitulo().toLowerCase().contains("auditoria"));

                Table table;

                if (isAuditoria) {
                    // --- CONFIGURAÇÃO TABELA AUDITORIA ---
                    table = new Table(UnitValue.createPercentArray(new float[]{
                            2.0f,  // Alterado Por (Quem mudou)
                            1.5f,  // Paciente
                            1.0f,  // Item (ID)
                            1.2f,  // De
                            1.2f,  // Para
                            1.5f,  // Data
                            1.6f   // Motivo
                    }));
                    table.setWidth(UnitValue.createPercentValue(100));

                    table.addHeaderCell(createCompactHeaderCell("Alterado Por"));
                    table.addHeaderCell(createCompactHeaderCell("Paciente"));
                    table.addHeaderCell(createCompactHeaderCell("Item / ID"));
                    table.addHeaderCell(createCompactHeaderCell("Status Anterior"));
                    table.addHeaderCell(createCompactHeaderCell("Status Novo"));
                    table.addHeaderCell(createCompactHeaderCell("Data Mudança"));
                    table.addHeaderCell(createCompactHeaderCell("Motivo / Obs"));

                    dados.getItens().stream().limit(500).forEach(item -> {
                        table.addCell(createCompactDataCell(truncateText(item.getUsuarioResponsavelNome(), 25)));
                        table.addCell(createCompactDataCell(truncateText(item.getPacienteNome(), 20)));

                        String idItem = "GUIA".equals(item.getTipoEntidade()) ? item.getNumeroGuia() : item.getCodigoFicha();
                        table.addCell(createCompactDataCell(idItem));

                        table.addCell(createCompactDataCell(item.getStatusAnterior()));
                        table.addCell(createCompactDataCell(item.getStatusNovo()));

                        String dataMudanca = item.getDataAtualizacao() != null ?
                                item.getDataAtualizacao().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")) : "-";
                        table.addCell(createCompactDataCell(dataMudanca));

                        table.addCell(createCompactDataCell(truncateText(item.getMotivoMudanca(), 30)));
                    });

                } else {
                    // --- CONFIGURAÇÃO TABELA PADRÃO (ESTADO ATUAL) ---
                    table = new Table(UnitValue.createPercentArray(new float[]{
                            2.2f, 1.5f, 1.0f, 1.2f, 2.0f, 0.8f, 0.7f, 0.8f, 1.0f, 0.8f
                    }));
                    table.setWidth(UnitValue.createPercentValue(100));

                    table.addHeaderCell(createCompactHeaderCell("Paciente"));
                    table.addHeaderCell(createCompactHeaderCell("Convênio"));
                    table.addHeaderCell(createCompactHeaderCell("Nº/Código"));
                    table.addHeaderCell(createCompactHeaderCell("Status"));
                    table.addHeaderCell(createCompactHeaderCell("Especialidade"));
                    table.addHeaderCell(createCompactHeaderCell("Unidade"));
                    table.addHeaderCell(createCompactHeaderCell("Mês"));
                    table.addHeaderCell(createCompactHeaderCell("Qtd."));
                    table.addHeaderCell(createCompactHeaderCell("Atualização"));
                    table.addHeaderCell(createCompactHeaderCell("Tipo"));

                    dados.getItens().stream().limit(500).forEach(item -> {
                        table.addCell(createCompactDataCell(truncateText(item.getPacienteNome(), 25)));
                        table.addCell(createCompactDataCell(truncateText(item.getConvenioNome(), 18)));
                        table.addCell(createCompactDataCell(getNumeroOuCodigoPDF(item)));
                        table.addCell(createCompactDataCell(item.getStatus())); // Status atual
                        table.addCell(createCompactDataCell(item.getEspecialidade()));
                        table.addCell(createCompactDataCell(getUnidadeFormatadaPDF(item)));
                        table.addCell(createCompactDataCell(getMesFormatadoPDF(item)));
                        table.addCell(createCompactDataCell(getQuantidadeFormatadaPDF(item)));

                        String dataAtualizacao = item.getDataAtualizacao() != null ?
                                item.getDataAtualizacao().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")) : "-";
                        table.addCell(createCompactDataCell(dataAtualizacao));

                        table.addCell(createCompactDataCell(item.getTipoEntidade()));
                    });
                }

                document.add(table);

                if (dados.getItens().size() > 500) {
                    document.add(new Paragraph("+ " + (dados.getItens().size() - 500) + " itens não exibidos (limite de página)")
                            .setFontSize(7).setItalic());
                }
            } else {
                document.add(new Paragraph("Nenhum dado encontrado para os filtros selecionados.").setItalic());
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

    private RelatorioDataDto processarDadosRelatorioAuditoria(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Processando relatório de Auditoria/Histórico de Status");

        RelatorioDataDto dados = new RelatorioDataDto();
        dados.setTitulo(request.getTitulo());
        dados.setUsuarioGerador(getCurrentUser().getFullName());
        dados.setPeriodoInicio(request.getPeriodoInicio());
        dados.setPeriodoFim(request.getPeriodoFim());
        dados.setDataGeracao(LocalDateTime.now());

        // Define explicitamente o tipo nos dados para o PDF
        dados.setTipoRelatorio(RelatorioTipo.HISTORICO_MUDANCAS.name());

        // 1. Identificar Entidade (Guia ou Ficha)
        StatusHistory.EntityType entityType = null;
        if ("GUIA".equalsIgnoreCase(request.getTipoEntidade())) {
            entityType = StatusHistory.EntityType.GUIA;
        } else if ("FICHA".equalsIgnoreCase(request.getTipoEntidade())) {
            entityType = StatusHistory.EntityType.FICHA;
        }

        // 2. Busca no repositório de histórico
        // OBS: Aqui ajustamos para buscar TUDO no período, independente de quem alterou.
        // Se o requisito for "ver o histórico das guias DO usuário X", seria necessário
        // buscar os IDs das guias dele primeiro e passar para o repository (findWithEntityIds),
        // mas assumindo a busca geral por período/tipo:

        Page<StatusHistory> historicoPage = statusHistoryRepository.findWithFilters(
                entityType,
                null, // entityId (null = todas as entidades desse tipo)
                null, // statusNovo (null = todas as mudanças)
                usuarioAlvo,
                request.getPeriodoInicio(),
                request.getPeriodoFim(),
                Pageable.unpaged()
        );

        List<StatusHistory> historico = historicoPage.getContent();

        // 3. Mapeia para o DTO do relatório
        List<RelatorioItemDto> itens = historico.stream()
                .map(h -> {
                    RelatorioItemDto item = new RelatorioItemDto();

                    // Dados básicos da mudança
                    item.setEntidadeId(h.getEntityId());
                    item.setTipoEntidade(h.getEntityType().name());
                    item.setStatusAnterior(h.getStatusAnterior());
                    item.setStatusNovo(h.getStatusNovo());
                    item.setDataAtualizacao(h.getDataAlteracao());
                    item.setMotivoMudanca(h.getMotivo());

                    // Quem realizou a alteração (Auditoria)
                    if (h.getAlteradoPor() != null) {
                        item.setUsuarioResponsavelNome(h.getAlteradoPor().getFullName());
                    } else {
                        item.setUsuarioResponsavelNome("Sistema/Automático");
                    }

                    // Enriquecer com dados da Guia/Ficha (Paciente, Código, etc)
                    enrichItemWithEntityData(item, h.getEntityType(), h.getEntityId());

                    return item;
                })
                // Ordenar por data (mais recente primeiro)
                .sorted((a, b) -> b.getDataAtualizacao().compareTo(a.getDataAtualizacao()))
                .collect(Collectors.toList());

        dados.setItens(itens);
        dados.setTotalRegistros(itens.size());

        // 4. Gera estatísticas úteis para auditoria
        // Ex: Quantas mudanças cada usuário fez
        Map<String, Long> mudancasPorUsuario = itens.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getUsuarioResponsavelNome() != null ? i.getUsuarioResponsavelNome() : "Desconhecido",
                        Collectors.counting()
                ));
        dados.setDistribuicaoPorStatus(mudancasPorUsuario); // Reutilizando campo map para exibir estatística

        return dados;
    }

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
        logger.info("Buscando guias com estado atual para relatório. Tipo: {}", request.getTipoRelatorio());

        List<Guia> guias;

        // SE FOR RELATORIO_GERAL, FILTRA POR MÊS/ANO DE COMPETÊNCIA
        if (RelatorioTipo.RELATORIO_GERAL.equals(request.getTipoRelatorio())) {
            int startPeriod = request.getPeriodoInicio().getYear() * 12 + request.getPeriodoInicio().getMonthValue();
            int endPeriod = request.getPeriodoFim().getYear() * 12 + request.getPeriodoFim().getMonthValue();

            guias = guiaRepository.findGuiasForRelatorioByPeriodo(
                    usuarioAlvo,
                    startPeriod,
                    endPeriod,
                    request.getStatus(),
                    request.getEspecialidades(),
                    request.getConvenioIds(),
                    request.getUnidades()
            );
        } else {
            // COMPORTAMENTO PADRÃO (ESTADO_ATUAL): Filtra por Data de Atualização (updatedAt)
            guias = guiaRepository.findGuiasForRelatorio(
                    usuarioAlvo,
                    request.getPeriodoInicio(),
                    request.getPeriodoFim(),
                    request.getStatus(),
                    request.getEspecialidades(),
                    request.getConvenioIds(),
                    request.getUnidades()
            );
        }

        return guias.stream()
                .map(this::mapGuiaToRelatorioItem)
                .collect(Collectors.toList());
    }

    private List<RelatorioItemDto> buscarFichasComEstadoAtual(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Buscando fichas com estado atual para relatório. Tipo: {}", request.getTipoRelatorio());

        List<Ficha> fichas;

        // SE FOR RELATORIO_GERAL, FILTRA POR MÊS/ANO DE COMPETÊNCIA
        if (RelatorioTipo.RELATORIO_GERAL.equals(request.getTipoRelatorio())) {
            int startPeriod = request.getPeriodoInicio().getYear() * 12 + request.getPeriodoInicio().getMonthValue();
            int endPeriod = request.getPeriodoFim().getYear() * 12 + request.getPeriodoFim().getMonthValue();

            fichas = fichaRepository.findFichasForRelatorioByPeriodo(
                    usuarioAlvo,
                    startPeriod,
                    endPeriod,
                    request.getStatus(),
                    request.getEspecialidades(),
                    request.getConvenioIds(),
                    request.getUnidades()
            );
        } else {
            // COMPORTAMENTO PADRÃO (ESTADO_ATUAL): Filtra por Data de Criação/Atualização
            fichas = fichaRepository.findFichasForRelatorio(
                    usuarioAlvo,
                    request.getPeriodoInicio(),
                    request.getPeriodoFim(),
                    request.getStatus(),
                    request.getEspecialidades(),
                    request.getConvenioIds(),
                    request.getUnidades()
            );
        }

        return fichas.stream()
                .map(this::mapFichaToRelatorioItem)
                .collect(Collectors.toList());
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
            return userRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalStateException("Usuário não encontrado: " + username));
        }

        throw new IllegalStateException("Usuário não autenticado");
    }

    private boolean isUserAdminOrSupervisor(User user) {
        try {
            List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());
            return roleNames.contains("ADMIN") || roleNames.contains("SUPERVISOR") || roleNames.contains("GUIAS") ;
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

    // Métodos auxiliares para formatação no PDF
    private String getNumeroOuCodigoPDF(RelatorioItemDto item) {
        if ("GUIA".equals(item.getTipoEntidade()) && item.getNumeroGuia() != null) {
            return item.getNumeroGuia();
        } else if ("FICHA".equals(item.getTipoEntidade()) && item.getCodigoFicha() != null) {
            return item.getCodigoFicha();
        }
        return "-";
    }

    private String getMesFormatadoPDF(RelatorioItemDto item) {
        if (item.getMes() != null && item.getAno() != null) {
            return String.format("%02d/%d", item.getMes(), item.getAno());
        }
        return "-";
    }

    private String getQuantidadeFormatadaPDF(RelatorioItemDto item) {
        if (item.getQuantidadeAutorizada() != null) {
            return item.getQuantidadeAutorizada().toString();
        }
        return "-";
    }

    private String getUnidadeFormatadaPDF(RelatorioItemDto item) {
        if (item.getUnidade() != null && !item.getUnidade().trim().isEmpty()) {
            return item.getUnidade();
        }
        return "N/A";
    }

    private Cell createCompactHeaderCell(String content) {
        return new Cell()
                .add(new Paragraph(content))
                .setBold()
                .setFontSize(8)  // Fonte menor para cabeçalho
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setPadding(3);  // Padding reduzido
    }

    private Cell createCompactDataCell(String content) {
        String cellContent = content != null ? content : "-";
        return new Cell()
                .add(new Paragraph(cellContent))
                .setFontSize(7)  // Fonte menor para dados
                .setPadding(2)   // Padding reduzido
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.LEFT);
    }

    private String truncateText(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }

    private RelatorioItemDto mapGuiaToRelatorioItem(Guia guia) {
        RelatorioItemDto item = new RelatorioItemDto();

        item.setTipoEntidade("GUIA");
        item.setEntidadeId(guia.getId());
        item.setNumeroGuia(guia.getNumeroGuia());
        item.setGuiaId(guia.getId());

        item.setStatus(guia.getStatus());
        item.setStatusNovo(guia.getStatus());

        if (guia.getPaciente() != null) {
            item.setPacienteNome(guia.getPaciente().getNome());
            item.setPacienteId(guia.getPaciente().getId());
            try {
                item.setUnidade(guia.getPaciente().getUnidade().name());
            } catch (Exception e) {
                logger.warn("Erro ao obter unidade: {}", e.getMessage());
                item.setUnidade("N/A");
            }
        }

        if (guia.getConvenio() != null) {
            item.setConvenioNome(guia.getConvenio().getName());
        }

        if (guia.getItens() != null && !guia.getItens().isEmpty()) {

            String especialidades = guia.getItens().stream()
                    .map(i -> i.getEspecialidade()) // Verifique se o getter no GuiaItem é getEspecialidade() ou getNomeEspecialidade()
                    .distinct()
                    .collect(Collectors.joining(", "));
            item.setEspecialidade(especialidades);

            int totalAutorizado = guia.getItens().stream()
                    .mapToInt(i -> i.getQuantidadeAutorizada())
                    .sum();
            item.setQuantidadeAutorizada(totalAutorizado);
        } else {
            item.setQuantidadeAutorizada(0);
        }

        item.setMes(guia.getMes());
        item.setAno(guia.getAno());

        if (guia.getUsuarioResponsavel() != null) {
            item.setUsuarioResponsavelNome(guia.getUsuarioResponsavel().getFullName());
        }

        item.setDataAtualizacao(guia.getUpdatedAt());

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

        Paciente paciente = ficha.getPaciente();
        if (paciente == null && ficha.getGuia() != null) {
            paciente = ficha.getGuia().getPaciente();
        }

        if (paciente != null) {
            item.setPacienteNome(paciente.getNome());
            item.setPacienteId(paciente.getId());

            try {
                if (paciente.getUnidade() != null) {
                    item.setUnidade(paciente.getUnidade().name());
                } else {
                    item.setUnidade("N/A");
                }
            } catch (Exception e) {
                logger.warn("Erro ao obter unidade do paciente da ficha {}: {}", ficha.getId(), e.getMessage());
                item.setUnidade("N/A");
            }
        } else {
            item.setPacienteNome("Paciente não identificado");
            item.setUnidade("N/A");
        }

        item.setEspecialidade(ficha.getEspecialidade());

        if (ficha.getConvenio() != null) {
            try {
                item.setConvenioNome(ficha.getConvenio().getName());
            } catch (Exception e) {
                logger.warn("Erro ao obter nome do convênio da ficha {}: {}", ficha.getId(), e.getMessage());
                item.setConvenioNome("N/A");
            }
        }

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

    private void enrichItemWithEntityData(RelatorioItemDto item, StatusHistory.EntityType type, UUID id) {
        if (type == StatusHistory.EntityType.GUIA) {
            guiaRepository.findById(id).ifPresent(g -> {
                item.setNumeroGuia(g.getNumeroGuia());
                if (g.getPaciente() != null) item.setPacienteNome(g.getPaciente().getNome());
                if (g.getConvenio() != null) item.setConvenioNome(g.getConvenio().getName());
            });
        } else if (type == StatusHistory.EntityType.FICHA) {
            fichaRepository.findById(id).ifPresent(f -> {
                item.setCodigoFicha(f.getCodigoFicha());
                if (f.getPaciente() != null) item.setPacienteNome(f.getPaciente().getNome());
            });
        }
    }
}