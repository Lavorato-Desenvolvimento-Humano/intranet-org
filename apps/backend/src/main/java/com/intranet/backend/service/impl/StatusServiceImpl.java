package com.intranet.backend.service.impl;

import com.intranet.backend.dto.StatusCreateRequest;
import com.intranet.backend.dto.StatusDto;
import com.intranet.backend.dto.StatusUpdateRequest;
import com.intranet.backend.model.Status;
import com.intranet.backend.repository.StatusRepository;
import com.intranet.backend.service.StatusService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatusServiceImpl implements StatusService {

    private static final Logger logger = LoggerFactory.getLogger(StatusServiceImpl.class);

    private final StatusRepository statusRepository;

    @Override
    public StatusDto createStatus(StatusCreateRequest request) {
        logger.info("Criando novo status: {}", request.getStatus());

        if (statusRepository.existsByStatus(request.getStatus())) {
            throw new IllegalArgumentException("O Status já existe");
        }

        Status status = new Status();
        status.setStatus(request.getStatus());
        statusRepository.save(status);

        logger.info("Status criado com sucesso: {}", status.getId());
        return mapToStatusDto(status);
    }

    @Override
    public StatusDto updateStatus(UUID id, StatusUpdateRequest request) {
        logger.info("Atualizando status com ID: {}", id);

        if (!statusRepository.existsById(id)) {
            throw new IllegalArgumentException("Status não encontrado para o digite ID: " + id);
        }

        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Status não encontrado para o ID: " + id));

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            if (statusRepository.existsByStatus(request.getStatus())) {
                throw new IllegalArgumentException("O Status já existe");
            }
            status.setStatus(request.getStatus());
        }

        statusRepository.save(status);

        logger.info("Status atualizado com sucesso: {}", status.getId());
        return mapToStatusDto(status);
    }

    @Override
    public StatusDto getStatusById(UUID id) {
        logger.info("Buscando status com ID: {}", id);

        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Status não encontrado para o ID: " + id));

        logger.info("Status encontrado: {}", status.getId());
        return mapToStatusDto(status);
    }

    @Override
    public List<StatusDto> getAllStatuses() {
        logger.info("Buscando todos os status");

        List<Status> statuses = statusRepository.findAll();

        if (statuses.isEmpty()) {
            logger.info("Nenhum status encontrado");
            return List.of();
        }

        logger.info("Total de status encontrados: {}", statuses.size());
        return statuses.stream()
                .map(this::mapToStatusDto)
                .toList();
    }

    @Override
    public void deleteStatus(UUID id) {
        logger.info("Deletando status com ID: {}", id);

        if (!statusRepository.existsById(id)) {
            throw new IllegalArgumentException("Status não encontrado para o ID: " + id);
        }

        statusRepository.deleteById(id);
        logger.info("Status deletado com sucesso: {}", id);
    }

    private StatusDto mapToStatusDto(Status status) {
        return new StatusDto(status.getId(), status.getStatus());
    }
}
