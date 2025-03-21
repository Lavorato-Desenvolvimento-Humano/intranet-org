package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImagemCreateRequest {
    @NotBlank(message = "A URL da imagem é obrigatória")
    private String url;

    private String description;
}
