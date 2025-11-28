package com.intranet.drive.audit.repository;

import com.intranet.drive.audit.entity.AuditLogEntity;
import org.springframework.data.repository.CrudRepository;

public interface AuditLogRepository extends CrudRepository<AuditLogEntity, Long> {
}
