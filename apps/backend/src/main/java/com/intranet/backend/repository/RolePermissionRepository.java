package com.intranet.backend.repository;

import com.intranet.backend.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {

    boolean existsByRoleIdAndPermissionId(Integer roleId, Integer permissionId);

    boolean existsByPermissionId(Integer permissionId);

    @Modifying
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId")
    void deleteByRoleId(Integer roleId);

    @Modifying
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    void deleteByRoleIdAndPermissionId(Integer roleId, Integer permissionId);

    List<RolePermission> findByRoleId(Integer roleId);
}