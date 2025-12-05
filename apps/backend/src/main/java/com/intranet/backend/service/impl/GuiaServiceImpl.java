package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.events.StatusEventPublisher;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.GuiaService;
import com.intranet.backend.service.StatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional (readOnly = true)
public class GuiaServiceImpl implements GuiaService {

    private static final Logger logger = LoggerFactory.getLogger(GuiaServiceImpl.class);

    private final GuiaRepository guiaRepository;
    private final PacienteRepository pacienteRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final FichaRepository fichaRepository;
    private final StatusHistoryService statusHistoryService;
    private final StatusEventPublisher statusEventPublisher;

    @Override
    public Page<GuiaSummaryDto> getAllGuias(Pageable pageable) {
        logger.info("Buscando todas as guias - página: {}, tamanho: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Guia> guias = guiaRepository.findAll(pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public GuiaDto getGuiaById(UUID id) {
        logger.info("Buscando guia com ID: {}", id);
        Guia guia = guiaRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + id));
        return mapToGuiaDto(guia);
    }

    @Override
    @Transactional
    public GuiaDto createGuia(GuiaCreateRequest request) {
        logger.info("Criando nova guia para paciente ID: {}", request.getPacienteId());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado com ID: " + request.getPacienteId()));

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        if (guiaRepository.existsByNumeroGuiaAndMesAndAno(request.getNumeroGuia(), request.getMes(), request.getAno())) {
            throw new IllegalArgumentException("Já existe guia com número " + request.getNumeroGuia() + " para o período " + request.getMes() + "/" + request.getAno());
        }

        User currentUser = getCurrentUser();

        Guia guia = new Guia();
        guia.setNumeroGuia(request.getNumeroGuia());
        guia.setNumeroVenda(request.getNumeroVenda());
        guia.setStatus(request.getStatus());
        guia.setPaciente(paciente);
        guia.setConvenio(convenio);
        guia.setMes(request.getMes());
        guia.setAno(request.getAno());
        guia.setValidade(request.getValidade());
        guia.setLote(request.getLote());
        guia.setQuantidadeFaturada(request.getQuantidadeFaturada());
        guia.setValorReais(request.getValorReais());
        guia.setUsuarioResponsavel(currentUser);

        // Processar itens (Especialidade + Quantidade)
        if (request.getItens() != null) {
            List<GuiaItem> itens = new ArrayList<>();
            for (GuiaCreateRequest.GuiaItemRequest itemRequest : request.getItens()) {
                GuiaItem item = new GuiaItem();
                item.setGuia(guia);
                item.setEspecialidade(itemRequest.getEspecialidade());
                item.setQuantidadeAutorizada(itemRequest.getQuantidade());
                item.setQuantidadeExecutada(0);
                itens.add(item);
            }
            guia.setItens(itens);
        }

        Guia savedGuia = guiaRepository.save(guia);
        logger.info("Guia criada com sucesso. ID: {}", savedGuia.getId());

        try {
            statusEventPublisher.publishGuiaStatusChange(
                    savedGuia.getId(),
                    null,
                    request.getStatus(),
                    "Criação da guia",
                    "Status inicial definido na criação",
                    currentUser.getId()
            );
        } catch (Exception e) {
            logger.error("Erro ao publicar evento de status inicial: {}", e.getMessage(), e);
        }

        return mapToGuiaDto(savedGuia);
    }

    @Override
    @Transactional
    public GuiaDto updateGuia(UUID id, GuiaUpdateRequest request) {
        logger.info("Atualizando guia com ID: {}", id);

        Guia guia = guiaRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + id));

        if (request.getNumeroGuia() != null) guia.setNumeroGuia(request.getNumeroGuia());
        if (request.getNumeroVenda() != null) guia.setNumeroVenda(request.getNumeroVenda());

        // Atualização de itens
        if (request.getItens() != null) {
            guia.getItens().clear();

            for (GuiaUpdateRequest.GuiaItemUpdate itemUpdate : request.getItens()) {
                GuiaItem item = new GuiaItem();
                item.setGuia(guia);
                item.setEspecialidade(itemUpdate.getEspecialidade());
                item.setQuantidadeAutorizada(itemUpdate.getQuantidadeAutorizada());
                item.setQuantidadeExecutada(
                        itemUpdate.getQuantidadeExecutada() != null ? itemUpdate.getQuantidadeExecutada() : 0
                );
                guia.getItens().add(item);
            }
        }

        if (request.getMes() != null) guia.setMes(request.getMes());
        if (request.getAno() != null) guia.setAno(request.getAno());
        if (request.getValidade() != null) guia.setValidade(request.getValidade());
        if (request.getLote() != null) guia.setLote(request.getLote());
        if (request.getQuantidadeFaturada() != null) guia.setQuantidadeFaturada(request.getQuantidadeFaturada());
        if (request.getValorReais() != null) guia.setValorReais(request.getValorReais());

        Guia updatedGuia = guiaRepository.save(guia);
        logger.info("Guia atualizada com sucesso. ID: {}", updatedGuia.getId());
        return mapToGuiaDto(updatedGuia);
    }

    @Override
    @Transactional
    public GuiaDto updateGuiaStatus(UUID id, String novoStatus, String motivo, String observacoes) {
        logger.info("Atualizando status da guia com ID: {} para {}", id, novoStatus);

        Guia guia = guiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + id));

        User currentUser = getCurrentUser();
        String statusAnterior = guia.getStatus();

        if (!StatusEnum.isValid(novoStatus)) {
            throw new IllegalArgumentException("Status inválido: " + novoStatus);
        }

        guia.setStatus(novoStatus);
        Guia updatedGuia = guiaRepository.save(guia);

        try {
            statusEventPublisher.publishGuiaStatusChange(
                    id,
                    statusAnterior,
                    novoStatus,
                    motivo,
                    observacoes,
                    currentUser.getId()
            );
        } catch (Exception e) {
            logger.error("Erro ao publicar evento de mudança de status: {}", e.getMessage(), e);
        }

        return mapToGuiaDto(updatedGuia);
    }

    @Override
    @Transactional
    public void deleteGuia(UUID id) {
        if (!guiaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Guia não encontrada com ID: " + id);
        }
        long totalFichas = guiaRepository.countFichasByGuiaId(id);
        if (totalFichas > 0) {
            throw new IllegalStateException("Não é possível excluir guia que possui fichas associadas");
        }
        guiaRepository.deleteById(id);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByPaciente(UUID pacienteId, Pageable pageable) {
        return guiaRepository.findByPacienteId(pacienteId, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByConvenio(UUID convenioId, Pageable pageable) {
        return guiaRepository.findByConvenioId(convenioId, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByMesEAno(Integer mes, Integer ano, Pageable pageable) {
        return guiaRepository.findByMesAndAno(mes, ano, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasVencidas(Pageable pageable) {
        return guiaRepository.findGuiasVencidas(pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasComQuantidadeExcedida(Pageable pageable) {
        return guiaRepository.findGuiasComQuantidadeExcedida(pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByValidade(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return guiaRepository.findByValidadeBetween(startDate, endDate, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByUsuarioResponsavel(UUID userId, Pageable pageable) {
        return guiaRepository.findByUsuarioResponsavelId(userId, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByEspecialidade(String especialidade, Pageable pageable) {
        return guiaRepository.findByEspecialidadesContaining(especialidade, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByGuiaId(UUID guiaId, Pageable pageable) {
        if (!guiaRepository.existsById(guiaId)) {
            throw new ResourceNotFoundException("Guia não encontrada com ID: " + guiaId);
        }
        List<Ficha> fichas = fichaRepository.findByGuiaId(guiaId);
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), fichas.size());
        return new org.springframework.data.domain.PageImpl<>(
                fichas.subList(start, end).stream().map(this::mapToFichaSummaryDto).collect(Collectors.toList()),
                pageable, fichas.size()
        );
    }

    @Override
    public Page<GuiaSummaryDto> searchGuias(String termo, Pageable pageable) {
        return guiaRepository.searchByNumeroOrPacienteNome(termo, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByStatus(String status, Pageable pageable) {
        return guiaRepository.findGuiaByStatus(status, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public long countTotalGuias() { return guiaRepository.count(); }

    @Override
    public long countGuiasVencidas() { return guiaRepository.findGuiasVencidas(Pageable.unpaged()).getTotalElements(); }

    @Override
    public long countGuiasComQuantidadeExcedida() { return guiaRepository.findGuiasComQuantidadeExcedida(Pageable.unpaged()).getTotalElements(); }

    @Override
    public GuiaDto findByNumeroGuia(String numeroGuia) {
        Guia guia = guiaRepository.findByNumeroGuia(numeroGuia)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada: " + numeroGuia));
        return mapToGuiaDto(guia);
    }

    @Override
    public Page<GuiaSummaryDto> searchByNumeroGuia(String termo, Pageable pageable) {
        return guiaRepository.searchByNumeroOrPacienteNome(termo, pageable).map(this::mapToGuiaSummaryDto);
    }

    @Override
    public List<StatusHistoryDto> getHistoricoStatusGuia(UUID guiaId) {
        return statusHistoryService.getHistoricoEntidade(StatusHistory.EntityType.GUIA, guiaId);
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Não foi possível encontrar o usuário atual"));
    }

    private GuiaDto mapToGuiaDto(Guia guia) {
        long totalFichas = guiaRepository.countFichasByGuiaId(guia.getId());

        List<GuiaItemDto> itensDto = new ArrayList<>();
        if (guia.getItens() != null) {
            itensDto = guia.getItens().stream()
                    .map(i -> new GuiaItemDto(i.getId(), i.getEspecialidade(), i.getQuantidadeAutorizada(), i.getQuantidadeExecutada()))
                    .collect(Collectors.toList());
        }

        return new GuiaDto(
                guia.getId(),
                guia.getNumeroGuia(),
                guia.getNumeroVenda(),
                guia.getStatus(),
                guia.getPaciente().getId(),
                guia.getPaciente().getNome(),
                itensDto,
                guia.getQuantidadeAutorizadaTotal(), // Retorna total para compatibilidade
                guia.getConvenio().getId(),
                guia.getConvenio().getName(),
                guia.getMes(),
                guia.getAno(),
                guia.getValidade(),
                guia.getLote(),
                guia.getQuantidadeFaturada(),
                guia.getValorReais(),
                guia.getUsuarioResponsavel().getId(),
                guia.getUsuarioResponsavel().getFullName(),
                guia.getCreatedAt(),
                guia.getUpdatedAt(),
                totalFichas,
                guia.isVencida(),
                guia.isQuantidadeExcedida(),
                guia.getQuantidadeRestante()
        );
    }

    private GuiaSummaryDto mapToGuiaSummaryDto(Guia guia) {
        long totalFichas = guiaRepository.countFichasByGuiaId(guia.getId());

        int quantidadeTotalGeral = (guia.getItens() != null) ?
                guia.getItens().stream().mapToInt(GuiaItem::getQuantidadeAutorizada).sum() : 0;

        List<GuiaItemDto> itensDto = new ArrayList<>();
        if (guia.getItens() != null) {
            itensDto = guia.getItens().stream()
                    .map(item -> new GuiaItemDto(
                            item.getId(),
                            item.getEspecialidade(),
                            item.getQuantidadeAutorizada(),
                            item.getQuantidadeExecutada()
                    ))
                    .collect(Collectors.toList());
        }

        return new GuiaSummaryDto(
                guia.getId(),
                guia.getPaciente().getNome(),
                guia.getNumeroGuia(),
                guia.getNumeroVenda(),
                guia.getStatus(),
                itensDto, // Passando a lista de DTOs convertida
                quantidadeTotalGeral,
                guia.getConvenio().getName(),
                guia.getMes(),
                guia.getAno(),
                guia.getValidade(),
                guia.getQuantidadeFaturada(),
                guia.getValorReais(),
                guia.getUsuarioResponsavel().getFullName(),
                totalFichas,
                guia.isVencida(),
                guia.isQuantidadeExcedida()
        );
    }

    private FichaSummaryDto mapToFichaSummaryDto(Ficha ficha) {
        UUID guiaId = ficha.getGuia() != null ? ficha.getGuia().getId() : null;
        return new FichaSummaryDto(
                ficha.getId(),
                ficha.getCodigoFicha(),
                ficha.getStatus(),
                ficha.getPacienteNome(),
                ficha.getEspecialidade(),
                ficha.getQuantidadeAutorizada(),
                ficha.getConvenioNome(),
                ficha.getMes(),
                ficha.getAno(),
                ficha.getUsuarioResponsavel().getFullName(),
                ficha.getCreatedAt(),
                ficha.getTipoFicha(),
                guiaId
        );
    }
}