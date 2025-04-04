package com.intranet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandaCreateDto {

    @NotBlank(message = "O título é obrigatório")
    @Size(min = 3, max = 100, message = "O título deve ter entre 3 e 100 caracteres")
    private String titulo;

    private String descricao;

    private LocalDateTime dataInicio;

    private LocalDateTime dataFim;

    private UUID atribuidoParaId;

    @Pattern(regexp = "pendente|em_andamento|concluida|cancelada", message = "Status inválido")
    private String status = "pendente";

    @Pattern(regexp = "baixa|media|alta|urgente", message = "Prioridade inválida")
    private String prioridade = "media";
}