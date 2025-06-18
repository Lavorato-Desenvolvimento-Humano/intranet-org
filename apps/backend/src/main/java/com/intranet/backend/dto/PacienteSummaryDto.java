package com.intranet.backend.dto;

import com.intranet.backend.model.Paciente;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteSummaryDto {
    private UUID id;
    private String nome;
    private String responsavel;
    private LocalDate dataNascimento;
    private String convenioNome;
    private Paciente.UnidadeEnum unidade;
    private long totalGuias;
    private boolean hasGuiasVencidas;
}
