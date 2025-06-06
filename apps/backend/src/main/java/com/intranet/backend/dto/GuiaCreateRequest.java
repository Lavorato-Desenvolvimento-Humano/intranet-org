package com.intranet.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaCreateRequest {

    @NotNull(message = "O paciente é obrigatório")
    private UUID pacienteId;

    @NotEmpty(message = "Pelo menos uma especialidade deve ser informada")
    @Size(max = 10, message = "A quantidade máxima de especialidades é 10")
    private List<@NotBlank(message = "Especialidade não pode ser vazia") String> especialidades;

    @NotNull(message = "A quantidade autorizada é obrigatória")
    @Min(value = 1, message = "A quantidade autorizada deve ser pelo menos 1")
    @Max(value = 999, message = "A quantidade autorizada não pode ser maior que 999")
    private Integer quantidadeAutorizada;

    @NotNull(message = "O convenio é obrigatório")
    private UUID convenioId;

    @NotNull(message = "O mês é obrigatório")
    @Min(value = 1, message = "O mês deve ser pelo menos 1")
    @Max(value = 12, message = "O mês não pode ser maior que 12")
    private Integer mes;

    @NotNull(message = "O ano é obrigatório")
    @Min(value = 2000, message = "O ano deve ser pelo menos 2020")
    private Integer ano;

    @NotNull(message = "A data de validade é obrigatória")
    @Future(message = "A data de validade deve ser futura")
    private LocalDate validade;

    @Size(max = 100, message = "O lote deve ter no máximo 100 caracteres")
    private String lote;

    @Min(value = 0, message = "O valor deve ser pelo menos 0")
    private Integer quantidadeFaturada;

    @DecimalMin(value = "0.0", message = "O valor não pode ser negativo")
    @DecimalMax(value = "999999.99", message = "O valor não pode exceder 999.999,99")
    private BigDecimal valorReais = BigDecimal.ZERO;
}
