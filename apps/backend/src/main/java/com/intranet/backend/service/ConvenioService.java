package com.intranet.backend.service;

import com.intranet.backend.dto.ConvenioCreateDto;
import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.PostagemSummaryDto;

import java.util.List;
import java.util.UUID;

public interface ConvenioService {

    List<ConvenioDto> getAllConvenios();

    ConvenioDto getConvenioById(UUID id);

    ConvenioDto createConvenio(ConvenioCreateDto convenioCreateDto);

    ConvenioDto updateConvenio(UUID id, ConvenioCreateDto convenioCreateDto);

    void deleteConvenio(UUID id);

    List<PostagemSummaryDto> getPostagensByConvenioId(UUID convenioId);

    long countPostagensByConvenioId(UUID convenioId);
}
