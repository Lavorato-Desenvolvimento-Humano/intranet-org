package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface PacienteService {
    Page<PacienteSummaryDto> getAllPacientes(Pageable pageable);

    PacienteDto getPacienteById(UUID id);

    PacienteDto createPaciente(PacienteCreateRequest request);

    PacienteDto updatePaciente(UUID id, PacienteUpdateRequest request);

    void deletePaciente(UUID id);

    Page<PacienteSummaryDto> searchPacientesByNome(String nome, Pageable pageable);

    Page<PacienteSummaryDto> getPacientesByConvenio(UUID convenioId, Pageable pageable);

    Page<PacienteSummaryDto> getPacientesByUnidade(Paciente.UnidadeEnum unidade, Pageable pageable);

    Page<PacienteSummaryDto> getPacientesByDataNascimento(LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<GuiaSummaryDto> getGuiasByPacienteId(UUID pacienteId, Pageable pageable);

    long countTotalPacientes();

    long countPacientesByConvenio(UUID convenioId);

    long countPacientesByUnidade(Paciente.UnidadeEnum unidade);
}
