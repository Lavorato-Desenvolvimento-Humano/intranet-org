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

    /**
     * Lista convênios desabilitados
     */
    List<ConvenioFichaPdfConfig> findByHabilitadoFalse();

    /**
     * Verifica se convênio está habilitado
     */
    @Query("SELECT c.habilitado FROM ConvenioFichaPdfConfig c WHERE c.convenio.id = :convenioId")
    Optional<Boolean> isConvenioHabilitado(@Param("convenioId") UUID convenioId);

    /**
     * Lista configurações por dias de atividade
     */
    List<ConvenioFichaPdfConfig> findByDiasAtividadeGreaterThan(Integer dias);

    /**
     * Busca por prefixo de identificação
     */
    List<ConvenioFichaPdfConfig> findByPrefixoIdentificacao(String prefixo);
}
