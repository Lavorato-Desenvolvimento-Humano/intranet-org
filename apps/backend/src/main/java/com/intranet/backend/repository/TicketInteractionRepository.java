package com.intranet.backend.repository;

import com.intranet.backend.model.TicketInteraction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketInteractionRepository extends JpaRepository<TicketInteraction,Long> {

    List<TicketInteraction> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
