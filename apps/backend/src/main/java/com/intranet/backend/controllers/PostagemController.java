package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.repository.PostagemRepository;
import com.intranet.backend.service.PostagemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/postagens")
@RequiredArgsConstructor
public class PostagemController {

    private static final Logger logger = LoggerFactory.getLogger(PostagemController.class);
    private final PostagemService postagemService;
    private final PostagemRepository postagemRepository;

    @GetMapping
    public ResponseEntity<List<PostagemSimpleDto>> getAllPostagens() {
        logger.info("Requisição para listar todas as postagens");
        return ResponseEntity.ok(postagemService.getAllPostagens());
    }

    @GetMapping("/paginadas")
    public ResponseEntity<Page<PostagemSimpleDto>> getAllPostagensPaginadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        logger.info("Requisição para listar postagens paginadas: página {}, tamanho {}", page, size);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        return ResponseEntity.ok(postagemService.getAllPostagens(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostagemDto> getPostagemById(@PathVariable UUID id) {
        logger.info("Requisição para buscar postagem com ID: {}", id);
        return ResponseEntity.ok(postagemService.getPostagemById(id));
    }

    @GetMapping("/convenio/{convenioId}")
    public ResponseEntity<List<PostagemSimpleDto>> getPostagensByConvenioId(@PathVariable UUID convenioId) {
        logger.info("Requisição para listar postagens do convênio com ID: {}", convenioId);
        return ResponseEntity.ok(postagemService.getPostagensByConvenioId(convenioId));
    }

    @GetMapping("/convenio/{convenioId}/paginadas")
    public ResponseEntity<Page<PostagemSimpleDto>> getPostagensByConvenioIdPaginadas(
            @PathVariable UUID convenioId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        logger.info("Requisição para listar postagens paginadas do convênio ID {}: página {}, tamanho {}",
                convenioId, page, size);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        return ResponseEntity.ok(postagemService.getPostagensByConvenioId(convenioId, pageable));
    }

    @GetMapping("/recentes")
    public ResponseEntity<List<PostagemSimpleDto>> getRecentPostagens(
            @RequestParam(defaultValue = "5") int limit) {

        logger.info("Requisição para listar as {} postagens mais recentes", limit);
        return ResponseEntity.ok(postagemService.getRecentPostagens(limit));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<PostagemDto> createPostagem(@Valid @RequestBody PostagemCreateRequest request) {
        logger.info("Requisição para criar nova postagem: {}", request.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED).body(postagemService.createPostagem(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<PostagemDto> updatePostagem(
            @PathVariable UUID id,
            @Valid @RequestBody PostagemUpdateRequest request) {
        logger.info("Requisição para atualizar postagem com ID: {}", id);
        return ResponseEntity.ok(postagemService.updatePostagem(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deletePostagem(@PathVariable UUID id) {
        logger.info("Requisição para excluir postagem com ID: {}", id);
        postagemService.deletePostagem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{id}")
    public ResponseEntity<Map<String, Boolean>> checkPostagemExists(@PathVariable String id) {
        try {
            // Se for "new", retorna false
            if ("new".equals(id)) {
                Map<String, Boolean> response = new HashMap<>();
                response.put("exists", false);
                return ResponseEntity.ok(response);
            }

            // Tenta converter para UUID e verificar se existe
            UUID uuid = UUID.fromString(id);

            // Em vez de existsById, vamos usar findById e verificar se está presente
            boolean exists = postagemRepository.findById(uuid).isPresent();

            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // Se não for um UUID válido
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", false);
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{id}/tabelas")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<TabelaPostagemDto> addTabelaToPostagem(
            @PathVariable UUID id,
            @RequestBody TabelaPostagemCreateRequest request) {
        logger.info("Requisição para adicionar tabela à postagem com ID: {}", id);
        logger.debug("Conteúdo da tabela: {}", request.getConteudo());

        try {
            TabelaPostagemDto tabela = postagemService.addTabelaToPostagem(id, request.getConteudo());
            return ResponseEntity.status(HttpStatus.CREATED).body(tabela);
        } catch (Exception e) {
            logger.error("Erro ao adicionar tabela: {}", e.getMessage(), e);
            throw e;
        }
    }
}