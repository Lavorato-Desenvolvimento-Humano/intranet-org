package com.intranet.backend.service.impl;

import com.intranet.backend.dto.ConvenioCreateDto;
import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.PostagemSummaryDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Convenio;
import com.intranet.backend.model.Postagem;
import com.intranet.backend.repository.ConvenioRepository;
import com.intranet.backend.repository.PostagemRepository;
import com.intranet.backend.service.ConvenioService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConvenioServiceImpl implements ConvenioService {

    private static final Logger logger = LoggerFactory.getLogger(ConvenioServiceImpl.class);

    private final ConvenioRepository convenioRepository;
    private final PostagemRepository postagemRepository;

    @Override
    public List<ConvenioDto> getAllConvenios() {
        logger.info("Buscando todos os convênios");
        try {
            List<Convenio> convenios = convenioRepository.findAllOrderedByName();
            logger.info("Encontrados {} convênios no banco de dados", convenios.size());

            return convenios.stream().map(convenio -> {
                try {
                    long postagemCount = postagemRepository.countByConvenioId(convenio.getId());
                    return mapToDto(convenio, postagemCount);
                } catch (Exception e) {
                    logger.error("Erro ao contar postagens para o convênio {}: {}", convenio.getId(), e.getMessage(), e);
                    // Retornar o convênio mesmo sem a contagem de postagens
                    return mapToDto(convenio, 0);
                }
            }).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Erro ao buscar convênios: {}", e.getMessage(), e);
            // Retorna uma lista vazia em vez de lançar exceção para evitar quebrar a UI
            return new ArrayList<>();
        }
    }

    @Override
    public ConvenioDto getConvenioById(UUID id) {
        logger.info("Buscando convênio com ID: {}", id);
        Convenio convenio = convenioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + id));

        long postagemCount = postagemRepository.countByConvenioId(id);
        return mapToDto(convenio, postagemCount);
    }

    @Override
    @Transactional
    public ConvenioDto createConvenio(ConvenioCreateDto convenioCreateDto) {
        logger.info("Criando novo convênio: {}", convenioCreateDto.getName());

        // Verificar se já existe um convênio com o mesmo nome
        if (convenioRepository.findByName(convenioCreateDto.getName()).isPresent()) {
            throw new IllegalArgumentException("Já existe um convênio com o nome: " + convenioCreateDto.getName());
        }

        Convenio convenio = new Convenio();
        convenio.setName(convenioCreateDto.getName());
        convenio.setDescription(convenioCreateDto.getDescription());

        Convenio savedConvenio = convenioRepository.save(convenio);
        logger.info("Convênio criado com sucesso. ID: {}", savedConvenio.getId());

        return mapToDto(savedConvenio, 0);
    }

    @Override
    @Transactional
    public ConvenioDto updateConvenio(UUID id, ConvenioCreateDto convenioCreateDto) {
        logger.info("Atualizando convênio com ID: {}", id);

        Convenio convenio = convenioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + id));

        // Verificar se o novo nome já está em uso (por outro convênio)
        if (!convenio.getName().equals(convenioCreateDto.getName()) &&
                convenioRepository.findByName(convenioCreateDto.getName()).isPresent()) {
            throw new IllegalArgumentException("Já existe um convênio com o nome: " + convenioCreateDto.getName());
        }

        convenio.setName(convenioCreateDto.getName());
        convenio.setDescription(convenioCreateDto.getDescription());

        Convenio updatedConvenio = convenioRepository.save(convenio);
        logger.info("Convênio atualizado com sucesso. ID: {}", updatedConvenio.getId());

        long postagemCount = postagemRepository.countByConvenioId(id);
        return mapToDto(updatedConvenio, postagemCount);
    }

    @Override
    @Transactional
    public void deleteConvenio(UUID id) {
        logger.info("Excluindo convênio com ID: {}", id);

        if (!convenioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + id);
        }

        // As postagens e seus itens relacionados serão excluídos automaticamente devido à configuração CASCADE
        convenioRepository.deleteById(id);
        logger.info("Convênio excluído com sucesso. ID: {}", id);
    }

    @Override
    public List<PostagemSummaryDto> getPostagensByConvenioId(UUID convenioId) {
        logger.info("Buscando postagens para o convênio com ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        List<Postagem> postagens = postagemRepository.findByConvenioIdOrderByCreatedAtDesc(convenioId);

        return postagens.stream().map(postagem -> {
            PostagemSummaryDto dto = new PostagemSummaryDto();
            dto.setId(postagem.getId());
            dto.setTitle(postagem.getTitle());
            dto.setConvenioId(postagem.getConvenio().getId());
            dto.setConvenioName(postagem.getConvenio().getName());
            dto.setCreatedById(postagem.getCreatedBy().getId());
            dto.setCreatedByName(postagem.getCreatedBy().getFullName());
            dto.setCreatedAt(postagem.getCreatedAt());
            dto.setHasImagens(!postagem.getImagens().isEmpty());
            dto.setHasAnexos(!postagem.getAnexos().isEmpty());
            dto.setHasTabelas(!postagem.getTabelas().isEmpty());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public long countPostagensByConvenioId(UUID convenioId) {
        logger.info("Contando postagens para o convênio com ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        return postagemRepository.countByConvenioId(convenioId);
    }

    // Método auxiliar para mapear entidade para DTO
    private ConvenioDto mapToDto(Convenio convenio, long postagemCount) {
        ConvenioDto dto = new ConvenioDto();
        dto.setId(convenio.getId());
        dto.setName(convenio.getName());
        dto.setDescription(convenio.getDescription());
        dto.setCreatedAt(convenio.getCreatedAt());
        dto.setUpdatedAt(convenio.getUpdatedAt());
        dto.setPostagemCount(postagemCount);
        return dto;
    }
}