package com.intranet.backend.controllers;

import com.intranet.backend.dto.DemandaAuditDto;
import com.intranet.backend.model.DemandaAudit;
import com.intranet.backend.service.DemandaAuditService;
import com.intranet.backend.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demandas/auditoria")
@RequiredArgsConstructor
public class DemandaAuditController {

    private static final Logger logger = LoggerFactory.getLogger(DemandaAuditController.class);
    private final DemandaAuditService demandaAuditService;

    @GetMapping("/{demandaId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<List<DemandaAuditDto>> getHistoricoAlteracoes(@PathVariable UUID demandaId) {
        logger.info("Requisição para obter histórico de alterações da demanda: {}", demandaId);

        List<DemandaAudit> historico = demandaAuditService.getHistoricoAlteracoes(demandaId);
        List<DemandaAuditDto> historicoDto = historico.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseUtil.success(historicoDto);
    }

    @GetMapping("/{demandaId}/paginado")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<Page<DemandaAuditDto>> getHistoricoAlteracoesPaginado(
            @PathVariable UUID demandaId,
            @PageableDefault(size = 10) Pageable pageable) {
        logger.info("Requisição para obter histórico de alterações paginado da demanda: {}", demandaId);

        Page<DemandaAudit> historicoPage = demandaAuditService.getHistoricoAlteracoesPaginado(demandaId, pageable);
        List<DemandaAuditDto> historicoDto = historicoPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        Page<DemandaAuditDto> historioDtoPage = new PageImpl<>(
                historicoDto,
                pageable,
                historicoPage.getTotalElements()
        );

        return ResponseUtil.success(historioDtoPage);
    }

    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or @userSecurity.isCurrentUser(#usuarioId)")
    public ResponseEntity<List<DemandaAuditDto>> getHistoricoAlteracoesPorUsuario(@PathVariable UUID usuarioId) {
        logger.info("Requisição para obter histórico de alterações feitas pelo usuário: {}", usuarioId);

        List<DemandaAudit> historico = demandaAuditService.getHistoricoAlteracoesPorUsuario(usuarioId);
        List<DemandaAuditDto> historicoDto = historico.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseUtil.success(historicoDto);
    }

    @GetMapping("/{demandaId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<List<DemandaAuditDto>> getHistoricoAlteracoesStatus(@PathVariable UUID demandaId) {
        logger.info("Requisição para obter histórico de alterações de status da demanda: {}", demandaId);

        List<DemandaAudit> historico = demandaAuditService.getHistoricoAlteracoesStatus(demandaId);
        List<DemandaAuditDto> historicoDto = historico.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseUtil.success(historicoDto);
    }

    @GetMapping("/{demandaId}/atribuicoes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERENTE') or hasRole('SUPERVISOR') or hasRole('USER')")
    public ResponseEntity<List<DemandaAuditDto>> getHistoricoReatribuicoes(@PathVariable UUID demandaId) {
        logger.info("Requisição para obter histórico de reatribuições da demanda: {}", demandaId);

        List<DemandaAudit> historico = demandaAuditService.getHistoricoReatribuicoes(demandaId);
        List<DemandaAuditDto> historicoDto = historico.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseUtil.success(historicoDto);
    }

    /**
     * Método auxiliar para mapear entidade para DTO
     */
    private DemandaAuditDto mapToDto(DemandaAudit audit) {
        DemandaAuditDto dto = new DemandaAuditDto();
        dto.setId(audit.getId());
        dto.setDemandaId(audit.getDemandaId());
        dto.setCampoAlterado(audit.getCampoAlterado());
        dto.setValorAnterior(audit.getValorAnterior());
        dto.setValorNovo(audit.getValorNovo());

        if (audit.getAlteradoPor() != null) {
            dto.setAlteradoPorId(audit.getAlteradoPor().getId());
            dto.setAlteradoPorNome(audit.getAlteradoPor().getFullName());
        }

        dto.setDataAlteracao(audit.getDataAlteracao());
        dto.setOperacao(audit.getOperacao());
        dto.setDescricaoOperacao(DemandaAuditDto.getDescricaoOperacao(audit.getOperacao()));

        return dto;
    }
}