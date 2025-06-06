package com.intranet.backend.dto;

import com.intranet.backend.model.Paciente;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteUpdateRequest {

    @Size(min = 2, max = 255, message = "O nome deve ter entre 2 e 255 caracteres")
    private String nome;

    private LocalDate dataNascimento;

    @Size(max = 255, message = "O nome do responsável ter no máximo 255 caracteres")
    private String responsavel;

    private UUID convenioId;

    private Paciente.UnidadeEnum unidade;

}
