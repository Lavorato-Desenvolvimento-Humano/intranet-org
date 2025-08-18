package com.intranet.backend.service;

import com.intranet.backend.dto.FichaPdfItemDto;
import com.intranet.backend.model.ConvenioFichaPdfConfig;
import org.springframework.stereotype.Service;

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
     * NOVO: Gera HTML com template específico para um convênio
     * @param item Dados da ficha
     * @param convenioNome Nome do convênio (ex: "FUSEX", "CBMDF")
     * @return HTML completo da ficha
     */
    String gerarHtmlComTemplateConvenio(FichaPdfItemDto item, String convenioNome);

    /**
     *
     * @param item Dados da ficha
     * @param config Configuração especifica do convênio (pode ser null)
     * @return HTML completo da ficha
     */
    String gerarHtmlComConfiguracaoConvenio(FichaPdfItemDto item, ConvenioFichaPdfConfig config);

    /**
     * Obtém template padrão
     */
    String getTemplatePadrao();

    /**
     * Converte imagem para base64
     */
    String imagemParaBase64(String caminhoImagem);

    /**
     * Valida se existe template específico para um convênio
     * @param convenioNome Nome do convênio
     * @return true se existe template específico
     */
    boolean temTemplateEspecifico(String convenioNome);

    /**
     *
     * @param config Configuração do convênio
     * @return true se existe template específico configurado
     */
    boolean temTemplateEspecificoPorConfig(ConvenioFichaPdfConfig config);
}
