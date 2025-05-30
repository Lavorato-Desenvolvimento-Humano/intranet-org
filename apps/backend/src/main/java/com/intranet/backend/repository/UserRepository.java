package com.intranet.backend.repository;

import com.intranet.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGithubId(String githubId);

    boolean existsByEmail(String email);

    boolean existsByGithubId(String githubId);

    @Query("SELECT r.name FROM Role r JOIN UserRole ur ON r.id = ur.role.id WHERE ur.user.id = :userId")
    List<String> findRoleNamesByUserId(UUID userId);

    /**
     * Encontra todos os IDs de usuários que pertencem a uma equipe específica
     */
    @Query("SELECT u.id FROM User u JOIN UserEquipe ue ON u.id = ue.user.id WHERE ue.equipe.id = :equipeId")
    List<UUID> findUserIdsByEquipeId(@Param("equipeId") UUID equipeId);

}
