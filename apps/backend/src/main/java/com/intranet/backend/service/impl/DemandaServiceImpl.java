package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.DemandaRepository;
import com.intranet.backend.repository.DemandaSpecifications;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.DemandaAuditService;
import com.intranet.backend.service.DemandaService;
import com.intranet.backend.util.DTOMapperUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemandaServiceImpl implements DemandaService {

    private static final Logger logger = LoggerFactory.getLogger(DemandaServiceImpl.class);

    private final DemandaRepository demandaRepository;
    private final UserRepository userRepository;
    private final DemandaAuditService demandaAuditService;

    @Override
    public List<DemandaDto> getAllDemandas() {
        logger.info("Buscando todas as demandas visíveis para o usuário atual");
        User currentUser = getCurrentUser();

        // Verificar se o usuário é gerente ou supervisor
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");

        List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());

        // Buscar demandas com base nos papéis do usuário
        List<Demanda> demandas;
        if (isGerente) {
            // Gerentes veem todas as demandas
            demandas = demandaRepository.findAll();
            logger.debug("Usuário é gerente, retornando todas as demandas");
        } else if (isSupervisor && !equipesIds.isEmpty()) {
            // Supervisores veem demandas de suas equipes
            demandas = equipesIds.stream()
                    .flatMap(equipeId -> demandaRepository.findByEquipeId(equipeId).stream())
                    .collect(Collectors.toList());

            // Adicionar também as demandas onde o supervisor é criador ou atribuído
            demandas.addAll(demandaRepository.findByCriadoPorIdOrderByCriadaEm(currentUser.getId()));
            demandas.addAll(demandaRepository.findByAtribuidoParaIdOrderByPrioridadeAndDataFim(currentUser.getId()));

            // Remover duplicatas
            demandas = demandas.stream().distinct().collect(Collectors.toList());
            logger.debug("Usuário é supervisor, retornando {} demandas", demandas.size());
        } else {
            // Usuários comuns veem apenas suas próprias demandas
            List<Demanda> demandasCriadas = demandaRepository.findByCriadoPorIdOrderByCriadaEm(currentUser.getId());
            List<Demanda> demandasAtribuidas = demandaRepository.findByAtribuidoParaIdOrderByPrioridadeAndDataFim(currentUser.getId());

            demandas = demandasCriadas;
            demandas.addAll(demandasAtribuidas);

            // Remover duplicatas
            demandas = demandas.stream().distinct().collect(Collectors.toList());
            logger.debug("Usuário comum, retornando {} demandas", demandas.size());
        }

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public DemandaDto getDemandaById(UUID id) {
        logger.info("Buscando demanda com ID: {}", id);
        User currentUser = getCurrentUser();

        Demanda demanda = demandaRepository.findByIdWithUsuarios(id);
        if (demanda == null) {
            throw new ResourceNotFoundException("Demanda não encontrada com ID: " + id);
        }

        // Verificar se o usuário tem permissão para ver esta demanda
        if (!podeVerDemanda(demanda, currentUser)) {
            throw new AccessDeniedException("Você não tem permissão para ver esta demanda");
        }

        return mapToDemandaDto(demanda, currentUser);
    }

    @Override
    @Transactional
    public DemandaDto createDemanda(DemandaCreateDto demandaCreateDto) {
        logger.info("Criando nova demanda: {}", demandaCreateDto.getTitulo());
        User currentUser = getCurrentUser();

        // Obter o usuário atribuído
        User atribuidoPara;
        if (demandaCreateDto.getAtribuidoParaId() != null) {
            // Se um usuário foi especificado, verificar se o usuário atual pode atribuir demandas
            if (!podeAtribuirDemanda()) {
                throw new AccessDeniedException("Você não tem permissão para atribuir demandas a outros usuários");
            }

            atribuidoPara = userRepository.findById(demandaCreateDto.getAtribuidoParaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário atribuído não encontrado"));
        } else {
            // Se nenhum usuário foi especificado, atribuir ao usuário atual
            atribuidoPara = currentUser;
        }

        // Validar datas se presentes
        if (demandaCreateDto.getDataInicio() != null && demandaCreateDto.getDataFim() != null) {
            if (demandaCreateDto.getDataInicio().isAfter(demandaCreateDto.getDataFim())) {
                throw new IllegalArgumentException("A data de início deve ser anterior à data de fim");
            }
        }

        // Criar nova demanda
        Demanda demanda = new Demanda();
        demanda.setTitulo(demandaCreateDto.getTitulo());
        demanda.setDescricao(demandaCreateDto.getDescricao());
        demanda.setDataInicio(demandaCreateDto.getDataInicio());
        demanda.setDataFim(demandaCreateDto.getDataFim());
        demanda.setCriadoPor(currentUser);
        demanda.setAtribuidoPara(atribuidoPara);
        demanda.setStatus(demandaCreateDto.getStatus());
        demanda.setPrioridade(demandaCreateDto.getPrioridade());

        Demanda savedDemanda = demandaRepository.save(demanda);
        logger.info("Demanda criada com sucesso. ID: {}", savedDemanda.getId());

        // Registrar a criação na auditoria
        demandaAuditService.registrarCriacaoDemanda(savedDemanda, currentUser);

        return mapToDemandaDto(savedDemanda, currentUser);
    }

    @Override
    @Transactional
    public DemandaDto updateDemanda(UUID id, DemandaUpdateDto demandaUpdateDto) {
        logger.info("Atualizando demanda com ID: {}", id);
        User currentUser = getCurrentUser();

        Demanda demanda = demandaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demanda não encontrada com ID: " + id));

        // Guardar o estado anterior para auditoria
        Demanda demandaAntiga = new Demanda();
        demandaAntiga.setId(demanda.getId());
        demandaAntiga.setTitulo(demanda.getTitulo());
        demandaAntiga.setDescricao(demanda.getDescricao());
        demandaAntiga.setDataInicio(demanda.getDataInicio());
        demandaAntiga.setDataFim(demanda.getDataFim());
        demandaAntiga.setCriadoPor(demanda.getCriadoPor());
        demandaAntiga.setAtribuidoPara(demanda.getAtribuidoPara());
        demandaAntiga.setStatus(demanda.getStatus());
        demandaAntiga.setPrioridade(demanda.getPrioridade());

        // Verificar se o usuário tem permissão para editar esta demanda
        if (!podeEditarDemanda(demanda, currentUser)) {
            throw new AccessDeniedException("Você não tem permissão para editar esta demanda");
        }

        // Verificar alterações de usuário atribuído
        if (demandaUpdateDto.getAtribuidoParaId() != null &&
                !demandaUpdateDto.getAtribuidoParaId().equals(demanda.getAtribuidoPara().getId())) {

            // Verificar se o usuário atual pode atribuir demandas
            if (!podeAtribuirDemanda()) {
                throw new AccessDeniedException("Você não tem permissão para alterar o usuário atribuído");
            }

            User novoAtribuido = userRepository.findById(demandaUpdateDto.getAtribuidoParaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário atribuído não encontrado"));

            demanda.setAtribuidoPara(novoAtribuido);
        }

        // Atualizar valores se fornecidos
        if (demandaUpdateDto.getTitulo() != null) {
            demanda.setTitulo(demandaUpdateDto.getTitulo());
        }

        if (demandaUpdateDto.getDescricao() != null) {
            demanda.setDescricao(demandaUpdateDto.getDescricao());
        }

        if (demandaUpdateDto.getDataInicio() != null) {
            demanda.setDataInicio(demandaUpdateDto.getDataInicio());
        }

        if (demandaUpdateDto.getDataFim() != null) {
            demanda.setDataFim(demandaUpdateDto.getDataFim());
        }

        // Validar datas se ambas presentes
        if (demanda.getDataInicio() != null && demanda.getDataFim() != null) {
            if (demanda.getDataInicio().isAfter(demanda.getDataFim())) {
                throw new IllegalArgumentException("A data de início deve ser anterior à data de fim");
            }
        }

        if (demandaUpdateDto.getStatus() != null) {
            demanda.setStatus(demandaUpdateDto.getStatus());
        }

        if (demandaUpdateDto.getPrioridade() != null) {
            demanda.setPrioridade(demandaUpdateDto.getPrioridade());
        }

        Demanda updatedDemanda = demandaRepository.save(demanda);
        logger.info("Demanda atualizada com sucesso. ID: {}", updatedDemanda.getId());

        // Registrar as alterações na auditoria
        demandaAuditService.registrarAtualizacaoDemanda(demandaAntiga, updatedDemanda, currentUser);

        return mapToDemandaDto(updatedDemanda, currentUser);
    }

    @Override
    @Transactional
    public void deleteDemanda(UUID id) {
        logger.info("Excluindo demanda com ID: {}", id);
        User currentUser = getCurrentUser();

        Demanda demanda = demandaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demanda não encontrada com ID: " + id));

        // Verificar permissão para excluir
        boolean isAdmin = temPapel("ADMIN");
        boolean isGerente = temPapel("GERENTE");
        boolean isCriador = demanda.getCriadoPor().getId().equals(currentUser.getId());

        if (!isAdmin && !isGerente && !isCriador) {
            throw new AccessDeniedException("Você não tem permissão para excluir esta demanda");
        }

        demandaRepository.delete(demanda);
        logger.info("Demanda excluída com sucesso. ID: {}", id);
    }

    @Override
    public List<DemandaDto> getMinhasDemandas() {
        logger.info("Buscando demandas atribuídas ao usuário atual");
        User currentUser = getCurrentUser();

        List<Demanda> demandas = demandaRepository.findByAtribuidoParaIdOrderByPrioridadeAndDataFim(currentUser.getId());

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<DemandaDto> getDemandasCriadasPorMim() {
        logger.info("Buscando demandas criadas pelo usuário atual");
        User currentUser = getCurrentUser();

        List<Demanda> demandas = demandaRepository.findByCriadoPorIdOrderByCriadaEm(currentUser.getId());

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<DemandaDto> getDemandasFiltradas(DemandaFilterDto filtros) {
        logger.info("Buscando demandas com filtros aplicados");
        User currentUser = getCurrentUser();

        // Criar uma especificação com os filtros
        List<Demanda> demandas = demandaRepository.findAll(DemandaSpecifications.withFilters(filtros));

        // Filtrar apenas as demandas que o usuário tem permissão para ver
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");

        if (!isGerente) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());

            // Filtrar as demandas que o usuário pode ver
            demandas = demandas.stream()
                    .filter(demanda -> podeVerDemanda(demanda, currentUser))
                    .collect(Collectors.toList());
        }

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<DemandaDto> getDemandasByEquipeId(UUID equipeId) {
        logger.info("Buscando demandas da equipe com ID: {}", equipeId);
        User currentUser = getCurrentUser();

        // Verificar se o usuário tem permissão para ver demandas da equipe
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");
        List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());

        if (!isGerente && !(isSupervisor && equipesIds.contains(equipeId))) {
            throw new AccessDeniedException("Você não tem permissão para ver demandas desta equipe");
        }

        List<Demanda> demandas = demandaRepository.findByEquipeId(equipeId);

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<DemandaDto> getDemandasByPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        logger.info("Buscando demandas no período: {} até {}", inicio, fim);
        User currentUser = getCurrentUser();

        List<Demanda> demandas = demandaRepository.findByPeriodo(inicio, fim);

        // Filtrar apenas as demandas que o usuário tem permissão para ver
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");

        if (!isGerente) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());

            // Filtrar as demandas que o usuário pode ver
            demandas = demandas.stream()
                    .filter(demanda -> podeVerDemanda(demanda, currentUser))
                    .collect(Collectors.toList());
        }

        return demandas.stream()
                .map(demanda -> mapToDemandaDto(demanda, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DemandaDto alterarStatus(UUID id, String novoStatus) {
        logger.info("Alterando status da demanda {} para {}", id, novoStatus);
        User currentUser = getCurrentUser();

        // Validar status
        try {
            Demanda.Status.fromValor(novoStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Status inválido: " + novoStatus);
        }

        Demanda demanda = demandaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demanda não encontrada com ID: " + id));

        // Verificar permissão para atualizar status
        boolean isAtribuido = demanda.getAtribuidoPara().getId().equals(currentUser.getId());
        boolean isCriador = demanda.getCriadoPor().getId().equals(currentUser.getId());
        boolean isSupervisorOuGerente = temPapel("SUPERVISOR") || temPapel("GERENTE") || temPapel("ADMIN");

        if (!isAtribuido && !isCriador && !isSupervisorOuGerente) {
            throw new AccessDeniedException("Você não tem permissão para alterar o status desta demanda");
        }

        String statusAntigo = demanda.getStatus();
        demanda.setStatus(novoStatus);

        Demanda updatedDemanda = demandaRepository.save(demanda);
        logger.info("Status da demanda alterado com sucesso. ID: {}", updatedDemanda.getId());

        // Registrar a alteração de status na auditoria
        demandaAuditService.registrarAlteracaoStatus(updatedDemanda, statusAntigo, novoStatus, currentUser);

        return mapToDemandaDto(updatedDemanda, currentUser);
    }

    @Override
    @Transactional
    public DemandaDto atribuirDemanda(UUID demandaId, UUID usuarioId) {
        logger.info("Atribuindo demanda {} para usuário {}", demandaId, usuarioId);
        User currentUser = getCurrentUser();

        // Verificar se o usuário atual pode atribuir demandas
        if (!podeAtribuirDemanda()) {
            throw new AccessDeniedException("Você não tem permissão para atribuir demandas");
        }

        Demanda demanda = demandaRepository.findById(demandaId)
                .orElseThrow(() -> new ResourceNotFoundException("Demanda não encontrada com ID: " + demandaId));

        User usuarioAntigo = demanda.getAtribuidoPara();
        User novoAtribuido = userRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + usuarioId));

        demanda.setAtribuidoPara(novoAtribuido);

        Demanda updatedDemanda = demandaRepository.save(demanda);
        logger.info("Demanda atribuída com sucesso. ID: {}", updatedDemanda.getId());

        // Registrar a reatribuição na auditoria
        demandaAuditService.registrarReatribuicao(updatedDemanda, usuarioAntigo, novoAtribuido, currentUser);

        return mapToDemandaDto(updatedDemanda, currentUser);
    }

    // === Métodos auxiliares ===

    /**
     * Mapeia uma entidade Demanda para um DTO
     */
    private DemandaDto mapToDemandaDto(Demanda demanda, User currentUser) {
        return DTOMapperUtil.mapToDemandaDto(demanda, currentUser, true);
    }

    /**
     * Obtém o usuário atual autenticado
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }

    /**
     * Verifica se o usuário atual tem um determinado papel
     */
    private boolean temPapel(String papel) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_" + papel));
    }

    /**
     * Verifica se o usuário pode atribuir demandas a outros usuários
     */
    private boolean podeAtribuirDemanda() {
        return temPapel("ADMIN") || temPapel("GERENTE") || temPapel("SUPERVISOR");
    }

    /**
     * Verifica se o usuário pode ver a demanda
     */
    private boolean podeVerDemanda(Demanda demanda, User user) {
        // Administradores e gerentes podem ver todas as demandas
        if (temPapel("ADMIN") || temPapel("GERENTE")) {
            return true;
        }

        // Usuário é o criador ou atribuído
        if (demanda.getCriadoPor().getId().equals(user.getId()) ||
                demanda.getAtribuidoPara().getId().equals(user.getId())) {
            return true;
        }

        // Supervisores podem ver demandas de suas equipes
        if (temPapel("SUPERVISOR")) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(user.getId());
            List<UUID> usuariosNaEquipe = equipesIds.stream()
                    .flatMap(equipeId -> userRepository.findUserIdsByEquipeId(equipeId).stream())
                    .collect(Collectors.toList());

            return usuariosNaEquipe.contains(demanda.getAtribuidoPara().getId());
        }

        return false;
    }

    /**
     * Verifica se o usuário pode editar a demanda
     */
    private boolean podeEditarDemanda(Demanda demanda, User user) {
        // Administradores e gerentes podem editar todas as demandas
        if (temPapel("ADMIN") || temPapel("GERENTE")) {
            return true;
        }

        // Criador sempre pode editar
        if (demanda.getCriadoPor().getId().equals(user.getId())) {
            return true;
        }

        // Usuário atribuído pode editar somente o status e a prioridade
        if (demanda.getAtribuidoPara().getId().equals(user.getId())) {
            return true;
        }

        // Supervisores podem editar demandas de suas equipes
        if (temPapel("SUPERVISOR")) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(user.getId());
            List<UUID> usuariosNaEquipe = equipesIds.stream()
                    .flatMap(equipeId -> userRepository.findUserIdsByEquipeId(equipeId).stream())
                    .collect(Collectors.toList());

            return usuariosNaEquipe.contains(demanda.getAtribuidoPara().getId());
        }

        return false;
    }

    @Override
    public List<DemandaEvent> getDemandasParaCalendario(LocalDateTime inicio, LocalDateTime fim) {
        List<Demanda> demandas = demandaRepository.findByDataInicioBetween(inicio, fim);

        return demandas.stream().map(demanda -> {
            DemandaEvent event = new DemandaEvent();
            event.setId(demanda.getId());
            event.setTitle(demanda.getTitulo());
            event.setStart(demanda.getDataInicio());
            event.setEnd(demanda.getDataFim() != null ? demanda.getDataFim() : demanda.getDataInicio());
            event.setStatus(demanda.getStatus());
            event.setPrioridade(demanda.getPrioridade());
            return event;
        }).toList();
    }
}