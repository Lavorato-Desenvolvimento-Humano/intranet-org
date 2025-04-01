package com.intranet.backend.repository;

import com.intranet.backend.model.Postagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostagemRepository extends JpaRepository<Postagem, UUID> {

    @Query("SELECT p FROM Postagem p WHERE p.convenio.id = :convenioId ORDER BY p.createdAt DESC")
    List<Postagem> findByConvenioIdOrderByCreatedAtDesc(@Param("convenioId") UUID convenioId);

    @Query("SELECT p FROM Postagem p JOIN FETCH p.createdBy WHERE p.id = :id")
    Postagem findByIdWithCreatedBy(@Param("id") UUID id);

    @Query("SELECT p FROM Postagem p WHERE p.createdBy.id = :userId ORDER BY p.createdAt DESC")
    List<Postagem> findByCreatedByIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query(value = "SELECT p FROM Postagem p JOIN FETCH p.convenio JOIN FETCH p.createdBy ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM Postagem p")
    Page<Postagem> findAllWithConvenioAndCreatedBy(Pageable pageable);

    @Query("SELECT COUNT(p) FROM Postagem p WHERE p.convenio.id = :convenioId")
    long countByConvenioId(@Param("convenioId") UUID convenioId);

    /**
     * Busca todas as postagens visíveis para um usuário, incluindo:
     * - Todas as postagens do tipo 'geral'
     * - Todas as postagens do tipo 'convenio'
     * - Apenas as postagens do tipo 'equipe' das equipes às quais o usuário pertence
     */
    @Query("SELECT p FROM Postagem p WHERE " +
            "p.tipoDestino IN ('geral', 'convenio') OR " +
            "(p.tipoDestino = 'equipe' AND p.equipe.id IN " +
            "(SELECT ue.equipe.id FROM UserEquipe ue WHERE ue.user.id = :userId)) " +
            "ORDER BY p.createdAt DESC")
    List<Postagem> findVisibleToUserOrderByCreatedAtDesc(@Param("userId") UUID userId);

    /**
     * Busca todas as postagens de determinados tipos de destino
     */
    List<Postagem> findByTipoDestinoInOrderByCreatedAtDesc(List<String> tiposDestino);

    @Query("SELECT COUNT(p) FROM Postagem p WHERE p.tipoDestino = 'equipe' AND p.equipe.id = :equipeId")
    long countByEquipeId(@Param("equipeId") UUID equipeId);

    /**
     * Busca todas as postagens visíveis para um usuário com paginação
     */
    @Query("SELECT p FROM Postagem p WHERE " +
            "p.tipoDestino IN ('geral', 'convenio') OR " +
            "(p.tipoDestino = 'equipe' AND p.equipe.id IN " +
            "(SELECT ue.equipe.id FROM UserEquipe ue WHERE ue.user.id = :userId)) " +
            "ORDER BY p.createdAt DESC")
    Page<Postagem> findVisibleToUserPaged(
            @Param("userId") UUID userId,
            Pageable pageable);

    @Query(value = "SELECT p FROM Postagem p WHERE " +
            "(p.tipoDestino = 'geral' OR " +
            "(p.tipoDestino = 'convenio' AND p.convenio.id = :convenioId) OR " +
            "(p.tipoDestino = 'equipe' AND p.equipe.id IN " +
            "(SELECT ue.equipe.id FROM UserEquipe ue WHERE ue.user.id = :userId))) " +
            "ORDER BY p.createdAt DESC")
    List<Postagem> findVisibleToUserOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("convenioId") UUID convenioId);
}
