package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.service.PostagemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/postagens")
@RequiredArgsConstructor
public class PostagemController {

    private static final Logger logger = LoggerFactory.getLogger(PostagemController.class);
    private final PostagemService postagemService;

    @GetMapping
    public ResponseEntity<Page<PostagemSummaryDto>> getAllPostagens(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        logger.info("Requisição para listar todas as postagens");
        Page<PostagemSummaryDto> postagens = postagemService.getAllPostagens(pageable);
        return ResponseEntity.ok(postagens);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostagemDto> getPostagemById(@PathVariable UUID id) {
        logger.info("Requisição para buscar postagem com ID: {}", id);
        PostagemDto postagem = postagemService.getPostagemById(id);
        return ResponseEntity.ok(postagem);
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<PostagemSummaryDto>> getPostagensByCurrentUser() {
        logger.info("Requisição para listar postagens do usuário atual");
        List<PostagemSummaryDto> postagens = postagemService.getPostagensByCurrentUser();
        return ResponseEntity.ok(postagens);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<PostagemDto> createPostagem(@Valid @RequestBody PostagemCreateDto postagemCreateDto) {
        logger.info("Requisição para criar nova postagem: {}", postagemCreateDto.getTitle());
        PostagemDto createdPostagem = postagemService.createPostagem(postagemCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPostagem);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<PostagemDto> updatePostagem(
            @PathVariable UUID id,
            @Valid @RequestBody PostagemCreateDto postagemUpdateDto) {
        logger.info("Requisição para atualizar postagem com ID: {}", id);
        PostagemDto updatedPostagem = postagemService.updatePostagem(id, postagemUpdateDto);
        return ResponseEntity.ok(updatedPostagem);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<Void> deletePostagem(@PathVariable UUID id) {
        logger.info("Requisição para deletar postagem com ID: {}", id);
        postagemService.deletePostagem(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints para manipulação de imagens
    @PostMapping(value = "/{id}/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<ImagemDto> addImagem(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        logger.info("Requisição para adicionar imagem à postagem com ID: {}", id);
        ImagemDto imagem = postagemService.addImagem(id, file, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(imagem);
    }

    @DeleteMapping("/imagens/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<Void> deleteImagem(@PathVariable UUID id) {
        logger.info("Requisição para deletar imagem com ID: {}", id);
        postagemService.deleteImagem(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints para manipulação de anexos
    @PostMapping(value = "/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<AnexoDto> addAnexo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        logger.info("Requisição para adicionar anexo à postagem com ID: {}", id);
        AnexoDto anexo = postagemService.addAnexo(id, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(anexo);
    }

    @DeleteMapping("/anexos/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<Void> deleteAnexo(@PathVariable UUID id) {
        logger.info("Requisição para deletar anexo com ID: {}", id);
        postagemService.deleteAnexo(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints para manipulação de tabelas
    @PostMapping("/{id}/tabelas")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<TabelaPostagemDto> addTabela(
            @PathVariable UUID id,
            @RequestBody String conteudoJson) {
        logger.info("Requisição para adicionar tabela à postagem com ID: {}", id);
        TabelaPostagemDto tabela = postagemService.addTabelaPostagem(id, conteudoJson);
        return ResponseEntity.status(HttpStatus.CREATED).body(tabela);
    }

    @PutMapping("/tabelas/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<TabelaPostagemDto> updateTabela(
            @PathVariable UUID id,
            @RequestBody String conteudoJson) {
        logger.info("Requisição para atualizar tabela com ID: {}", id);
        TabelaPostagemDto tabela = postagemService.updateTabelaPostagem(id, conteudoJson);
        return ResponseEntity.ok(tabela);
    }

    @DeleteMapping("/tabelas/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<Void> deleteTabela(@PathVariable UUID id) {
        logger.info("Requisição para deletar tabela com ID: {}", id);
        postagemService.deleteTabelaPostagem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/nova")
    public ResponseEntity<PostagemCreateDto> getNovaPostagemFormulario() {
        // Retornar um modelo vazio para o formulário de nova postagem
        PostagemCreateDto postagemCreateDto = new PostagemCreateDto();
        return ResponseEntity.ok(postagemCreateDto);
    }
}
