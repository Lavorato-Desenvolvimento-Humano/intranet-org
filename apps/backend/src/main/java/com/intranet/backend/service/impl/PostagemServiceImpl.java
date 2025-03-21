package com.intranet.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.PostagemService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostagemServiceImpl implements PostagemService {

    private static final Logger logger = LoggerFactory.getLogger(PostagemServiceImpl.class);

    private final PostagemRepository postagemRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final ImagemRepository imagemRepository;
    private final AnexoRepository anexoRepository;
    private final TabelaPostagemRepository tabelaPostagemRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<PostagemSimpleDto> getAllPostagens() {
        logger.info("Buscando todas as postagens");

        List<Postagem> postagens = postagemRepository.findAll();
        return postagens.stream()
                .map(this::convertToSimpleDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PostagemSimpleDto> getAllPostagens(Pageable pageable) {
        logger.info("Buscando todas as postagens paginadas");

        Page<Postagem> postagens = postagemRepository.findAll(pageable);
        return postagens.map(this::convertToSimpleDto);
    }

    @Override
    public PostagemDto getPostagemById(UUID id) {
        logger.info("Buscando postagem com ID: {}", id);

        try {
            // Buscar a postagem básica
            Postagem postagem = postagemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + id));

            // Carregar as coleções manualmente
            if (!Hibernate.isInitialized(postagem.getImagens())) {
                Hibernate.initialize(postagem.getImagens());
            }

            if (!Hibernate.isInitialized(postagem.getAnexos())) {
                Hibernate.initialize(postagem.getAnexos());
            }

            if (!Hibernate.isInitialized(postagem.getTabelas())) {
                Hibernate.initialize(postagem.getTabelas());
            }

            return convertToDto(postagem);
        } catch (Exception e) {
            logger.error("Erro ao buscar postagem com ID {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public List<PostagemSimpleDto> getPostagensByConvenioId(UUID convenioId) {
        logger.info("Buscando postagens para o convênio ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        List<Postagem> postagens = postagemRepository.findByConvenioId(convenioId);
        return postagens.stream()
                .map(this::convertToSimpleDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PostagemSimpleDto> getPostagensByConvenioId(UUID convenioId, Pageable pageable) {
        logger.info("Buscando postagens paginadas para o convênio ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        Page<Postagem> postagens = postagemRepository.findByConvenioId(convenioId, pageable);
        return postagens.map(this::convertToSimpleDto);
    }

    @Override
    @Transactional
    public PostagemDto createPostagem(PostagemCreateRequest request) {
        logger.info("Criando nova postagem: {}", request.getTitle());

        // Buscar o convênio
        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        // Buscar o usuário atual
        User currentUser = getCurrentUser();

        // Criar postagem
        Postagem postagem = new Postagem();
        postagem.setTitle(request.getTitle());
        postagem.setText(request.getText());
        postagem.setConvenio(convenio);
        postagem.setCreatedBy(currentUser);

        Postagem savedPostagem = postagemRepository.save(postagem);

        // Adicionar imagens se houver
        if (request.getImagens() != null && !request.getImagens().isEmpty()) {
            List<Imagem> imagens = request.getImagens().stream()
                    .map(imagemRequest -> {
                        Imagem imagem = new Imagem();
                        imagem.setPost(savedPostagem);
                        imagem.setUrl(imagemRequest.getUrl());
                        imagem.setDescription(imagemRequest.getDescription());
                        return imagem;
                    })
                    .collect(Collectors.toList());
            imagemRepository.saveAll(imagens);
        }

        // Adicionar anexos se houver
        if (request.getAnexos() != null && !request.getAnexos().isEmpty()) {
            List<Anexo> anexos = request.getAnexos().stream()
                    .map(anexoRequest -> {
                        Anexo anexo = new Anexo();
                        anexo.setPost(savedPostagem);
                        anexo.setNameFile(anexoRequest.getNameFile());
                        anexo.setTypeFile(anexoRequest.getTypeFile());
                        anexo.setUrl(anexoRequest.getUrl());
                        return anexo;
                    })
                    .collect(Collectors.toList());
            anexoRepository.saveAll(anexos);
        }

        // Adicionar tabelas se houver
        if (request.getTabelas() != null && !request.getTabelas().isEmpty()) {
            List<TabelaPostagem> tabelas = request.getTabelas().stream()
                    .map(tabelaRequest -> {
                        TabelaPostagem tabela = new TabelaPostagem();
                        tabela.setPost(savedPostagem);
                        // Verificar se o conteúdo é uma string ou um objeto JSON
                        if (tabelaRequest.getConteudo() instanceof String) {
                            tabela.setConteudo(tabelaRequest.getConteudo());
                        } else {
                            // Converter objeto para string JSON
                            try {
                                ObjectMapper objectMapper = new ObjectMapper();
                                tabela.setConteudo(objectMapper.writeValueAsString(tabelaRequest.getConteudo()));
                            } catch (Exception e) {
                                logger.error("Erro ao converter conteúdo da tabela para JSON", e);
                                throw new RuntimeException("Erro ao processar tabela", e);
                            }
                        }
                        return tabela;
                    })
                    .collect(Collectors.toList());
            tabelaPostagemRepository.saveAll(tabelas);
        }

        // Buscar a postagem com todos os detalhes para retornar
        return getPostagemById(savedPostagem.getId());
    }

    @Override
    @Transactional
    public PostagemDto updatePostagem(UUID id, PostagemUpdateRequest request) {
        logger.info("Atualizando postagem com ID: {}", id);

        Postagem postagem = postagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + id));

        // Atualizar campos básicos se fornecidos
        if (request.getTitle() != null) {
            postagem.setTitle(request.getTitle());
        }

        if (request.getText() != null) {
            postagem.setText(request.getText());
        }

        // Atualizar convênio se fornecido
        if (request.getConvenioId() != null) {
            Convenio convenio = convenioRepository.findById(request.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));
            postagem.setConvenio(convenio);
        }

        Postagem updatedPostagem = postagemRepository.save(postagem);

        // Atualizar imagens se fornecido
        if (request.getImagens() != null) {
            // Remover imagens existentes
            imagemRepository.deleteByPostId(id);

            // Adicionar novas imagens
            if (!request.getImagens().isEmpty()) {
                List<Imagem> imagens = request.getImagens().stream()
                        .map(imagemRequest -> {
                            Imagem imagem = new Imagem();
                            imagem.setPost(updatedPostagem);
                            imagem.setUrl(imagemRequest.getUrl());
                            imagem.setDescription(imagemRequest.getDescription());
                            return imagem;
                        })
                        .collect(Collectors.toList());
                imagemRepository.saveAll(imagens);
            }
        }

        // Atualizar anexos se fornecido
        if (request.getAnexos() != null) {
            // Remover anexos existentes
            anexoRepository.deleteByPostId(id);

            // Adicionar novos anexos
            if (!request.getAnexos().isEmpty()) {
                List<Anexo> anexos = request.getAnexos().stream()
                        .map(anexoRequest -> {
                            Anexo anexo = new Anexo();
                            anexo.setPost(updatedPostagem);
                            anexo.setNameFile(anexoRequest.getNameFile());
                            anexo.setTypeFile(anexoRequest.getTypeFile());
                            anexo.setUrl(anexoRequest.getUrl());
                            return anexo;
                        })
                        .collect(Collectors.toList());
                anexoRepository.saveAll(anexos);
            }
        }

        // Atualizar tabelas se fornecido
        if (request.getTabelas() != null) {
            // Remover tabelas existentes
            tabelaPostagemRepository.deleteByPostId(id);

            // Adicionar novas tabelas
            if (!request.getTabelas().isEmpty()) {
                List<TabelaPostagem> tabelas = request.getTabelas().stream()
                        .map(tabelaRequest -> {
                            TabelaPostagem tabela = new TabelaPostagem();
                            tabela.setPost(updatedPostagem);
                            tabela.setConteudo(tabelaRequest.getConteudo());
                            return tabela;
                        })
                        .collect(Collectors.toList());
                tabelaPostagemRepository.saveAll(tabelas);
            }
        }

        // Buscar a postagem com todos os detalhes para retornar
        return getPostagemById(updatedPostagem.getId());
    }

    @Override
    @Transactional
    public void deletePostagem(UUID id) {
        logger.info("Excluindo postagem com ID: {}", id);

        if (!postagemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Postagem não encontrada com ID: " + id);
        }

        postagemRepository.deleteById(id);
    }

    @Override
    public List<PostagemSimpleDto> getRecentPostagens(int limit) {
        logger.info("Buscando as {} postagens mais recentes", limit);

        Pageable pageable = PageRequest.of(0, limit);
        List<Postagem> postagens = postagemRepository.findRecentPostagens(pageable);

        return postagens.stream()
                .map(this::convertToSimpleDto)
                .collect(Collectors.toList());
    }

    // Método auxiliar para obter o usuário atual
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        return userRepository.findByEmail(currentUserName)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    @Transactional
    @Override
    public TabelaPostagemDto addTabelaToPostagem(UUID postagemId, Object conteudo) {
        logger.info("Adicionando tabela à postagem ID: {}", postagemId);
        logger.debug("Conteúdo recebido: {}", conteudo);

        try {
            Postagem postagem = postagemRepository.findById(postagemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + postagemId));

            TabelaPostagem tabela = new TabelaPostagem();
            tabela.setPost(postagem);

            // Determinar o tipo do conteúdo
            if (conteudo == null) {
                logger.warn("Conteúdo da tabela é nulo, usando objeto vazio");
                tabela.setConteudo("{}");
            }
            else if (conteudo instanceof String) {
                logger.debug("Conteúdo da tabela é String: {}", conteudo);
                // Verificar se a string é um JSON válido
                try {
                    new ObjectMapper().readTree((String) conteudo);
                    tabela.setConteudo((String) conteudo);
                } catch (Exception e) {
                    logger.warn("Conteúdo não é JSON válido, tentando converter", e);
                    // Se não for JSON válido, tenta converter para JSON string
                    try {
                        tabela.setConteudo(new ObjectMapper().writeValueAsString(conteudo));
                    } catch (Exception ex) {
                        logger.error("Falha ao converter conteúdo para JSON", ex);
                        tabela.setConteudo("{}");
                    }
                }
            }
            else {
                logger.debug("Conteúdo da tabela não é String, convertendo");
                // Objeto não-String, converter para JSON
                try {
                    tabela.setConteudo(new ObjectMapper().writeValueAsString(conteudo));
                } catch (Exception e) {
                    logger.error("Erro ao converter objeto para JSON", e);
                    tabela.setConteudo("{}");
                }
            }

            TabelaPostagem savedTabela = tabelaPostagemRepository.save(tabela);
            logger.info("Tabela adicionada com sucesso, ID: {}", savedTabela.getId());

            return convertToTabelaDto(savedTabela);
        } catch (Exception e) {
            logger.error("Erro ao adicionar tabela à postagem {}: {}", postagemId, e.getMessage(), e);
            throw e;
        }
    }

    // Métodos auxiliares para conversão

    private PostagemSimpleDto convertToSimpleDto(Postagem postagem) {
        String createdByName = postagem.getCreatedBy() != null ?
                postagem.getCreatedBy().getFullName() : "Desconhecido";

        boolean hasImagens = postagem.getImagens() != null && !postagem.getImagens().isEmpty();
        boolean hasTabelas = postagem.getTabelas() != null && !postagem.getTabelas().isEmpty();
        boolean hasAnexos = postagem.getAnexos() != null && !postagem.getAnexos().isEmpty();

        return new PostagemSimpleDto(
                postagem.getId(),
                postagem.getTitle(),
                createdByName,
                postagem.getCreatedAt(),
                hasImagens,
                hasTabelas,
                hasAnexos
        );
    }

    private PostagemDto convertToDto(Postagem postagem) {
        List<ImagemDto> imagemDtos = new ArrayList<>();
        if (postagem.getImagens() != null) {
            imagemDtos = postagem.getImagens().stream()
                    .map(this::convertToImagemDto)
                    .collect(Collectors.toList());
        }

        List<AnexoDto> anexoDtos = new ArrayList<>();
        if (postagem.getAnexos() != null) {
            anexoDtos = postagem.getAnexos().stream()
                    .map(this::convertToAnexoDto)
                    .collect(Collectors.toList());
        }

        List<TabelaPostagemDto> tabelaDtos = new ArrayList<>();
        if (postagem.getTabelas() != null) {
            tabelaDtos = postagem.getTabelas().stream()
                    .map(this::convertToTabelaDto)
                    .collect(Collectors.toList());
        }

        String convenioName = postagem.getConvenio() != null ?
                postagem.getConvenio().getName() : "Desconhecido";

        String createdByName = postagem.getCreatedBy() != null ?
                postagem.getCreatedBy().getFullName() : "Desconhecido";

        UUID convenioId = postagem.getConvenio() != null ?
                postagem.getConvenio().getId() : null;

        UUID createdById = postagem.getCreatedBy() != null ?
                postagem.getCreatedBy().getId() : null;

        return new PostagemDto(
                postagem.getId(),
                postagem.getTitle(),
                postagem.getText(),
                convenioId,
                convenioName,
                createdById,
                createdByName,
                postagem.getCreatedAt(),
                postagem.getUpdatedAt(),
                imagemDtos,
                anexoDtos,
                tabelaDtos
        );
    }

    private ImagemDto convertToImagemDto(Imagem imagem) {
        return new ImagemDto(
                imagem.getId(),
                imagem.getUrl(),
                imagem.getDescription()
        );
    }

    private AnexoDto convertToAnexoDto(Anexo anexo) {
        return new AnexoDto(
                anexo.getId(),
                anexo.getNameFile(),
                anexo.getTypeFile(),
                anexo.getUrl()
        );
    }

    private TabelaPostagemDto convertToTabelaDto(TabelaPostagem tabela) {
        // Verificar e sanitizar o conteúdo JSON
        String conteudo = tabela.getConteudo();
        if (conteudo == null) {
            conteudo = "{}";
        }

        // Verifica se o conteúdo é JSON válido
        try {
            new ObjectMapper().readTree(conteudo);
        } catch (Exception e) {
            logger.warn("Conteúdo da tabela ID {} não é JSON válido: {}", tabela.getId(), e.getMessage());
            conteudo = "{}";
        }

        return new TabelaPostagemDto(
                tabela.getId(),
                conteudo
        );
    }
}