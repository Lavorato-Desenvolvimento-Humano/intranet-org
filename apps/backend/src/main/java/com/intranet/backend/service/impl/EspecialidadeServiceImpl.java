package com.intranet.backend.service.impl;

import com.intranet.backend.dto.EspecialidadeCreateRequest;
import com.intranet.backend.dto.EspecialidadeDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Especialidade;
import com.intranet.backend.repository.EspecialidadeRepository;
import com.intranet.backend.service.EspecialidadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EspecialidadeServiceImpl implements EspecialidadeService {
    private final EspecialidadeRepository especialidadeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EspecialidadeDto> findAll() {
        return especialidadeRepository.findAllByOrderByNomeAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspecialidadeDto> findAtivas() {
        return especialidadeRepository.findAllByAtivoTrueOrderByNomeAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EspecialidadeDto findById(UUID id) {
        Especialidade especialidade = especialidadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade não encontrada com ID: " + id));
        return toDto(especialidade);
    }

    @Override
    @Transactional
    public EspecialidadeDto create(EspecialidadeCreateRequest request) {
        if (especialidadeRepository.existsByNome(request.getNome())) {
            throw new IllegalArgumentException("Já existe uma especialidade com o nome: " + request.getNome());
        }

        Especialidade especialidade = new Especialidade();
        especialidade.setNome(request.getNome().toUpperCase()); // Padronizando em maiúsculo
        especialidade.setDescricao(request.getDescricao());
        especialidade.setAtivo(true);

        return toDto(especialidadeRepository.save(especialidade));
    }

    @Override
    @Transactional
    public EspecialidadeDto update(UUID id, EspecialidadeCreateRequest request) {
        Especialidade especialidade = especialidadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade não encontrada com ID: " + id));

        // Verifica se o nome mudou e se já existe outro registro com esse nome
        if (!especialidade.getNome().equalsIgnoreCase(request.getNome()) &&
                especialidadeRepository.existsByNomeAndIdNot(request.getNome(), id)) {
            throw new IllegalArgumentException("Já existe outra especialidade com o nome: " + request.getNome());
        }

        especialidade.setNome(request.getNome().toUpperCase());
        especialidade.setDescricao(request.getDescricao());

        if (request.getAtivo() != null) {
            especialidade.setAtivo(request.getAtivo());
        }

        return toDto(especialidadeRepository.save(especialidade));
    }

    @Override
    @Transactional
    public void toggleAtivo(UUID id) {
        Especialidade especialidade = especialidadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade não encontrada com ID: " + id));

        especialidade.setAtivo(!especialidade.getAtivo());
        especialidadeRepository.save(especialidade);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!especialidadeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Especialidade não encontrada com ID: " + id);
        }
        // Aqui você pode adicionar validações extras, como verificar se existem médicos vinculados
        especialidadeRepository.deleteById(id);
    }

    // Método auxiliar para converter Entity para DTO
    private EspecialidadeDto toDto(Especialidade entity) {
        return EspecialidadeDto.builder()
                .id(entity.getId())
                .nome(entity.getNome())
                .descricao(entity.getDescricao())
                .ativo(entity.getAtivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
