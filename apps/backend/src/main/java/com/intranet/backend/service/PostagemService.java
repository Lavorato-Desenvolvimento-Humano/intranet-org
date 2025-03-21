package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface PostagemService {

    List<PostagemSimpleDto> getAllPostagens();

    Page<PostagemSimpleDto> getAllPostagens(Pageable pageable);

    PostagemDto getPostagemById(UUID id);

    List<PostagemSimpleDto> getPostagensByConvenioId(UUID convenioId);

    Page<PostagemSimpleDto> getPostagensByConvenioId(UUID convenioId, Pageable pageable);

    PostagemDto createPostagem(PostagemCreateRequest request);

    PostagemDto updatePostagem(UUID id, PostagemUpdateRequest request);

    void deletePostagem(UUID id);

    List<PostagemSimpleDto> getRecentPostagens(int limit);

    @Transactional
    TabelaPostagemDto addTabelaToPostagem(UUID postagemId, Object conteudo);
}