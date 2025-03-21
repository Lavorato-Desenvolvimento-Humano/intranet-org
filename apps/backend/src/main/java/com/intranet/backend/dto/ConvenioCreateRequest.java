package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

// DTO para criação de convênio
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvenioCreateRequest {
    @NotBlank(message = "O nome do convênio é obrigatório")
    private String name;

    private String description;
}