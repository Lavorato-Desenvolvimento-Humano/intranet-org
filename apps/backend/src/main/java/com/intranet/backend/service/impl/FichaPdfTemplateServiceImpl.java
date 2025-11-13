package com.intranet.backend.service.impl;

import com.intranet.backend.dto.FichaPdfItemDto;
import com.intranet.backend.service.FichaPdfTemplateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.intranet.backend.model.ConvenioFichaPdfConfig;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FichaPdfTemplateServiceImpl implements FichaPdfTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfTemplateServiceImpl.class);

    @Value("${app.ficha-pdf.template.logo-path:classpath:static/images/logo.png}")
    private String logoPath;

    @Value("${app.ficha-pdf.template.templates-path:classpath:templates/fichas}")
    private String templatesPath;

    @Value("${app.ficha-pdf.template.enable-custom-templates:false}")
    private boolean enableCustomTemplates;

    // Cache de templates para performance
    private final Map<String, String> templateCache = new HashMap<>();
    private final Map<String, String> logoCache = new HashMap<>();

    @Override
    public String gerarHtmlFicha(FichaPdfItemDto item) {
        logger.debug("Gerando HTML para ficha: {} - Paciente: {}",
                item.getNumeroIdentificacao(), item.getPacienteNome());

        try {
            String template = getTemplatePadrao();
            return preencherTemplate(template, item);

        } catch (Exception e) {
            logger.error("Erro ao gerar HTML da ficha: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na geração do HTML: " + e.getMessage(), e);
        }
    }

    @Override
    public String gerarHtmlComTemplate(FichaPdfItemDto item, String templateNome) {
        logger.debug("Gerando HTML com template personalizado: {} para ficha: {}",
                templateNome, item.getNumeroIdentificacao());

        try {
            String template = carregarTemplate(templateNome);
            if (template == null) {
                logger.warn("Template {} não encontrado, usando padrão", templateNome);
                template = getTemplatePadrao();
            }

            return preencherTemplate(template, item);

        } catch (Exception e) {
            logger.error("Erro ao gerar HTML com template {}: {}", templateNome, e.getMessage(), e);
            throw new RuntimeException("Erro na geração do HTML: " + e.getMessage(), e);
        }
    }

    @Override
    public String gerarHtmlComTemplateConvenio(FichaPdfItemDto item, String convenioNome) {
        logger.debug("Gerando HTML com template específico para convênio: {} - ficha: {}",
                convenioNome, item.getNumeroIdentificacao());

        try {
            if (isFusexConvenio(convenioNome)) {
                logger.info("✅ FUSEX identificado! Convênio: '{}' - Usando template específico", convenioNome);
                String templateFusex = obterTemplateFusex();
                // CORREÇÃO: Usar preencherTemplate que agora sabe lidar com FUSEX
                return preencherTemplate(templateFusex, item);
            } else if (isCbmdfConvenio(convenioNome)) {
                String templateCbmdf = obterTemplateCbmdf();
                // CORREÇÃO: Usar preencherTemplate que agora sabe lidar com CBMDF
                return preencherTemplate(templateCbmdf, item);
            }

            // Para outros convênios, usar template padrão
            logger.debug("Convênio '{}' não é FUSEX, usando template padrão", convenioNome);
            return gerarHtmlFicha(item);

        } catch (Exception e) {
            logger.error("Erro ao gerar HTML com template do convênio {}: {}", convenioNome, e.getMessage(), e);
            // Fallback para template padrão
            logger.warn("Usando template padrão como fallback para convênio: {}", convenioNome);
            return gerarHtmlFicha(item);
        }
    }


    @Override
    public String gerarHtmlComConfiguracaoConvenio(FichaPdfItemDto item, ConvenioFichaPdfConfig config) {
        logger.debug("Gerando HTML com configuração específica para convênio: {} - ficha: {}",
                config != null ? config.getConvenio().getName() : "null", item.getNumeroIdentificacao());

        try {
            // PRIORIDADE 1: Usar template personalizado da configuração
            if (config != null && StringUtils.hasText(config.getTemplatePersonalizado())) {
                logger.info("✅ Usando template personalizado configurado: {} para convênio: {}",
                        config.getTemplatePersonalizado(), config.getConvenio().getName());

                String template = carregarTemplate(config.getTemplatePersonalizado());
                if (template != null) {
                    return preencherTemplateComConvenio(template, item, config);
                } else {
                    logger.warn("❌ Template personalizado '{}' não encontrado, usando fallback",
                            config.getTemplatePersonalizado());
                }
            }

            // PRIORIDADE 2: Usar template específico baseado no nome (lógica atual - FUSEX)
            if (config != null) {
                String convenioNome = config.getConvenio().getName();
                if (isFusexConvenio(convenioNome)) {
                    logger.info("✅ FUSEX identificado! Convênio: '{}' - Usando template específico", convenioNome);
                    String templateFusex = obterTemplateFusex();
                    return preencherTemplateComConvenio(templateFusex, item, config);
                } else if (isCbmdfConvenio(convenioNome)) {
                    logger.info("✅ CBMDF identificado! Convênio: '{}' - Usando template específico", convenioNome);
                    String templateCbmdf = obterTemplateCbmdf();
                    return preencherTemplateComConvenio(templateCbmdf, item, config);
                }
            }

            // PRIORIDADE 3: Template padrão
            logger.debug("Usando template padrão para convênio: {}",
                    config != null ? config.getConvenio().getName() : "não configurado");
            // CORREÇÃO: Chamar preencherTemplateComConvenio mesmo para o padrão,
            // para que a logo correta (padrão) seja usada.
            return preencherTemplateComConvenio(getTemplatePadrao(), item, config);

        } catch (Exception e) {
            logger.error("Erro ao gerar HTML com configuração do convênio: {}", e.getMessage(), e);
            // Fallback para template padrão
            logger.warn("Usando template padrão como fallback");
            // CORREÇÃO: Chamar preencherTemplateComConvenio para o fallback
            return preencherTemplateComConvenio(getTemplatePadrao(), item, config);
        }
    }

    private boolean isCbmdfConvenio(String convenioNome) {
        if (convenioNome == null) return false;

        String nome = convenioNome.toUpperCase().trim();

        String[] variacoesCbmdf = {
                "CBMDF",
                "CORPO DE BOMBEIROS",
                "CORPO DE BOMBEIROS MILITAR",
                "CORPO DE BOMBEIROS DF",
                "CORPO DE BOMBEIROS DISTRITO FEDERAL",
                "CBMDF - CORPO DE BOMBEIROS",
                "BOMBEIROS DF",
                "BOMBEIROS MILITAR DF",
        };

        for (String variacao : variacoesCbmdf) {
            if (nome.contains(variacao)) {
                logger.debug("✅ Convênio '{}' identificado como CBMDF (variação '{}')", convenioNome, variacao);
                return true;
            }
        }

        logger.debug("❌ Convênio '{}' não é CBMDF", convenioNome);
        return false;
    }

    private boolean isFusexConvenio(String convenioNome) {
        if (convenioNome == null || convenioNome.trim().isEmpty()) {
            logger.debug("Nome do convênio é nulo ou vazio");
            return false;
        }

        String nomeNormalizado = convenioNome.trim().toUpperCase();

        // TODOS os padrões em UPPERCASE (removido "Fusex" da lista)
        String[] padroesFusex = {
                "FUSEX",
                "FUNDO DE SAÚDE DO EXÉRCITO",
                "FUNDO DE SAUDE DO EXERCITO",
                "EXERCITO",
                "EXÉRCITO"
        };

        for (String padrao : padroesFusex) {
            if (nomeNormalizado.contains(padrao)) {
                logger.debug("✅ FUSEX identificado pelo padrão: '{}' em '{}'", padrao, convenioNome);
                return true;
            }
        }

        logger.debug("❌ Convênio '{}' não é FUSEX", convenioNome);
        return false;
    }


    @Override
    public String getTemplatePadrao() {
        // Cache do template padrão
        return templateCache.computeIfAbsent("default", k -> {
            logger.debug("Carregando template padrão");
            return criarTemplatePadrao();
        });
    }

    private String obterTemplateCbmdf() {
        return templateCache.computeIfAbsent("template_cbmdf", k -> {
            logger.debug("Carregando template do CBMDF");
            return criarTemplateCbmdf();
        });
    }

    private String obterTemplateFusex() {
        return templateCache.computeIfAbsent("template_fusex", k -> {
            logger.debug("Carregando template do FUSEX");
            return criarTemplateFusex();
        });
    }

    @Override
    public boolean temTemplateEspecificoPorConfig(ConvenioFichaPdfConfig config) {
        if (config == null) return false;

        // Verifica se tem template personalizado configurado
        if (StringUtils.hasText(config.getTemplatePersonalizado())) {
            // Verificar se o template existe fisicamente
            String template = carregarTemplate(config.getTemplatePersonalizado());
            if (template != null) {
                logger.debug("✅ Template personalizado '{}' encontrado para convênio: {}",
                        config.getTemplatePersonalizado(), config.getConvenio().getName());
                return true;
            } else {
                logger.warn("❌ Template personalizado '{}' configurado mas não encontrado para convênio: {}",
                        config.getTemplatePersonalizado(), config.getConvenio().getName());
            }
        }

        // Fallback: usar a lógica atual baseada no nome
        String convenioNome = config.getConvenio().getName();
        return isFusexConvenio(convenioNome) || isCbmdfConvenio(convenioNome);
    }

    @Override
    public boolean temTemplateEspecifico(String convenioNome) {
        if (convenioNome == null) return false;
        return isFusexConvenio(convenioNome) || isCbmdfConvenio(convenioNome);
    }

    /**
     * Preenche template com logo específica do convênio
     */
    private String preencherTemplateComConvenio(String template, FichaPdfItemDto item, ConvenioFichaPdfConfig config) {
        logger.debug("Preenchendo template com convênio para: {}", item.getPacienteNome());

        String html = template;
        String convenioNome = (config != null && config.getConvenio() != null)
                ? config.getConvenio().getName()
                : item.getConvenioNome();

        try {
            // Logo específica baseada no convênio
            String logoBase64 = obterLogoBase64(convenioNome);
            html = html.replace("{LOGO_BASE64}", logoBase64);

            // Resto do preenchimento
            html = html.replace("{NUMERO_IDENTIFICACAO}",
                    StringUtils.hasText(item.getNumeroIdentificacao()) ? item.getNumeroIdentificacao() : "N/A");

            html = html.replace("{PACIENTE_NOME}",
                    StringUtils.hasText(item.getPacienteNome()) ? item.getPacienteNome() : "Paciente não informado");

            html = html.replace("{ESPECIALIDADE}",
                    StringUtils.hasText(item.getEspecialidade()) ? item.getEspecialidade() : "Não informado");

            html = html.replace("{MES_EXTENSO}",
                    StringUtils.hasText(item.getMesExtenso()) ? item.getMesExtenso() : obterMesExtenso(item.getMes()));

            html = html.replace("{ANO}",
                    item.getAno() != null ? item.getAno().toString() : "2025");

            // Data de geração
            String dataGeracao = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            html = html.replace("{DATA_GERACAO}", dataGeracao);

            // Número da guia
            html = html.replace("{NUMERO_GUIA}",
                    StringUtils.hasText(item.getNumeroGuia()) ? item.getNumeroGuia() : "N/A");

            html = html.replace("{CONVENIO_NOME}",
                    StringUtils.hasText(item.getConvenioNome()) ? item.getConvenioNome() : "Não informado");

            html = html.replace("{UNIDADE}",
                    StringUtils.hasText(item.getUnidade()) ? formatarUnidade(item.getUnidade()) : "Não informado");

            html = html.replace("{QUANTIDADE_AUTORIZADA}",
                    item.getQuantidadeAutorizada() != null ? item.getQuantidadeAutorizada().toString() : "30");

            // --- INÍCIO DA CORREÇÃO ---
            // Tabela de sessões
            // Precisamos saber se estamos preenchendo um template FUSEX ou não

            boolean isFusex = isFusexConvenio(convenioNome);

            String linhasTabela;
            if (isFusex) {
                logger.debug("Gerando linhas da tabela FUSEX (5 colunas)");
                linhasTabela = gerarLinhasTabelaFusex(item.getQuantidadeAutorizada());
            } else {
                logger.debug("Gerando linhas da tabela Padrão/CBMDF (3 colunas)");
                linhasTabela = gerarLinhasTabela(item.getQuantidadeAutorizada());
            }
            html = html.replace("{LINHAS_TABELA}", linhasTabela);
            // --- FIM DA CORREÇÃO ---

            return html;

        } catch (Exception e) {
            logger.error("Erro ao preencher template com convênio: {}", e.getMessage(), e);
            throw new RuntimeException("Erro no preenchimento: " + e.getMessage(), e);
        }
    }

    @Override
    public String imagemParaBase64(String caminhoImagem) {
        try {
            // Cache de imagens convertidas
            return logoCache.computeIfAbsent(caminhoImagem, caminho -> {
                try {
                    logger.debug("Convertendo imagem para base64: {}", caminho);
                    return converterImagemParaBase64(caminho);
                } catch (Exception e) {
                    logger.error("Erro ao converter imagem {}: {}", caminho, e.getMessage());
                    return criarImagemPlaceholder();
                }
            });

        } catch (Exception e) {
            logger.error("Erro ao processar imagem para base64: {}", e.getMessage());
            return criarImagemPlaceholder();
        }
    }

    private String criarTemplatePadrao() {
        return """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha de Assinatura - {NUMERO_IDENTIFICACAO}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
            color: #333;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .header img {
            width: 120px;
            height: auto;
            max-height: 60px;
            object-fit: contain;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            text-align: center;
            flex-grow: 1;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header .identificacao {
            font-size: 13px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            text-align: center;
        }
        
        .info-section {
            background-color: #f9f9f9;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: center;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #333;
        }
        
        .info-value {
            flex-grow: 1;
            padding-left: 10px;
            color: #555;
        }
        
        .table-container {
            margin-top: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        
        .table thead {
            background-color: #f5f5f5;
            border-bottom: 2px solid #ddd;
        }
        
        .table th {
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            border-right: 1px solid #ddd;
            color: #333;
        }
        
        .table th:last-child {
            border-right: none;
        }
        
        .table td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
            border-right: 1px solid #eee;
            text-align: center;
        }
        
        .table td:last-child {
            border-right: none;
        }
        
        .table tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        .table tbody tr:hover {
            background-color: #f0f0f0;
        }
        
        .numero-col {
            width: 8%;
            background-color: #e9ecef;
        }
        
        .data-col {
            width: 25%;
        }
        
        .assinatura-col {
            width: 67%;
        }
        
        .footer {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .footer p {
            margin: 0 0 8px 0;
        }
        
        .footer p:last-child {
            margin-bottom: 0;
        }
        
        .metadata {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
        }
        
        .metadata span {
            flex: 1;
            text-align: center;
        }
        
        .sessao-linha {
            height: 35px;
            line-height: 35px;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .table tbody tr:nth-child(even) {
                background-color: #fafafa !important;
            }
        }
    </style>
    </head>
    <body>
    <div class="header">
        <img src="{LOGO_BASE64}" alt="Logo" />
        <h1>Ficha de Assinatura</h1>
        <div class="identificacao">
            <strong>Nº {NUMERO_IDENTIFICACAO}</strong>
        </div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Paciente:</span>
            <span class="info-value"><strong>{PACIENTE_NOME}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">Especialidade:</span>
            <span class="info-value">{ESPECIALIDADE}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Mês de Referência:</span>
            <span class="info-value">{MES_EXTENSO} de {ANO}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Convênio:</span>
            <span class="info-value">{CONVENIO_NOME}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Unidade:</span>
            <span class="info-value">{UNIDADE}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Quantidade Autorizada:</span>
            <span class="info-value"><strong>{QUANTIDADE_AUTORIZADA} sessões</strong></span>
        </div>
    </div>

    <div class="table-container">
        <table class="table">
            <thead>
                <tr>
                    <th class="numero-col">Nº</th>
                    <th class="data-col">Data de Atendimento</th>
                    <th class="assinatura-col">Assinatura do Responsável</th>
                </tr>
            </thead>
            <tbody>
                {LINHAS_TABELA}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>Instruções:</strong></p>
        <p>1. Preencher a data e assinar a cada atendimento realizado.</p>
        <p>2. Este documento é de uso obrigatório para faturamento junto ao convênio.</p>
        <p>3. Manter o documento em local seguro e apresentar quando solicitado.</p>
    </div>

    <div class="metadata">
        <span>Gerado em: {DATA_GERACAO}</span>
        <span>Guia: {NUMERO_GUIA}</span>
        <span>Sistema: Intranet v2.0</span>
    </div>
    </body>
    </html>
     """;
    }

    /**
     * Template específico para o Cbmdf
     * Baseado no sistema legado em PHP
     */
    private String criarTemplateCbmdf() {
        return """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ficha de Assinatura</title>
        <style>
            @page {
                size: A4;
                margin: 15mm;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                margin: 5px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .header img {
                width: 70px;
                height: auto;
                object-fit: contain;
            }
            .header h1 {
                font-size: 18px;
                margin: 0;
                text-align: center;
                flex-grow: 1;
            }
            .header .identificacao {
                font-size: 14px;
                font-weight: bold;
            }
            .section {
                margin-bottom: 5px;
            }
            .section label {
                display: inline-block;
                width: 200px;
                font-weight: bold;
            }
            .table {
                width: 100%;
                border-collapse: collapse;
            }
            .table th, .table td {
                border: 1px solid #000;
                padding: 5px;
                text-align: center;
            }
            .info-header {
                text-align: left;
                margin-bottom: 5px;
            }
            .footer {
                 margin-top: 20px;
                 padding: 10px;
                 border-top: 1px solid #ccc;
                 font-size: 11px;
            }
            .footer p {
                 margin: 3px 0;
            }
            .metadata {
                  margin-top: 15px;
                  padding: 8px;
                  background-color: #f9f9f9;
                  border: 1px solid #ddd;
                  font-size: 10px;
                  text-align: center;
            }
            .metadata span {
                   margin: 0 15px;
                   color: #666;
            }
            
            .sessao-linha {
                height: 35px;
                line-height: 35px;
            }
            
            .numero-col {
                width: 8%;
            }
            .data-col {
                width: 25%;
            }
            .assinatura-col {
                width: 67%;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="{LOGO_BASE64}" alt="logo-cbmdf">
            <h1>FICHA DE ASSINATURA</h1>
            <div class="identificacao">ID: {NUMERO_IDENTIFICACAO}</div>
        </div>

        <div class="info-header">
            <div class="section">
                <label>Paciente:</label> {PACIENTE_NOME}
            </div>
            <div class="section">
                <label>Especialidade:</label> {ESPECIALIDADE}
            </div>
            <div class="section">
                <label>Mês de referência:</label> {MES_EXTENSO} de {ANO}
            </div>
            <div class="section">
                <label>Convênio:</label> {CONVENIO_NOME}
            </div>
            <div class="section">
                <label>Quantidade Autorizada:</label> {QUANTIDADE_AUTORIZADA} sessões
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th class="numero-col">Nº</th>
                    <th class="data-col">Data de Atendimento</th>
                    <th class="assinatura-col">Assinatura do Responsável</th>
                </tr>
            </thead>
            <tbody>
                {LINHAS_TABELA}
            </tbody>
        </table>
         <div class="footer">
               <p><strong>Instruções:</strong></p>
               <p>1. Preencher a data e assinar a cada atendimento realizado.</p>
               <p>2. Este documento é de uso obrigatório para faturamento junto ao convênio.</p>
               <p>3. Manter o documento em local seguro e apresentar quando solicitado.</p>
         </div>
         <div class="metadata">
                <span>Gerado em: {DATA_GERACAO}</span>
                <span>Sistema: Intranet v2.0</span>
         </div>
    </body>
    </html>
    """;
    }

    private String criarTemplateFusex() {
        logger.info("Criando template FUSEX - Folha de Frequência Multidisciplinar");

        return """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Folha de Frequência Multidisciplinar - FUSEX</title>
<style>
    @page {
        size: A4 landscape;  
        margin: 15mm 10mm 15mm 10mm;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Arial', sans-serif;
        font-size: 11pt;
        color: #000;
        line-height: 1.4;
    }

    .page {
        page-break-after: always;
    }

    .page:last-child {
        page-break-after: auto;
    }

    /* Cabeçalho que aparece em todas as páginas */
    .fusex-header {
        text-align: center;
        margin-bottom: 10px;
    }

    .fusex-header img {
        width: 60px;
        height: 60px;
        margin: 0 auto 8px;
        display: block;
    }

    .fusex-header-text {
        font-size: 10pt;
        font-weight: bold;
        line-height: 1.3;
        margin-bottom: 0;
    }

    /* Informações do paciente - aparece SOMENTE na primeira página */
    .patient-info {
        margin: 10px 0 15px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #000;
    }

    .info-row {
        display: flex;
        margin-bottom: 5px;
        align-items: baseline;
        font-size: 10pt;
    }

    .info-label {
        font-weight: normal;
        margin-right: 5px;
        white-space: nowrap;
    }

    .info-value {
        border-bottom: 1px solid #000;
        flex: 1;
        min-height: 18px;
        padding: 0 5px;
    }

    .info-date {
        display: inline-flex;
        align-items: baseline;
        gap: 5px;
    }

    .date-separator {
        border-bottom: 1px solid #000;
        width: 30px;
        display: inline-block;
        text-align: center;
    }

    /* Título principal */
    .title {
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        margin: 15px 0 10px 0;
        text-transform: uppercase;
    }

    /* Tabela de atendimentos */
    .attendance-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    .attendance-table th {
        background-color: #fff;
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 11pt;
    }

    .attendance-table td {
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
        min-height: 35px;
        font-size: 10pt;
    }

    .col-data {
        width: 12%;
    }

    .col-horario {
        width: 12%;
    }

    .col-procedimento {
        width: 30%;
    }

    .col-assinatura {
        width: 33%;
    }

    .col-parentesco {
        width: 13%;
    }
</style>
</head>
<body>
    <!-- PRIMEIRA PÁGINA -->
    <div class="page">
        <!-- Cabeçalho com logo e identificação -->
        <div class="fusex-header">
            <img src="{LOGO_BASE64}" alt="Brasão da República">
            <div class="fusex-header-text">
                MINISTÉRIO DA DEFESA<br>
                EXÉRCITO BRASILEIRO<br>
                CMP - 11ª R M<br>
                HOSPITAL MILITAR DE ÁREA DE BRASÍLIA
            </div>
        </div>

        <!-- Informações do paciente - SOMENTE na primeira página -->
        <div class="patient-info">
            <div class="info-row">
                <span class="info-label">NOME COMPLETO:</span>
                <span class="info-value">{PACIENTE_NOME}</span>
            </div>
            <div class="info-row">
                <span class="info-label">D/N</span>
                <span class="date-separator"></span>
                <span>/</span>
                <span class="date-separator"></span>
                <span>/</span>
                <span class="date-separator"></span>
                <span class="info-label" style="margin-left: 20px;">DIAGNÓSTICO:</span>
                <span class="info-value">{ESPECIALIDADE}</span>
                <span class="info-label" style="margin-left: 20px;">MÊS:</span>
                <span class="info-value">{MES_EXTENSO} de {ANO}</span>
            </div>
        </div>

        <!-- Título principal -->
        <div class="title">FOLHA DE FREQUÊNCIA MULTIDISCIPLINAR</div>

        <!-- Tabela de frequência -->
        <table class="attendance-table">
            <thead>
                <tr>
                    <th class="col-data">DATA</th>
                    <th class="col-horario">HORÁRIO</th>
                    <th class="col-procedimento">PROCEDIMENTO</th>
                    <th class="col-assinatura">ASSINATURA DO RESPONSÁVEL</th>
                    <th class="col-parentesco">PARENTESCO</th>
                </tr>
            </thead>
            <tbody>
                {LINHAS_TABELA}
            </tbody>
        </table>
    </div>
</body>
</html>
""";
}

    private String preencherTemplate(String template, FichaPdfItemDto item) {
        logger.debug("Preenchendo template para: {}", item.getPacienteNome());

        String html = template;

        try {
            // Logo em base64
            String convenioNome = detectarConvenioDoItem(item);
            String logoBase64 = obterLogoBase64(convenioNome);
            html = html.replace("{LOGO_BASE64}", logoBase64);

            // Dados básicos
            html = html.replace("{NUMERO_IDENTIFICACAO}",
                    StringUtils.hasText(item.getNumeroIdentificacao()) ? item.getNumeroIdentificacao() : "N/A");

            html = html.replace("{PACIENTE_NOME}",
                    StringUtils.hasText(item.getPacienteNome()) ? item.getPacienteNome() : "Paciente não informado");

            html = html.replace("{ESPECIALIDADE}",
                    StringUtils.hasText(item.getEspecialidade()) ? item.getEspecialidade() : "Não informado");

            html = html.replace("{MES_EXTENSO}",
                    StringUtils.hasText(item.getMesExtenso()) ? item.getMesExtenso() : obterMesExtenso(item.getMes()));

            html = html.replace("{ANO}",
                    item.getAno() != null ? item.getAno().toString() : "2025");

            html = html.replace("{CONVENIO_NOME}",
                    StringUtils.hasText(item.getConvenioNome()) ? item.getConvenioNome() : "Não informado");

            html = html.replace("{UNIDADE}",
                    StringUtils.hasText(item.getUnidade()) ? formatarUnidade(item.getUnidade()) : "Não informado");

            html = html.replace("{QUANTIDADE_AUTORIZADA}",
                    item.getQuantidadeAutorizada() != null ? item.getQuantidadeAutorizada().toString() : "30");

            html = html.replace("{NUMERO_GUIA}",
                    StringUtils.hasText(item.getNumeroGuia()) ? item.getNumeroGuia() : "N/A");

            // Data de geração
            html = html.replace("{DATA_GERACAO}",
                    java.time.LocalDateTime.now().format(
                            java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            // --- INÍCIO DA CORREÇÃO ---
            // Gerar linhas da tabela baseado no convênio

            boolean isFusex = isFusexConvenio(convenioNome);
            String linhasTabela;

            if (isFusex) {
                logger.debug("Gerando linhas da tabela FUSEX (5 colunas) para preencherTemplate");
                linhasTabela = gerarLinhasTabelaFusex(item.getQuantidadeAutorizada());
            } else {
                logger.debug("Gerando linhas da tabela Padrão/CBMDF (3 colunas) para preencherTemplate");
                linhasTabela = gerarLinhasTabela(item.getQuantidadeAutorizada());
            }

            html = html.replace("{LINHAS_TABELA}", linhasTabela);
            // --- FIM DA CORREÇÃO ---

            logger.debug("Template preenchido com sucesso para: {}", item.getPacienteNome());
            return html;

        } catch (Exception e) {
            logger.error("Erro ao preencher template: {}", e.getMessage(), e);
            throw new RuntimeException("Erro no preenchimento do template", e);
        }
    }

    /**
     * Gera as linhas da tabela para o template PADRÃO ou CBMDF (3 colunas)
     */
    private String gerarLinhasTabela(Integer quantidadeAutorizada) {
        StringBuilder linhas = new StringBuilder();

        // Usar quantidade autorizada ou padrão de 30 linhas se não informado
        int numeroLinhas = quantidadeAutorizada != null && quantidadeAutorizada > 0
                ? quantidadeAutorizada
                : 30;

        // Estrutura de 3 colunas
        for (int i = 1; i <= numeroLinhas; i++) {
            linhas.append(String.format(
                    "<tr class=\"sessao-linha\">" +
                            "<td class=\"numero-col\"><strong>%02d</strong></td>" +
                            "<td class=\"data-col\">___/___/______</td>" +
                            "<td class=\"assinatura-col\">&nbsp;</td>" +
                            "</tr>%n", i
            ));
        }

        return linhas.toString();
    }

    private String gerarLinhasTabelaFusex(Integer quantidadeAutorizada) {
        int totalLinhas = (quantidadeAutorizada != null && quantidadeAutorizada > 0)
                ? quantidadeAutorizada
                : 30;

        logger.debug("Gerando {} linhas FUSEX (5 colunas) com paginação automática", totalLinhas);

        // Configuração de linhas por página
        final int LINHAS_PRIMEIRA_PAGINA = 5;  // Primeira página tem menos espaço
        final int LINHAS_PAGINAS_SEGUINTES = 10; // Páginas seguintes têm mais espaço

        StringBuilder html = new StringBuilder();
        int linhasGeradas = 0;

        // ========================================
        // PRIMEIRA PÁGINA - Gerar até 5 linhas
        // ========================================
        int linhasNestaPagina = Math.min(totalLinhas, LINHAS_PRIMEIRA_PAGINA);

        for (int i = 0; i < linhasNestaPagina; i++) {
            html.append("""
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
""");
            linhasGeradas++;
        }

        // ========================================
        // PÁGINAS ADICIONAIS - Se necessário
        // ========================================
        while (linhasGeradas < totalLinhas) {
            // Fechar a página anterior
            html.append("""
            </tbody>
        </table>
    </div>
    
    <!-- PÁGINA ADICIONAL -->
    <div class="page">
        <!-- Cabeçalho com logo - REPETIDO EM TODAS AS PÁGINAS -->
        <div class="fusex-header">
            <img src="{LOGO_BASE64}" alt="Brasão da República">
            <div class="fusex-header-text">
                MINISTÉRIO DA DEFESA<br>
                EXÉRCITO BRASILEIRO<br>
                CMP - 11ª R M<br>
                HOSPITAL MILITAR DE ÁREA DE BRASÍLIA
            </div>
        </div>

        <!-- Tabela de frequência (SEM informações do paciente em páginas adicionais) -->
        <table class="attendance-table" style="margin-top: 20px;">
            <thead>
                <tr>
                    <th class="col-data">DATA</th>
                    <th class="col-horario">HORÁRIO</th>
                    <th class="col-procedimento">PROCEDIMENTO</th>
                    <th class="col-assinatura">ASSINATURA DO RESPONSÁVEL</th>
                    <th class="col-parentesco">PARENTESCO</th>
                </tr>
            </thead>
            <tbody>
""");

            // Gerar linhas para esta página adicional
            int linhasRestantes = totalLinhas - linhasGeradas;
            linhasNestaPagina = Math.min(linhasRestantes, LINHAS_PAGINAS_SEGUINTES);

            for (int i = 0; i < linhasNestaPagina; i++) {
                html.append("""
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
""");
                linhasGeradas++;
            }
        }

        logger.debug("Total de {} linhas FUSEX geradas em {} página(s)",
                linhasGeradas,
                (linhasGeradas <= LINHAS_PRIMEIRA_PAGINA) ? 1 : (1 + (int)Math.ceil((linhasGeradas - LINHAS_PRIMEIRA_PAGINA) / (double)LINHAS_PAGINAS_SEGUINTES)));

        return html.toString();
    }

    private String carregarTemplate(String templateNome) {
        try {
            if (!enableCustomTemplates) {
                logger.debug("Templates customizados desabilitados, usando padrão");
                return null;
            }

            // CORREÇÃO: Garantir que o caminho não tenha barras duplicadas
            String caminhoTemplate = templatesPath.endsWith("/") ? templatesPath : templatesPath + "/";
            caminhoTemplate += templateNome.endsWith(".html") ? templateNome : templateNome + ".html";

            logger.debug("Tentando carregar template customizado de: {}", caminhoTemplate);

            Resource resource = new ClassPathResource(caminhoTemplate.replace("classpath:", ""));

            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    String templateContent = new String(inputStream.readAllBytes(), "UTF-8");
                    logger.info("Template customizado '{}' carregado com sucesso.", templateNome);
                    return templateContent;
                }
            } else {
                logger.warn("Template não encontrado: {}", caminhoTemplate);
                return null;
            }

        } catch (Exception e) {
            logger.error("Erro ao carregar template {}: {}", templateNome, e.getMessage());
            return null;
        }
    }

    private String obterLogoBase64() {
        return obterLogoBase64(null);
    }

    private String obterLogoBase64(String convenioNome) {
        // Determinar qual logo usar
        String caminhoLogo;
        String cacheKey;

        // CORREÇÃO: Usar os métodos isFusexConvenio e isCbmdfConvenio para consistência
        if (isFusexConvenio(convenioNome)) {
            caminhoLogo = "classpath:static/images/logo-fusex.png";
            cacheKey = "logo_fusex";
            logger.debug("✅ Usando logo específica do FUSEX");
        } else if (isCbmdfConvenio(convenioNome)) {
            caminhoLogo = "classpath:static/images/logo-cbmdf.jpg";
            cacheKey = "logo_cbmdf";
            logger.debug("✅ Usando logo específica do CBMDF");
        } else {
            caminhoLogo = logoPath;
            cacheKey = "logo_principal";
            logger.debug("Usando logo padrão para convênio: {}", convenioNome);
        }

        return logoCache.computeIfAbsent(cacheKey, k -> {
            try {
                return converterImagemParaBase64(caminhoLogo);
            } catch (Exception e) {
                logger.warn("Erro ao carregar logo '{}', usando padrão: {}", caminhoLogo, e.getMessage());
                // Fallback para logo padrão
                try {
                    // Garantir que a logo padrão seja carregada do cache se já existir
                    return logoCache.computeIfAbsent("logo_principal", k2 -> {
                        try {
                            return converterImagemParaBase64(logoPath);
                        } catch (Exception fallbackError) {
                            logger.error("Erro ao carregar logo padrão como fallback: {}", fallbackError.getMessage());
                            return criarImagemPlaceholder();
                        }
                    });
                } catch (Exception fallbackError) {
                    logger.error("Erro fatal ao carregar logo padrão: {}", fallbackError.getMessage());
                    return criarImagemPlaceholder();
                }
            }
        });
    }

    private String converterImagemParaBase64(String caminhoImagem) throws IOException {
        try {
            byte[] imageBytes;

            if (caminhoImagem.startsWith("classpath:")) {
                // Carregar do classpath
                String path = caminhoImagem.substring("classpath:".length());
                Resource resource = new ClassPathResource(path);

                if (resource.exists()) {
                    try (InputStream inputStream = resource.getInputStream()) {
                        imageBytes = inputStream.readAllBytes();
                    }
                } else {
                    logger.warn("Imagem não encontrada no classpath: {}. Usando placeholder.", path);
                    throw new IOException("Imagem não encontrada no classpath: " + path);
                }
            } else {
                // Carregar do sistema de arquivos
                imageBytes = Files.readAllBytes(Paths.get(caminhoImagem));
            }

            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = determinarMimeType(caminhoImagem);

            return String.format("data:%s;base64,%s", mimeType, base64);

        } catch (Exception e) {
            logger.error("Erro ao converter imagem '{}': {}", caminhoImagem, e.getMessage());
            // Lançar exceção para que o chamador possa tratar (usando placeholder)
            throw new IOException("Erro na conversão da imagem: " + caminhoImagem, e);
        }
    }

    private String determinarMimeType(String caminhoImagem) {
        String extensao = caminhoImagem.toLowerCase();

        if (extensao.endsWith(".png")) {
            return "image/png";
        } else if (extensao.endsWith(".jpg") || extensao.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (extensao.endsWith(".gif")) {
            return "image/gif";
        } else if (extensao.endsWith(".svg")) {
            return "image/svg+xml";
        } else {
            return "image/png"; // Padrão
        }
    }

    private String criarImagemPlaceholder() {
        // SVG simples como placeholder
        String svgPlaceholder = """
            <svg width="120" height="60" xmlns="http://www.w3.org/2000/svg">
                <rect width="120" height="60" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
                <text x="60" y="35" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">LOGO</text>
            </svg>
            """;

        try {
            String base64 = Base64.getEncoder().encodeToString(svgPlaceholder.getBytes("UTF-8"));
            return "data:image/svg+xml;base64," + base64;
        } catch (Exception e) {
            logger.error("Erro ao criar placeholder: {}", e.getMessage());
            return "data:image/svg+xml;base64,"; // Retorno vazio em caso de erro
        }
    }

    private String formatarUnidade(String unidade) {
        if (unidade == null || unidade.trim().isEmpty()) {
            return "Não informado";
        }

        // Substituir underscores por espaços e converter para minúsculas
        String limpo = unidade.replace("_", " ").toLowerCase().trim();

        // Dividir em palavras e capitalizar cada uma
        String[] palavras = limpo.split("\\s+");
        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < palavras.length; i++) {
            if (i > 0) {
                resultado.append(" ");
            }

            String palavra = palavras[i];
            if (!palavra.isEmpty()) {
                resultado.append(Character.toUpperCase(palavra.charAt(0)));
                if (palavra.length() > 1) {
                    resultado.append(palavra.substring(1));
                }
            }
        }

        return resultado.toString();
    }

    private String obterMesExtenso(Integer mes) {
        try {
            if (mes == null || mes < 1 || mes > 12) {
                return "Mês inválido";
            }

            return java.time.Month.of(mes)
                    .getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
        } catch (Exception e) {
            logger.warn("Erro ao obter mês por extenso para {}: {}", mes, e.getMessage());
            return "Mês " + mes;
        }
    }

    /**
     * Detecta o nome do convênio a partir do item (se disponível)
     */
    private String detectarConvenioDoItem(FichaPdfItemDto item) {
        if (item != null && StringUtils.hasText(item.getConvenioNome())) {
            return item.getConvenioNome();
        }
        return null; // Usará logo padrão
    }
}