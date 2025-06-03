package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface GuiaService {

    Page<GuiaSummaryDto> getAllGuias(Pageable pageable);

    GuiaDto getGuiaById(UUID id);

    GuiaDto createGuia(GuiaCreateRequest request);

    GuiaDto updateGuia(UUID id, GuiaUpdateRequest request);

    void deleteGuia(UUID id);

    Page<GuiaSummaryDto> getGuiasByPaciente(UUID pacienteId, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByConvenio(UUID convenioId, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByMesEAno(Integer mes, Integer ano, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasVencidas(Pageable pageable);

    Page<GuiaSummaryDto> getGuiasComQuantidadeExcedida(Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByValidade(LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByUsuarioResponsavel(UUID userId, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByEspecialidade(String especialidade, Pageable pageable);

    Page<FichaSummaryDto> getFichasByGuiaId(UUID guiaId, Pageable pageable);

    long countTotalGuias();

    long countGuiasVencidas();

    long countGuiasComQuantidadeExcedida();
}