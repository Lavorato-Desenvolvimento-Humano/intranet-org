// src/main/java/com/intranet/backend/repository/EquipeRepository.java
package com.intranet.backend.repository;

import com.intranet.backend.model.Equipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, UUID> {

    boolean existsByNome(String nome);

    @Query("SELECT COUNT(ue) FROM UserEquipe ue WHERE ue.equipe.id = :equipeId")
    int countMembrosByEquipeId(@Param("equipeId") UUID equipeId);

    @Query("SELECT e FROM Equipe e JOIN FETCH e.membros m JOIN FETCH m.user WHERE e.id = :id")
    Equipe findByIdWithMembros(@Param("id") UUID id);
}