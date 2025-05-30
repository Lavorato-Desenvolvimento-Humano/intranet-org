package com.intranet.backend.service.impl;

import com.intranet.backend.dto.TabelaValoresCreateDto;
import com.intranet.backend.dto.TabelaValoresDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Convenio;
import com.intranet.backend.model.TabelaValores;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.ConvenioRepository;
import com.intranet.backend.repository.TabelaValoresRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.TabelaValoresService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TabelaValoresServiceImpl implements TabelaValoresService {

    private static final Logger logger = LoggerFactory.getLogger(TabelaValoresServiceImpl.class);

    private final TabelaValoresRepository tabelaValoresRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;

    @Override
    public List<TabelaValoresDto> getTabelasByConvenioId(UUID convenioId) {
        logger.info("Buscando tabelas para o convênio com ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        List<TabelaValores> tabelas = tabelaValoresRepository.findByConvenioIdOrderByNomeAsc(convenioId);

        return tabelas.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<TabelaValoresDto> getAllTabelas(Pageable pageable) {
        logger.info("Buscando todas as tabelas paginadas");

        Page<TabelaValores> tabelasPage = tabelaValoresRepository.findAllWithConvenioAndCreatedBy(pageable);

        return tabelasPage.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public TabelaValoresDto getTabelaById(UUID id) {
        logger.info("Buscando tabela com ID: {}", id);

        TabelaValores tabela = tabelaValoresRepository.findByIdWithConvenioAndCreatedBy(id);
        if (tabela == null) {
            throw new ResourceNotFoundException("Tabela não encontrada com ID: " + id);
        }

        return mapToDto(tabela);
    }

    @Override
    public List<TabelaValoresDto> getTabelasByCurrentUser() {
        User currentUser = getCurrentUser();
        logger.info("Buscando tabelas do usuário atual: {}", currentUser.getId());

        List<TabelaValores> tabelas = tabelaValoresRepository.findByCreatedByIdOrderByCreatedAtDesc(currentUser.getId());

        return tabelas.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TabelaValoresDto createTabela(TabelaValoresCreateDto tabelaCreateDto) {
        logger.info("Criando nova tabela de valores: {}", tabelaCreateDto.getNome());

        Convenio convenio = convenioRepository.findById(tabelaCreateDto.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + tabelaCreateDto.getConvenioId()));

        User currentUser = getCurrentUser();

        TabelaValores tabela = new TabelaValores();
        tabela.setNome(tabelaCreateDto.getNome());
        tabela.setDescricao(tabelaCreateDto.getDescricao());
        tabela.setConteudo(tabelaCreateDto.getConteudo());
        tabela.setConvenio(convenio);
        tabela.setCreatedBy(currentUser);

        TabelaValores savedTabela = tabelaValoresRepository.save(tabela);
        logger.info("Tabela de valores criada com sucesso. ID: {}", savedTabela.getId());

        return mapToDto(savedTabela);
    }

    @Override
    @Transactional
    public TabelaValoresDto updateTabela(UUID id, TabelaValoresCreateDto tabelaUpdateDto) {
        logger.info("Atualizando tabela de valores com ID: {}", id);

        TabelaValores tabela = tabelaValoresRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tabela não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da tabela ou um administrador
        User currentUser = getCurrentUser();

        // Usar o método do repositório em vez de acessar a coleção diretamente
        List<String> userRoles = userRepository.findRoleNamesByUserId(currentUser.getId());
        boolean isAdmin = userRoles.stream()
                .anyMatch(role -> role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("ROLE_ADMIN"));

        if (!tabela.getCreatedBy().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new IllegalStateException("Apenas o criador da tabela ou um administrador pode atualizá-la");
        }

        // Verificar se o convênio existe, caso esteja sendo alterado
        if (!tabela.getConvenio().getId().equals(tabelaUpdateDto.getConvenioId())) {
            Convenio convenio = convenioRepository.findById(tabelaUpdateDto.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + tabelaUpdateDto.getConvenioId()));
            tabela.setConvenio(convenio);
        }

        try {
            new ObjectMapper().readTree(tabelaUpdateDto.getConteudo());
        } catch (Exception e) {
            throw new IllegalArgumentException("O conteúdo da tabela não é um JSON válido: " + e.getMessage());
        }

        tabela.setNome(tabelaUpdateDto.getNome());
        tabela.setDescricao(tabelaUpdateDto.getDescricao());
        tabela.setConteudo(tabelaUpdateDto.getConteudo());

        TabelaValores updatedTabela = tabelaValoresRepository.save(tabela);
        logger.info("Tabela de valores atualizada com sucesso. ID: {}", updatedTabela.getId());

        return mapToDto(updatedTabela);
    }

    @Override
    @Transactional
    public void deleteTabela(UUID id) {
        logger.info("Excluindo tabela de valores com ID: {}", id);

        TabelaValores tabela = tabelaValoresRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tabela não encontrada com ID: " + id));

        // Verificar se o usuário atual é o criador da tabela ou um administrador
        User currentUser = getCurrentUser();

        // Usar o método do repositório em vez de acessar a coleção diretamente
        List<String> userRoles = userRepository.findRoleNamesByUserId(currentUser.getId());
        boolean isAdmin = userRoles.stream()
                .anyMatch(role -> role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("ROLE_ADMIN"));

        if (!tabela.getCreatedBy().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new IllegalStateException("Apenas o criador da tabela ou um administrador pode excluí-la");
        }

        // Excluir a tabela
        tabelaValoresRepository.delete(tabela);
        logger.info("Tabela de valores excluída com sucesso. ID: {}", id);
    }

    @Override
    public long countTabelasByConvenioId(UUID convenioId) {
        logger.info("Contando tabelas para o convênio com ID: {}", convenioId);

        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convênio não encontrado com ID: " + convenioId);
        }

        return tabelaValoresRepository.countByConvenioId(convenioId);
    }

    // Métodos auxiliares

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }

    private TabelaValoresDto mapToDto(TabelaValores tabela) {
        TabelaValoresDto dto = new TabelaValoresDto();
        dto.setId(tabela.getId());
        dto.setNome(tabela.getNome());
        dto.setDescricao(tabela.getDescricao());
        dto.setConteudo(tabela.getConteudo());
        dto.setConvenioId(tabela.getConvenio().getId());
        dto.setConvenioNome(tabela.getConvenio().getName());
        dto.setCreatedById(tabela.getCreatedBy().getId());
        dto.setCreatedByName(tabela.getCreatedBy().getFullName());
        dto.setCreatedAt(tabela.getCreatedAt());
        dto.setUpdatedAt(tabela.getUpdatedAt());
        return dto;
    }
}