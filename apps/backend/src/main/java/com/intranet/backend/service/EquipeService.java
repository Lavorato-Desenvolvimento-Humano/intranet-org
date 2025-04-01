// src/main/java/com/intranet/backend/service/EquipeService.java
package com.intranet.backend.service;

import com.intranet.backend.dto.EquipeCreateDto;
import com.intranet.backend.dto.EquipeDto;
import com.intranet.backend.dto.UserDto;

import java.util.List;
import java.util.UUID;

public interface EquipeService {

    List<EquipeDto> getAllEquipes();

    EquipeDto getEquipeById(UUID id);

    EquipeDto createEquipe(EquipeCreateDto equipeCreateDto);

    EquipeDto updateEquipe(UUID id, EquipeCreateDto equipeUpdateDto);

    void deleteEquipe(UUID id);

    EquipeDto addMembro(UUID equipeId, UUID userId);

    EquipeDto removeMembro(UUID equipeId, UUID userId);

    List<UserDto> getMembrosEquipe(UUID equipeId);

    List<EquipeDto> getEquipesByCurrentUser();
}