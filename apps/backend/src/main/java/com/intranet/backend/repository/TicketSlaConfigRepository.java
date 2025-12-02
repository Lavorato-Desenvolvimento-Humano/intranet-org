package com.intranet.backend.repository;

import com.intranet.backend.model.TicketPriority;
import com.intranet.backend.model.TicketSlaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketSlaConfigRepository extends JpaRepository<TicketSlaConfig, TicketPriority> {
}
