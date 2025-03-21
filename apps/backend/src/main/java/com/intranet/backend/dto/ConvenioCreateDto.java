package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvenioCreateDto {
    @NotBlank(message = "O nome do convênio é obrigatório")
    @Size(min = 2, max = 255, message = "O nome deve ter entre 2 e 255 caracteres")
    private String name;

    private String description;
}
