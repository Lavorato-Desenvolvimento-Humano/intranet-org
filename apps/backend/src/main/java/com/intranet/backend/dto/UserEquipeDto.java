// src/main/java/com/intranet/backend/dto/UserEquipeDto.java
package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserEquipeDto {
    private Long id;
    private UUID userId;
    private String userName;
    private UUID equipeId;
    private String equipeName;
}