package com.intranet.backend.controllers;

import com.intranet.backend.dto.ConvenioCreateDto;
import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.PostagemSummaryDto;
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
    public ResponseEntity<List<ConvenioDto>> getAllConvenios() {
        logger.info("Requisição para listar todos os convênios recebida");
        try {
            List<ConvenioDto> convenios = convenioService.getAllConvenios();
            logger.info("Retornando {} convênios", convenios.size());
            return ResponseEntity.ok(convenios);
        } catch (Exception e) {
            logger.error("Erro ao buscar convênios: ", e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConvenioDto> getConvenioById(@PathVariable UUID id) {
        logger.info("Requisição para buscar convênio com ID: {}", id);
        ConvenioDto convenio = convenioService.getConvenioById(id);
        return ResponseEntity.ok(convenio);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ConvenioDto> createConvenio(@Valid @RequestBody ConvenioCreateDto convenioCreateDto) {
        logger.info("Requisição para criar novo convênio: {}", convenioCreateDto.getName());
        ConvenioDto createdConvenio = convenioService.createConvenio(convenioCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdConvenio);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ConvenioDto> updateConvenio(
            @PathVariable UUID id,
            @Valid @RequestBody ConvenioCreateDto convenioCreateDto) {
        logger.info("Requisição para atualizar convênio com ID: {}", id);
        ConvenioDto updatedConvenio = convenioService.updateConvenio(id, convenioCreateDto);
        return ResponseEntity.ok(updatedConvenio);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConvenio(@PathVariable UUID id) {
        logger.info("Requisição para deletar convênio com ID: {}", id);
        convenioService.deleteConvenio(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/postagens")
    public ResponseEntity<List<PostagemSummaryDto>> getPostagensByConvenioId(@PathVariable UUID id) {
        logger.info("Requisição para listar postagens do convênio com ID: {}", id);
        List<PostagemSummaryDto> postagens = convenioService.getPostagensByConvenioId(id);
        return ResponseEntity.ok(postagens);
    }

    @GetMapping("/{id}/postagens/count")
    public ResponseEntity<Long> countPostagensByConvenioId(@PathVariable UUID id) {
        logger.info("Requisição para contar postagens do convênio com ID: {}", id);
        long count = convenioService.countPostagensByConvenioId(id);
        return ResponseEntity.ok(count);
    }
}