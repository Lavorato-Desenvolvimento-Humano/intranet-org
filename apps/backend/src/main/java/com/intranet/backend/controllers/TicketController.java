package com.intranet.backend.controllers;

import com.intranet.backend.dto.DashboardStatsDto;
import com.intranet.backend.dto.TicketCreateRequest;
import com.intranet.backend.dto.TicketRatingRequest;
import com.intranet.backend.dto.TicketResponseDto;
import com.intranet.backend.model.Ticket;
import com.intranet.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketResponseDto>> getAll(
            @RequestParam(required = false) String assigneeId,
            @RequestParam(required = false) String requesterId,
            @RequestParam(required = false) String status
    ) {
        List<TicketResponseDto> tickets = ticketService.getAllTickets(assigneeId, requesterId, status);
        return ResponseEntity.ok(tickets);
    }

    @PostMapping
    public ResponseEntity<TicketResponseDto> create(
            @RequestPart("data") @Valid TicketCreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, file));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<TicketResponseDto> claimTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.claimTicket(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDto> getById(@PathVariable Long id){
        return ResponseEntity.ok(ticketService.getTicketByIdResponse(id));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<TicketResponseDto> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.resolveTicket(id));
    }

    @PatchMapping("/{id}/rate")
    public ResponseEntity<TicketResponseDto> rate(
            @PathVariable Long id,
            @RequestBody @Valid TicketRatingRequest request
    ) {
        return ResponseEntity.ok(ticketService.rateTicket(id, request));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        // TODO: Adicionar @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
        return ResponseEntity.ok(ticketService.getDashboardStats());
    }
}
