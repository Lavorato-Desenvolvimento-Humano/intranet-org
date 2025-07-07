package com.intranet.backend.service;

import com.intranet.backend.dto.FichaPdfItemDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Consumer;

public interface FichaPdfGeneratorService {

    /**
     * Gera PDF completo com todas as fichas (síncrono)
     */
    byte[] gerarPdfCompleto(List<FichaPdfItemDto> itens, Integer mes, Integer ano);

    /**
     * Gera PDF completo com callback de progresso (assíncrono)
     */
    byte[] gerarPdfCompletoAsync(List<FichaPdfItemDto> itens, Integer mes, Integer ano,
                                 Consumer<Integer> progressCallback);

    /**
     * Gera PDF de uma única ficha
     */
    byte[] gerarPdfFichaUnica(FichaPdfItemDto item);

    /**
     * Lê arquivo PDF salvo
     */
    byte[] lerArquivoPdf(String caminhoArquivo);

    /**
     * Valida template HTML
     */
    boolean validarTemplate(String templateHtml);
}