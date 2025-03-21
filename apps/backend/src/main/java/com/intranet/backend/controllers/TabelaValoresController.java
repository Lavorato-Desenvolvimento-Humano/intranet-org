package com.intranet.backend.controllers;

import com.intranet.backend.dto.TabelaValoresCreateDto;
import com.intranet.backend.dto.TabelaValoresDto;
import com.intranet.backend.service.TabelaValoresService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tabelas-valores")
@RequiredArgsConstructor
public class TabelaValoresController {

    private static final Logger logger = LoggerFactory.getLogger(TabelaValoresController.class);
    private final TabelaValoresService tabelaValoresService;

    @GetMapping
    public ResponseEntity<Page<TabelaValoresDto>> getAllTabelas(
            @PageableDefault(size = 10, sort = "nome") Pageable pageable) {
        logger.info("Requisição para listar todas as tabelas de valores");
        Page<TabelaValoresDto> tabelas = tabelaValoresService.getAllTabelas(pageable);
        return ResponseEntity.ok(tabelas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TabelaValoresDto> getTabelaById(@PathVariable UUID id) {
        logger.info("Requisição para buscar tabela de valores com ID: {}", id);
        TabelaValoresDto tabela = tabelaValoresService.getTabelaById(id);
        return ResponseEntity.ok(tabela);
    }

    @GetMapping("/convenio/{convenioId}")
    public ResponseEntity<List<TabelaValoresDto>> getTabelasByConvenioId(@PathVariable UUID convenioId) {
        logger.info("Requisição para listar tabelas de valores do convênio com ID: {}", convenioId);
        List<TabelaValoresDto> tabelas = tabelaValoresService.getTabelasByConvenioId(convenioId);
        return ResponseEntity.ok(tabelas);
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<TabelaValoresDto>> getTabelasByCurrentUser() {
        logger.info("Requisição para listar tabelas de valores do usuário atual");
        List<TabelaValoresDto> tabelas = tabelaValoresService.getTabelasByCurrentUser();
        return ResponseEntity.ok(tabelas);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<TabelaValoresDto> createTabela(@Valid @RequestBody TabelaValoresCreateDto tabelaCreateDto) {
        logger.info("Requisição para criar nova tabela de valores: {}", tabelaCreateDto.getNome());
        TabelaValoresDto createdTabela = tabelaValoresService.createTabela(tabelaCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTabela);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<TabelaValoresDto> updateTabela(
            @PathVariable UUID id,
            @Valid @RequestBody TabelaValoresCreateDto tabelaUpdateDto) {
        logger.info("Requisição para atualizar tabela de valores com ID: {}", id);
        TabelaValoresDto updatedTabela = tabelaValoresService.updateTabela(id, tabelaUpdateDto);
        return ResponseEntity.ok(updatedTabela);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Void> deleteTabela(@PathVariable UUID id) {
        logger.info("Requisição para deletar tabela de valores com ID: {}", id);
        tabelaValoresService.deleteTabela(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/convenio/{convenioId}/count")
    public ResponseEntity<Long> countTabelasByConvenioId(@PathVariable UUID convenioId) {
        logger.info("Requisição para contar tabelas de valores do convênio com ID: {}", convenioId);
        long count = tabelaValoresService.countTabelasByConvenioId(convenioId);
        return ResponseEntity.ok(count);
    }
}