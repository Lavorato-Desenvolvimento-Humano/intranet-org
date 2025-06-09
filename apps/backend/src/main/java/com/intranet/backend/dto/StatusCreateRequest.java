package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusCreateRequest {

    @NotBlank(message = "O Status não pode ser vazio")
    private String status;
}
