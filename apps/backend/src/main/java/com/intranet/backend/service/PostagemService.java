package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PostagemService {

    Page<PostagemSummaryDto> getAllPostagens(Pageable pageable);

    List<PostagemSummaryDto> getPostagensByCurrentUser();

    PostagemDto getPostagemById(UUID id);

    PostagemDto createPostagem(PostagemCreateDto postagemCreateDto);

    PostagemDto updatePostagem(UUID id, PostagemCreateDto postagemUpdateDto);

    void deletePostagem(UUID id);

    ImagemDto addImagem(UUID postagemId, MultipartFile file, String description);

    void deleteImagem(UUID id);

    void deleteAnexo(UUID id);

    AnexoDto associarAnexo(UUID postagemId, UUID anexoId);

    List<PostagemSummaryDto> getPostagensByEquipeId(UUID equipeId);

    List<PostagemSummaryDto> getPostagensByTipoDestino(String tipoDestino);
    
    List<PostagemSummaryDto> getPostagensVisibleToCurrentUser();

    @Transactional
    void toggleLike(UUID postagemId);

    @Transactional
    PostagemComentarioDto addComment(UUID postagemId, String text);

    @Transactional
    void incrementViewCount(UUID postagemId);

    /**
     * Busca todas as postagens para administradores (sem restrições de visibilidade)
     * @return Lista de todas as postagens do sistema
     */
    List<PostagemSummaryDto> getAllPostagensForAdmin();
}
