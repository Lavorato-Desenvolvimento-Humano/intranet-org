package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkloadDto {
    private UUID userId;
    private String userName;
    private String userEmail;
    private String profileImage;
    private int activeAssignmentsCount;
    private int pendingAssignmentsCount;
    private int totalAssignmentsCount;
    private int overdueAssignmentsCount;
    private double workloadPercentage; // 0-100% com base em threshold definido
    private boolean isOverloaded; // true se workloadPercentage > thresholdPercentage
    private List<WorkflowAssignmentDto> activeAssignments;
}