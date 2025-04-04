package com.intranet.backend.controllers;

import com.intranet.backend.dto.DemandaCreateDto;
import com.intranet.backend.dto.DemandaDto;
import com.intranet.backend.dto.DemandaFilterDto;
import com.intranet.backend.dto.DemandaUpdateDto;
import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.DemandaRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.DemandaService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demandas")
@RequiredArgsConstructor
public class DemandaController {

    private static final Logger logger = LoggerFactory.getLogger(DemandaController.class);
    private final DemandaService demandaService;
    private final DemandaRepository demandaRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<DemandaDto>> getAllDemandas() {
        logger.info("Requisição para listar todas as demandas visíveis para o usuário atual");
        try {
            List<DemandaDto> demandas = demandaService.getAllDemandas();
            return ResponseUtil.success(demandas);
        } catch (Exception e) {
            logger.error("Erro ao buscar demandas: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandaDto> getDemandaById(@PathVariable UUID id) {
        logger.info("Requisição para buscar demanda com ID: {}", id);
        DemandaDto demanda = demandaService.getDemandaById(id);
        return ResponseUtil.success(demanda);
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<DemandaDto>> getMinhasDemandas() {
        logger.info("Requisição para listar demandas atribuídas ao usuário atual");
        List<DemandaDto> demandas = demandaService.getMinhasDemandas();
        return ResponseUtil.success(demandas);
    }

    @GetMapping("/criadas-por-mim")
    public ResponseEntity<List<DemandaDto>> getDemandasCriadasPorMim() {
        logger.info("Requisição para listar demandas criadas pelo usuário atual");
        List<DemandaDto> demandas = demandaService.getDemandasCriadasPorMim();
        return ResponseUtil.success(demandas);
    }

    @GetMapping("/equipe/{equipeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR')")
    public ResponseEntity<List<DemandaDto>> getDemandasByEquipeId(@PathVariable UUID equipeId) {
        logger.info("Requisição para listar demandas da equipe com ID: {}", equipeId);
        List<DemandaDto> demandas = demandaService.getDemandasByEquipeId(equipeId);
        return ResponseUtil.success(demandas);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<DemandaDto>> getDemandasFiltradas(DemandaFilterDto filtros) {
        logger.info("Requisição para filtrar demandas com critérios personalizados");
        List<DemandaDto> demandas = demandaService.getDemandasFiltradas(filtros);
        return ResponseUtil.success(demandas);
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<DemandaDto>> getDemandasByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        logger.info("Requisição para listar demandas no período: {} até {}", inicio, fim);
        List<DemandaDto> demandas = demandaService.getDemandasByPeriodo(inicio, fim);
        return ResponseUtil.success(demandas);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<DemandaDto> createDemanda(@Valid @RequestBody DemandaCreateDto demandaCreateDto) {
        logger.info("Requisição para criar nova demanda: {}", demandaCreateDto.getTitulo());
        try {
            DemandaDto createdDemanda = demandaService.createDemanda(demandaCreateDto);
            return ResponseUtil.created(createdDemanda);
        } catch (Exception e) {
            logger.error("Erro ao criar demanda: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<DemandaDto> updateDemanda(
            @PathVariable UUID id,
            @Valid @RequestBody DemandaUpdateDto demandaUpdateDto) {
        logger.info("Requisição para atualizar demanda com ID: {}", id);
        try {
            DemandaDto updatedDemanda = demandaService.updateDemanda(id, demandaUpdateDto);
            return ResponseUtil.success(updatedDemanda);
        } catch (Exception e) {
            logger.error("Erro ao atualizar demanda: {}", e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE')")
    public ResponseEntity<Void> deleteDemanda(@PathVariable UUID id) {
        logger.info("Requisição para deletar demanda com ID: {}", id);
        demandaService.deleteDemanda(id);
        return ResponseUtil.noContent();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<DemandaDto> alterarStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        logger.info("Requisição para alterar status da demanda {} para {}", id, status);
        try {
            DemandaDto updatedDemanda = demandaService.alterarStatus(id, status);
            return ResponseUtil.success(updatedDemanda);
        } catch (Exception e) {
            logger.error("Erro ao alterar status da demanda: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PatchMapping("/{id}/atribuir")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR')")
    public ResponseEntity<DemandaDto> atribuirDemanda(
            @PathVariable UUID id,
            @RequestParam UUID usuarioId) {
        logger.info("Requisição para atribuir demanda {} para usuário {}", id, usuarioId);
        try {
            DemandaDto updatedDemanda = demandaService.atribuirDemanda(id, usuarioId);
            return ResponseUtil.success(updatedDemanda);
        } catch (Exception e) {
            logger.error("Erro ao atribuir demanda: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Endpoint para obter estatísticas de demandas
     */
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> getEstatisticas() {
        logger.info("Requisição para obter estatísticas de demandas");
        try {
            Map<String, Object> estatisticas = new HashMap<>();
            User currentUser = getCurrentUser();

            // Contar demandas pendentes do usuário atual
            estatisticas.put("demandasPendentes", demandaRepository.countDemandasPendentes(currentUser.getId()));

            // Contar demandas por status
            Map<String, Long> contagemPorStatus = Arrays.stream(Demanda.Status.values())
                    .collect(Collectors.toMap(
                            Demanda.Status::getValor,
                            status -> demandaRepository.countByStatus(status.getValor())
                    ));
            estatisticas.put("contagemPorStatus", contagemPorStatus);

            // Obter outras estatísticas relevantes...

            return ResponseUtil.success(estatisticas);
        } catch (Exception e) {
            logger.error("Erro ao obter estatísticas: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/calendario")
    public ResponseEntity<List<DemandaDto>> getDemandasCalendario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        logger.info("Requisição para listar demandas para calendário: {} até {}", dataInicio, dataFim);

        // Converter LocalDate para LocalDateTime (início do dia e fim do dia)
        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(23, 59, 59);

        try {
            List<DemandaDto> demandas = demandaService.getDemandasByPeriodo(inicio, fim);
            return ResponseUtil.success(demandas);
        } catch (Exception e) {
            logger.error("Erro ao buscar demandas para calendário: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Método utilitário para obter o usuário atual
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));
    }
}