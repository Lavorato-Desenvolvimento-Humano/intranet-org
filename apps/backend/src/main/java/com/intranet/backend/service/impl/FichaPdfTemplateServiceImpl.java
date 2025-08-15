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

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
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
            // Verificar se é FUSEX
            if ("FUSEX".equalsIgnoreCase(convenioNome)) {
                String templateFusex = obterTemplateFusex();
                return preencherTemplate(templateFusex, item);
            }

            // Para outros convênios, usar template padrão
            logger.debug("Convênio {} não tem template específico, usando padrão", convenioNome);
            return gerarHtmlFicha(item);

        } catch (Exception e) {
            logger.error("Erro ao gerar HTML com template do convênio {}: {}", convenioNome, e.getMessage(), e);
            // Fallback para template padrão
            logger.warn("Usando template padrão como fallback para convênio: {}", convenioNome);
            return gerarHtmlFicha(item);
        }
    }

    @Override
    public String getTemplatePadrao() {
        // Cache do template padrão
        return templateCache.computeIfAbsent("default", k -> {
            logger.debug("Carregando template padrão");
            return criarTemplatePadrao();
        });
    }

    private String obterTemplateFusex() {
        return templateCache.computeIfAbsent("template_fusex", k -> {
            logger.debug("Carregando template do FUSEX");
            return criarTemplateFusex();
        });
    }

    @Override
    public boolean temTemplateEspecifico(String convenioNome) {
        if (convenioNome == null) return false;

        // Apenas FUSEX tem template específico
        return "FUSEX".equalsIgnoreCase(convenioNome.trim());
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
     * Template específico para o Fusex
     * Baseado no sistema legado em PHP
     */
    private String criarTemplateFusex() {
        return """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ficha de Assinatura - {NUMERO_IDENTIFICACAO}</title>
        <style>
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
                width: 150px;
                height: auto;
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
                margin-top: 15px;
            }
            
            .table th, .table td {
                border: 1px solid #000;
                padding: 5px;
                text-align: center;
            }
            
            .table th {
                background-color: #f0f0f0;
                font-weight: bold;
            }
            
            .info-header {
                text-align: left;
                margin-bottom: 15px;
            }
            
            /* Específico para Fusex */
            .fusex-header {
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
            }
            
            .fusex-instructions {
                margin-top: 20px;
                font-size: 10px;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="header fusex-header">
            <img src="{LOGO_BASE64}" alt="Logo">
            <h1>FICHA DE ASSINATURA</h1>
            <div class="identificacao">ID: {NUMERO_IDENTIFICACAO}</div>
        </div>

        <div class="info-header">
            <div class="section">
                <label>Nome do Paciente:</label> {PACIENTE_NOME}
            </div>
            <div class="section">
                <label>Especialidade:</label> {ESPECIALIDADE}
            </div>
            <div class="section">
                <label>Mês:</label> {MES_EXTENSO}
            </div>
            <div class="section">
                <label>Convênio:</label> FUSEX
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Nº</th>
                    <th>Data de Atendimento</th>
                    <th>Assinatura do Responsável</th>
                </tr>
            </thead>
            <tbody>
                {LINHAS_TABELA}
            </tbody>
        </table>
        
        <div class="fusex-instructions">
            <p><strong>Instruções FUSEX:</strong></p>
            <p>1. Preencher a data e assinar a cada atendimento realizado.</p>
            <p>2. Este documento é de uso obrigatório para faturamento junto ao FUSEX.</p>
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

    private String preencherTemplate(String template, FichaPdfItemDto item) {
        logger.debug("Preenchendo template para: {}", item.getPacienteNome());

        String html = template;

        try {
            // Logo em base64
            String logoBase64 = obterLogoBase64();
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

            // Gerar linhas da tabela
            String linhasTabela = gerarLinhasTabela(item.getQuantidadeAutorizada());
            html = html.replace("{LINHAS_TABELA}", linhasTabela);

            logger.debug("Template preenchido com sucesso para: {}", item.getPacienteNome());
            return html;

        } catch (Exception e) {
            logger.error("Erro ao preencher template: {}", e.getMessage(), e);
            throw new RuntimeException("Erro no preenchimento do template", e);
        }
    }

    private String gerarLinhasTabela(Integer quantidadeAutorizada) {
        StringBuilder linhas = new StringBuilder();

        // Usar quantidade autorizada ou padrão de 30 linhas
        int numeroLinhas = quantidadeAutorizada != null ? quantidadeAutorizada : 30;

        // Garantir pelo menos 10 linhas e no máximo 50
        numeroLinhas = Math.max(10, Math.min(50, numeroLinhas));

        for (int i = 1; i <= numeroLinhas; i++) {
            linhas.append(String.format(
                    "<tr class=\"sessao-linha\">" +
                            "<td><strong>%02d</strong></td>" +
                            "<td>___/___/______</td>" +
                            "<td>&nbsp;</td>" +
                            "</tr>%n", i
            ));
        }

        return linhas.toString();
    }

    private String carregarTemplate(String templateNome) {
        try {
            if (!enableCustomTemplates) {
                logger.debug("Templates customizados desabilitados, usando padrão");
                return null;
            }

            String caminhoTemplate = templatesPath + "/" + templateNome + ".html";
            Resource resource = new ClassPathResource(caminhoTemplate);

            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    return new String(inputStream.readAllBytes(), "UTF-8");
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
        try {
            return logoCache.computeIfAbsent("logo_principal", k -> {
                try {
                    return converterImagemParaBase64(logoPath);
                } catch (Exception e) {
                    logger.warn("Erro ao carregar logo, usando placeholder: {}", e.getMessage());
                    return criarImagemPlaceholder();
                }
            });
        } catch (Exception e) {
            logger.error("Erro ao obter logo base64: {}", e.getMessage());
            return criarImagemPlaceholder();
        }
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
            logger.error("Erro ao converter imagem para base64: {}", e.getMessage());
            throw new IOException("Erro na conversão da imagem", e);
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
}