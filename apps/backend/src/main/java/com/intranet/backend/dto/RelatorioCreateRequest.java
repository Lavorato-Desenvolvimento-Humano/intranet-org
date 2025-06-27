package com.intranet.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class RelatorioCreateRequest {

    @NotNull(message = "Título é obrigatório")
    private String titulo;

    private String descricao;

    @NotNull(message = "Data de início é obrigatória")
    private LocalDateTime periodoInicio;

    @NotNull(message = "Data de fim é obrigatória")
    private LocalDateTime periodoFim;

    // Filtros opcionais
    private UUID usuarioResponsavelId; // Se não informado, usa o usuário atual
    private List<String> status;
    private List<String> especialidades;
    private List<UUID> convenioIds;
    private List<String> unidades; // KIDS, SENIOR
    private String tipoEntidade; // GUIA, FICHA, PACIENTE, TODOS

    // Configurações do relatório
    private Boolean incluirGraficos = true;
    private Boolean incluirEstatisticas = true;
    private String formatoSaida = "PDF"; // PDF, EXCEL (futuro)
}
