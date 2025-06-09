package com.intranet.backend.controllers;

import com.intranet.backend.dto.StatusCreateRequest;
import com.intranet.backend.dto.StatusDto;
import com.intranet.backend.dto.StatusUpdateRequest;
import com.intranet.backend.service.StatusService;
import com.intranet.backend.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/status")
@RequiredArgsConstructor
public class StatusController {

    private static final Logger logger = LoggerFactory.getLogger(StatusController.class);
    private final StatusService statusService;

    @GetMapping
    public ResponseEntity<List<StatusDto>> getStatuses(){
        logger.info("Requisição para listar todos os status");

        List<StatusDto> statuses = statusService.getAllStatuses();
        if (statuses.isEmpty()) {
            logger.warn("Nenhum status encontrado");
            return ResponseEntity.noContent().build();
        }
        logger.info("Total de status encontrados: {}", statuses.size());
        return ResponseEntity.ok(statuses);
    }

    @PostMapping
    public ResponseEntity<StatusDto> createStatus(StatusCreateRequest request) {
        logger.info("Requisição para criar novo status: {}", request.getStatus());

        StatusDto createdStatus = statusService.createStatus(request);
        logger.info("Status criado com sucesso: {}", createdStatus.getId());
        return ResponseUtil.created(createdStatus);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusDto> updateStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest request) {
        logger.info("Requisição para atualizar status com ID: {}", id);

        StatusDto updatedStatus = statusService.updateStatus(id, request);
        logger.info("Status atualizado com sucesso: {}", updatedStatus.getId());
        return ResponseEntity.ok(updatedStatus);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatus(@PathVariable UUID id) {
        logger.info("Requisição para deletar status com ID: {}", id);

        statusService.deleteStatus(id);
        logger.info("Status deletado com sucesso: {}", id);
        return ResponseEntity.noContent().build();
    }


}
