package com.intranet.backend.repository;

import com.intranet.backend.model.Imagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImagemRepository extends JpaRepository<Imagem, UUID> {

    List<Imagem> findByPostId(UUID postId);

    void deleteByPostId(UUID postId);
}