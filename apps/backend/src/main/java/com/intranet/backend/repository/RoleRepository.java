package com.intranet.backend.repository;

import com.intranet.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);

    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.rolePermissions rp LEFT JOIN FETCH rp.permission WHERE r.id = :id")
    Optional<Role> findByIdWithPermissions(Integer id);

    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.rolePermissions rp LEFT JOIN FETCH rp.permission WHERE r.name = :name")
    Optional<Role> findByNameWithPermissions(String name);
}
