package com.intranet.backend.dto;

import com.intranet.backend.model.Paciente;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteDto {
    private UUID id;
    private String nome;
    private LocalDate dataNascimento;
    private String responsavel;
    private UUID convenioId;
    private String convenioNome;
    private Paciente.UnidadeEnum unidade;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long TotalGuias;
}
