package com.intranet.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RelatorioServiceImpl implements RelatorioService {

    private static final Logger logger = LoggerFactory.getLogger(RelatorioServiceImpl.class);

    private final StatusHistoryRepository statusHistoryRepository;
    private final GuiaRepository guiaRepository;
    private final FichaRepository fichaRepository;
    private final UserRepository userRepository;
    private final ConvenioRepository convenioRepository;
    private final PacienteRepository pacienteRepository;
    private final RelatorioCompartilhamentoRepository relatorioCompartilhamentoRepository;
    private final ObjectMapper objectMapper;

    @Override
    public RelatorioGeralDto gerarRelatorioGeral(RelatorioFilterRequest filters) {
        logger.info("Gerando relatório geral com filtros: {}", filters);

        // Validar e ajustar filtros
        RelatorioFilterRequest filtrosAjustados = ajustarFiltros(filters);

        // Buscar dados do histórico de status
        List<StatusHistory> historico = buscarHistoricoComFiltros(filtrosAjustados);

        // Buscar dados de criações de guias e fichas
        List<RelatorioItemDto> itensCriacao = buscarItensCreacao(filtrosAjustados);

        // Converter histórico para itens do relatório
        List<RelatorioItemDto> itensHistorico = historico.stream()
                .map(this::mapHistoricoToItem)
                .collect(Collectors.toList());

        // Combinar todos os itens
        List<RelatorioItemDto> todosItens = new ArrayList<>();
        todosItens.addAll(itensHistorico);
        todosItens.addAll(itensCriacao);

        // Ordenar por data
        todosItens.sort((a, b) -> b.getDataAcao().compareTo(a.getDataAcao()));

        // Gerar totalizações
        RelatorioTotalizacaoDto totalizacao = calcularTotalizacao(todosItens, filtrosAjustados);

        // Gerar agrupamentos
        Map<String, Object> agrupamentos = gerarAgrupamentos(todosItens);

        // Gerar metadata
        RelatorioMetadataDto metadata = gerarMetadata(filtrosAjustados, todosItens.size());

        return new RelatorioGeralDto(metadata, todosItens, totalizacao, agrupamentos);
    }

    @Override
    public RelatorioGeralDto gerarRelatorioUsuario(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        logger.info("Gerando relatório para usuário {} no período {} a {}", usuarioId, dataInicio, dataFim);

        RelatorioFilterRequest filters = new RelatorioFilterRequest();
        filters.setUsuarioId(usuarioId);
        filters.setDataInicio(dataInicio);
        filters.setDataFim(dataFim);

        return gerarRelatorioGeral(filters);
    }

    @Override
    public RelatorioGeralDto gerarRelatorioMudancasStatus(LocalDateTime dataInicio, LocalDateTime dataFim, UUID usuarioId) {
        RelatorioFilterRequest filters = new RelatorioFilterRequest();
        filters.setDataInicio(dataInicio);
        filters.setDataFim(dataFim);
        filters.setUsuarioId(usuarioId);
        filters.setTipoAcao("MUDANCA_STATUS");

        return gerarRelatorioGeral(filters);
    }

    @Override
    public RelatorioGeralDto gerarRelatorioCriacoes(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        RelatorioFilterRequest filters = new RelatorioFilterRequest();
        filters.setUsuarioId(usuarioId);
        filters.setDataInicio(dataInicio);
        filters.setDataFim(dataFim);
        filters.setTipoAcao("CRIACAO");

        return gerarRelatorioGeral(filters);
    }

    @Override
    public RelatorioGeralDto gerarRelatorioEdicoes(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        RelatorioFilterRequest filters = new RelatorioFilterRequest();
        filters.setUsuarioId(usuarioId);
        filters.setDataInicio(dataInicio);
        filters.setDataFim(dataFim);
        filters.setTipoAcao("EDICAO");

        return gerarRelatorioGeral(filters);
    }

    @Override
    public RelatorioGeralDto gerarRelatorioComparativo(List<UUID> usuarioIds, LocalDateTime dataInicio, LocalDateTime dataFim) {
        logger.info("Gerando relatório comparativo para usuários: {}", usuarioIds);

        List<RelatorioGeralDto> relatoriosIndividuais = usuarioIds.stream()
                .map(usuarioId -> gerarRelatorioUsuario(usuarioId, dataInicio, dataFim))
                .collect(Collectors.toList());

        // Combinar todos os itens
        List<RelatorioItemDto> todosItens = relatoriosIndividuais.stream()
                .flatMap(rel -> rel.getItens().stream())
                .sorted((a, b) -> b.getDataAcao().compareTo(a.getDataAcao()))
                .collect(Collectors.toList());

        // Gerar totalizações consolidadas
        RelatorioTotalizacaoDto totalizacao = calcularTotalizacao(todosItens, null);

        // Gerar agrupamentos comparativos
        Map<String, Object> agrupamentos = gerarAgrupamentosComparativos(todosItens, usuarioIds);

        // Gerar metadata
        RelatorioMetadataDto metadata = new RelatorioMetadataDto();
        metadata.setTitulo("Relatório Comparativo de Usuários");
        metadata.setDescricao("Comparação de atividades entre " + usuarioIds.size() + " usuários");
        metadata.setDataGeracao(LocalDateTime.now());
        metadata.setPeriodoInicio(dataInicio);
        metadata.setPeriodoFim(dataFim);
        metadata.setUsuarioGerador(getCurrentUser().getFullName());

        return new RelatorioGeralDto(metadata, todosItens, totalizacao, agrupamentos);
    }

    @Override
    @Transactional
    public RelatorioCompartilhamentoDto compartilharRelatorio(RelatorioCompartilhamentoCreateRequest request) {
        logger.info("Compartilhando relatório: {}", request.getTitulo());

        User currentUser = getCurrentUser();
        User usuarioDestino = userRepository.findById(request.getUsuarioDestinoId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário destino não encontrado"));

        try {
            String dadosJson = objectMapper.writeValueAsString(request.getDadosRelatorio());

            RelatorioCompartilhamento compartilhamento = RelatorioCompartilhamento.create(
                    request.getTitulo(),
                    dadosJson,
                    currentUser,
                    usuarioDestino,
                    request.getObservacao()
            );

            RelatorioCompartilhamento saved = relatorioCompartilhamentoRepository.save(compartilhamento);
            logger.info("Relatório compartilhado com sucesso. ID: {}", saved.getId());

            return mapToCompartilhamentoDto(saved);
        } catch (Exception e) {
            logger.error("Erro ao compartilhar relatório: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar compartilhamento do relatório", e);
        }
    }

    @Override
    @Transactional
    public RelatorioCompartilhamentoDto responderCompartilhamento(UUID compartilhamentoId, RelatorioCompartilhamentoResponseRequest request) {
        logger.info("Respondendo compartilhamento ID: {} com status: {}", compartilhamentoId, request.getStatus());

        RelatorioCompartilhamento compartilhamento = relatorioCompartilhamentoRepository.findById(compartilhamentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartilhamento não encontrado"));

        User currentUser = getCurrentUser();
        if (!compartilhamento.getUsuarioDestino().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Você não tem permissão para responder a este compartilhamento");
        }

        if (request.getStatus() == RelatorioCompartilhamento.StatusCompartilhamento.CONFIRMADO) {
            compartilhamento.confirmar(request.getObservacaoResposta());
        } else {
            compartilhamento.rejeitar(request.getObservacaoResposta());
        }

        RelatorioCompartilhamento saved = relatorioCompartilhamentoRepository.save(compartilhamento);
        logger.info("Resposta do compartilhamento salva com sucesso");

        return mapToCompartilhamentoDto(saved);
    }

    @Override
    public Page<RelatorioCompartilhamentoDto> getRelatoriosRecebidos(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<RelatorioCompartilhamento> page = relatorioCompartilhamentoRepository
                .findRecebidosByUsuario(currentUser.getId(), pageable);
        return page.map(this::mapToCompartilhamentoDto);
    }

    @Override
    public Page<RelatorioCompartilhamentoDto> getRelatoriosEnviados(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<RelatorioCompartilhamento> page = relatorioCompartilhamentoRepository
                .findEnviadosByUsuario(currentUser.getId(), pageable);
        return page.map(this::mapToCompartilhamentoDto);
    }

    @Override
    public List<RelatorioCompartilhamentoDto> getRelatoriosPendentes() {
        User currentUser = getCurrentUser();
        List<RelatorioCompartilhamento> pendentes = relatorioCompartilhamentoRepository
                .findPendentesByUsuario(currentUser.getId());
        return pendentes.stream()
                .map(this::mapToCompartilhamentoDto)
                .collect(Collectors.toList());
    }

    @Override
    public RelatorioCompartilhamentoDto getCompartilhamento(UUID compartilhamentoId) {
        RelatorioCompartilhamento compartilhamento = relatorioCompartilhamentoRepository.findById(compartilhamentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartilhamento não encontrado"));

        User currentUser = getCurrentUser();
        if (!validarPermissaoVisualizacao(compartilhamentoId, currentUser.getId())) {
            throw new AccessDeniedException("Você não tem permissão para visualizar este compartilhamento");
        }

        return mapToCompartilhamentoDto(compartilhamento);
    }

    @Override
    @Transactional
    public void excluirCompartilhamento(UUID compartilhamentoId) {
        RelatorioCompartilhamento compartilhamento = relatorioCompartilhamentoRepository.findById(compartilhamentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Compartilhamento não encontrado"));

        User currentUser = getCurrentUser();
        if (!compartilhamento.getUsuarioOrigem().getId().equals(currentUser.getId()) && !isAdmin(currentUser)) {
            throw new AccessDeniedException("Você não tem permissão para excluir este compartilhamento");
        }

        relatorioCompartilhamentoRepository.delete(compartilhamento);
        logger.info("Compartilhamento excluído com sucesso. ID: {}", compartilhamentoId);
    }

    @Override
    public Map<String, Object> getEstatisticasRelatorios(LocalDateTime dataInicio, LocalDateTime dataFim) {
        logger.info("Gerando estatísticas de relatórios para período: {} a {}", dataInicio, dataFim);

        Map<String, Object> estatisticas = new HashMap<>();

        // Estatísticas gerais
        long totalCompartilhamentos = relatorioCompartilhamentoRepository.count();
        estatisticas.put("totalCompartilhamentos", totalCompartilhamentos);

        // Estatísticas por status
        List<Object[]> statusStats = relatorioCompartilhamentoRepository.getEstatisticasByUsuario(getCurrentUser().getId());
        Map<String, Long> estatisticasPorStatus = statusStats.stream()
                .collect(Collectors.toMap(
                        arr -> arr[0].toString(),
                        arr -> (Long) arr[1]
                ));
        estatisticas.put("porStatus", estatisticasPorStatus);

        // Estatísticas de atividades
        RelatorioFilterRequest filters = new RelatorioFilterRequest();
        filters.setDataInicio(dataInicio);
        filters.setDataFim(dataFim);

        List<StatusHistory> historico = buscarHistoricoComFiltros(filters);

        long totalMudancasStatus = historico.size();
        long totalGuias = historico.stream()
                .filter(h -> h.getEntityType() == StatusHistory.EntityType.GUIA)
                .count();
        long totalFichas = historico.stream()
                .filter(h -> h.getEntityType() == StatusHistory.EntityType.FICHA)
                .count();

        estatisticas.put("totalMudancasStatus", totalMudancasStatus);
        estatisticas.put("totalGuias", totalGuias);
        estatisticas.put("totalFichas", totalFichas);

        return estatisticas;
    }

    @Override
    public Page<RelatorioCompartilhamentoDto> buscarCompartilhamentosComFiltros(
            UUID usuarioOrigemId, UUID usuarioDestinoId, RelatorioCompartilhamento.StatusCompartilhamento status,
            LocalDateTime dataInicio, LocalDateTime dataFim, Pageable pageable) {

        // Verificar se o usuário atual é admin
        User currentUser = getCurrentUser();
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Apenas administradores podem usar filtros avançados");
        }

        Page<RelatorioCompartilhamento> page = relatorioCompartilhamentoRepository.findWithFilters(
                usuarioOrigemId, usuarioDestinoId, status, dataInicio, dataFim, pageable);

        return page.map(this::mapToCompartilhamentoDto);
    }

    @Override
    public long countRelatoriosPendentes() {
        User currentUser = getCurrentUser();
        return relatorioCompartilhamentoRepository.countPendentesByUsuario(currentUser.getId());
    }

    @Override
    public String exportarRelatorioJson(UUID relatorioId) {
        RelatorioCompartilhamento compartilhamento = relatorioCompartilhamentoRepository.findById(relatorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório não encontrado"));

        User currentUser = getCurrentUser();
        if (!validarPermissaoVisualizacao(relatorioId, currentUser.getId())) {
            throw new AccessDeniedException("Você não tem permissão para exportar este relatório");
        }

        return compartilhamento.getDadosRelatorio();
    }

    @Override
    public boolean validarPermissaoVisualizacao(UUID compartilhamentoId, UUID usuarioId) {
        RelatorioCompartilhamento compartilhamento = relatorioCompartilhamentoRepository.findById(compartilhamentoId)
                .orElse(null);

        if (compartilhamento == null) {
            return false;
        }

        // O usuário pode visualizar se for o remetente, destinatário ou admin
        return compartilhamento.getUsuarioOrigem().getId().equals(usuarioId) ||
                compartilhamento.getUsuarioDestino().getId().equals(usuarioId) ||
                isAdmin(userRepository.findById(usuarioId).orElse(null));
    }

    // Métodos auxiliares privados

    private RelatorioFilterRequest ajustarFiltros(RelatorioFilterRequest filters) {
        if (filters == null) {
            filters = new RelatorioFilterRequest();
        }

        // Se não especificado, buscar dados dos últimos 30 dias
        if (filters.getDataInicio() == null) {
            filters.setDataInicio(LocalDateTime.now().minusDays(30));
        }
        if (filters.getDataFim() == null) {
            filters.setDataFim(LocalDateTime.now());
        }

        return filters;
    }

    private List<StatusHistory> buscarHistoricoComFiltros(RelatorioFilterRequest filters) {
        return statusHistoryRepository.findWithFilters(
                filters.getTipoEntidade(),
                null, // entityId - null para buscar todas
                filters.getStatus(),
                filters.getUsuarioId(),
                filters.getDataInicio(),
                filters.getDataFim(),
                Pageable.unpaged()
        ).getContent();
    }

    private List<RelatorioItemDto> buscarItensCreacao(RelatorioFilterRequest filters) {
        List<RelatorioItemDto> itens = new ArrayList<>();

        // Buscar criações de guias
        if (filters.getTipoEntidade() == null || filters.getTipoEntidade() == StatusHistory.EntityType.GUIA) {
            List<Guia> guias = buscarGuiasCriadas(filters);
            itens.addAll(guias.stream()
                    .map(this::mapGuiaToItemCriacao)
                    .collect(Collectors.toList()));
        }

        // Buscar criações de fichas
        if (filters.getTipoEntidade() == null || filters.getTipoEntidade() == StatusHistory.EntityType.FICHA) {
            List<Ficha> fichas = buscarFichasCriadas(filters);
            itens.addAll(fichas.stream()
                    .map(this::mapFichaToItemCriacao)
                    .collect(Collectors.toList()));
        }

        return itens;
    }

    private List<Guia> buscarGuiasCriadas(RelatorioFilterRequest filters) {
        // Implementar busca personalizada de guias criadas no período
        // Por simplicidade, usando findAll e filtrando em memória
        // Em produção, criar query específica no repository
        return guiaRepository.findAll().stream()
                .filter(guia -> {
                    boolean incluir = true;

                    if (filters.getDataInicio() != null && guia.getCreatedAt().isBefore(filters.getDataInicio())) {
                        incluir = false;
                    }
                    if (filters.getDataFim() != null && guia.getCreatedAt().isAfter(filters.getDataFim())) {
                        incluir = false;
                    }
                    if (filters.getConvenioId() != null && !guia.getConvenio().getId().equals(filters.getConvenioId())) {
                        incluir = false;
                    }
                    if (filters.getPacienteId() != null && !guia.getPaciente().getId().equals(filters.getPacienteId())) {
                        incluir = false;
                    }

                    return incluir;
                })
                .collect(Collectors.toList());
    }

    private List<Ficha> buscarFichasCriadas(RelatorioFilterRequest filters) {
        // Implementar busca personalizada de fichas criadas no período
        // Por simplicidade, usando findAll e filtrando em memória
        // Em produção, criar query específica no repository
        return fichaRepository.findAll().stream()
                .filter(ficha -> {
                    boolean incluir = true;

                    if (filters.getDataInicio() != null && ficha.getCreatedAt().isBefore(filters.getDataInicio())) {
                        incluir = false;
                    }
                    if (filters.getDataFim() != null && ficha.getCreatedAt().isAfter(filters.getDataFim())) {
                        incluir = false;
                    }

                    return incluir;
                })
                .collect(Collectors.toList());
    }

    private RelatorioItemDto mapHistoricoToItem(StatusHistory history) {
        RelatorioItemDto item = new RelatorioItemDto();
        item.setId(history.getId());
        item.setTipoEntidade(history.getEntityType());
        item.setEntidadeId(history.getEntityId());
        item.setTipoAcao("MUDANCA_STATUS");
        item.setStatusAnterior(history.getStatusAnterior());
        item.setStatusNovo(history.getStatusNovo());
        item.setMotivo(history.getMotivo());
        item.setObservacoes(history.getObservacoes());
        item.setUsuarioResponsavel(history.getAlteradoPor().getFullName());
        item.setDataAcao(history.getDataAlteracao());

        // Buscar informações da entidade
        if (history.getEntityType() == StatusHistory.EntityType.GUIA) {
            guiaRepository.findById(history.getEntityId()).ifPresent(guia -> {
                item.setEntidadeDescricao("Guia " + guia.getNumeroGuia());
                item.setNumeroGuia(guia.getNumeroGuia());
                item.setPacienteNome(guia.getPaciente().getNome());
                item.setConvenioNome(guia.getConvenio().getName());
                if (!guia.getEspecialidades().isEmpty()) {
                    item.setEspecialidade(String.join(", ", guia.getEspecialidades()));
                }
            });
        } else if (history.getEntityType() == StatusHistory.EntityType.FICHA) {
            fichaRepository.findById(history.getEntityId()).ifPresent(ficha -> {
                item.setEntidadeDescricao("Ficha " + ficha.getCodigoFicha());
                item.setCodigoFicha(ficha.getCodigoFicha());
                item.setPacienteNome(ficha.getPacienteNome());

                // Buscar informações da guia relacionada
                if (ficha.getGuia() != null) {
                    item.setNumeroGuia(ficha.getGuia().getNumeroGuia());
                    item.setConvenioNome(ficha.getGuia().getConvenio().getName());
                }
            });
        }

        return item;
    }

    private RelatorioItemDto mapGuiaToItemCriacao(Guia guia) {
        RelatorioItemDto item = new RelatorioItemDto();
        item.setId(guia.getId());
        item.setTipoEntidade(StatusHistory.EntityType.GUIA);
        item.setEntidadeId(guia.getId());
        item.setEntidadeDescricao("Guia " + guia.getNumeroGuia());
        item.setNumeroGuia(guia.getNumeroGuia());
        item.setPacienteNome(guia.getPaciente().getNome());
        item.setConvenioNome(guia.getConvenio().getName());
        item.setTipoAcao("CRIACAO");
        item.setStatusNovo(guia.getStatus());
        item.setDataAcao(guia.getCreatedAt());

        if (!guia.getEspecialidades().isEmpty()) {
            item.setEspecialidade(String.join(", ", guia.getEspecialidades()));
        }

        // Buscar quem criou através do primeiro registro de status
        statusHistoryRepository.findByEntityTypeAndEntityIdOrderByDataAlteracaoDesc(
                        StatusHistory.EntityType.GUIA, guia.getId()
                ).stream()
                .findFirst()
                .ifPresent(firstHistory -> item.setUsuarioResponsavel(firstHistory.getAlteradoPor().getFullName()));

        return item;
    }

    private RelatorioItemDto mapFichaToItemCriacao(Ficha ficha) {
        RelatorioItemDto item = new RelatorioItemDto();
        item.setId(ficha.getId());
        item.setTipoEntidade(StatusHistory.EntityType.FICHA);
        item.setEntidadeId(ficha.getId());
        item.setEntidadeDescricao("Ficha " + ficha.getCodigoFicha());
        item.setCodigoFicha(ficha.getCodigoFicha());
        item.setPacienteNome(ficha.getPacienteNome());
        item.setTipoAcao("CRIACAO");
        item.setStatusNovo(ficha.getStatus());
        item.setDataAcao(ficha.getCreatedAt());

        // Informações da guia relacionada
        if (ficha.getGuia() != null) {
            item.setNumeroGuia(ficha.getGuia().getNumeroGuia());
            item.setConvenioNome(ficha.getGuia().getConvenio().getName());
        }

        // Buscar quem criou através do primeiro registro de status
        statusHistoryRepository.findByEntityTypeAndEntityIdOrderByDataAlteracaoDesc(
                        StatusHistory.EntityType.FICHA, ficha.getId()
                ).stream()
                .findFirst()
                .ifPresent(firstHistory -> item.setUsuarioResponsavel(firstHistory.getAlteradoPor().getFullName()));

        return item;
    }

    private RelatorioTotalizacaoDto calcularTotalizacao(List<RelatorioItemDto> itens, RelatorioFilterRequest filters) {
        RelatorioTotalizacaoDto totalizacao = new RelatorioTotalizacaoDto();

        totalizacao.setTotalItens(itens.size());
        totalizacao.setTotalGuias(itens.stream()
                .filter(item -> item.getTipoEntidade() == StatusHistory.EntityType.GUIA)
                .count());
        totalizacao.setTotalFichas(itens.stream()
                .filter(item -> item.getTipoEntidade() == StatusHistory.EntityType.FICHA)
                .count());
        totalizacao.setTotalCriacoes(itens.stream()
                .filter(item -> "CRIACAO".equals(item.getTipoAcao()))
                .count());
        totalizacao.setTotalEdicoes(itens.stream()
                .filter(item -> "EDICAO".equals(item.getTipoAcao()))
                .count());
        totalizacao.setTotalMudancasStatus(itens.stream()
                .filter(item -> "MUDANCA_STATUS".equals(item.getTipoAcao()))
                .count());

        // Calcular valores financeiros se for filtro específico
        if (filters != null && filters.getUsuarioId() != null) {
            BigDecimal valorTotal = calcularValorTotalGuias(itens);
            totalizacao.setValorTotalGuias(valorTotal);

            long quantidadeTotal = calcularQuantidadeAutorizadaTotal(itens);
            totalizacao.setQuantidadeAutorizadaTotal(quantidadeTotal);
        }

        return totalizacao;
    }

    private BigDecimal calcularValorTotalGuias(List<RelatorioItemDto> itens) {
        Set<UUID> guiasProcessadas = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;

        for (RelatorioItemDto item : itens) {
            if (item.getTipoEntidade() == StatusHistory.EntityType.GUIA &&
                    !guiasProcessadas.contains(item.getEntidadeId())) {

                guiaRepository.findById(item.getEntidadeId()).ifPresent(guia -> {
                    if (guia.getValorReais() != null) {
                        // total = total.add(guia.getValorReais()); // Descomentar quando campo existir
                    }
                });
                guiasProcessadas.add(item.getEntidadeId());
            }
        }

        return total;
    }

    private long calcularQuantidadeAutorizadaTotal(List<RelatorioItemDto> itens) {
        Set<UUID> guiasProcessadas = new HashSet<>();
        long total = 0;

        for (RelatorioItemDto item : itens) {
            if (item.getTipoEntidade() == StatusHistory.EntityType.GUIA &&
                    !guiasProcessadas.contains(item.getEntidadeId())) {

                Optional<Guia> guiaOpt = guiaRepository.findById(item.getEntidadeId());
                if (guiaOpt.isPresent()) {
                    total += guiaOpt.get().getQuantidadeAutorizada();
                }
                guiasProcessadas.add(item.getEntidadeId());
            }
        }

        return total;
    }

    private Map<String, Object> gerarAgrupamentos(List<RelatorioItemDto> itens) {
        Map<String, Object> agrupamentos = new HashMap<>();

        // Agrupamento por tipo de ação
        Map<String, Long> porTipoAcao = itens.stream()
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getTipoAcao,
                        Collectors.counting()
                ));
        agrupamentos.put("porTipoAcao", porTipoAcao);

        // Agrupamento por usuário responsável
        Map<String, Long> porUsuario = itens.stream()
                .filter(item -> item.getUsuarioResponsavel() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getUsuarioResponsavel,
                        Collectors.counting()
                ));
        agrupamentos.put("porUsuario", porUsuario);

        // Agrupamento por convênio
        Map<String, Long> porConvenio = itens.stream()
                .filter(item -> item.getConvenioNome() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getConvenioNome,
                        Collectors.counting()
                ));
        agrupamentos.put("porConvenio", porConvenio);

        // Agrupamento por status
        Map<String, Long> porStatus = itens.stream()
                .filter(item -> item.getStatusNovo() != null)
                .collect(Collectors.groupingBy(
                        RelatorioItemDto::getStatusNovo,
                        Collectors.counting()
                ));
        agrupamentos.put("porStatus", porStatus);

        // Agrupamento por dia
        Map<String, Long> porDia = itens.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getDataAcao().toLocalDate().toString(),
                        Collectors.counting()
                ));
        agrupamentos.put("porDia", porDia);

        return agrupamentos;
    }

    private Map<String, Object> gerarAgrupamentosComparativos(List<RelatorioItemDto> itens, List<UUID> usuarioIds) {
        Map<String, Object> agrupamentos = gerarAgrupamentos(itens);

        // Adicionar comparação específica por usuário
        Map<String, Map<String, Long>> comparativoPorUsuario = new HashMap<>();

        for (UUID usuarioId : usuarioIds) {
            userRepository.findById(usuarioId).ifPresent(user -> {
                List<RelatorioItemDto> itensUsuario = itens.stream()
                        .filter(item -> user.getFullName().equals(item.getUsuarioResponsavel()))
                        .collect(Collectors.toList());

                Map<String, Long> estatisticasUsuario = new HashMap<>();
                estatisticasUsuario.put("totalItens", (long) itensUsuario.size());
                estatisticasUsuario.put("criacoes", itensUsuario.stream()
                        .filter(item -> "CRIACAO".equals(item.getTipoAcao()))
                        .count());
                estatisticasUsuario.put("mudancasStatus", itensUsuario.stream()
                        .filter(item -> "MUDANCA_STATUS".equals(item.getTipoAcao()))
                        .count());

                comparativoPorUsuario.put(user.getFullName(), estatisticasUsuario);
            });
        }

        agrupamentos.put("comparativoPorUsuario", comparativoPorUsuario);
        return agrupamentos;
    }

    private RelatorioMetadataDto gerarMetadata(RelatorioFilterRequest filters, int totalItens) {
        RelatorioMetadataDto metadata = new RelatorioMetadataDto();
        metadata.setTitulo("Relatório de Atividades do Sistema");
        metadata.setDescricao("Relatório contendo " + totalItens + " registros de atividades");
        metadata.setDataGeracao(LocalDateTime.now());
        metadata.setPeriodoInicio(filters.getDataInicio());
        metadata.setPeriodoFim(filters.getDataFim());
        metadata.setUsuarioGerador(getCurrentUser().getFullName());
        metadata.setFiltrosAplicados(filters);
        return metadata;
    }

    private RelatorioCompartilhamentoDto mapToCompartilhamentoDto(RelatorioCompartilhamento compartilhamento) {
        return new RelatorioCompartilhamentoDto(
                compartilhamento.getId(),
                compartilhamento.getTitulo(),
                compartilhamento.getDadosRelatorio(),
                compartilhamento.getUsuarioOrigem().getId(),
                compartilhamento.getUsuarioOrigem().getFullName(),
                compartilhamento.getUsuarioDestino().getId(),
                compartilhamento.getUsuarioDestino().getFullName(),
                compartilhamento.getStatus(),
                compartilhamento.getObservacao(),
                compartilhamento.getObservacaoResposta(),
                compartilhamento.getDataCompartilhamento(),
                compartilhamento.getDataResposta()
        );
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));
    }

    private boolean isAdmin(User user) {
        if (user == null) return false;
        List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
        return roles.contains("ADMIN");
    }
}