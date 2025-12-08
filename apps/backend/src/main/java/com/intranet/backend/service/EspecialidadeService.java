package com.intranet.backend.service;

import com.intranet.backend.dto.EspecialidadeCreateRequest;
import com.intranet.backend.dto.EspecialidadeDto;

import java.util.List;
import java.util.UUID;

public interface EspecialidadeService {
    List<EspecialidadeDto> findAll();
    List<EspecialidadeDto> findAtivas();
    EspecialidadeDto findById(UUID id);
    EspecialidadeDto create(EspecialidadeCreateRequest request);
    EspecialidadeDto update(UUID id, EspecialidadeCreateRequest request);
    void toggleAtivo(UUID id);
    void delete(UUID id);
}
