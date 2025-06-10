package com.intranet.backend.service.impl;

import com.intranet.backend.dto.StatusCreateRequest;
import com.intranet.backend.dto.StatusDto;
import com.intranet.backend.dto.StatusUpdateRequest;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Status;
import com.intranet.backend.model.StatusEnum;
import com.intranet.backend.repository.StatusRepository;
import com.intranet.backend.service.StatusService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatusServiceImpl implements StatusService {

    private static final Logger logger = LoggerFactory.getLogger(StatusServiceImpl.class);

    private final StatusRepository statusRepository;

    @Override
    @Transactional
    public StatusDto createStatus(StatusCreateRequest request) {
        logger.info("Criando novo status: {}", request.getStatus());

        // Validar se o status é válido segundo o enum
        if (!StatusEnum.isValid(request.getStatus())) {
            throw new IllegalArgumentException("Status inválido: " + request.getStatus() +
                    ". Status válidos: " + getValidStatusString());
        }

        if (statusRepository.existsByStatus(request.getStatus())) {
            throw new IllegalArgumentException("Status já existe: " + request.getStatus());
        }

        Status status = new Status();
        status.setStatus(request.getStatus().toUpperCase().trim());
        status.setDescricao(request.getDescricao());
        status.setAtivo(request.getAtivo() != null ? request.getAtivo() : true);

        // Se não fornecida ordem, usar a do enum
        if (request.getOrdemExibicao() == null) {
            StatusEnum statusEnum = StatusEnum.fromString(request.getStatus());
            status.setOrdemExibicao(statusEnum.getOrdem());
        } else {
            status.setOrdemExibicao(request.getOrdemExibicao());
        }

        Status savedStatus = statusRepository.save(status);
        logger.info("Status criado com sucesso: {}", savedStatus.getId());

        return mapToStatusDto(savedStatus);
    }

    @Override
    @Transactional
    public StatusDto updateStatus(UUID id, StatusUpdateRequest request) {
        logger.info("Atualizando status com ID: {}", id);

        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado para o ID: " + id));

        boolean updated = false;

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            String newStatus = request.getStatus().toUpperCase().trim();

            // Validar se o novo status é válido
            if (!StatusEnum.isValid(newStatus)) {
                throw new IllegalArgumentException("Status inválido: " + newStatus +
                        ". Status válidos: " + getValidStatusString());
            }

            // Verificar se não existe outro status com o mesmo nome
            if (statusRepository.existsByStatusAndIdNot(newStatus, id)) {
                throw new IllegalArgumentException("Já existe outro status com este nome: " + newStatus);
            }

            status.setStatus(newStatus);
            updated = true;
        }

        if (request.getDescricao() != null) {
            status.setDescricao(request.getDescricao());
            updated = true;
        }

        if (request.getAtivo() != null) {
            status.setAtivo(request.getAtivo());
            updated = true;
        }

        if (request.getOrdemExibicao() != null) {
            status.setOrdemExibicao(request.getOrdemExibicao());
            updated = true;
        }

        if (updated) {
            status = statusRepository.save(status);
            logger.info("Status atualizado com sucesso: {}", status.getId());
        }

        return mapToStatusDto(status);
    }

    @Override
    public StatusDto getStatusById(UUID id) {
        logger.info("Buscando status com ID: {}", id);

        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado para o ID: " + id));

        return mapToStatusDto(status);
    }

    @Override
    public List<StatusDto> getAllStatuses() {
        logger.info("Buscando todos os status");

        List<Status> statuses = statusRepository.findAllOrdenados();

        if (statuses.isEmpty()) {
            logger.info("Nenhum status encontrado, inicializando status padrão");
            initializeDefaultStatuses();
            statuses = statusRepository.findAllOrdenados();
        }

        logger.info("Total de status encontrados: {}", statuses.size());
        return statuses.stream()
                .map(this::mapToStatusDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<StatusDto> getAllStatusesAtivos() {
        logger.info("Buscando todos os status ativos");

        List<Status> statuses = statusRepository.findAllAtivosOrdenados();
        return statuses.stream()
                .map(this::mapToStatusDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<StatusDto> getAllStatusesOrdenados() {
        return getAllStatuses(); // Já retorna ordenado
    }

    @Override
    @Transactional
    public void deleteStatus(UUID id) {
        logger.info("Deletando status com ID: {}", id);

        if (!statusRepository.existsById(id)) {
            throw new ResourceNotFoundException("Status não encontrado para o ID: " + id);
        }

        // TODO: Verificar se o status está sendo usado em guias ou fichas antes de deletar
        // Implementar essa verificação quando necessário

        statusRepository.deleteById(id);
        logger.info("Status deletado com sucesso: {}", id);
    }

    @Override
    @Transactional
    public void toggleStatusAtivo(UUID id) {
        logger.info("Alterando status ativo/inativo para ID: {}", id);

        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado para o ID: " + id));

        status.setAtivo(!status.getAtivo());
        statusRepository.save(status);

        logger.info("Status {} agora está: {}", id, status.getAtivo() ? "ATIVO" : "INATIVO");
    }

    @Override
    public StatusDto findByStatus(String statusName) {
        logger.info("Buscando status por nome: {}", statusName);

        Status status = statusRepository.findByStatus(statusName.toUpperCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado: " + statusName));

        return mapToStatusDto(status);
    }

    @Override
    public List<StatusDto> getStatusEnumValues() {
        logger.info("Retornando valores do enum de status");

        return Arrays.stream(StatusEnum.getAllInOrder())
                .map(this::mapEnumToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void initializeDefaultStatuses() {
        logger.info("Inicializando status padrão do sistema");

        for (StatusEnum statusEnum : StatusEnum.values()) {
            if (!statusRepository.existsByStatus(statusEnum.getValor())) {
                Status status = new Status(statusEnum);
                statusRepository.save(status);
                logger.debug("Status padrão criado: {}", statusEnum.getValor());
            }
        }

        logger.info("Inicialização de status padrão concluída");
    }

    @Override
    public long countStatusesAtivos() {
        return statusRepository.countAtivos();
    }

    private StatusDto mapToStatusDto(Status status) {
        return new StatusDto(
                status.getId(),
                status.getStatus(),
                status.getDescricao(),
                status.getAtivo(),
                status.getOrdemExibicao(),
                status.getCreatedAt(),
                status.getUpdatedAt()
        );
    }

    private StatusDto mapEnumToDto(StatusEnum statusEnum) {
        return new StatusDto(
                null, // ID null para valores do enum
                statusEnum.getValor(),
                statusEnum.getDescricao(),
                true, // Enum values são sempre ativos
                statusEnum.getOrdem(),
                null, // CreatedAt null para valores do enum
                null  // UpdatedAt null para valores do enum
        );
    }

    private String getValidStatusString() {
        return Arrays.stream(StatusEnum.values())
                .map(StatusEnum::getValor)
                .collect(Collectors.joining(", "));
    }
}