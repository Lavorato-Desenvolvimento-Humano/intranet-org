package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.Paciente;
import com.intranet.backend.service.PacienteService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private static final Logger logger = LoggerFactory.getLogger(PacienteController.class);
    private final PacienteService pacienteService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<PacienteSummaryDto>> getAllPacientes(@PageableDefault(size = 20) Pageable pageable) {

        // ✅ Debug temporário
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Usuário: {}", auth.getName());
        logger.info("Autoridades: {}", auth.getAuthorities());

        logger.info("Requisição para listar todos os pacientes");

        Page<PacienteSummaryDto> pacientes = pacienteService.getAllPacientes(pageable);
        return ResponseUtil.success(pacientes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<PacienteDto> getPacienteById(@PathVariable UUID id) {
        logger.info("Requisição para buscar paciente com ID: {}", id);

        PacienteDto paciente = pacienteService.getPacienteById(id);
        return ResponseUtil.success(paciente);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('paciente:create') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<PacienteDto> createPaciente(@Valid @RequestBody PacienteCreateRequest request) {
        logger.info("Requisição para criar novo paciente: {}", request.getNome());

        PacienteDto createdPaciente = pacienteService.createPaciente(request);
        return ResponseUtil.success(createdPaciente);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('paciente:update') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<PacienteDto> updatePaciente(@PathVariable UUID id,
                                                      @Valid @RequestBody PacienteUpdateRequest request) {
        logger.info("Requisição para atualizar paciente com ID: {}", id);

        PacienteDto updatedPaciente = pacienteService.updatePaciente(id, request);
        return ResponseUtil.success(updatedPaciente);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('paciente:delete') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Void> deletePaciente(@PathVariable UUID id) {
        logger.info("Requisição para deletar paciente com ID: {}", id);

        pacienteService.deletePaciente(id);
        return ResponseUtil.noContent();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<PacienteSummaryDto>> searchPacientseByNome(
            @RequestParam String nome,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar pacientes por nome: {}", nome);

        Page<PacienteSummaryDto> pacientes = pacienteService.searchPacientesByNome(nome, pageable);
        return ResponseUtil.success(pacientes);
    }

    @GetMapping("/convenio/{convenioId}")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<PacienteSummaryDto>> getPacientesByConvenio(
            @PathVariable UUID convenioId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar pacientes do convênio: {}", convenioId);

        Page<PacienteSummaryDto> pacientes = pacienteService.getPacientesByConvenio(convenioId, pageable);
        return ResponseUtil.success(pacientes);
    }

    @GetMapping("/unidade/{unidade}")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<PacienteSummaryDto>> getPacientesByUnidade(
            @PathVariable Paciente.UnidadeEnum unidade,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar pacientes pela unidade: {}", unidade);

        Page<PacienteSummaryDto> pacientes = pacienteService.getPacientesByUnidade(unidade, pageable);
        return ResponseUtil.success(pacientes);
    }

    @GetMapping("/data-nascimento")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<PacienteSummaryDto>> getPacientesByDataNascimento(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar pacientes por data de nascimento entre {} e {}", startDate, endDate);

        Page<PacienteSummaryDto> pacientes = pacienteService.getPacientesByDataNascimento(startDate, endDate, pageable);
        return ResponseUtil.success(pacientes);
    }

    @GetMapping("/{id}/guias")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByPacienteId(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias do paciente com ID: {}", id);

        Page<GuiaSummaryDto> guias = pacienteService.getGuiasByPacienteId(id, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Map<String, Object>> getPacientesStats() {
        logger.info("Requisição para buscar estatísticas dos pacientes");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPacientes", pacienteService.countTotalPacientes());
        stats.put("pacientesKids", pacienteService.countPacientesByUnidade(Paciente.UnidadeEnum.KIDS));
        stats.put("pacientesSenior", pacienteService.countPacientesByUnidade(Paciente.UnidadeEnum.SENIOR));

        return ResponseUtil.success(stats);
    }

    @GetMapping("/convenio/{convenioId}/count")
    @PreAuthorize("hasAnyAuthority('paciente:read') or hasAnyRole('ADMIN','GUIAS','SUPERVISOR','GERENTE')")
    public ResponseEntity<Map<String, Long>> countPacientesByConvenio(@PathVariable UUID convenioId) {
        logger.info("Requisição para contar pacientes do convênio com ID: {}", convenioId);

        long count = pacienteService.countPacientesByConvenio(convenioId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseUtil.success(response);
    }
}