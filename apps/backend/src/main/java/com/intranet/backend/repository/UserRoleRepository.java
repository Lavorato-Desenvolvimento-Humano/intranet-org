package com.intranet.backend.repository;

import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {

    /**
     * Encontra todas as associações de funções para um usuário específico
     *
     * @param user O usuário
     * @return Lista de associações usuário-função
     */
    List<UserRole> findByUser(User user);

    /**
     * Encontra todas as associações de usuários para uma função específica
     *
     * @param role A função
     * @return Lista de associações usuário-função
     */
    List<UserRole> findByRole(Role role);

    /**
     * Encontra uma associação específica de usuário e função
     *
     * @param user O usuário
     * @param role A função
     * @return A associação usuário-função, se existir
     */
    Optional<UserRole> findByUserAndRole(User user, Role role);

    /**
     * Verifica se um usuário tem uma função específica
     *
     * @param userId ID do usuário
     * @param roleId ID da função
     * @return verdadeiro se o usuário tiver a função, falso caso contrário
     */
    boolean existsByUserIdAndRoleId(UUID userId, Integer roleId);

    /**
     * Remove todas as associações de função para um usuário específico
     *
     * @param userId ID do usuário
     * @return Número de registros afetados
     */
    @Modifying
    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId")
    int deleteByUserId(UUID userId);

    /**
     * Remove uma associação específica de usuário e função
     *
     * @param userId ID do usuário
     * @param roleId ID da função
     * @return Número de registros afetados
     */
    @Modifying
    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId AND ur.role.id = :roleId")
    int deleteByUserIdAndRoleId(UUID userId, Integer roleId);
}
