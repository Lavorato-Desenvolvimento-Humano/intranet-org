package com.intranet.backend.repository;

import com.intranet.backend.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusRepository extends JpaRepository<Status, UUID> {

    boolean existsByStatus(String status);

    @Query("SELECT s FROM Status s WHERE s.status = :status")
    Optional<Status> findByStatus(@Param("status") String status);

    @Query("SELECT s FROM Status s WHERE s.ativo = true ORDER BY s.ordemExibicao ASC, s.status ASC")
    List<Status> findAllAtivosOrdenados();

    @Query("SELECT s FROM Status s ORDER BY s.ordemExibicao ASC, s.status ASC")
    List<Status> findAllOrdenados();

    @Query("SELECT s FROM Status s WHERE s.ativo = :ativo ORDER BY s.ordemExibicao ASC")
    List<Status> findByAtivoOrderByOrdemExibicao(@Param("ativo") Boolean ativo);

    @Query("SELECT COUNT(s) FROM Status s WHERE s.ativo = true")
    long countAtivos();

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Status s " +
            "WHERE s.status = :status AND s.id != :id")
    boolean existsByStatusAndIdNot(@Param("status") String status, @Param("id") UUID id);
}