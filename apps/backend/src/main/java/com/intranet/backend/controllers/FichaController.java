package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.service.FichaService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/fichas")
@RequiredArgsConstructor
public class FichaController {

    private static final Logger logger = LoggerFactory.getLogger(FichaController.class);
    private final FichaService fichaService;

    @GetMapping
    public ResponseEntity<Page<FichaSummaryDto>> getAllFichas(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar todas as fichas");

        Page<FichaSummaryDto> fichas = fichaService.getAllFichas(pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FichaDto> getFichaById(@PathVariable UUID id) {
        logger.info("Requisição para buscar ficha com ID: {}", id);

        FichaDto ficha = fichaService.getFichaById(id);
        return ResponseUtil.success(ficha);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ficha:create') or hasAnyRole('ADMIN')")
    public ResponseEntity<FichaDto> createFicha(@Valid @RequestBody FichaCreateRequest request) {
        logger.info("Requisição para criar nova ficha para guia: {}", request.getGuiaId());

        FichaDto createdFicha = fichaService.createFicha(request);
        return ResponseUtil.created(createdFicha);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ficha:update') or hasAnyRole('ADMIN')")
    public ResponseEntity<FichaDto> updateFicha(
            @PathVariable UUID id,
            @Valid @RequestBody FichaUpdateRequest request) {
        logger.info("Requisição para atualizar ficha com ID: {}", id);

        FichaDto updatedFicha = fichaService.updateFicha(id, request);
        return ResponseUtil.success(updatedFicha);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ficha:delete') or hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteFicha(@PathVariable UUID id) {
        logger.info("Requisição para deletar ficha com ID: {}", id);

        fichaService.deleteFicha(id);
        return ResponseUtil.noContent();
    }

    @GetMapping("/guia/{guiaId}")
    public ResponseEntity<List<FichaDto>> getFichasByGuiaId(@PathVariable UUID guiaId) {
        logger.info("Requisição para buscar fichas da guia: {}", guiaId);

        List<FichaDto> fichas = fichaService.getFichasByGuiaId(guiaId);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByPacienteId(
            @PathVariable UUID pacienteId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas do paciente: {}", pacienteId);

        Page<FichaSummaryDto> fichas = fichaService.getFichasByPacienteId(pacienteId, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/convenio/{convenioId}")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByConvenioId(
            @PathVariable UUID convenioId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas do convênio: {}", convenioId);

        Page<FichaSummaryDto> fichas = fichaService.getFichasByConvenioId(convenioId, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<FichaSummaryDto>> searchFichasByEspecialidade(
            @RequestParam String especialidade,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas por especialidade: {}", especialidade);

        Page<FichaSummaryDto> fichas = fichaService.searchFichasByEspecialidade(especialidade, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/periodo/{mes}/{ano}")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByMesEAno(
            @PathVariable Integer mes,
            @PathVariable Integer ano,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas do período: {}/{}", mes, ano);

        Page<FichaSummaryDto> fichas = fichaService.getFichasByMesEAno(mes, ano, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/usuario/{userId}")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByUsuarioResponsavel(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para buscar fichas do usuário: {}", userId);

        Page<FichaSummaryDto> fichas = fichaService.getFichasByUsuarioResponsavel(userId, pageable);
        return ResponseUtil.success(fichas);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getFichasStats() {
        logger.info("Requisição para estatísticas de fichas");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFichas", fichaService.countTotalFichas());

        return ResponseUtil.success(stats);
    }

    @GetMapping("/guia/{guiaId}/count")
    public ResponseEntity<Map<String, Long>> countFichasByGuia(@PathVariable UUID guiaId) {
        logger.info("Requisição para contar fichas da guia: {}", guiaId);

        long count = fichaService.countFichasByGuia(guiaId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseUtil.success(response);
    }

    @GetMapping("/convenio/{convenioId}/count")
    public ResponseEntity<Map<String, Long>> countFichasByConvenio(@PathVariable UUID convenioId) {
        logger.info("Requisição para contar fichas do convênio: {}", convenioId);

        long count = fichaService.countFichasByConvenio(convenioId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseUtil.success(response);
    }

    @PostMapping("/assinatura")
    @PreAuthorize("hasAnyAuthority('ficha:assinatura:create') or hasAnyRole('ADMIN')")
    public ResponseEntity<FichaDto> createFichaAssinatura(
            @Valid @RequestBody FichaAssinaturaCreateRequest request
    ) {
      FichaDto ficha = fichaService.createFichaAssinatura(request);
      return ResponseUtil.created(ficha);
    }

    @PatchMapping("/{fichaId}/vincular-guia/{guiaId}")
    @PreAuthorize("hasAnyAuthority('ficha:update') or hasAnyRole('ADMIN')")
    public ResponseEntity<FichaDto> vincularGuia(
            @PathVariable UUID fichaId,
            @PathVariable UUID guiaId) {
        FichaDto ficha = fichaService.vincularFichaAGuia(fichaId, guiaId);
        return ResponseUtil.success(ficha);
    }

    @GetMapping("/codigo/{codigoFicha}")
    public ResponseEntity<FichaDto> getFichaByCodigo(@PathVariable String codigoFicha) {
        logger.info("Buscando ficha pelo código: {}", codigoFicha);
        FichaDto ficha = fichaService.findByCodigoFicha(codigoFicha);
        return ResponseEntity.ok(ficha);
    }

    @GetMapping("/search/codigo")
    public ResponseEntity<Page<FichaSummaryDto>> searchByCodigo(
            @RequestParam String termo,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FichaSummaryDto> fichas = fichaService.searchByCodigoFicha(termo, pageable);
        return ResponseEntity.ok(fichas);
    }

    @GetMapping("/status/status")
    public ResponseEntity<Page<FichaSummaryDto>> getFichasByStatus(
            @RequestParam String status,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Buscando fichas pelo status: {}", status);
        Page<FichaSummaryDto> fichas = fichaService.getFichasByStatus(status, pageable);
        return ResponseEntity.ok(fichas);
    }
}