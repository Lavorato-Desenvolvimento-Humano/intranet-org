package com.intranet.backend.controllers;

import com.intranet.backend.dto.WorkflowStatusItemDto;
import com.intranet.backend.dto.WorkflowStatusTemplateCreateDto;
import com.intranet.backend.dto.WorkflowStatusTemplateDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.WorkflowStatusService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflow-status-templates")
@RequiredArgsConstructor
public class WorkflowStatusTemplateController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowStatusTemplateController.class);
    private final WorkflowStatusService statusService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowStatusTemplateDto>> getAllStatusTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        logger.info("Buscando todos os templates de status com paginação");

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<WorkflowStatusTemplateDto> templates = statusService.getAllStatusTemplates(pageable);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowStatusTemplateDto> getStatusTemplateById(@PathVariable UUID id) {
        logger.info("Buscando template de status por ID: {}", id);

        WorkflowStatusTemplateDto template = statusService.getStatusTemplateById(id);
        return ResponseEntity.ok(template);
    }

    @GetMapping("/my-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR')")
    public ResponseEntity<List<WorkflowStatusTemplateDto>> getMyStatusTemplates() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Buscando templates de status criados pelo usuário: {}", userId);

        List<WorkflowStatusTemplateDto> templates = statusService.getStatusTemplatesByCreatedBy(userId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowStatusTemplateDto>> getAvailableStatusTemplates() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Buscando templates de status disponíveis para o usuário: {}", userId);

        List<WorkflowStatusTemplateDto> templates = statusService.getAvailableStatusTemplates(userId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowStatusItemDto>> getStatusItems(@PathVariable UUID id) {
        logger.info("Buscando status do template: {}", id);

        List<WorkflowStatusItemDto> items = statusService.getStatusItems(id);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}/initial-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowStatusItemDto> getInitialStatus(@PathVariable UUID id) {
        logger.info("Buscando status inicial do template: {}", id);

        WorkflowStatusItemDto initialStatus = statusService.getInitialStatus(id);
        return ResponseEntity.ok(initialStatus);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowStatusTemplateDto> createStatusTemplate(
            @RequestBody WorkflowStatusTemplateCreateDto templateDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        logger.info("Criando novo template de status para usuário com email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        WorkflowStatusTemplateDto createdTemplate = statusService.createStatusTemplate(templateDto, userId);
        return ResponseEntity.created(null).body(createdTemplate);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowStatusTemplateDto> updateStatusTemplate(
            @PathVariable UUID id,
            @RequestBody WorkflowStatusTemplateCreateDto templateDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para modificar o template
        if (!statusService.canUserModifyStatusTemplate(userId, id)) {
            logger.warn("Usuário {} tentou modificar template de status {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para modificar este template de status");
        }

        logger.info("Atualizando template de status: {}", id);

        WorkflowStatusTemplateDto updatedTemplate = statusService.updateStatusTemplate(id, templateDto);
        return ResponseEntity.ok(updatedTemplate);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> deleteStatusTemplate(@PathVariable UUID id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        // Verificar se o usuário tem permissão para excluir o template
        if (!statusService.canUserModifyStatusTemplate(userId, id)) {
            logger.warn("Usuário {} tentou excluir template de status {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para excluir este template de status");
        }

        logger.info("Excluindo template de status: {}", id);

        statusService.deleteStatusTemplate(id);
        return ResponseEntity.noContent().build();
    }
}