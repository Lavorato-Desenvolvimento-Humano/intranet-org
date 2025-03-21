package com.intranet.backend.service;

import com.intranet.backend.dto.ConvenioCreateRequest;
import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.ConvenioSimpleDto;
import com.intranet.backend.dto.ConvenioUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface ConvenioService {

    List<ConvenioSimpleDto> getAllConvenios();

    ConvenioDto getConvenioById(UUID id);

    ConvenioDto createConvenio(ConvenioCreateRequest request);

    ConvenioDto updateConvenio(UUID id, ConvenioUpdateRequest request);

    void deleteConvenio(UUID id);

    List<ConvenioDto> getConveniosWithPostagens();
}
