package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PostagemService {

    Page<PostagemSummaryDto> getAllPostagens(Pageable pageable);

    List<PostagemSummaryDto> getPostagensByConvenioId(UUID convenioId);

    List<PostagemSummaryDto> getPostagensByCurrentUser();

    PostagemDto getPostagemById(UUID id);

    PostagemDto createPostagem(PostagemCreateDto postagemCreateDto);

    PostagemDto updatePostagem(UUID id, PostagemCreateDto postagemUpdateDto);

    void deletePostagem(UUID id);

    // Métodos para manipulação de imagens
    ImagemDto addImagem(UUID postagemId, MultipartFile file, String description);

    void deleteImagem(UUID id);

    // Métodos para manipulação de anexos
    AnexoDto addAnexo(UUID postagemId, MultipartFile file);

    void deleteAnexo(UUID id);

    // Métodos para manipulação de tabelas
    TabelaPostagemDto addTabelaPostagem(UUID postagemId, String conteudoJson);

    TabelaPostagemDto updateTabelaPostagem(UUID id, String conteudoJson);

    void deleteTabelaPostagem(UUID id);
}
