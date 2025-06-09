package com.intranet.backend.repository;

import com.intranet.backend.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusRepository extends JpaRepository<Status, UUID> {

    boolean existsByStatus(String status);

    @Query("SELECT s FROM Status s WHERE s.status = :status")
    Status findByStatus(String status);

    boolean existsById(UUID id);

    @Query("SELECT s FROM Status s WHERE s.id = :id")
    Optional<Status> findById(UUID id);
}
