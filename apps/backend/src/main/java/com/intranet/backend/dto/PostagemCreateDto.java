package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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

    @NotBlank(message = "O tipo de destino é obrigatório")
    @Pattern(regexp = "geral|equipe|convenio", message = "Tipo de destino inválido")
    private String tipoDestino = "convenio";

    private UUID convenioId;

    private UUID equipeId;

    private boolean pinned;
}
