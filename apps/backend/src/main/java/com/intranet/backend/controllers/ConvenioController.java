package com.intranet.backend.controllers;

import com.intranet.backend.dto.ConvenioCreateRequest;
import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.ConvenioSimpleDto;
import com.intranet.backend.dto.ConvenioUpdateRequest;
import com.intranet.backend.service.ConvenioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/convenios")
@RequiredArgsConstructor
public class ConvenioController {

    private static final Logger logger = LoggerFactory.getLogger(ConvenioController.class);
    private final ConvenioService convenioService;

    @GetMapping
    public ResponseEntity<List<ConvenioSimpleDto>> getAllConvenios() {
        logger.info("Requisição para listar todos os convênios");
        return ResponseEntity.ok(convenioService.getAllConvenios());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConvenioDto> getConvenioById(@PathVariable UUID id) {
        logger.info("Requisição para buscar convênio com ID: {}", id);
        return ResponseEntity.ok(convenioService.getConvenioById(id));
    }

    @GetMapping("/with-postagens")
    public ResponseEntity<List<ConvenioDto>> getConveniosWithPostagens() {
        logger.info("Requisição para listar todos os convênios com suas postagens");
        return ResponseEntity.ok(convenioService.getConveniosWithPostagens());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConvenioDto> createConvenio(@Valid @RequestBody ConvenioCreateRequest request) {
        logger.info("Requisição para criar novo convênio: {}", request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(convenioService.createConvenio(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConvenioDto> updateConvenio(
            @PathVariable UUID id,
            @Valid @RequestBody ConvenioUpdateRequest request) {
        logger.info("Requisição para atualizar convênio com ID: {}", id);
        return ResponseEntity.ok(convenioService.updateConvenio(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConvenio(@PathVariable UUID id) {
        logger.info("Requisição para excluir convênio com ID: {}", id);
        convenioService.deleteConvenio(id);
        return ResponseEntity.noContent().build();
    }
}
