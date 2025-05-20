package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.WorkflowService;
import com.intranet.backend.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowController.class);
    private final WorkflowService workflowService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getAllWorkflows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        logger.info("Buscando todos os fluxos de trabalho com paginação");

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<WorkflowSummaryDto> workflows = workflowService.getAllWorkflows(pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> getWorkflowById(@PathVariable UUID id) {
        logger.info("Buscando fluxo de trabalho por ID: {}", id);

        WorkflowDto workflow = workflowService.getWorkflowById(id);
        return ResponseEntity.ok(workflow);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getWorkflowsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("Buscando fluxos de trabalho com status: {}", status);

        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowSummaryDto> workflows = workflowService.getWorkflowsByStatus(status, pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getWorkflowsByTeam(
            @PathVariable UUID teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("Buscando fluxos de trabalho da equipe: {}", teamId);

        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowSummaryDto> workflows = workflowService.getWorkflowsByTeam(teamId, pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowSummaryDto>> getWorkflowsAssignedToMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Buscando fluxos de trabalho atribuídos ao usuário: {}", userId);

        List<WorkflowSummaryDto> workflows = workflowService.getWorkflowsAssignedToUser(userId);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/visible-to-me")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getVisibleWorkflows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();;

        logger.info("Buscando fluxos de trabalho visíveis para o usuário: {}", userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowSummaryDto> workflows = workflowService.getVisibleWorkflows(userId, pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<WorkflowSummaryDto>> getOverdueWorkflows() {
        logger.info("Buscando fluxos de trabalho com prazo vencido");

        List<WorkflowSummaryDto> workflows = workflowService.findOverdueWorkflows();
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/near-deadline")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<WorkflowSummaryDto>> getWorkflowsNearDeadline(
            @RequestParam(defaultValue = "3") int daysThreshold) {

        logger.info("Buscando fluxos de trabalho com prazo próximo do vencimento");

        List<WorkflowSummaryDto> workflows = workflowService.findWorkflowsNearDeadline(daysThreshold);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}/transitions")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowTransitionDto>> getWorkflowTransitions(@PathVariable UUID id) {
        logger.info("Buscando histórico de transições do fluxo: {}", id);

        List<WorkflowTransitionDto> transitions = workflowService.getWorkflowTransitions(id);
        return ResponseEntity.ok(transitions);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowStatsDto> getGeneralWorkflowStats() {
        logger.info("Obtendo estatísticas gerais de fluxos");

        WorkflowStatsDto stats = workflowService.getGeneralWorkflowStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowStatsDto> getUserWorkflowStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Obtendo estatísticas de fluxos para o usuário: {}", userId);

        WorkflowStatsDto stats = workflowService.getUserWorkflowStats(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users-workload")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<List<UserWorkloadDto>> getUsersWorkload() {
        logger.info("Obtendo carga de trabalho dos usuários");

        List<UserWorkloadDto> workloads = workflowService.getUsersWorkload();
        return ResponseEntity.ok(workloads);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> createWorkflow(@RequestBody WorkflowCreateDto workflowDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Criando novo fluxo de trabalho");

        WorkflowDto createdWorkflow = workflowService.createWorkflow(workflowDto, userId);
        return ResponseEntity.created(null).body(createdWorkflow);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> updateWorkflow(
            @PathVariable UUID id,
            @RequestBody WorkflowCreateDto workflowDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou modificar fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para modificar este fluxo");
        }

        logger.info("Atualizando fluxo de trabalho: {}", id);

        WorkflowDto updatedWorkflow = workflowService.updateWorkflow(id, workflowDto);
        return ResponseEntity.ok(updatedWorkflow);
    }

    @PostMapping("/{id}/next-step")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> advanceToNextStep(
            @PathVariable UUID id,
            @RequestParam UUID assignToId,
            @RequestParam(required = false) String comments) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou avançar fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para avançar este fluxo");
        }

        logger.info("Avançando fluxo {} para a próxima etapa", id);

        WorkflowDto updatedWorkflow = workflowService.advanceToNextStep(id, assignToId, comments);
        return ResponseEntity.ok(updatedWorkflow);
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> updateWorkflowStatus(
            @PathVariable UUID id,
            @RequestParam String newStatus,
            @RequestParam(required = false) String comments) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou modificar status do fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para modificar este fluxo");
        }

        logger.info("Atualizando status do fluxo {} para: {}", id, newStatus);

        WorkflowDto updatedWorkflow = workflowService.updateWorkflowStatus(id, newStatus, comments);
        return ResponseEntity.ok(updatedWorkflow);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowAssignmentDto> assignStep(
            @PathVariable UUID id,
            @RequestParam int stepNumber,
            @RequestParam UUID assignToId,
            @RequestParam(required = false) String comments) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou atribuir etapa do fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para atribuir etapas deste fluxo");
        }

        logger.info("Atribuindo etapa {} do fluxo {} para usuário: {}", stepNumber, id, assignToId);

        WorkflowAssignmentDto assignment = workflowService.assignStep(id, stepNumber, assignToId, comments);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/complete-step")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowAssignmentDto> completeStep(
            @PathVariable UUID id,
            @RequestParam int stepNumber,
            @RequestParam(required = false) String comments) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou concluir etapa do fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para concluir etapas deste fluxo");
        }

        logger.info("Concluindo etapa {} do fluxo {}", stepNumber, id);

        WorkflowAssignmentDto assignment = workflowService.completeStep(id, stepNumber, comments);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowDto> archiveWorkflow(@PathVariable UUID id) {
        logger.info("Arquivando fluxo de trabalho: {}", id);

        WorkflowDto archivedWorkflow = workflowService.archiveWorkflow(id);
        return ResponseEntity.ok(archivedWorkflow);
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowDto> restoreWorkflow(@PathVariable UUID id) {
        logger.info("Restaurando fluxo de trabalho: {}", id);

        WorkflowDto restoredWorkflow = workflowService.restoreWorkflow(id);
        return ResponseEntity.ok(restoredWorkflow);
    }

    @GetMapping("/custom-status/{statusId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getWorkflowsByCustomStatus(
            @PathVariable UUID statusId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("Buscando fluxos de trabalho com status personalizado: {}", statusId);

        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowSummaryDto> workflows = workflowService.getWorkflowsByCustomStatus(statusId, pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/step/{stepNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowSummaryDto>> getWorkflowsByStepNumber(
            @PathVariable int stepNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("Buscando fluxos de trabalho na etapa: {}", stepNumber);

        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowSummaryDto> workflows = workflowService.getWorkflowsByStepNumber(stepNumber, pageable);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/template/{templateId}/status-counts")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Map<String, Integer>> getWorkflowCountByCustomStatus(@PathVariable UUID templateId) {
        logger.info("Contando fluxos de trabalho por status personalizado para o template: {}", templateId);

        Map<String, Integer> counts = workflowService.getWorkflowCountByCustomStatus(templateId);
        return ResponseEntity.ok(counts);
    }

    @PostMapping("/{id}/custom-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowDto> updateWorkflowCustomStatus(
            @PathVariable UUID id,
            @RequestParam UUID statusId,
            @RequestParam(required = false) String comments) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o fluxo
        if (!workflowService.canUserModifyWorkflow(userId, id)) {
            logger.warn("Usuário {} tentou modificar status do fluxo {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para modificar este fluxo");
        }

        logger.info("Atualizando status personalizado do fluxo {} para: {}", id, statusId);

        WorkflowDto updatedWorkflow = workflowService.updateWorkflowCustomStatus(id, statusId, comments);
        return ResponseEntity.ok(updatedWorkflow);
    }

    @GetMapping("/stats/template/{templateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowStatsDto> getWorkflowStatsByTemplate(@PathVariable UUID templateId) {
        logger.info("Obtendo estatísticas de fluxos para o template: {}", templateId);

        WorkflowStatsDto stats = workflowService.getGeneralWorkflowStatsByTemplate(templateId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/status-template/{statusTemplateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowStatsDto> getWorkflowStatsByStatusTemplate(@PathVariable UUID statusTemplateId) {
        logger.info("Obtendo estatísticas de fluxos para o template de status: {}", statusTemplateId);

        WorkflowStatsDto stats = workflowService.getGeneralWorkflowStatsByStatusTemplate(statusTemplateId);
        return ResponseEntity.ok(stats);
    }
}