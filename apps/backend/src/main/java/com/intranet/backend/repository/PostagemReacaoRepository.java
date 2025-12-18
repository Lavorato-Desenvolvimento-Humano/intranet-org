package com.intranet.backend.repository;

import com.intranet.backend.model.Postagem;
import com.intranet.backend.model.PostagemReacao;
import com.intranet.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostagemReacaoRepository extends JpaRepository<PostagemReacao, UUID> {
    Optional<PostagemReacao> findByPostagemAndUser(Postagem postagem, User user);

    boolean existsByPostagemIdAndUserId(UUID postagemId, UUID userId);

    long countByPostagemId(UUID postagemId);
}
