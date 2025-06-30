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
import com.itextpdf.kernel.colors.DeviceGray;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
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
        logger.info("Iniciando geração de relatório: {}", request.getTitulo());

        User currentUser = getCurrentUser();

        // Verificar se o usuário pode gerar relatório para outro usuário
        UUID usuarioAlvo = request.getUsuarioResponsavelId() != null ?
                request.getUsuarioResponsavelId() : currentUser.getId();

        if (!usuarioAlvo.equals(currentUser.getId()) && !isUserAdminOrSupervisor(currentUser)) {
            throw new IllegalArgumentException("Usuário não tem permissão para gerar relatórios de outros usuários");
        }

        // Criar entidade do relatório
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

        // Gerar dados do relatório
        try {
            RelatorioDataDto dadosRelatorio = processarDadosRelatorio(request, usuarioAlvo);
            relatorio.setTotalRegistros(dadosRelatorio.getTotalRegistros());
            relatorio.setDadosRelatorio(convertToJsonString(dadosRelatorio));
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO);

            relatorio = relatorioRepository.save(relatorio);

            // Registrar log de geração
            registrarLog(RelatorioLog.gerado(relatorio, currentUser, getClientIpAddress()));

            logger.info("Relatório gerado com sucesso. ID: {}, Total de registros: {}",
                    relatorio.getId(), relatorio.getTotalRegistros());

        } catch (Exception e) {
            logger.error("Erro ao processar dados do relatório: {}", e.getMessage(), e);
            relatorio.setStatusRelatorio(Relatorio.StatusRelatorio.ERRO);
            relatorioRepository.save(relatorio);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }

        return mapToDto(relatorio);
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
            Document document = new Document(pdf, PageSize.A4);

            // Configurar margens
            document.setMargins(50, 50, 50, 50);

            // CABEÇALHO COM IDENTIDADE VISUAL
            addPDFHeader(document, dados);

            // INFORMAÇÕES GERAIS DO RELATÓRIO
            addRelatorioInfo(document, dados);

            // ESTATÍSTICAS RESUMIDAS
            addEstatisticasResumo(document, dados);

            // DETALHAMENTO DOS ITENS
            addItensDetalhados(document, dados);

            // RODAPÉ
            addPDFFooter(document, dados);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }

    private void addPDFHeader(Document document, RelatorioDataDto dados) {
        try {
            // Cores da identidade visual
            DeviceRgb primaryColor = new DeviceRgb(46, 166, 184); // #2ea6b8
            DeviceRgb lightBlue = new DeviceRgb(88, 197, 214); // #58c5d6

            // Criar tabela para o cabeçalho
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .setWidth(UnitValue.createPercentValue(100));

            // Logo/Ícone (placeholder - pode ser substituído por logo real)
            Cell logoCell = new Cell()
                    .setBackgroundColor(primaryColor)
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .setPadding(20);

            logoCell.add(new Paragraph("📊")
                    .setFontSize(40)
                    .setTextAlignment(TextAlignment.CENTER));

            headerTable.addCell(logoCell);

            // Informações da empresa/sistema
            Cell infoCell = new Cell()
                    .setBackgroundColor(lightBlue)
                    .setBorder(Border.NO_BORDER)
                    .setPadding(20);

            infoCell.add(new Paragraph("SISTEMA DE GESTÃO CLÍNICA")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(primaryColor));

            infoCell.add(new Paragraph("Relatório de Análise de Dados")
                    .setFontSize(12)
                    .setFontColor(DeviceGray.GRAY)
                    .setMarginTop(5));

            infoCell.add(new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                    .setFontSize(10)
                    .setFontColor(DeviceGray.GRAY)
                    .setMarginTop(10));

            headerTable.addCell(infoCell);

            document.add(headerTable);
            document.add(new Paragraph("\n"));

        } catch (Exception e) {
            logger.warn("Erro ao adicionar cabeçalho do PDF: {}", e.getMessage());
        }
    }

    private void addRelatorioInfo(Document document, RelatorioDataDto dados) {
        try {
            DeviceRgb primaryColor = new DeviceRgb(46, 166, 184);

            // Título do relatório
            document.add(new Paragraph(dados.getTitulo())
                    .setFontSize(24)
                    .setBold()
                    .setFontColor(primaryColor)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Tabela com informações principais
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(20);

            // Headers
            String[] headers = {"Gerado por", "Período", "Total de Registros", "Data de Geração"};
            for (String header : headers) {
                Cell headerCell = new Cell()
                        .setBackgroundColor(primaryColor)
                        .setFontColor(DeviceGray.WHITE)
                        .setBold()
                        .setPadding(10)
                        .setTextAlignment(TextAlignment.CENTER);
                headerCell.add(new Paragraph(header).setFontSize(10));
                infoTable.addHeaderCell(headerCell);
            }

            // Dados
            infoTable.addCell(createInfoCell(dados.getUsuarioGerador()));
            infoTable.addCell(createInfoCell(formatPeriodo(dados.getPeriodoInicio(), dados.getPeriodoFim())));
            infoTable.addCell(createInfoCell(String.valueOf(dados.getTotalRegistros())));
            infoTable.addCell(createInfoCell(dados.getDataGeracao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));

            document.add(infoTable);

        } catch (Exception e) {
            logger.warn("Erro ao adicionar informações do relatório: {}", e.getMessage());
        }
    }

    private void addEstatisticasResumo(Document document, RelatorioDataDto dados) {
        try {
            DeviceRgb primaryColor = new DeviceRgb(46, 166, 184);

            document.add(new Paragraph("📈 RESUMO ESTATÍSTICO")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(primaryColor)
                    .setMarginTop(20)
                    .setMarginBottom(15));

            // Criar grid de estatísticas
            Table statsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(20);

            // Distribuição por Status
            if (dados.getDistribuicaoPorStatus() != null && !dados.getDistribuicaoPorStatus().isEmpty()) {
                Cell statusCell = createStatsCard("Status", dados.getDistribuicaoPorStatus());
                statsTable.addCell(statusCell);
            }

            // Distribuição por Convênio
            if (dados.getDistribuicaoPorConvenio() != null && !dados.getDistribuicaoPorConvenio().isEmpty()) {
                Cell convenioCell = createStatsCard("Convênios", dados.getDistribuicaoPorConvenio());
                statsTable.addCell(convenioCell);
            }

            // Distribuição por Especialidade
            if (dados.getDistribuicaoPorEspecialidade() != null && !dados.getDistribuicaoPorEspecialidade().isEmpty()) {
                Cell especialidadeCell = createStatsCard("Especialidades", dados.getDistribuicaoPorEspecialidade());
                statsTable.addCell(especialidadeCell);
            }

            document.add(statsTable);

        } catch (Exception e) {
            logger.warn("Erro ao adicionar estatísticas: {}", e.getMessage());
        }
    }

    private void addItensDetalhados(Document document, RelatorioDataDto dados) {
        try {
            DeviceRgb primaryColor = new DeviceRgb(46, 166, 184);

            document.add(new Paragraph("📋 DETALHAMENTO DOS REGISTROS")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(primaryColor)
                    .setMarginTop(20)
                    .setMarginBottom(15));

            if (dados.getItens() == null || dados.getItens().isEmpty()) {
                document.add(new Paragraph("Nenhum registro encontrado.")
                        .setFontSize(12)
                        .setFontColor(DeviceGray.GRAY)
                        .setTextAlignment(TextAlignment.CENTER));
                return;
            }

            // Tabela detalhada
            float[] columnWidths = {0.8f, 1.2f, 1.5f, 1f, 1f, 1f, 1.2f, 1.2f};
            Table detailTable = new Table(UnitValue.createPercentArray(columnWidths))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setFontSize(8);

            // Headers da tabela
            String[] headers = {
                    "Tipo", "Paciente", "Identificação", "Convênio",
                    "Especialidade", "Status", "Responsável", "Atualização"
            };

            for (String header : headers) {
                Cell headerCell = new Cell()
                        .setBackgroundColor(primaryColor)
                        .setFontColor(DeviceGray.WHITE)
                        .setBold()
                        .setPadding(8)
                        .setTextAlignment(TextAlignment.CENTER);
                headerCell.add(new Paragraph(header).setFontSize(9));
                detailTable.addHeaderCell(headerCell);
            }

            // Adicionar itens
            for (int i = 0; i < dados.getItens().size(); i++) {
                RelatorioItemDto item = dados.getItens().get(i);

                // Alternar cores das linhas
                DeviceRgb rowColor = (i % 2 == 0) ? new DeviceRgb(255, 255, 255) : new DeviceRgb(248, 249, 250);

                // Tipo
                detailTable.addCell(createDataCell(item.getTipoEntidade(), rowColor));

                // Paciente
                detailTable.addCell(createDataCell(
                        truncateText(item.getPacienteNome(), 20), rowColor));

                // Identificação (MELHORADO)
                String identificacao = buildIdentificacao(item);
                detailTable.addCell(createDataCell(identificacao, rowColor));

                // Convênio
                detailTable.addCell(createDataCell(
                        truncateText(item.getConvenioNome(), 15), rowColor));

                // Especialidade
                detailTable.addCell(createDataCell(
                        truncateText(item.getEspecialidade(), 15), rowColor));

                // Status
                detailTable.addCell(createDataCell(
                        truncateText(item.getStatus(), 15), rowColor));

                // Responsável
                detailTable.addCell(createDataCell(
                        truncateText(item.getUsuarioResponsavelNome(), 15), rowColor));

                // Atualização
                String dataFormatada = item.getDataAtualizacao() != null ?
                        item.getDataAtualizacao().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")) : "N/A";
                detailTable.addCell(createDataCell(dataFormatada, rowColor));
            }

            document.add(detailTable);

        } catch (Exception e) {
            logger.warn("Erro ao adicionar itens detalhados: {}", e.getMessage());
        }
    }

    private void addPDFFooter(Document document, RelatorioDataDto dados) {
        try {
            DeviceRgb primaryColor = new DeviceRgb(46, 166, 184);

            // Adicionar linha separadora
            document.add(new Paragraph("\n"));
            document.add(new LineSeparator(new SolidLine(1))
                    .setMarginTop(20)
                    .setMarginBottom(10));

            // Informações do rodapé
            Table footerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100));

            // Lado esquerdo
            Cell leftCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPadding(5);
            leftCell.add(new Paragraph("Sistema de Gestão Clínica")
                    .setFontSize(10)
                    .setFontColor(primaryColor)
                    .setBold());
            leftCell.add(new Paragraph("Relatório gerado automaticamente")
                    .setFontSize(8)
                    .setFontColor(DeviceGray.GRAY));

            // Lado direito
            Cell rightCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPadding(5)
                    .setTextAlignment(TextAlignment.RIGHT);
            rightCell.add(new Paragraph("Total de " + dados.getTotalRegistros() + " registros processados")
                    .setFontSize(8)
                    .setFontColor(DeviceGray.GRAY));
            rightCell.add(new Paragraph("Página 1")
                    .setFontSize(8)
                    .setFontColor(DeviceGray.GRAY));

            footerTable.addCell(leftCell);
            footerTable.addCell(rightCell);

            document.add(footerTable);

        } catch (Exception e) {
            logger.warn("Erro ao adicionar rodapé: {}", e.getMessage());
        }
    }

    // === MÉTODOS AUXILIARES ===

    private String buildIdentificacao(RelatorioItemDto item) {
        List<String> partes = new ArrayList<>();

        if (item.getCodigoFicha() != null) {
            partes.add("F:" + item.getCodigoFicha());
        }

        if (item.getNumeroGuia() != null) {
            partes.add("G:" + item.getNumeroGuia());
        }

        // Se há relação ficha-guia, mostrar a vinculação
        if (item.getCodigoFicha() != null && item.getNumeroGuia() != null) {
            return String.format("F:%s → G:%s", item.getCodigoFicha(), item.getNumeroGuia());
        }

        return partes.isEmpty() ? "N/A" : String.join(" | ", partes);
    }

    private Cell createInfoCell(String text) {
        Cell cell = new Cell()
                .setPadding(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(DeviceGray.GRAY, 1));
        cell.add(new Paragraph(text != null ? text : "N/A").setFontSize(10));
        return cell;
    }

    private Cell createStatsCard(String title, Map<String, Long> data) {
        Cell cell = new Cell()
                .setPadding(10)
                .setBorder(new SolidBorder(new DeviceRgb(46, 166, 184), 1))
                .setBackgroundColor(new DeviceRgb(46, 166, 184));

        // Título
        cell.add(new Paragraph(title)
                .setFontSize(12)
                .setBold()
                .setFontColor(new DeviceRgb(46, 166, 184))
                .setMarginBottom(8));

        // Dados - mostrar apenas os top 5
        data.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> {
                    String linha = String.format("• %s: %d",
                            truncateText(entry.getKey(), 20), entry.getValue());
                    cell.add(new Paragraph(linha)
                            .setFontSize(9)
                            .setMarginBottom(3));
                });

        if (data.size() > 5) {
            cell.add(new Paragraph("... e mais " + (data.size() - 5) + " itens")
                    .setFontSize(8)
                    .setFontColor(DeviceGray.GRAY)
                    .setItalic());
        }

        return cell;
    }

    private Cell createDataCell(String text, DeviceRgb backgroundColor) {
        Cell cell = new Cell()
                .setPadding(6)
                .setBackgroundColor(backgroundColor)
                .setBorder(new SolidBorder(DeviceGray.GRAY, 0.5f));
        cell.add(new Paragraph(text != null ? text : "N/A")
                .setFontSize(8));
        return cell;
    }

    private String truncateText(String text, int maxLength) {
        if (text == null) return "N/A";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }

    private String formatPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return inicio.format(formatter) + " - " + fim.format(formatter);
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
            RelatorioDataDto dadosRelatorio = processarDadosRelatorio(request, relatorio.getUsuarioGerador().getId());
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

    private RelatorioDataDto processarDadosRelatorio(RelatorioCreateRequest request, UUID usuarioAlvo) {
        logger.info("Processando dados do relatório para usuário: {}", usuarioAlvo);

        RelatorioDataDto dados = new RelatorioDataDto();
        dados.setTitulo(request.getTitulo());
        dados.setUsuarioGerador(getCurrentUser().getFullName());
        dados.setPeriodoInicio(request.getPeriodoInicio());
        dados.setPeriodoFim(request.getPeriodoFim());
        dados.setDataGeracao(LocalDateTime.now());

        Map<String, Object> filtrosAplicados = new HashMap<>();
        filtrosAplicados.put("usuarioResponsavelId", request.getUsuarioResponsavelId());
        filtrosAplicados.put("status", request.getStatus());
        filtrosAplicados.put("especialidades", request.getEspecialidades());
        filtrosAplicados.put("convenioIds", request.getConvenioIds());
        filtrosAplicados.put("unidades", request.getUnidades());
        filtrosAplicados.put("tipoEntidade", request.getTipoEntidade());
        dados.setFiltrosAplicados(filtrosAplicados);

        List<StatusHistory> historicoStatus = statusHistoryRepository
                .findByDataAlteracaoBetween(request.getPeriodoInicio(), request.getPeriodoFim(), Pageable.unpaged())
                .getContent()
                .stream()
                .filter(h -> h.getAlteradoPor().getId().equals(usuarioAlvo))
                .collect(Collectors.toList());

        historicoStatus = aplicarFiltros(historicoStatus, request);

        List<RelatorioItemDto> itens = new ArrayList<>();

        for (StatusHistory history : historicoStatus) {
            RelatorioItemDto item = new RelatorioItemDto();
            item.setTipoEntidade(history.getEntityType().name());
            item.setEntidadeId(history.getEntityId());
            item.setStatusAnterior(history.getStatusAnterior());
            item.setStatusNovo(history.getStatusNovo());
            item.setMotivoMudanca(history.getMotivo());
            item.setDataMudancaStatus(history.getDataAlteracao());
            item.setUsuarioResponsavelNome(history.getAlteradoPor().getFullName());

            enrichItemWithEntityData(item, history);

            itens.add(item);
        }

        dados.setItens(itens);
        dados.setTotalRegistros(itens.size());

        dados.setDistribuicaoPorStatus(calculateStatusDistribution(itens));
        dados.setDistribuicaoPorEspecialidade(calculateEspecialidadeDistribution(itens));
        dados.setDistribuicaoPorConvenio(calculateConvenioDistribution(itens));
        dados.setDistribuicaoPorUnidade(calculateUnidadeDistribution(itens));

        dados.setTimelineData(generateTimelineData(itens, request.getPeriodoInicio(), request.getPeriodoFim()));

        return dados;
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
                    enrichGuiaData(item, history);
                    break;
                case FICHA:
                    enrichFichaData(item, history);
                    break;
                default:
                    logger.warn("Tipo de entidade não suportado para enriquecimento: {}", history.getEntityType());
            }
        } catch (Exception e) {
            logger.error("Erro ao enriquecer dados da entidade {}: {}", history.getEntityType(), e.getMessage());
            // Continuar processamento mesmo com erro
        }
    }

    private void enrichGuiaData(RelatorioItemDto item, StatusHistory history) {
        guiaRepository.findById(history.getEntityId()).ifPresent(guia -> {
            // Dados básicos da guia
            item.setNumeroGuia(guia.getNumeroGuia());
            item.setGuiaId(guia.getId());
            item.setStatusGuia(guia.getStatus());

            // Dados do paciente
            if (guia.getPaciente() != null) {
                item.setPacienteNome(guia.getPaciente().getNome());
                item.setPacienteId(guia.getPaciente().getId());

                try {
                    item.setUnidade(guia.getPaciente().getUnidade() != null ?
                            guia.getPaciente().getUnidade().name() : "N/A");
                } catch (Exception e) {
                    logger.warn("Erro ao obter unidade do paciente: {}", e.getMessage());
                    item.setUnidade("N/A");
                }
            }

            // Dados do convênio
            if (guia.getConvenio() != null) {
                item.setConvenioNome(guia.getConvenio().getName());
                item.setConvenioId(guia.getConvenio().getId());
            }

            // Informações gerais
            item.setMes(guia.getMes());
            item.setAno(guia.getAno());
            item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());
            item.setStatus(guia.getStatus());

            // Especialidades
            if (guia.getEspecialidades() != null && !guia.getEspecialidades().isEmpty()) {
                item.setEspecialidade(String.join(", ", guia.getEspecialidades()));
            }

            // Usuário responsável
            if (guia.getUsuarioResponsavel() != null) {
                item.setUsuarioResponsavelNome(guia.getUsuarioResponsavel().getFullName());
                item.setUsuarioResponsavelId(guia.getUsuarioResponsavel().getId());
            }

            item.setDataAtualizacao(guia.getUpdatedAt());

            // NOVO: Campos para melhor identificação
            item.setDescricaoCompleta(String.format("Paciente %s - Guia %s - %s",
                    item.getPacienteNome() != null ? item.getPacienteNome() : "N/A",
                    item.getNumeroGuia() != null ? item.getNumeroGuia() : "N/A",
                    item.getEspecialidade() != null ? item.getEspecialidade() : "N/A"));

            item.setIdentificadorCompleto(String.format("G%s - %s",
                    item.getNumeroGuia() != null ? item.getNumeroGuia() : "N/A",
                    item.getPacienteNome() != null ? item.getPacienteNome() : "N/A"));
        });
    }

    private void enrichFichaData(RelatorioItemDto item, StatusHistory history) {
        fichaRepository.findByIdWithRelations(history.getEntityId()).ifPresent(ficha -> {
            // Dados básicos da ficha
            item.setCodigoFicha(ficha.getCodigoFicha());
            item.setFichaId(ficha.getId());
            item.setEspecialidade(ficha.getEspecialidade());
            item.setStatusFicha(ficha.getStatus());
            item.setTipoFicha(ficha.getTipoFicha() != null ? ficha.getTipoFicha().name() : "N/A");
            item.setStatus(ficha.getStatus());

            // Dados do paciente (via ficha ou guia)
            String pacienteNome = ficha.getPacienteNome();
            UUID pacienteId = null;

            if (ficha.getPaciente() != null) {
                pacienteId = ficha.getPaciente().getId();
                pacienteNome = ficha.getPaciente().getNome();
            } else if (ficha.getGuia() != null && ficha.getGuia().getPaciente() != null) {
                pacienteId = ficha.getGuia().getPaciente().getId();
                pacienteNome = ficha.getGuia().getPaciente().getNome();
            }

            item.setPacienteNome(pacienteNome);
            item.setPacienteId(pacienteId);

            // Dados da guia vinculada
            if (ficha.getGuia() != null) {
                item.setNumeroGuia(ficha.getGuia().getNumeroGuia());
                item.setGuiaId(ficha.getGuia().getId());
                item.setStatusGuia(ficha.getGuia().getStatus());

                // Relacionamento Ficha-Guia
                item.setRelacaoFichaGuia(String.format("Ficha %s vinculada à Guia %s",
                        ficha.getCodigoFicha() != null ? ficha.getCodigoFicha() : "N/A",
                        ficha.getGuia().getNumeroGuia() != null ? ficha.getGuia().getNumeroGuia() : "N/A"));

                item.setVinculacaoInfo(String.format("Ficha de %s vinculada à Guia %s",
                        ficha.getEspecialidade() != null ? ficha.getEspecialidade() : "N/A",
                        ficha.getGuia().getNumeroGuia() != null ? ficha.getGuia().getNumeroGuia() : "N/A"));

                // Obter unidade do paciente da guia
                if (ficha.getGuia().getPaciente() != null) {
                    try {
                        item.setUnidade(ficha.getGuia().getPaciente().getUnidade() != null ?
                                ficha.getGuia().getPaciente().getUnidade().name() : "N/A");
                    } catch (Exception e) {
                        logger.warn("Erro ao obter unidade do paciente: {}", e.getMessage());
                        item.setUnidade("N/A");
                    }
                }
            }

            // Dados do convênio
            if (ficha.getConvenio() != null) {
                item.setConvenioNome(ficha.getConvenio().getName());
                item.setConvenioId(ficha.getConvenio().getId());
            }

            // Informações gerais
            item.setMes(ficha.getMes());
            item.setAno(ficha.getAno());
            item.setQuantidadeAutorizada(ficha.getQuantidadeAutorizada());

            // Usuário responsável
            if (ficha.getUsuarioResponsavel() != null) {
                item.setUsuarioResponsavelNome(ficha.getUsuarioResponsavel().getFullName());
                item.setUsuarioResponsavelId(ficha.getUsuarioResponsavel().getId());
            }

            item.setDataAtualizacao(ficha.getUpdatedAt());

            // Campos para melhor identificação
            String numeroGuia = item.getNumeroGuia() != null ? item.getNumeroGuia() : "Sem Guia";

            item.setDescricaoCompleta(String.format("Paciente %s - Ficha %s - Guia %s - %s",
                    pacienteNome != null ? pacienteNome : "N/A",
                    ficha.getCodigoFicha() != null ? ficha.getCodigoFicha() : "N/A",
                    numeroGuia,
                    ficha.getEspecialidade() != null ? ficha.getEspecialidade() : "N/A"));

            item.setIdentificadorCompleto(String.format("F%s → G%s - %s",
                    ficha.getCodigoFicha() != null ? ficha.getCodigoFicha() : "N/A",
                    numeroGuia,
                    pacienteNome != null ? pacienteNome : "N/A"));
        });
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
        } catch (Exception e) {
            logger.error("Erro ao registrar log: {}", e.getMessage(), e);
        }
    }

    // =================================================================================
    // MÉTODOS DE MAPEAMENTO DTO
    // =================================================================================

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
        dto.setId(relatorio.getId()); // UUID direto se DTO espera UUID
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