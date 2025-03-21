package com.intranet.backend.repository;

import com.intranet.backend.model.TabelaPostagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TabelaPostagemRepository extends JpaRepository<TabelaPostagem, UUID> {

    List<TabelaPostagem> findByPostId(UUID postId);

    Optional<TabelaPostagem> findFirstByPostId(UUID postId);

    void deleteByPostId(UUID postId);
}