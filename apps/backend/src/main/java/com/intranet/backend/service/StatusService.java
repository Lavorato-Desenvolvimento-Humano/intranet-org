package com.intranet.backend.service;

import com.intranet.backend.dto.StatusCreateRequest;
import com.intranet.backend.dto.StatusDto;
import com.intranet.backend.dto.StatusUpdateRequest;
import com.intranet.backend.model.StatusEnum;

import java.util.List;
import java.util.UUID;

public interface StatusService {

    StatusDto createStatus(StatusCreateRequest request);

    StatusDto updateStatus(UUID id, StatusUpdateRequest request);

    StatusDto getStatusById(UUID id);

    List<StatusDto> getAllStatuses();

    List<StatusDto> getAllStatusesAtivos();

    List<StatusDto> getAllStatusesOrdenados();

    void deleteStatus(UUID id);

    void toggleStatusAtivo(UUID id);

    StatusDto findByStatus(String status);

    List<StatusDto> getStatusEnumValues();

    void initializeDefaultStatuses();

    long countStatusesAtivos();
}