package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostagemUpdateRequest {
    private String title;
    private String text;
    private UUID convenioId;
    private List<ImagemCreateRequest> imagens;
    private List<AnexoCreateRequest> anexos;
    private List<TabelaPostagemCreateRequest> tabelas;
}