package com.intranet.backend.controllers;

import com.intranet.backend.dto.TicketCommentRequest;
import com.intranet.backend.dto.TicketInteractionResponseDto;
import com.intranet.backend.model.TicketInteraction;
import com.intranet.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets/{ticketId}/interactions")
@RequiredArgsConstructor
public class TicketInteractionController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketInteractionResponseDto>> getTimeline(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ticketService.getTicketTimeLine(ticketId));
    }

    @PostMapping("/comments")
    public ResponseEntity<TicketInteractionResponseDto> addComent(
            @PathVariable Long ticketId,
            @RequestBody @Valid TicketCommentRequest request
    ) {
        return ResponseEntity.ok(ticketService.addComent(ticketId, request.content()));
    }
}
