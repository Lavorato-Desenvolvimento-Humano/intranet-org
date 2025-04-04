package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DemandaEvent {
    private UUID id;
    private String title;
    private LocalDateTime start;
    private LocalDateTime end;
    private String status;
    private String prioridade;
}
