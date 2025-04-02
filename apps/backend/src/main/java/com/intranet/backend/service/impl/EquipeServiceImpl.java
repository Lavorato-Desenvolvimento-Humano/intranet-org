package com.intranet.backend.service.impl;

import com.intranet.backend.dto.EquipeCreateDto;
import com.intranet.backend.dto.EquipeDto;
import com.intranet.backend.dto.UserDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Equipe;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserEquipe;
import com.intranet.backend.repository.EquipeRepository;
import com.intranet.backend.repository.UserEquipeRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.EquipeService;
import com.intranet.backend.util.DTOMapperUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipeServiceImpl implements EquipeService {

    private static final Logger logger = LoggerFactory.getLogger(EquipeServiceImpl.class);

    private final EquipeRepository equipeRepository;
    private final UserRepository userRepository;
    private final UserEquipeRepository userEquipeRepository;

    @Override
    public List<EquipeDto> getAllEquipes() {
        logger.info("Buscando todas as equipes");
        List<Equipe> equipes = equipeRepository.findAll();

        return equipes.stream()
                .map(equipe -> {
                    int membroCount = equipeRepository.countMembrosByEquipeId(equipe.getId());
                    return DTOMapperUtil.mapToEquipeDto(equipe, membroCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    public EquipeDto getEquipeById(UUID id) {
        logger.info("Buscando equipe com ID: {}", id);

        Equipe equipe = equipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + id));

        int membroCount = equipeRepository.countMembrosByEquipeId(id);

        return DTOMapperUtil.mapToEquipeDto(equipe, membroCount);
    }

    @Override
    @Transactional
    public EquipeDto createEquipe(EquipeCreateDto equipeCreateDto) {
        logger.info("Criando nova equipe: {}", equipeCreateDto.getNome());

        if (equipeRepository.existsByNome(equipeCreateDto.getNome())) {
            throw new IllegalArgumentException("Já existe uma equipe com este nome");
        }

        Equipe equipe = new Equipe();
        equipe.setNome(equipeCreateDto.getNome());
        equipe.setDescricao(equipeCreateDto.getDescricao());

        Equipe savedEquipe = equipeRepository.save(equipe);
        logger.info("Equipe criada com sucesso. ID: {}", savedEquipe.getId());

        return DTOMapperUtil.mapToEquipeDto(savedEquipe, 0);
    }

    @Override
    @Transactional
    public EquipeDto updateEquipe(UUID id, EquipeCreateDto equipeUpdateDto) {
        logger.info("Atualizando equipe com ID: {}", id);

        Equipe equipe = equipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + id));

        // Verificar se o nome já existe (exceto para a própria equipe)
        if (!equipe.getNome().equals(equipeUpdateDto.getNome()) &&
                equipeRepository.existsByNome(equipeUpdateDto.getNome())) {
            throw new IllegalArgumentException("Já existe uma equipe com este nome");
        }

        equipe.setNome(equipeUpdateDto.getNome());
        equipe.setDescricao(equipeUpdateDto.getDescricao());

        Equipe updatedEquipe = equipeRepository.save(equipe);
        logger.info("Equipe atualizada com sucesso. ID: {}", updatedEquipe.getId());

        int membroCount = equipeRepository.countMembrosByEquipeId(id);

        return DTOMapperUtil.mapToEquipeDto(updatedEquipe, membroCount);
    }

    @Override
    @Transactional
    public void deleteEquipe(UUID id) {
        logger.info("Excluindo equipe com ID: {}", id);

        if (!equipeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipe não encontrada com ID: " + id);
        }

        try {
            // Primeiro, remover todas as associações UserEquipe para prevenir problemas de cascata
            userEquipeRepository.deleteByEquipeId(id);
            logger.debug("Associações de membros removidas para a equipe ID: {}", id);

            // Agora é seguro remover a equipe
            equipeRepository.deleteById(id);
            logger.info("Equipe excluída com sucesso. ID: {}", id);
        } catch (Exception e) {
            logger.error("Erro ao excluir equipe ID {}: {}", id, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public EquipeDto addMembro(UUID equipeId, UUID userId) {
        logger.info("Adicionando membro {} à equipe {}", userId, equipeId);

        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));

        // Verificar se o usuário já é membro
        if (userEquipeRepository.existsByUserIdAndEquipeId(userId, equipeId)) {
            throw new IllegalArgumentException("Usuário já é membro desta equipe");
        }

        UserEquipe userEquipe = new UserEquipe();
        userEquipe.setUser(user);
        userEquipe.setEquipe(equipe);

        userEquipeRepository.save(userEquipe);
        logger.info("Membro adicionado com sucesso à equipe. Equipe ID: {}, Usuário ID: {}", equipeId, userId);

        int membroCount = equipeRepository.countMembrosByEquipeId(equipeId);

        return DTOMapperUtil.mapToEquipeDto(equipe, membroCount);
    }

    @Override
    @Transactional
    public EquipeDto removeMembro(UUID equipeId, UUID userId) {
        logger.info("Removendo membro {} da equipe {}", userId, equipeId);

        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId));

        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Usuário não encontrado com ID: " + userId);
        }

        if (!userEquipeRepository.existsByUserIdAndEquipeId(userId, equipeId)) {
            throw new IllegalArgumentException("Usuário não é membro desta equipe");
        }

        userEquipeRepository.deleteByUserIdAndEquipeId(userId, equipeId);
        logger.info("Membro removido com sucesso da equipe. Equipe ID: {}, Usuário ID: {}", equipeId, userId);

        int membroCount = equipeRepository.countMembrosByEquipeId(equipeId);

        return DTOMapperUtil.mapToEquipeDto(equipe, membroCount);
    }

    @Override
    public List<UserDto> getMembrosEquipe(UUID equipeId) {
        logger.info("Buscando membros da equipe com ID: {}", equipeId);

        if (!equipeRepository.existsById(equipeId)) {
            throw new ResourceNotFoundException("Equipe não encontrada com ID: " + equipeId);
        }

        List<UserEquipe> membros = userEquipeRepository.findByEquipeIdWithDetails(equipeId);

        return membros.stream()
                .map(m -> {
                    List<String> roles = userRepository.findRoleNamesByUserId(m.getUser().getId());
                    return DTOMapperUtil.mapToUserDto(m.getUser(), roles);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<EquipeDto> getEquipesByCurrentUser() {
        User currentUser = getCurrentUser();
        logger.info("Buscando equipes do usuário atual: {}", currentUser.getId());

        List<UserEquipe> userEquipes = userEquipeRepository.findByUserId(currentUser.getId());

        return userEquipes.stream()
                .map(ue -> {
                    int membroCount = equipeRepository.countMembrosByEquipeId(ue.getEquipe().getId());
                    return DTOMapperUtil.mapToEquipeDto(ue.getEquipe(), membroCount);
                })
                .collect(Collectors.toList());
    }

    // Método auxiliar para obter o usuário atual
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }
}