package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface FichaService {

    Page<FichaSummaryDto> getAllFichas(Pageable pageable);

    FichaDto getFichaById(UUID id);

    FichaDto createFicha(FichaCreateRequest request);

    FichaDto createFichaAssinatura(FichaAssinaturaCreateRequest request);

    FichaDto vincularFichaAGuia(UUID fichaId, UUID guiaId);

    FichaDto updateFicha(UUID id, FichaUpdateRequest request);

    void deleteFicha(UUID id);

    List<FichaDto> getFichasByGuiaId(UUID guiaId);

    Page<FichaSummaryDto> getFichasByPacienteId(UUID pacienteId, Pageable pageable);

    Page<FichaSummaryDto> getFichasByConvenioId(UUID convenioId, Pageable pageable);

    Page<FichaSummaryDto> searchFichasByEspecialidade(String especialidade, Pageable pageable);

    Page<FichaSummaryDto> getFichasByMesEAno(Integer mes, Integer ano, Pageable pageable);

    Page<FichaSummaryDto> getFichasByUsuarioResponsavel(UUID userId, Pageable pageable);

    long countTotalFichas();

    long countFichasByGuia(UUID guiaId);

    long countFichasByConvenio(UUID convenioId);

    FichaDto findByCodigoFicha(String codigoFicha);

    Page<FichaSummaryDto> searchByCodigoFicha(String termo, Pageable pageable);

    Page<FichaSummaryDto> getFichasByStatus(String status, Pageable pageable);
}