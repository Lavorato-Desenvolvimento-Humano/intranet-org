package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemCreateDto {
    @NotBlank(message = "O título é obrigatório")
    @Size(min = 3, max = 255, message = "O título deve ter entre 3 e 255 caracteres")
    private String title;

    @NotBlank(message = "O texto é obrigatório")
    private String text;

    @NotNull(message = "O ID do convênio é obrigatório")
    private UUID convenioId;
}
