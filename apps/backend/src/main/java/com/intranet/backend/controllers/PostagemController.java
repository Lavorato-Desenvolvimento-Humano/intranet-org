package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Anexo;
import com.intranet.backend.model.Imagem;
import com.intranet.backend.model.Postagem;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.AnexoRepository;
import com.intranet.backend.repository.ImagemRepository;
import com.intranet.backend.repository.PostagemRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.FileStorageService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ImagemRepository imagemRepository;
    private final AnexoRepository anexoRepository;
    private final PostagemRepository postagemRepository;

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

    @PostMapping(value = "/temp/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<ImagemDto> addTempImagem(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        logger.info("Requisição para adicionar imagem temporária");

        try {
            // Obter usuário atual
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

            // Salvar arquivo
            String fileName = fileStorageService.storeFile(file);
            String fileUrl = "/uploads/images/" + fileName;

            // Criar entidade Imagem temporária (sem postagem)
            Imagem imagem = new Imagem();
            imagem.setId(UUID.randomUUID());
            imagem.setUrl(fileUrl);
            imagem.setDescription(description);
            // Não definir postagem ainda

            // Salvar no banco de dados
            Imagem savedImagem = imagemRepository.save(imagem);

            // Criar DTO para retorno
            ImagemDto imagemDto = new ImagemDto();
            imagemDto.setId(savedImagem.getId());
            imagemDto.setUrl(savedImagem.getUrl());
            imagemDto.setDescription(savedImagem.getDescription());

            return ResponseEntity.status(HttpStatus.CREATED).body(imagemDto);
        } catch (Exception e) {
            logger.error("Erro ao adicionar imagem temporária: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/temp/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<AnexoDto> addTempAnexo(
            @RequestParam("file") MultipartFile file) {

        logger.info("Requisição para adicionar anexo temporário");

        try {
            // Obter usuário atual
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

            // Salvar arquivo
            String fileName = fileStorageService.storeFile(file);
            String fileUrl = "/uploads/files/" + fileName;

            // Criar entidade Anexo temporária (sem postagem)
            Anexo anexo = new Anexo();
            anexo.setId(UUID.randomUUID());
            anexo.setNameFile(file.getOriginalFilename());
            anexo.setTypeFile(file.getContentType());
            anexo.setUrl(fileUrl);
            // Não definir postagem ainda

            // Salvar no banco de dados
            Anexo savedAnexo = anexoRepository.save(anexo);

            // Criar DTO para retorno
            AnexoDto anexoDto = new AnexoDto();
            anexoDto.setId(savedAnexo.getId());
            anexoDto.setNameFile(savedAnexo.getNameFile());
            anexoDto.setTypeFile(savedAnexo.getTypeFile());
            anexoDto.setUrl(savedAnexo.getUrl());

            return ResponseEntity.status(HttpStatus.CREATED).body(anexoDto);
        } catch (Exception e) {
            logger.error("Erro ao adicionar anexo temporário: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Adicione endpoints para associar uploads temporários a uma postagem
    @PostMapping("/{id}/associar-imagem/{imagemId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<ImagemDto> associarImagem(
            @PathVariable UUID id,
            @PathVariable UUID imagemId) {

        logger.info("Requisição para associar imagem {} à postagem {}", imagemId, id);

        try {
            // Verificar se a postagem existe
            Postagem postagem = postagemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada"));

            // Verificar se o usuário atual é o criador da postagem
            User currentUser = getCurrentUser();
            if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new IllegalStateException("Apenas o criador da postagem pode associar imagens");
            }

            // Buscar imagem
            Imagem imagem = imagemRepository.findById(imagemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Imagem não encontrada"));

            // Associar imagem à postagem
            imagem.setPostagem(postagem);
            postagem.getImagens().add(imagem);

            // Salvar
            Imagem savedImagem = imagemRepository.save(imagem);

            // Retornar DTO atualizado
            ImagemDto imagemDto = new ImagemDto();
            imagemDto.setId(savedImagem.getId());
            imagemDto.setPostagemId(postagem.getId());
            imagemDto.setUrl(savedImagem.getUrl());
            imagemDto.setDescription(savedImagem.getDescription());

            return ResponseEntity.ok(imagemDto);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Erro ao associar imagem: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/associar-anexo/{anexoId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<AnexoDto> associarAnexo(
            @PathVariable UUID id,
            @PathVariable UUID anexoId) {

        logger.info("Requisição para associar anexo {} à postagem {}", anexoId, id);

        try {
            // Verificar se a postagem existe
            Postagem postagem = postagemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada"));

            // Verificar se o usuário atual é o criador da postagem
            User currentUser = getCurrentUser();
            if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new IllegalStateException("Apenas o criador da postagem pode associar anexos");
            }

            // Buscar anexo
            Anexo anexo = anexoRepository.findById(anexoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Anexo não encontrado"));

            // Associar anexo à postagem
            anexo.setPostagem(postagem);
            postagem.getAnexos().add(anexo);

            // Salvar
            Anexo savedAnexo = anexoRepository.save(anexo);

            // Retornar DTO atualizado
            AnexoDto anexoDto = new AnexoDto();
            anexoDto.setId(savedAnexo.getId());
            anexoDto.setPostagemId(postagem.getId());
            anexoDto.setNameFile(savedAnexo.getNameFile());
            anexoDto.setTypeFile(savedAnexo.getTypeFile());
            anexoDto.setUrl(savedAnexo.getUrl());

            return ResponseEntity.ok(anexoDto);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Erro ao associar anexo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));
    }
}
