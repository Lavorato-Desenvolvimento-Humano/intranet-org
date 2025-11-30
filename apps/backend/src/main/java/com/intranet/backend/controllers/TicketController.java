package com.intranet.backend.controllers;

import com.intranet.backend.dto.DashboardStatsDto;
import com.intranet.backend.dto.TicketCreateRequest;
import com.intranet.backend.model.Ticket;
import com.intranet.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<Ticket> create(
            @RequestPart("data") @Valid TicketCreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ){
        Ticket createdTicket = ticketService.createTicket(request, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<Ticket> claimTicket(@PathVariable Long id) {
        Ticket updatedTicket = ticketService.claimTicket(id);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getById(@PathVariable Long id){
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        // TODO: Adicionar @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
        return ResponseEntity.ok(ticketService.getDashboardStats());
    }
}
