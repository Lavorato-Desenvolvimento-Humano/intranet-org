package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.service.GuiaService;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/guias")
@RequiredArgsConstructor
public class GuiaController {

    private static final Logger logger = LoggerFactory.getLogger(GuiaController.class);
    private final GuiaService guiaService;

    @GetMapping
    public ResponseEntity<Page<GuiaSummaryDto>> getAllGuias(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar todas as guias");

        Page<GuiaSummaryDto> guias = guiaService.getAllGuias(pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuiaDto> getGuiaById(@PathVariable UUID id) {
        logger.info("Requisição para buscar guia com ID: {}", id);

        GuiaDto guia = guiaService.getGuiaById(id);
        return ResponseUtil.success(guia);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('guia:create') or hasAnyRole('ADMIN')")
    public ResponseEntity<GuiaDto> createGuia(@Valid @RequestBody GuiaCreateRequest request) {
        logger.info("Requisição para criar nova guia para paciente: {}", request.getPacienteId());

        GuiaDto createdGuia = guiaService.createGuia(request);
        return ResponseUtil.created(createdGuia);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('guia:update') or hasAnyRole('ADMIN')")
    public ResponseEntity<GuiaDto> updateGuia(
            @PathVariable UUID id,
            @Valid @RequestBody GuiaUpdateRequest request) {
        logger.info("Requisição para atualizar guia com ID: {}", id);

        GuiaDto updatedGuia = guiaService.updateGuia(id, request);
        return ResponseUtil.success(updatedGuia);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('guia:delete') or hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteGuia(@PathVariable UUID id) {
        logger.info("Requisição para deletar guia com ID: {}", id);

        guiaService.deleteGuia(id);
        return ResponseUtil.noContent();
    }

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByPaciente(
            @PathVariable UUID pacienteId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias do paciente: {}", pacienteId);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByPaciente(pacienteId, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/convenio/{convenioId}")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByConvenio(
            @PathVariable UUID convenioId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias do convênio: {}", convenioId);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByConvenio(convenioId, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/periodo/{mes}/{ano}")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByMesEAno(
            @PathVariable Integer mes,
            @PathVariable Integer ano,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias do período: {}/{}", mes, ano);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByMesEAno(mes, ano, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/vencidas")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasVencidas(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias vencidas");

        Page<GuiaSummaryDto> guias = guiaService.getGuiasVencidas(pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/quantidade-excedida")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasComQuantidadeExcedida(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias com quantidade excedida");

        Page<GuiaSummaryDto> guias = guiaService.getGuiasComQuantidadeExcedida(pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/validade")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByValidade(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias com validade entre {} e {}", startDate, endDate);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByValidade(startDate, endDate, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/usuario/{userId}")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByUsuarioResponsavel(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias do usuário: {}", userId);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByUsuarioResponsavel(userId, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/especialidade")
    public ResponseEntity<Page<GuiaSummaryDto>> getGuiasByEspecialidade(
            @RequestParam String especialidade,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar guias da especialidade: {}", especialidade);

        Page<GuiaSummaryDto> guias = guiaService.getGuiasByEspecialidade(especialidade, pageable);
        return ResponseUtil.success(guias);
    }

    @GetMapping("/{id}/fichas")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByGuiaId(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas da guia: {}", id);

        Page<FichaSummaryDto> fichas = guiaService.getFichasByGuiaId(id, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGuiasStats() {
        logger.info("Requisição para estatísticas de guias");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGuias", guiaService.countTotalGuias());
        stats.put("guiasVencidas", guiaService.countGuiasVencidas());
        stats.put("guiasQuantidadeExcedida", guiaService.countGuiasComQuantidadeExcedida());

        return ResponseUtil.success(stats);
    }
}