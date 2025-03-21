package com.intranet.backend.repository;

import com.intranet.backend.model.Convenio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConvenioRepository extends JpaRepository<Convenio, UUID> {

    Optional<Convenio> findByName(String name);

    @Query("SELECT c FROM Convenio c LEFT JOIN FETCH c.postagens WHERE c.id = :id")
    Optional<Convenio> findByIdWithPostagens(UUID id);

    @Query("SELECT DISTINCT c FROM Convenio c LEFT JOIN FETCH c.postagens")
    List<Convenio> findAllWithPostagens();
}