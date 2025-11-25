package com.intranet.drive.quota.repository;

import com.intranet.drive.quota.entity.UserQuotaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserQuotaRepository extends JpaRepository<UserQuotaEntity, Long> {
}
