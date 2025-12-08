package com.intranet.backend.controllers;


import com.intranet.backend.dto.EspecialidadeCreateRequest;
import com.intranet.backend.dto.EspecialidadeDto;
import com.intranet.backend.service.EspecialidadeService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/especialidades")
@RequiredArgsConstructor
public class EspecialidadeController {

    private final EspecialidadeService especialidadeService;

    @GetMapping
    public ResponseEntity<List<EspecialidadeDto>> getAll() {
        return ResponseEntity.ok(especialidadeService.findAll());
    }

    @GetMapping("{id}")
    public ResponseEntity<EspecialidadeDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(especialidadeService.findById(id));
    }

    @GetMapping("/ativas")
    public ResponseEntity<List<EspecialidadeDto>> getAtivas() {
        return ResponseEntity.ok(especialidadeService.findAtivas());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<EspecialidadeDto> create(@Valid @RequestBody EspecialidadeCreateRequest request) {
        return ResponseUtil.created(especialidadeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<EspecialidadeDto> update(@PathVariable UUID id, @Valid @RequestBody EspecialidadeCreateRequest request) {
        return ResponseEntity.ok(especialidadeService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-ativo")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> toggleAtivo(@PathVariable UUID id) {
        especialidadeService.toggleAtivo(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        especialidadeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
