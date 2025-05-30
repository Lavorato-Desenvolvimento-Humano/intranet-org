package com.intranet.backend.service.impl;

import com.intranet.backend.dto.WorkflowTemplateCreateDto;
import com.intranet.backend.dto.WorkflowTemplateDto;
import com.intranet.backend.dto.WorkflowTemplateStepCreateDto;
import com.intranet.backend.dto.WorkflowTemplateStepDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.User;
import com.intranet.backend.model.WorkflowTemplate;
import com.intranet.backend.model.WorkflowTemplateStep;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.WorkflowRepository;
import com.intranet.backend.repository.WorkflowTemplateRepository;
import com.intranet.backend.repository.WorkflowTemplateStepRepository;
import com.intranet.backend.service.WorkflowTemplateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowTemplateServiceImpl implements WorkflowTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowTemplateServiceImpl.class);

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowTemplateStepRepository stepRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public WorkflowTemplateDto createTemplate(WorkflowTemplateCreateDto templateDto, UUID createdById) {
        logger.info("Criando novo template de fluxo para usuário: {}", createdById);

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + createdById));

        WorkflowTemplate template = new WorkflowTemplate();
        template.setName(templateDto.getName());
        template.setDescription(templateDto.getDescription());
        template.setVisibility(templateDto.getVisibility());
        template.setCreatedBy(createdBy);

        // Salvar o template primeiro para obter o ID
        WorkflowTemplate savedTemplate = templateRepository.save(template);

        // Criar uma nova coleção para os passos
        if (templateDto.getSteps() != null) {
            for (WorkflowTemplateStepCreateDto stepDto : templateDto.getSteps()) {
                WorkflowTemplateStep step = new WorkflowTemplateStep();
                step.setTemplate(savedTemplate);
                step.setName(stepDto.getName());
                step.setDescription(stepDto.getDescription());
                step.setStepOrder(stepDto.getStepOrder());

                // Salvar cada passo individualmente
                stepRepository.save(step);
            }
        }

        // Buscar o template novamente com os passos já carregados
        WorkflowTemplate finalTemplate = templateRepository.findById(savedTemplate.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado após criação"));

        logger.info("Template de fluxo criado com sucesso: {}", finalTemplate.getId());
        return mapToTemplateDto(finalTemplate, 0);
    }

    @Override
    @Transactional
    public WorkflowTemplateDto updateTemplate(UUID templateId, WorkflowTemplateCreateDto templateDto) {
        logger.info("Atualizando template de fluxo: {}", templateId);

        WorkflowTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Atualizar campos básicos
        template.setName(templateDto.getName());
        template.setDescription(templateDto.getDescription());
        template.setVisibility(templateDto.getVisibility());

        if (templateDto.getSteps() != null) {
            // Criar um mapa com os passos existentes para referência rápida
            Map<Integer, WorkflowTemplateStep> existingStepsByOrder = new HashMap<>();
            for (WorkflowTemplateStep existingStep : template.getSteps()) {
                existingStepsByOrder.put(existingStep.getStepOrder(), existingStep);
            }

            // Criar uma lista dos novos passos
            List<WorkflowTemplateStep> updatedSteps = new ArrayList<>();

            for (WorkflowTemplateStepCreateDto stepDto : templateDto.getSteps()) {
                // Verificar se já existe um passo com essa ordem
                WorkflowTemplateStep step = existingStepsByOrder.get(stepDto.getStepOrder());

                if (step != null) {
                    // Atualizar o passo existente
                    step.setName(stepDto.getName());
                    step.setDescription(stepDto.getDescription());
                    updatedSteps.add(step);
                    // Remover do mapa para indicar que foi processado
                    existingStepsByOrder.remove(stepDto.getStepOrder());
                } else {
                    // Criar um novo passo
                    WorkflowTemplateStep newStep = new WorkflowTemplateStep();
                    newStep.setTemplate(template);
                    newStep.setName(stepDto.getName());
                    newStep.setDescription(stepDto.getDescription());
                    newStep.setStepOrder(stepDto.getStepOrder());
                    updatedSteps.add(newStep);
                }
            }

            // Limpar a coleção existente e adicionar os passos atualizados
            template.getSteps().clear();
            template.getSteps().addAll(updatedSteps);
        }

        // Salvar o template com as alterações
        WorkflowTemplate updatedTemplate = templateRepository.save(template);

        // Calcular o número de workflows que usam este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);

        logger.info("Template de fluxo atualizado com sucesso: {}", updatedTemplate.getId());
        return mapToTemplateDto(updatedTemplate, workflowCount);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowTemplateDto getTemplateById(UUID templateId) {
        logger.info("Buscando template de fluxo por ID: {}", templateId);

        WorkflowTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Contar fluxos que usam este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);

        return mapToTemplateDto(template, workflowCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowTemplateDto> getAllTemplates(Pageable pageable) {
        logger.info("Buscando todos os templates de fluxo com paginação");

        // Modificar a consulta para buscar templates com suas coleções carregadas
        Page<WorkflowTemplate> templates = templateRepository.findAll(pageable);

        // Usar uma abordagem diferente para mapear
        List<WorkflowTemplateDto> dtoList = new ArrayList<>();

        for (WorkflowTemplate template : templates.getContent()) {
            try {
                // Carregar manualmente o contador de workflows
                int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());

                // Criar DTO com dados básicos
                WorkflowTemplateDto dto = new WorkflowTemplateDto();
                dto.setId(template.getId());
                dto.setName(template.getName());
                dto.setDescription(template.getDescription());
                dto.setVisibility(template.getVisibility());

                if (template.getCreatedBy() != null) {
                    dto.setCreatedById(template.getCreatedBy().getId());
                    dto.setCreatedByName(template.getCreatedBy().getFullName());
                }

                dto.setWorkflowCount(workflowCount);
                dto.setCreatedAt(template.getCreatedAt());
                dto.setUpdatedAt(template.getUpdatedAt());

                // Buscar os passos separadamente para evitar problemas de lazy loading
                List<WorkflowTemplateStepDto> stepDtoList = new ArrayList<>();
                List<WorkflowTemplateStep> steps = stepRepository.findByTemplateIdOrderByStepOrder(template.getId());

                for (WorkflowTemplateStep step : steps) {
                    WorkflowTemplateStepDto stepDto = new WorkflowTemplateStepDto();
                    stepDto.setId(step.getId());
                    stepDto.setTemplateId(template.getId());
                    stepDto.setName(step.getName());
                    stepDto.setDescription(step.getDescription());
                    stepDto.setStepOrder(step.getStepOrder());
                    stepDtoList.add(stepDto);
                }

                dto.setSteps(stepDtoList);
                dtoList.add(dto);
            } catch (Exception e) {
                logger.error("Erro ao processar template {}: {}", template.getId(), e.getMessage());
                // Continuar para o próximo template
            }
        }

        // Converter para Page
        return new PageImpl<>(dtoList, pageable, templates.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTemplateDto> getTemplatesByCreatedBy(UUID createdById) {
        logger.info("Buscando templates criados pelo usuário: {}", createdById);

        List<WorkflowTemplate> templates = templateRepository.findByCreatedById(createdById);

        return templates.stream()
                .map(template -> {
                    int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());
                    return mapToTemplateDto(template, workflowCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTemplateDto> getVisibleTemplates(UUID userId) {
        logger.info("Buscando templates visíveis para o usuário: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));

        // Obter equipes do usuário
        List<UUID> equipeIds = userRepository.findUserIdsByEquipeId(userId);
        UUID teamId = !equipeIds.isEmpty() ? equipeIds.get(0) : null;

        List<WorkflowTemplate> templates;
        if (teamId != null) {
            templates = templateRepository.findVisibleTemplates(userId, teamId);
        } else {
            // Se o usuário não tem equipe, mostrar apenas templates públicos e os que ele criou
            templates = templateRepository.findPublicTemplates();
            templates.addAll(templateRepository.findByCreatedById(userId));
            // Remover duplicatas
            templates = templates.stream().distinct().collect(Collectors.toList());
        }

        return templates.stream()
                .map(template -> {
                    int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());
                    return mapToTemplateDto(template, workflowCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTemplateStepDto> getTemplateSteps(UUID templateId) {
        logger.info("Buscando passos do template: {}", templateId);

        List<WorkflowTemplateStep> steps = stepRepository.findByTemplateIdOrderByStepOrder(templateId);

        return steps.stream()
                .map(this::mapToStepDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID templateId) {
        logger.info("Excluindo template de fluxo: {}", templateId);

        WorkflowTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Verificar se existem fluxos utilizando este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);
        if (workflowCount > 0) {
            throw new IllegalStateException("Não é possível excluir o template pois existem " + workflowCount + " fluxos ativos que o utilizam.");
        }

        templateRepository.delete(template);
        logger.info("Template de fluxo excluído com sucesso: {}", templateId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserModifyTemplate(UUID userId, UUID templateId) {
        WorkflowTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Verificar se o usuário é o criador do template
        return template.getCreatedBy().getId().equals(userId);
    }

    /**
     * Mapeia um WorkflowTemplate para um WorkflowTemplateDto
     */
    private WorkflowTemplateDto mapToTemplateDto(WorkflowTemplate template, int workflowCount) {
        WorkflowTemplateDto dto = new WorkflowTemplateDto();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setDescription(template.getDescription());
        dto.setVisibility(template.getVisibility());

        if (template.getCreatedBy() != null) {
            dto.setCreatedById(template.getCreatedBy().getId());
            dto.setCreatedByName(template.getCreatedBy().getFullName());
        }

        dto.setWorkflowCount(workflowCount);
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());

        // Buscar passos separadamente para evitar problemas de lazy loading
        List<WorkflowTemplateStepDto> stepDtoList = new ArrayList<>();
        List<WorkflowTemplateStep> steps = stepRepository.findByTemplateIdOrderByStepOrder(template.getId());

        for (WorkflowTemplateStep step : steps) {
            WorkflowTemplateStepDto stepDto = new WorkflowTemplateStepDto();
            stepDto.setId(step.getId());
            stepDto.setTemplateId(template.getId());
            stepDto.setName(step.getName());
            stepDto.setDescription(step.getDescription());
            stepDto.setStepOrder(step.getStepOrder());
            stepDtoList.add(stepDto);
        }

        dto.setSteps(stepDtoList);
        return dto;
    }

    /**
     * Mapeia um WorkflowTemplateStep para um WorkflowTemplateStepDto
     */
    private WorkflowTemplateStepDto mapToStepDto(WorkflowTemplateStep step) {
        WorkflowTemplateStepDto dto = new WorkflowTemplateStepDto();
        dto.setId(step.getId());
        dto.setTemplateId(step.getTemplate().getId());
        dto.setName(step.getName());
        dto.setDescription(step.getDescription());
        dto.setStepOrder(step.getStepOrder());
        return dto;
    }
}