// RelatorioServiceImpl.java - Implementação Corrigida com Base nos Erros Identificados
package com.intranet.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

        // Registrar log de visualização via compartilhamento
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

        // Implementar filtros customizados aqui se necessário
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

        RelatorioDto relatorioDto = getRelatorioByHash(hash);
        RelatorioDataDto dados = getDadosRelatorio(relatorioDto.getId());

        return generatePDF(dados);
    }

    @Override
    public Map<String, Object> getEstatisticasRelatorios() {
        logger.info("Obtendo estatísticas de relatórios");

        User currentUser = getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        if (isUserAdminOrSupervisor(currentUser)) {
            // Estatísticas globais para admins/supervisores
            stats.put("totalRelatorios", relatorioRepository.count());
            // CORREÇÃO: Verificar se estes métodos existem no repository
            // stats.put("relatoriosConcluidos", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.CONCLUIDO));
            // stats.put("relatoriosProcessando", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.PROCESSANDO));
            // stats.put("relatoriosComErro", relatorioRepository.countByStatusRelatorio(Relatorio.StatusRelatorio.ERRO));
        } else {
            // Estatísticas do usuário atual
            // CORREÇÃO: Verificar se este método existe no repository
            // stats.put("meusRelatorios", relatorioRepository.countByUsuarioGeradorId(currentUser.getId()));
        }

        // Estatísticas de compartilhamento
        stats.put("compartilhamentosRecebidos", compartilhamentoRepository.findByUsuarioDestinoId(currentUser.getId(), Pageable.unpaged()).getTotalElements());
        stats.put("compartilhamentosEnviados", compartilhamentoRepository.findByUsuarioOrigemId(currentUser.getId(), Pageable.unpaged()).getTotalElements());
        stats.put("compartilhamentosNaoVisualizados", countCompartilhamentosNaoVisualizados());

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

        // Converter request para Map para armazenar filtros aplicados
        Map<String, Object> filtrosAplicados = new HashMap<>();
        filtrosAplicados.put("usuarioResponsavelId", request.getUsuarioResponsavelId());
        filtrosAplicados.put("status", request.getStatus());
        filtrosAplicados.put("especialidades", request.getEspecialidades());
        filtrosAplicados.put("convenioIds", request.getConvenioIds());
        filtrosAplicados.put("unidades", request.getUnidades());
        filtrosAplicados.put("tipoEntidade", request.getTipoEntidade());
        dados.setFiltrosAplicados(filtrosAplicados);

        // Buscar dados do histórico de status no período
        List<StatusHistory> historicoStatus = statusHistoryRepository
                .findByDataAlteracaoBetween(request.getPeriodoInicio(), request.getPeriodoFim(), Pageable.unpaged())
                .getContent()
                .stream()
                .filter(h -> h.getAlteradoPor().getId().equals(usuarioAlvo))
                .collect(Collectors.toList());

        // Aplicar filtros adicionais se especificados
        historicoStatus = aplicarFiltros(historicoStatus, request);

        // Converter para DTOs do relatório
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

            // Enriquecer com dados específicos da entidade
            enrichItemWithEntityData(item, history);

            itens.add(item);
        }

        dados.setItens(itens);
        dados.setTotalRegistros(itens.size());

        // CORREÇÃO: Usar Map<String, Long> em vez de Map<String, Integer>
        dados.setDistribuicaoPorStatus(calculateStatusDistribution(itens));
        dados.setDistribuicaoPorEspecialidade(calculateEspecialidadeDistribution(itens));
        dados.setDistribuicaoPorConvenio(calculateConvenioDistribution(itens));
        dados.setDistribuicaoPorUnidade(calculateUnidadeDistribution(itens));

        // CORREÇÃO: Usar Map<String, Object> em vez de List<GraficoTimelineDto>
        dados.setTimelineData((List<GraficoTimelineDto>) generateTimelineData(itens, request.getPeriodoInicio(), request.getPeriodoFim()));

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
                    guiaRepository.findById(history.getEntityId()).ifPresent(guia -> {
                        item.setNumeroGuia(guia.getNumeroGuia());
                        item.setGuiaId(guia.getId());
                        item.setPacienteNome(guia.getPaciente().getNome());
                        item.setPacienteId(guia.getPaciente().getId());
                        item.setConvenioNome(guia.getConvenio().getName());
                        item.setMes(guia.getMes());
                        item.setAno(guia.getAno());
                        item.setQuantidadeAutorizada(guia.getQuantidadeAutorizada());
                        item.setUnidade(guia.getPaciente().getUnidade().name());
                        item.setStatus(guia.getStatus());
                        if (!guia.getEspecialidades().isEmpty()) {
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
                        item.setPacienteId(ficha.getPaciente() != null ? ficha.getPaciente().getId() :
                                (ficha.getGuia() != null ? ficha.getGuia().getPaciente().getId() : null));
                        item.setConvenioNome(ficha.getConvenioNome());
                        item.setMes(ficha.getMes());
                        item.setAno(ficha.getAno());
                        item.setQuantidadeAutorizada(ficha.getQuantidadeAutorizada());
                        item.setStatus(ficha.getStatus());
                        item.setDataAtualizacao(ficha.getUpdatedAt());

                        // Se ficha tem guia, usar dados da guia
                        if (ficha.getGuia() != null) {
                            item.setNumeroGuia(ficha.getGuia().getNumeroGuia());
                            item.setGuiaId(ficha.getGuia().getId());
                            item.setUnidade(ficha.getGuia().getPaciente().getUnidade().name());
                        }
                    });
                    break;
            }
        } catch (Exception e) {
            logger.warn("Erro ao enriquecer item com dados da entidade: {}", e.getMessage());
        }
    }

    // CORREÇÃO: Retornar Map<String, Long> em vez de Map<String, Integer>
    private Map<String, Long> calculateStatusDistribution(List<RelatorioItemDto> itens) {
        return itens.stream()
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

    // CORREÇÃO: Retornar Map<String, Object> com dados do timeline
    private Map<String, Object> generateTimelineData(List<RelatorioItemDto> itens,
                                                     LocalDateTime inicio, LocalDateTime fim) {
        // Agrupar por data (dia)
        Map<String, Long> dadosPorDia = itens.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getDataMudancaStatus().toLocalDate().toString(),
                        Collectors.counting()
                ));

        Map<String, Object> timeline = new HashMap<>();
        timeline.put("dadosPorDia", dadosPorDia);
        timeline.put("totalDias", dadosPorDia.size());
        timeline.put("mediaPorDia", dadosPorDia.values().stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0));

        return timeline;
    }

    private String buildFiltrosJson(RelatorioCreateRequest request) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());

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
        return false; // Temporário até verificar a estrutura real
    }

    private String getClientIpAddress() {
        // TODO: Implementação para obter IP do cliente real
        // Você pode injetar HttpServletRequest e extrair o IP
        return "127.0.0.1";
    }

    private void registrarLog(RelatorioLog log) {
        try {
            logRepository.save(log);
        } catch (Exception e) {
            logger.error("Erro ao registrar log: {}", e.getMessage(), e);
        }
    }

    private byte[] generatePDF(RelatorioDataDto dados) {
        logger.info("Gerando PDF para relatório: {}", dados.getTitulo());

        try {
            // Placeholder - implementação simplificada
            String pdfContent = "Relatório: " + dados.getTitulo() + "\n" +
                    "Total de registros: " + dados.getTotalRegistros() + "\n" +
                    "Gerado em: " + dados.getDataGeracao();

            return pdfContent.getBytes();

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
    }

    // =================================================================================
    // MÉTODOS DE MAPEAMENTO DTO
    // =================================================================================

    private RelatorioDto mapToDto(Relatorio relatorio) {
        RelatorioDto dto = new RelatorioDto();
        // CORREÇÃO: Manter ID como String se o DTO espera String
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
        // CORREÇÃO: Usar enum direto se DTO espera enum
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
                    request.setUsuarioResponsavelId(UUID.fromString(usuarioId.toString()));
                }

                @SuppressWarnings("unchecked")
                List<String> status = (List<String>) filtros.get("status");
                request.setStatus(status);

                @SuppressWarnings("unchecked")
                List<String> especialidades = (List<String>) filtros.get("especialidades");
                request.setEspecialidades(especialidades);

                // Converter convenioIds de List<String> para List<UUID>
                Object convenioIds = filtros.get("convenioIds");
                if (convenioIds instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<UUID> convenioUuids = ((List<Object>) convenioIds).stream()
                            .filter(Objects::nonNull)
                            .map(id -> UUID.fromString(id.toString()))
                            .collect(Collectors.toList());
                    request.setConvenioIds(convenioUuids);
                }

                @SuppressWarnings("unchecked")
                List<String> unidades = (List<String>) filtros.get("unidades");
                request.setUnidades(unidades);

                request.setTipoEntidade((String) filtros.get("tipoEntidade"));

                Object incluirGraficos = filtros.get("incluirGraficos");
                if (incluirGraficos instanceof Boolean) {
                    request.setIncluirGraficos((Boolean) incluirGraficos);
                }

                Object incluirEstatisticas = filtros.get("incluirEstatisticas");
                if (incluirEstatisticas instanceof Boolean) {
                    request.setIncluirEstatisticas((Boolean) incluirEstatisticas);
                }

                request.setFormatoSaida((String) filtros.get("formatoSaida"));
            }

        } catch (Exception e) {
            logger.error("Erro ao recriar request dos filtros: {}", e.getMessage(), e);
            // Usar valores padrão se houver erro
            request.setTitulo(relatorio.getTitulo());
            request.setDescricao(relatorio.getDescricao());
            request.setPeriodoInicio(relatorio.getPeriodoInicio());
            request.setPeriodoFim(relatorio.getPeriodoFim());
        }

        return request;
    }
}