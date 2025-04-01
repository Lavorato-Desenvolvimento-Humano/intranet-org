// src/main/java/com/intranet/backend/repository/UserEquipeRepository.java
package com.intranet.backend.repository;

import com.intranet.backend.model.UserEquipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserEquipeRepository extends JpaRepository<UserEquipe, Long> {

    List<UserEquipe> findByUserId(UUID userId);

    List<UserEquipe> findByEquipeId(UUID equipeId);

    boolean existsByUserIdAndEquipeId(UUID userId, UUID equipeId);

    void deleteByUserIdAndEquipeId(UUID userId, UUID equipeId);

    @Query("SELECT ue FROM UserEquipe ue JOIN FETCH ue.user JOIN FETCH ue.equipe WHERE ue.equipe.id = :equipeId")
    List<UserEquipe> findByEquipeIdWithDetails(@Param("equipeId") UUID equipeId);
}