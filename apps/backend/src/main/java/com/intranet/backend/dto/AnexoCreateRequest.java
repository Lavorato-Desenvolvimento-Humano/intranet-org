package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnexoCreateRequest {
    @NotBlank(message = "O nome do arquivo é obrigatório")
    private String nameFile;

    private String typeFile;

    @NotBlank(message = "A URL do anexo é obrigatória")
    private String url;
}