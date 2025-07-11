package com.intranet.backend.repository;

import com.intranet.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConvenioFichaPdfConfigRepository extends JpaRepository<ConvenioFichaPdfConfig, UUID> {
    /**
     * Busca configuração por convênio
     */
    Optional<ConvenioFichaPdfConfig> findByConvenioId(UUID convenioId);

    /**
     * Lista convênios habilitados para geração de fichas
     */
    List<ConvenioFichaPdfConfig> findByHabilitadoTrue();

}
