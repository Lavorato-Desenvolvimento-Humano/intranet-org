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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private final EquipeRepository equipeRepository;

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
    public List<PostagemSummaryDto> getPostagensByTipoDestino(String tipoDestino) {
        logger.info("Buscando postagens do tipo: {}", tipoDestino);

        // Validar tipo de destino
        if (!Arrays.asList("geral", "equipe", "convenio").contains(tipoDestino)) {
            throw new IllegalArgumentException("Tipo de destino inválido: " + tipoDestino);
        }

        List<Postagem> postagens = postagemRepository.findByTipoDestinoOrderByCreatedAtDesc(tipoDestino);

        return postagens.stream()
                .map(DTOMapperUtil::mapToPostagemSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostagemSummaryDto> getPostagensByEquipeId(UUID equipeId) {
        logger.info("Buscando postagens para a equipe com ID: {}", equipeId);

        if (!equipeRepository.existsById(equipeId)) {
            throw new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId);
        }

        List<Postagem> postagens = postagemRepository.findByTipoDestinoAndEquipeIdOrderByCreatedAtDesc("equipe", equipeId);

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

        User currentUser = getCurrentUser();
        Postagem postagem = new Postagem();
        postagem.setTitle(postagemCreateDto.getTitle());
        postagem.setText(postagemCreateDto.getText());
        postagem.setCreatedBy(currentUser);

        // Definir o tipo de destino
        String tipoDestino = postagemCreateDto.getTipoDestino();
        postagem.setTipoDestino(tipoDestino);

        // Configurar o destino com base no tipo
        switch (tipoDestino) {
            case "convenio":
                UUID convenioId = postagemCreateDto.getConvenioId();
                if (convenioId == null) {
                    throw new IllegalArgumentException("O ID do convênio é obrigatório para postagens de tipo 'convenio'");
                }
                Convenio convenio = convenioRepository.findById(convenioId)
                        .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId));
                postagem.setConvenio(convenio);
                break;

            case "equipe":
                UUID equipeId = postagemCreateDto.getEquipeId();
                if (equipeId == null) {
                    throw new IllegalArgumentException("O ID da equipe é obrigatório para postagens de tipo 'equipe'");
                }
                Equipe equipe = equipeRepository.findById(equipeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId));
                postagem.setEquipe(equipe);
                break;

            case "geral":
                // Não precisa de configuração adicional
                break;

            default:
                throw new IllegalArgumentException("Tipo de destino inválido: " + tipoDestino);
        }

        Postagem savedPostagem = postagemRepository.save(postagem);
        logger.info("Postagem criada com sucesso. ID: {}", savedPostagem.getId());

        associarImagensTemporarias(savedPostagem, postagemCreateDto.getText());

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

//        // Verificar se o convênio existe, caso esteja sendo alterado
//        if (!postagem.getConvenio().getId().equals(postagemUpdateDto.getConvenioId())) {
//            Convenio convenio = convenioRepository.findById(postagemUpdateDto.getConvenioId())
//                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + postagemUpdateDto.getConvenioId()));
//            postagem.setConvenio(convenio);
//        }

        String tipoDestino = postagemUpdateDto.getTipoDestino();
        postagem.setTipoDestino(tipoDestino);

        //Resetar os campos de destino primeiro
        postagem.setConvenio(null);
        postagem.setEquipe(null);

        // Configurar o destino com base no tipo
        switch (tipoDestino) {
            case "convenio":
                UUID convenioId = postagemUpdateDto.getConvenioId();
                if (convenioId == null) {
                    throw new IllegalArgumentException("O ID do convênio é obrigatório para postagens de tipo 'convenio'");
                }
                Convenio convenio = convenioRepository.findById(convenioId)
                        .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId));
                postagem.setConvenio(convenio);
                break;

            case "equipe":
                UUID equipeId = postagemUpdateDto.getEquipeId();
                if (equipeId == null) {
                    throw new IllegalArgumentException("O ID da equipe é obrigatório para postagens de tipo 'equipe'");
                }
                Equipe equipe = equipeRepository.findById(equipeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId));
                postagem.setEquipe(equipe);
                break;

            case "geral":
                // Não precisa de configuração adicional
                break;

            default:
                throw new IllegalArgumentException("Tipo de destino inválido: " + tipoDestino);
        }

        postagem.setTitle(postagemUpdateDto.getTitle());
        postagem.setText(postagemUpdateDto.getText());

        Postagem updatedPostagem = postagemRepository.save(postagem);
        logger.info("Postagem atualizada com sucesso. ID: {}", updatedPostagem.getId());

        associarImagensTemporarias(updatedPostagem, postagemUpdateDto.getText());

        return DTOMapperUtil.mapToPostagemDto(updatedPostagem);
    }

    /**
     * Obtém todas as postagens visíveis para o usuário atual, incluindo:
     * - Postagens do tipo 'geral' (visíveis para todos)
     * - Postagens do tipo 'convenio' (visíveis para todos)
     * - Postagens do tipo 'equipe' das equipes às quais o usuário pertence
     *
     * @return Lista de DTOs das postagens visíveis para o usuário atual
     */
    @Override
    @Transactional(readOnly = true)
    public List<PostagemSummaryDto> getPostagensVisibleToCurrentUser() {
        User currentUser = getCurrentUser();
        logger.info("Buscando postagens visíveis para o usuário: {}", currentUser.getId());

        // Buscar postagens visíveis para o usuário atual:
        // Como todas as postagens de convênios são visíveis para todos, não é necessário
        // passar o convenioId como parâmetro. O parâmetro pode ser null ou removido da query.
        List<Postagem> postagens = postagemRepository.findVisibleToUserOrderByCreatedAtDesc(currentUser.getId());

        return postagens.stream()
                .map(DTOMapperUtil::mapToPostagemSummaryDto)
                .collect(Collectors.toList());
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

    // Método a ser adicionado no PostagemService após salvar uma postagem
    private void associarImagensTemporarias(Postagem postagem, String conteudoHtml) {
        // Usar regex ou parser HTML para extrair URLs de imagens
        Pattern pattern = Pattern.compile("<img[^>]+src=\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(conteudoHtml);

        while (matcher.find()) {
            String imageUrl = matcher.group(1);
            // Extrair nome do arquivo da URL
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            // Buscar imagens temporárias com esta URL
            List<Imagem> imagens = imagemRepository.findByUrlContaining(filename);

            // Associar cada imagem encontrada à postagem
            for (Imagem imagem : imagens) {
                if (imagem.getPostagem() == null) {
                    imagem.setPostagem(postagem);
                    imagemRepository.save(imagem);
                }
            }
        }
    }

    /**
     * Associa um anexo temporário a uma postagem
     */
    @Transactional
    public AnexoDto associarAnexo(UUID postagemId, UUID anexoId) {
        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new ResourceNotFoundException("Postagem não encontrada"));

        Anexo anexo = anexoRepository.findById(anexoId)
                .orElseThrow(() -> new ResourceNotFoundException("Anexo não encontrado"));

        // Associar anexo à postagem
        anexo.setPostagem(postagem);
        postagem.getAnexos().add(anexo);

        // Salvar as alterações
        Anexo savedAnexo = anexoRepository.save(anexo);

        return DTOMapperUtil.mapToAnexoDto(savedAnexo);
    }


    // Método auxiliar para obter o usuário atual
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }
}