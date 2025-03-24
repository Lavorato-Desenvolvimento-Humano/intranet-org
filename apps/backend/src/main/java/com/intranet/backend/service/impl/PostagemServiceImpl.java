package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.FileStorageService;
import com.intranet.backend.service.PostagemService;
import com.intranet.backend.util.DTOMapperUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;

    @Override
    public Page<PostagemSummaryDto> getAllPostagens(Pageable pageable) {
        logger.info("Buscando todas as postagens paginadas");
        Page<Postagem> postagensPage = postagemRepository.findAllWithConvenioAndCreatedBy(pageable);
        return DTOMapperUtil.mapToPostagemSummaryDtoPage(postagensPage);
    }

    @Override
    public List<PostagemSummaryDto> getPostagensByConvenioId(UUID convenioId) {
        logger.info("Buscando postagens para o convênio com ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        List<Postagem> postagens = postagemRepository.findByConvenioIdOrderByCreatedAtDesc(convenioId);

        return postagens.stream()
                .map(DTOMapperUtil::mapToPostagemSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostagemSummaryDto> getPostagensByCurrentUser() {
        User currentUser = getCurrentUser();
        logger.info("Buscando postagens do usuário atual: {}", currentUser.getId());

        List<Postagem> postagens = postagemRepository.findByCreatedByIdOrderByCreatedAtDesc(currentUser.getId());

        return postagens.stream()
                .map(DTOMapperUtil::mapToPostagemSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PostagemDto getPostagemById(UUID id) {
        logger.info("Buscando postagem com ID: {}", id);

        Postagem postagem = postagemRepository.findByIdWithCreatedBy(id);
        if (postagem == null) {
            throw new ResourceNotFoundException("Postagem não encontrada com ID: " + id);
        }

        return DTOMapperUtil.mapToPostagemDto(postagem);
    }

    @Override
    @Transactional
    public PostagemDto createPostagem(PostagemCreateDto postagemCreateDto) {
        logger.info("Criando nova postagem: {}", postagemCreateDto.getTitle());

        Convenio convenio = convenioRepository.findById(postagemCreateDto.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + postagemCreateDto.getConvenioId()));

        User currentUser = getCurrentUser();

        Postagem postagem = new Postagem();
        postagem.setTitle(postagemCreateDto.getTitle());
        postagem.setText(postagemCreateDto.getText());
        postagem.setConvenio(convenio);
        postagem.setCreatedBy(currentUser);

        Postagem savedPostagem = postagemRepository.save(postagem);
        logger.info("Postagem criada com sucesso. ID: {}", savedPostagem.getId());

        return DTOMapperUtil.mapToPostagemDto(savedPostagem);
    }

    @Override
    @Transactional
    public PostagemDto updatePostagem(UUID id, PostagemCreateDto postagemUpdateDto) {
        logger.info("Atualizando postagem com ID: {}", id);

        Postagem postagem = postagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode atualizá-la");
        }

        // Verificar se o convênio existe, caso esteja sendo alterado
        if (!postagem.getConvenio().getId().equals(postagemUpdateDto.getConvenioId())) {
            Convenio convenio = convenioRepository.findById(postagemUpdateDto.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + postagemUpdateDto.getConvenioId()));
            postagem.setConvenio(convenio);
        }

        postagem.setTitle(postagemUpdateDto.getTitle());
        postagem.setText(postagemUpdateDto.getText());

        Postagem updatedPostagem = postagemRepository.save(postagem);
        logger.info("Postagem atualizada com sucesso. ID: {}", updatedPostagem.getId());

        return DTOMapperUtil.mapToPostagemDto(updatedPostagem);
    }

    @Override
    @Transactional
    public void deletePostagem(UUID id) {
        logger.info("Excluindo postagem com ID: {}", id);

        Postagem postagem = postagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode excluí-la");
        }

        // Excluir arquivos físicos das imagens e anexos
        for (Imagem imagem : postagem.getImagens()) {
            String fileName = DTOMapperUtil.extractFileNameFromUrl(imagem.getUrl());
            fileStorageService.deleteFile(fileName);
        }

        for (Anexo anexo : postagem.getAnexos()) {
            String fileName = DTOMapperUtil.extractFileNameFromUrl(anexo.getUrl());
            fileStorageService.deleteFile(fileName);
        }

        // A exclusão da postagem vai cascatear para imagens, anexos e tabelas
        postagemRepository.delete(postagem);
        logger.info("Postagem excluída com sucesso. ID: {}", id);
    }

    @Override
    @Transactional
    public ImagemDto addImagem(UUID postagemId, MultipartFile file, String description) {
        logger.info("Adicionando imagem à postagem com ID: {}", postagemId);

        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + postagemId));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode adicionar imagens");
        }

        // Salvar arquivo e obter URL
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/uploads/images/" + fileName;

        Imagem imagem = new Imagem();
        imagem.setPostagem(postagem);
        imagem.setUrl(fileUrl);
        imagem.setDescription(description);

        Imagem savedImagem = imagemRepository.save(imagem);
        postagem.getImagens().add(savedImagem);

        logger.info("Imagem adicionada com sucesso. ID: {}", savedImagem.getId());

        return DTOMapperUtil.mapToImagemDto(savedImagem);
    }

    @Override
    @Transactional
    public void deleteImagem(UUID id) {
        logger.info("Excluindo imagem com ID: {}", id);

        Imagem imagem = imagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagem não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!imagem.getPostagem().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode excluir imagens");
        }

        // Excluir arquivo físico
        String fileName = DTOMapperUtil.extractFileNameFromUrl(imagem.getUrl());
        fileStorageService.deleteFile(fileName);

        // Remover da lista de imagens da postagem
        imagem.getPostagem().getImagens().remove(imagem);

        // Excluir a imagem
        imagemRepository.delete(imagem);
        logger.info("Imagem excluída com sucesso. ID: {}", id);
    }

    @Override
    @Transactional
    public AnexoDto addAnexo(UUID postagemId, MultipartFile file) {
        logger.info("Adicionando anexo à postagem com ID: {}", postagemId);

        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + postagemId));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode adicionar anexos");
        }

        // Salvar arquivo e obter URL
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/uploads/files/" + fileName;

        Anexo anexo = new Anexo();
        anexo.setPostagem(postagem);
        anexo.setNameFile(file.getOriginalFilename());
        anexo.setTypeFile(file.getContentType());
        anexo.setUrl(fileUrl);

        Anexo savedAnexo = anexoRepository.save(anexo);
        postagem.getAnexos().add(savedAnexo);

        logger.info("Anexo adicionado com sucesso. ID: {}", savedAnexo.getId());

        return DTOMapperUtil.mapToAnexoDto(savedAnexo);
    }

    @Override
    @Transactional
    public void deleteAnexo(UUID id) {
        logger.info("Excluindo anexo com ID: {}", id);

        Anexo anexo = anexoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anexo não encontrado com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!anexo.getPostagem().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode excluir anexos");
        }

        // Excluir arquivo físico
        String fileName = DTOMapperUtil.extractFileNameFromUrl(anexo.getUrl());
        fileStorageService.deleteFile(fileName);

        // Remover da lista de anexos da postagem
        anexo.getPostagem().getAnexos().remove(anexo);

        // Excluir o anexo
        anexoRepository.delete(anexo);
        logger.info("Anexo excluído com sucesso. ID: {}", id);
    }

    @Override
    @Transactional
    public TabelaPostagemDto addTabelaPostagem(UUID postagemId, String conteudoJson) {
        logger.info("Adicionando tabela à postagem com ID: {}", postagemId);

        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada com ID: " + postagemId));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!postagem.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode adicionar tabelas");
        }

        TabelaPostagem tabelaPostagem = new TabelaPostagem();
        tabelaPostagem.setPostagem(postagem);
        tabelaPostagem.setConteudo(conteudoJson);

        TabelaPostagem savedTabela = tabelaPostagemRepository.save(tabelaPostagem);
        postagem.getTabelas().add(savedTabela);

        logger.info("Tabela adicionada com sucesso. ID: {}", savedTabela.getId());

        return DTOMapperUtil.mapToTabelaDto(savedTabela);
    }

    @Override
    @Transactional
    public TabelaPostagemDto updateTabelaPostagem(UUID id, String conteudoJson) {
        logger.info("Atualizando tabela com ID: {}", id);

        TabelaPostagem tabela = tabelaPostagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tabela não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!tabela.getPostagem().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode atualizar tabelas");
        }

        tabela.setConteudo(conteudoJson);

        TabelaPostagem updatedTabela = tabelaPostagemRepository.save(tabela);
        logger.info("Tabela atualizada com sucesso. ID: {}", updatedTabela.getId());

        return DTOMapperUtil.mapToTabelaDto(updatedTabela);
    }

    @Override
    @Transactional
    public void deleteTabelaPostagem(UUID id) {
        logger.info("Excluindo tabela com ID: {}", id);

        TabelaPostagem tabela = tabelaPostagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tabela não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da postagem
        User currentUser = getCurrentUser();
        if (!tabela.getPostagem().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Apenas o criador da postagem pode excluir tabelas");
        }

        // Remover da lista de tabelas da postagem
        tabela.getPostagem().getTabelas().remove(tabela);

        // Excluir a tabela
        tabelaPostagemRepository.delete(tabela);
        logger.info("Tabela excluída com sucesso. ID: {}", id);
    }

    // Método auxiliar para obter o usuário atual
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }
}