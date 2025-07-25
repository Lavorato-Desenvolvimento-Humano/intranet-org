package com.intranet.backend.service;

import com.intranet.backend.dto.FichaPdfItemDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Consumer;

public interface FichaPdfGeneratorService {

    /**
     * Gera PDF completo com todas as fichas (síncrono)
     * @param itens Lista de itens para gerar fichas
     * @param mes Mês de referência
     * @param ano Ano de referência
     * @return bytes do PDF gerado
     */
    byte[] gerarPdfCompleto(List<FichaPdfItemDto> itens, Integer mes, Integer ano);

    /**
     * Gera PDF completo com callback de progresso (assíncrono)
     * @param itens Lista de itens para gerar fichas
     * @param mes Mês de referência
     * @param ano Ano de referência
     * @param progressCallback Callback para acompanhar progresso
     * @return bytes do PDF gerado
     */
    byte[] gerarPdfCompletoAsync(List<FichaPdfItemDto> itens, Integer mes, Integer ano,
                                 Consumer<Integer> progressCallback);

    /**
     * Gera PDF de uma única ficha
     * @param item Item para gerar a ficha
     * @return bytes do PDF da ficha única
     */
    byte[] gerarPdfFichaUnica(FichaPdfItemDto item);

    /**
     * Método alternativo para compatibilidade (alias para gerarPdfCompleto)
     * DEPRECATED: Use gerarPdfCompleto ou gerarPdfCompletoAsync
     * @param itens Lista de itens para gerar fichas
     * @return bytes do PDF gerado
     */
    @Deprecated
    default byte[] gerarPdfFichas(List<FichaPdfItemDto> itens) {
        // Buscar mês e ano do primeiro item ou usar valores padrão
        Integer mes = itens.isEmpty() ? java.time.LocalDate.now().getMonthValue() : itens.get(0).getMes();
        Integer ano = itens.isEmpty() ? java.time.LocalDate.now().getYear() : itens.get(0).getAno();
        return gerarPdfCompleto(itens, mes, ano);
    }

    /**
     * Lê arquivo PDF salvo do sistema de arquivos
     * @param caminhoArquivo Caminho completo do arquivo
     * @return bytes do arquivo PDF
     */
    byte[] lerArquivoPdf(String caminhoArquivo);

    /**
     * Salva bytes de PDF no sistema de arquivos
     * DEPRECATED: Esta funcionalidade foi movida para FichaPdfService
     * @param pdfBytes Bytes do PDF
     * @param jobId ID do job
     * @return Caminho do arquivo salvo
     */
    @Deprecated
    default String salvarArquivoPdf(byte[] pdfBytes, String jobId) {
        throw new UnsupportedOperationException(
                "Este método foi movido para FichaPdfService.salvarArquivoPdf(). " +
                        "Use a implementação no serviço apropriado."
        );
    }

    /**
     * Valida se um template HTML pode ser convertido para PDF
     * @param templateHtml Template HTML para validar
     * @return true se o template é válido
     */
    boolean validarTemplate(String templateHtml);
}