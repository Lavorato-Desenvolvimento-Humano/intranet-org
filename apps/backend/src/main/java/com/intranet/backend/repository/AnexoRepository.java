package com.intranet.backend.repository;

import com.intranet.backend.model.Anexo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnexoRepository extends JpaRepository<Anexo, UUID> {

    List<Anexo> findByPostId(UUID postId);

    void deleteByPostId(UUID postId);
}