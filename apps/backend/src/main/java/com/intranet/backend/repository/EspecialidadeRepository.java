package com.intranet.backend.repository;

import com.intranet.backend.model.Especialidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EspecialidadeRepository extends JpaRepository<Especialidade, UUID> {

    Optional<Especialidade> findByNome(String nome);

    boolean existsByNome(String nome);

    boolean existsByNomeAndIdNot(String nome, UUID id);

    List<Especialidade> findAllByAtivoTrueOrderByNomeAsc();

    List<Especialidade> findAllByOrderByNomeAsc();
}
