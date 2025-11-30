package com.intranet.backend.dto;

import java.util.Map;

public record DashboardStatsDto(
        long totalOpen,
        long totalClosedToday,
        double slaCompliancePercentage, // ex: 95.5
        double averageRating,           // ex: 4.2
        Map<String, Long> ticketsByStatus, // OPEN: 10, IN_PROGRESS: 5
        Map<String, Long> ticketsByPriority
) {}
