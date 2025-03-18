package com.intranet.backend.repository;

import com.intranet.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGithubId(String githubId);

    boolean existsByEmail(String email);

    boolean existsByGithubId(String githubId);

    // Consulta JPQL otimizada com referência explícita ao parâmetro
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") UUID id);

    // Consulta JPQL otimizada com referência explícita ao parâmetro
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    // Consulta nativa alternativa (use se a JPQL não funcionar)
    @Query(value =
            "SELECT u.* FROM users u " +
                    "WHERE u.email = :email",
            nativeQuery = true)
    Optional<User> findByEmailNative(@Param("email") String email);

    @Query("SELECT r.name FROM Role r JOIN UserRole ur ON r.id = ur.role.id WHERE ur.user.id = :userId")
    List<String> findRoleNamesByUserId(UUID userId);
}
