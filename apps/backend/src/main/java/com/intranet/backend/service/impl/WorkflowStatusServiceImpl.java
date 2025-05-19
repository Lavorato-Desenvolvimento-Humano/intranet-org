package com.intranet.backend.service.impl;

import com.intranet.backend.dto.WorkflowStatusItemCreateDto;
import com.intranet.backend.dto.WorkflowStatusItemDto;
import com.intranet.backend.dto.WorkflowStatusTemplateCreateDto;
import com.intranet.backend.dto.WorkflowStatusTemplateDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.User;
import com.intranet.backend.model.WorkflowStatusItem;
import com.intranet.backend.model.WorkflowStatusTemplate;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.WorkflowRepository;
import com.intranet.backend.repository.WorkflowStatusItemRepository;
import com.intranet.backend.repository.WorkflowStatusTemplateRepository;
import com.intranet.backend.service.WorkflowStatusService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowStatusServiceImpl implements WorkflowStatusService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowStatusServiceImpl.class);

    private final WorkflowStatusTemplateRepository templateRepository;
    private final WorkflowStatusItemRepository itemRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public WorkflowStatusTemplateDto createStatusTemplate(WorkflowStatusTemplateCreateDto templateDto, UUID createdById) {
        logger.info("Criando novo template de status para usuário: {}", createdById);

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + createdById));

        WorkflowStatusTemplate template = new WorkflowStatusTemplate();
        template.setName(templateDto.getName());
        template.setDescription(templateDto.getDescription());
        template.setCreatedBy(createdBy);

        // Salvar o template primeiro para obter o ID
        WorkflowStatusTemplate savedTemplate = templateRepository.save(template);

        // Criar uma nova coleção para os status
        if (templateDto.getStatusItems() != null) {
            boolean hasInitial = false;

            for (WorkflowStatusItemCreateDto itemDto : templateDto.getStatusItems()) {
                WorkflowStatusItem item = new WorkflowStatusItem();
                item.setTemplate(savedTemplate);
                item.setName(itemDto.getName());
                item.setDescription(itemDto.getDescription());
                item.setColor(itemDto.getColor());
                item.setOrderIndex(itemDto.getOrderIndex());
                item.setInitial(itemDto.isInitial());
                item.setFinal(itemDto.isFinal());

                // Verificar se já existe um status inicial
                if (itemDto.isInitial()) {
                    if (hasInitial) {
                        throw new IllegalStateException("Só pode haver um status inicial por template");
                    }
                    hasInitial = true;
                }

                // Salvar cada status individualmente
                itemRepository.save(item);
            }

            // Verificar se existe pelo menos um status inicial
            if (!hasInitial && !templateDto.getStatusItems().isEmpty()) {
                // Definir o primeiro status como inicial se nenhum foi definido
                WorkflowStatusItem firstItem = itemRepository.findByTemplateIdOrderByOrderIndex(savedTemplate.getId()).get(0);
                firstItem.setInitial(true);
                itemRepository.save(firstItem);
            }
        }

        // Buscar o template novamente com os status já carregados
        WorkflowStatusTemplate finalTemplate = templateRepository.findById(savedTemplate.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado após criação"));

        logger.info("Template de status criado com sucesso: {}", finalTemplate.getId());
        return mapToTemplateDto(finalTemplate, 0);
    }

    @Override
    @Transactional
    public WorkflowStatusTemplateDto updateStatusTemplate(UUID templateId, WorkflowStatusTemplateCreateDto templateDto) {
        logger.info("Atualizando template de status: {}", templateId);

        WorkflowStatusTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + templateId));

        // Atualizar campos básicos
        template.setName(templateDto.getName());
        template.setDescription(templateDto.getDescription());

        if (templateDto.getStatusItems() != null) {
            // Criar um mapa com os status existentes para referência rápida
            Map<Integer, WorkflowStatusItem> existingItemsByOrder = new HashMap<>();
            for (WorkflowStatusItem existingItem : template.getStatusItems()) {
                existingItemsByOrder.put(existingItem.getOrderIndex(), existingItem);
            }

            // Criar uma lista dos novos status
            List<WorkflowStatusItem> updatedItems = new ArrayList<>();
            boolean hasInitial = false;

            for (WorkflowStatusItemCreateDto itemDto : templateDto.getStatusItems()) {
                // Verificar se já existe um status com essa ordem
                WorkflowStatusItem item = existingItemsByOrder.get(itemDto.getOrderIndex());

                if (item != null) {
                    // Atualizar o status existente
                    item.setName(itemDto.getName());
                    item.setDescription(itemDto.getDescription());
                    item.setColor(itemDto.getColor());
                    item.setInitial(itemDto.isInitial());
                    item.setFinal(itemDto.isFinal());
                    updatedItems.add(item);
                    // Remover do mapa para indicar que foi processado
                    existingItemsByOrder.remove(itemDto.getOrderIndex());
                } else {
                    // Criar um novo status
                    WorkflowStatusItem newItem = new WorkflowStatusItem();
                    newItem.setTemplate(template);
                    newItem.setName(itemDto.getName());
                    newItem.setDescription(itemDto.getDescription());
                    newItem.setColor(itemDto.getColor());
                    newItem.setOrderIndex(itemDto.getOrderIndex());
                    newItem.setInitial(itemDto.isInitial());
                    newItem.setFinal(itemDto.isFinal());
                    updatedItems.add(newItem);
                }

                // Verificar se já existe um status inicial
                if (itemDto.isInitial()) {
                    if (hasInitial) {
                        throw new IllegalStateException("Só pode haver um status inicial por template");
                    }
                    hasInitial = true;
                }
            }

            // Verificar se existe pelo menos um status inicial
            if (!hasInitial && !updatedItems.isEmpty()) {
                // Definir o primeiro status como inicial se nenhum foi definido
                updatedItems.get(0).setInitial(true);
            }

            // Limpar a coleção existente e adicionar os status atualizados
            template.getStatusItems().clear();
            template.getStatusItems().addAll(updatedItems);
        }

        // Salvar o template com as alterações
        WorkflowStatusTemplate updatedTemplate = templateRepository.save(template);

        // Calcular o número de workflows que usam este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);

        logger.info("Template de status atualizado com sucesso: {}", updatedTemplate.getId());
        return mapToTemplateDto(updatedTemplate, workflowCount);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowStatusTemplateDto getStatusTemplateById(UUID templateId) {
        logger.info("Buscando template de status por ID: {}", templateId);

        WorkflowStatusTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + templateId));

        // Contar fluxos que usam este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);

        return mapToTemplateDto(template, workflowCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowStatusTemplateDto> getAllStatusTemplates(Pageable pageable) {
        logger.info("Buscando todos os templates de status com paginação");

        Page<WorkflowStatusTemplate> templates = templateRepository.findAll(pageable);

        List<WorkflowStatusTemplateDto> dtoList = new ArrayList<>();

        for (WorkflowStatusTemplate template : templates.getContent()) {
            try {
                // Carregar manualmente o contador de workflows
                int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());

                WorkflowStatusTemplateDto dto = mapToTemplateDto(template, workflowCount);
                dtoList.add(dto);
            } catch (Exception e) {
                logger.error("Erro ao processar template {}: {}", template.getId(), e.getMessage());
            }
        }

        return new PageImpl<>(dtoList, pageable, templates.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowStatusTemplateDto> getStatusTemplatesByCreatedBy(UUID createdById) {
        logger.info("Buscando templates de status criados pelo usuário: {}", createdById);

        List<WorkflowStatusTemplate> templates = templateRepository.findByCreatedById(createdById);

        return templates.stream()
                .map(template -> {
                    int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());
                    return mapToTemplateDto(template, workflowCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowStatusTemplateDto> getAvailableStatusTemplates(UUID userId) {
        logger.info("Buscando templates de status disponíveis para o usuário: {}", userId);

        List<WorkflowStatusTemplate> templates = templateRepository.findAvailableTemplates(userId);

        return templates.stream()
                .map(template -> {
                    int workflowCount = templateRepository.countWorkflowsByTemplateId(template.getId());
                    return mapToTemplateDto(template, workflowCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowStatusItemDto> getStatusItems(UUID templateId) {
        logger.info("Buscando status do template: {}", templateId);

        List<WorkflowStatusItem> items = itemRepository.findByTemplateIdOrderByOrderIndex(templateId);

        return items.stream()
                .map(this::mapToItemDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteStatusTemplate(UUID templateId) {
        logger.info("Excluindo template de status: {}", templateId);

        WorkflowStatusTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + templateId));

        // Verificar se existem fluxos utilizando este template
        int workflowCount = templateRepository.countWorkflowsByTemplateId(templateId);
        if (workflowCount > 0) {
            throw new IllegalStateException("Não é possível excluir o template pois existem " + workflowCount + " fluxos ativos que o utilizam.");
        }

        templateRepository.delete(template);
        logger.info("Template de status excluído com sucesso: {}", templateId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserModifyStatusTemplate(UUID userId, UUID templateId) {
        WorkflowStatusTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + templateId));

        // Verificar se o usuário é o criador do template
        return template.getCreatedBy().getId().equals(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowStatusItemDto getInitialStatus(UUID templateId) {
        logger.info("Buscando status inicial do template: {}", templateId);

        WorkflowStatusItem initialStatus = itemRepository.findInitialStatusByTemplateId(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Status inicial não encontrado para o template com ID: " + templateId));

        return mapToItemDto(initialStatus);
    }

    /**
     * Mapeia um WorkflowStatusTemplate para um WorkflowStatusTemplateDto
     */
    private WorkflowStatusTemplateDto mapToTemplateDto(WorkflowStatusTemplate template, int workflowCount) {
        WorkflowStatusTemplateDto dto = new WorkflowStatusTemplateDto();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setDescription(template.getDescription());

        if (template.getCreatedBy() != null) {
            dto.setCreatedById(template.getCreatedBy().getId());
            dto.setCreatedByName(template.getCreatedBy().getFullName());
        }

        dto.setWorkflowCount(workflowCount);
        dto.setCreatedAt(template.getCreatedAt().toString());
        dto.setUpdatedAt(template.getUpdatedAt().toString());

        // Buscar status separadamente para evitar problemas de lazy loading
        List<WorkflowStatusItemDto> itemDtoList = new ArrayList<>();
        List<WorkflowStatusItem> items = itemRepository.findByTemplateIdOrderByOrderIndex(template.getId());

        for (WorkflowStatusItem item : items) {
            WorkflowStatusItemDto itemDto = mapToItemDto(item);
            itemDtoList.add(itemDto);
        }

        dto.setStatusItems(itemDtoList);
        return dto;
    }

    /**
     * Mapeia um WorkflowStatusItem para um WorkflowStatusItemDto
     */
    private WorkflowStatusItemDto mapToItemDto(WorkflowStatusItem item) {
        WorkflowStatusItemDto dto = new WorkflowStatusItemDto();
        dto.setId(item.getId());
        dto.setTemplateId(item.getTemplate().getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setColor(item.getColor());
        dto.setOrderIndex(item.getOrderIndex());
        dto.setInitial(item.isInitial());
        dto.setFinal(item.isFinal());
        return dto;
    }
}