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
public class GuiaUpdateRequest {

    @Size(min = 1, max = 10, message = "Máximo de 10 especialidades")
    private List<@NotBlank(message = "Especialidade não pode ser vazia") String> especialidades;

    @Min(value = 1, message = "A quantidade autorizada deve ser maior que zero")
    @Max(value = 999, message = "A quantidade autorizada não pode ser maior que 999")
    private Integer quantidadeAutorizada;

    private UUID convenioId;

    @Min(value = 1, message = "O mês deve ser pelo menos 1")
    @Max(value = 12, message = "O mês não pode ser maior que 12")
    private Integer mes;

    @Min(value = 2020, message = "O ano deve ser pelo menos 2020")
    private Integer ano;

    private LocalDate validade;

    @Size(max = 100, message = "O lote deve ter no máximo 100 caracteres")
    private String lote;

    @Min(value = 0, message = "A quantidade faturada não pode ser negativa")
    private Integer quantidadeFaturada;

    @DecimalMin(value = "0.0", message = "O valor não pode ser negativo")
    @DecimalMax(value = "999999.99", message = "O valor não pode exceder 999.999,99")
    private BigDecimal valorReais;


}
