package com.intranet.backend.controllers;

import com.intranet.backend.dto.TicketCommentRequest;
import com.intranet.backend.dto.TicketInteractionResponseDto;
import com.intranet.backend.model.TicketInteraction;
import com.intranet.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tickets/{ticketId}/interactions")
@RequiredArgsConstructor
public class TicketInteractionController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<List<TicketInteractionResponseDto>> getTimeline(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ticketService.getTicketTimeLine(ticketId));
    }

    @PostMapping(value = "/comments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<TicketInteractionResponseDto> addComent(
            @PathVariable Long ticketId,
            @RequestPart("data") @Valid TicketCommentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ticketService.addComent(ticketId, request.content(), file));
    }
}
