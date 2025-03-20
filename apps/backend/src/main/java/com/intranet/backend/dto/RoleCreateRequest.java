package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleCreateRequest {

    @NotBlank(message = "O nome da role é obrigatório")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "O nome da role deve conter apenas letras maiúsculas, números e underscores")
    private String name;

    private String description;

    private List<Integer> permissionIds;
}