package com.intranet.backend.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    default String formatJsonbContent(String content) {
        if (content == null) return null;
        // Se já for um JSON válido, retorna como está
        try {
            new ObjectMapper().readTree(content);
            return content;
        } catch (Exception e) {
            // Se não for JSON válido, tenta converter para string JSON
            try {
                return new ObjectMapper().writeValueAsString(content);
            } catch (Exception ex) {
                return "{}"; // Retorna JSON vazio em caso de erro
            }
        }
    }
}