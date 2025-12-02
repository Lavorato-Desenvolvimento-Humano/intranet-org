// src/main/java/com/intranet/backend/repository/UserEquipeRepository.java
package com.intranet.backend.repository;

import com.intranet.backend.model.Equipe;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserEquipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserEquipeRepository extends JpaRepository<UserEquipe, Long> {

    List<UserEquipe> findByUserId(UUID userId);

    @Query("SELECT COUNT(ue) > 0 FROM UserEquipe ue WHERE ue.user.id = :userId AND ue.equipe.id = :equipeId")
    boolean existsByUserIdAndEquipeId(@Param("userId") UUID userId, @Param("equipeId") UUID equipeId);

    void deleteByUserIdAndEquipeId(UUID userId, UUID equipeId);

    @Query("SELECT ue FROM UserEquipe ue JOIN FETCH ue.user JOIN FETCH ue.equipe WHERE ue.equipe.id = :equipeId")
    List<UserEquipe> findByEquipeIdWithDetails(@Param("equipeId") UUID equipeId);

    @Modifying
    @Query("DELETE FROM UserEquipe ue WHERE ue.equipe.id = :equipeId")
    void deleteByEquipeId(@Param("equipeId") UUID equipeId);

    @Query("SELECT ue.equipe.id FROM UserEquipe ue WHERE ue.user.id = :userId")
    List<UUID> findEquipeIdsByUserId(@Param("userId") UUID userId);
}