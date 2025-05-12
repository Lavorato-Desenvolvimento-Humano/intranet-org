package com.intranet.backend.controllers;

import com.intranet.backend.dto.WorkflowTemplateCreateDto;
import com.intranet.backend.dto.WorkflowTemplateDto;
import com.intranet.backend.dto.WorkflowTemplateStepDto;
import com.intranet.backend.service.WorkflowTemplateService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/workflow-templates")
@RequiredArgsConstructor
public class WorkflowTemplateController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowTemplateController.class);
    private final WorkflowTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowTemplateDto>> getAllTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        logger.info("Buscando todos os templates de fluxo com paginação");

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<WorkflowTemplateDto> templates = templateService.getAllTemplates(pageable);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<WorkflowTemplateDto> getTemplateById(@PathVariable UUID id) {
        logger.info("Buscando template de fluxo por ID: {}", id);

        WorkflowTemplateDto template = templateService.getTemplateById(id);
        return ResponseEntity.ok(template);
    }

    @GetMapping("/my-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR')")
    public ResponseEntity<List<WorkflowTemplateDto>> getMyTemplates() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Obter o ID do usuário a partir do contexto de segurança
        UUID userId = UUID.fromString(userDetails.getUsername());

        logger.info("Buscando templates criados pelo usuário: {}", userId);

        List<WorkflowTemplateDto> templates = templateService.getTemplatesByCreatedBy(userId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/visible")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowTemplateDto>> getVisibleTemplates() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Obter o ID do usuário a partir do contexto de segurança
        UUID userId = UUID.fromString(userDetails.getUsername());

        logger.info("Buscando templates visíveis para o usuário: {}", userId);

        List<WorkflowTemplateDto> templates = templateService.getVisibleTemplates(userId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}/steps")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowTemplateStepDto>> getTemplateSteps(@PathVariable UUID id) {
        logger.info("Buscando passos do template: {}", id);

        List<WorkflowTemplateStepDto> steps = templateService.getTemplateSteps(id);
        return ResponseEntity.ok(steps);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowTemplateDto> createTemplate(@RequestBody WorkflowTemplateCreateDto templateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Obter o ID do usuário a partir do contexto de segurança
        UUID userId = UUID.fromString(userDetails.getUsername());

        logger.info("Criando novo template de fluxo");

        WorkflowTemplateDto createdTemplate = templateService.createTemplate(templateDto, userId);
        return ResponseEntity.created(null).body(createdTemplate);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<WorkflowTemplateDto> updateTemplate(
            @PathVariable UUID id,
            @RequestBody WorkflowTemplateCreateDto templateDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Obter o ID do usuário a partir do contexto de segurança
        UUID userId = UUID.fromString(userDetails.getUsername());

        // Verificar se o usuário tem permissão para modificar o template
        if (!templateService.canUserModifyTemplate(userId, id)) {
            logger.warn("Usuário {} tentou modificar template {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para modificar este template");
        }

        logger.info("Atualizando template de fluxo: {}", id);

        WorkflowTemplateDto updatedTemplate = templateService.updateTemplate(id, templateDto);
        return ResponseEntity.ok(updatedTemplate);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Obter o ID do usuário a partir do contexto de segurança
        UUID userId = UUID.fromString(userDetails.getUsername());

        // Verificar se o usuário tem permissão para excluir o template
        if (!templateService.canUserModifyTemplate(userId, id)) {
            logger.warn("Usuário {} tentou excluir template {} sem permissão", userId, id);
            return ResponseUtil.forbidden("Você não tem permissão para excluir este template");
        }

        logger.info("Excluindo template de fluxo: {}", id);

        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}