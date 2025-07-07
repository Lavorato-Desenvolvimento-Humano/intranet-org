package com.intranet.backend.service;

import com.intranet.backend.dto.FichaPdfItemDto;

public interface FichaPdfTemplateService {

    /**
     * Gera HTML completo da ficha
     */
    String gerarHtmlFicha(FichaPdfItemDto item);

    /**
     * Gera HTML com template personalizado
     */
    String gerarHtmlComTemplate(FichaPdfItemDto item, String templateNome);

    /**
     * Obtém template padrão
     */
    String getTemplatePadrao();

    /**
     * Converte imagem para base64
     */
    String imagemParaBase64(String caminhoImagem);
}
