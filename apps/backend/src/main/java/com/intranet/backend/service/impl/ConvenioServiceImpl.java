package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Convenio;
import com.intranet.backend.model.Postagem;
import com.intranet.backend.repository.ConvenioRepository;
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

    @Override
    public List<ConvenioSimpleDto> getAllConvenios() {
        logger.info("Buscando todos os convênios");

        List<Convenio> convenios = convenioRepository.findAll();
        return convenios.stream()
                .map(this::convertToSimpleDto)
                .collect(Collectors.toList());
    }

    @Override
    public ConvenioDto getConvenioById(UUID id) {
        logger.info("Buscando convênio com ID: {}", id);

        Convenio convenio = convenioRepository.findByIdWithPostagens(id)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + id));

        return convertToDto(convenio);
    }

    @Override
    @Transactional
    public ConvenioDto createConvenio(ConvenioCreateRequest request) {
        logger.info("Criando novo convênio: {}", request.getName());

        Convenio convenio = new Convenio();
        convenio.setName(request.getName());
        convenio.setDescription(request.getDescription());

        Convenio savedConvenio = convenioRepository.save(convenio);

        return convertToDto(savedConvenio);
    }

    @Override
    @Transactional
    public ConvenioDto updateConvenio(UUID id, ConvenioUpdateRequest request) {
        logger.info("Atualizando convênio com ID: {}", id);

        Convenio convenio = convenioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + id));

        if (request.getName() != null) {
            convenio.setName(request.getName());
        }

        if (request.getDescription() != null) {
            convenio.setDescription(request.getDescription());
        }

        Convenio updatedConvenio = convenioRepository.save(convenio);

        return convertToDto(updatedConvenio);
    }

    @Override
    @Transactional
    public void deleteConvenio(UUID id) {
        logger.info("Excluindo convênio com ID: {}", id);

        if (!convenioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + id);
        }

        convenioRepository.deleteById(id);
    }

    @Override
    public List<ConvenioDto> getConveniosWithPostagens() {
        logger.info("Buscando todos os convênios com suas postagens");

        List<Convenio> convenios = convenioRepository.findAllWithPostagens();
        return convenios.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Métodos auxiliares para conversão

    private ConvenioSimpleDto convertToSimpleDto(Convenio convenio) {
        return new ConvenioSimpleDto(
                convenio.getId(),
                convenio.getName(),
                convenio.getDescription(),
                convenio.getPostagens() != null ? convenio.getPostagens().size() : 0
        );
    }

    private ConvenioDto convertToDto(Convenio convenio) {
        List<PostagemSimpleDto> postagemDtos = new ArrayList<>();

        if (convenio.getPostagens() != null) {
            postagemDtos = convenio.getPostagens().stream()
                    .map(this::convertToPostagemSimpleDto)
                    .collect(Collectors.toList());
        }

        return new ConvenioDto(
                convenio.getId(),
                convenio.getName(),
                convenio.getDescription(),
                convenio.getCreatedAt(),
                convenio.getUpdatedAt(),
                postagemDtos,
                postagemDtos.size()
        );
    }

    private PostagemSimpleDto convertToPostagemSimpleDto(Postagem postagem) {
        return new PostagemSimpleDto(
                postagem.getId(),
                postagem.getTitle(),
                postagem.getCreatedBy() != null ? postagem.getCreatedBy().getFullName() : "Desconhecido",
                postagem.getCreatedAt(),
                postagem.getImagens() != null && !postagem.getImagens().isEmpty(),
                postagem.getTabelas() != null && !postagem.getTabelas().isEmpty(),
                postagem.getAnexos() != null && !postagem.getAnexos().isEmpty()
        );
    }
}