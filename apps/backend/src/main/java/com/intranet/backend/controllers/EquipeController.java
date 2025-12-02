// src/main/java/com/intranet/backend/controllers/EquipeController.java
package com.intranet.backend.controllers;

import com.intranet.backend.dto.EquipeCreateDto;
import com.intranet.backend.dto.EquipeDto;
import com.intranet.backend.dto.UserDto;
import com.intranet.backend.service.EquipeService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipes")
@RequiredArgsConstructor
public class EquipeController {

    private static final Logger logger = LoggerFactory.getLogger(EquipeController.class);
    private final EquipeService equipeService;

    @GetMapping
    public ResponseEntity<List<EquipeDto>> getAllEquipes() {
        logger.info("Requisição para listar todas as equipes");
        List<EquipeDto> equipes = equipeService.getAllEquipes();
        return ResponseUtil.success(equipes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipeDto> getEquipeById(@PathVariable UUID id) {
        logger.info("Requisição para buscar equipe com ID: {}", id);
        EquipeDto equipe = equipeService.getEquipeById(id);
        return ResponseUtil.success(equipe);
    }

    @GetMapping("/{id}/membros")
    public ResponseEntity<List<UserDto>> getMembrosEquipe(@PathVariable UUID id) {
        logger.info("Requisição para listar membros da equipe com ID: {}", id);
        List<UserDto> membros = equipeService.getMembrosEquipe(id);
        return ResponseUtil.success(membros);
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<EquipeDto>> getEquipesByCurrentUser() {
        logger.info("Requisição para listar equipes do usuário atual");
        List<EquipeDto> equipes = equipeService.getEquipesByCurrentUser();
        return ResponseUtil.success(equipes);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<EquipeDto> createEquipe(@Valid @RequestBody EquipeCreateDto equipeCreateDto) {
        logger.info("Requisição para criar nova equipe: {}", equipeCreateDto.getNome());
        EquipeDto createdEquipe = equipeService.createEquipe(equipeCreateDto);
        return ResponseUtil.created(createdEquipe);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<EquipeDto> updateEquipe(
            @PathVariable UUID id,
            @Valid @RequestBody EquipeCreateDto equipeUpdateDto) {
        logger.info("Requisição para atualizar equipe com ID: {}", id);
        EquipeDto updatedEquipe = equipeService.updateEquipe(id, equipeUpdateDto);
        return ResponseUtil.success(updatedEquipe);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<Void> deleteEquipe(@PathVariable UUID id) {
        logger.info("Requisição para deletar equipe com ID: {}", id);
        equipeService.deleteEquipe(id);
        return ResponseUtil.noContent();
    }

    @PostMapping("/{id}/membros/{userId}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<EquipeDto> addMembro(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        logger.info("Requisição para adicionar membro {} à equipe {}", userId, id);
        EquipeDto equipe = equipeService.addMembro(id, userId);
        return ResponseUtil.success(equipe);
    }

    @DeleteMapping("/{id}/membros/{userId}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<EquipeDto> removeMembro(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        logger.info("Requisição para remover membro {} da equipe {}", userId, id);
        EquipeDto equipe = equipeService.removeMembro(id, userId);
        return ResponseUtil.success(equipe);
    }
}