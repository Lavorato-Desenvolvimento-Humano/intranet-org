package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatsDto {
    // Contagens por status
    private int totalWorkflows;
    private int inProgressCount;
    private int pausedCount;
    private int completedCount;
    private int canceledCount;
    private int archivedCount;

    // Contagens por prioridade
    private int lowPriorityCount;
    private int mediumPriorityCount;
    private int highPriorityCount;
    private int urgentPriorityCount;

    // Contagens por visibilidade
    private int publicCount;
    private int restrictedCount;
    private int teamCount;

    // Estatísticas de prazos
    private int overdueCount;
    private int nearDeadlineCount;
    private int onTrackCount;

    // Estatísticas agregadas
    private int totalStepsCount;
    private int completedStepsCount;
    private int averageWorkflowDurationDays;

    // Distribuição por equipe
    private Map<String, Integer> workflowsByTeam;

    // Distribuição por template
    private Map<String, Integer> workflowsByTemplate;

    // Métricas de desempenho
    private double completionRate; // % de fluxos concluídos
    private double onTimeCompletionRate; // % de fluxos concluídos dentro do prazo
    private double averageTimePerStep; // tempo médio por etapa em dias
}