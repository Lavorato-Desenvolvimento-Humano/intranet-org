package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionCreateRequest {

    @NotBlank(message = "O nome da permissão é obrigatório")
    @Pattern(regexp = "^[a-z0-9:]+$", message = "O nome da permissão deve conter apenas letras minúsculas, números e dois pontos")
    private String name;

    private String description;
}