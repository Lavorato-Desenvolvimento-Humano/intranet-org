// =================================================================================
// IMPLEMENTAÇÃO COMPLETA DO SERVIÇO DE TEMPLATES
// =================================================================================

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

    @Value("${app.ficha-pdf.template.logo-path:classpath:static/images/logo.jpeg}")
    private String logoPath;

    @Value("${app.ficha-pdf.template.templates-path:classpath:templates/fichas}")
    private String templatesPath;

    @Value("${app.ficha-pdf.template.enable-custom-templates:false}")
    private boolean enableCustomTemplates;

    // Cache de templates para performance
    private final Map<String, String> templateCache = new HashMap<>();
    private final Map<String, String> logoCache = new HashMap<>();

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================

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
    public String getTemplatePadrao() {
        // Cache do template padrão
        return templateCache.computeIfAbsent("default", k -> {
            logger.debug("Carregando template padrão");
            return criarTemplatePadrao();
        });
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

    // =================================================================================
    // MÉTODOS PRIVADOS - TEMPLATE
    // =================================================================================

    private String criarTemplatePadrao() {
        // Template baseado no código PHP fornecido, com melhorias
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
            margin: 10mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 5px;
            line-height: 1.2;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .header img {
            width: 150px;
            height: auto;
            max-height: 80px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            text-align: center;
            flex-grow: 1;
            color: #333;
            text-transform: uppercase;
        }
        
        .header .identificacao {
            font-size: 14px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        .info-section {
            background-color: #f9f9f9;
            padding: 15px;
            margin-bottom: 15px;
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
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #333;
        }
        
        .table th {
            background-color: #333;
            color: white;
            font-weight: bold;
            padding: 12px 8px;
            text-align: center;
            border: 1px solid #333;
            font-size: 13px;
        }
        
        .table td {
            border: 1px solid #333;
            padding: 10px 8px;
            text-align: center;
            height: 25px;
            vertical-align: middle;
        }
        
        .table .numero-col {
            width: 8%;
            background-color: #f8f8f8;
            font-weight: bold;
        }
        
        .table .data-col {
            width: 30%;
        }
        
        .table .assinatura-col {
            width: 62%;
        }
        
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        .metadata {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #888;
            margin-top: 10px;
        }
        
        /* Print styles */
        @media print {
            .header {
                break-inside: avoid;
            }
            
            .info-section {
                break-inside: avoid;
            }
            
            .table {
                break-inside: auto;
            }
            
            .table tr {
                break-inside: avoid;
                break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{LOGO_BASE64}" alt="Logo da Empresa" onerror="this.style.display='none'">
        <h1>Ficha de Assinatura</h1>
        <div class="identificacao">ID: {NUMERO_IDENTIFICACAO}</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Nome do Paciente:</span>
            <span class="info-value">{PACIENTE_NOME}</span>
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
            <span class="info-value">{QUANTIDADE_AUTORIZADA} sessões</span>
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
        <p><strong>Instruções:</strong> Preencher a data e assinar a cada atendimento realizado.</p>
        <p>Este documento é de uso obrigatório para faturamento junto ao convênio.</p>
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

        // Usar quantidade autorizada ou padrão de 30 linhas como no PHP
        int numeroLinhas = quantidadeAutorizada != null ? quantidadeAutorizada : 30;

        // Garantir pelo menos 15 linhas e no máximo 60
        numeroLinhas = Math.max(15, Math.min(60, numeroLinhas));

        for (int i = 1; i <= numeroLinhas; i++) {
            linhas.append(String.format("""
                <tr>
                    <td class="numero-col">%d</td>
                    <td class="data-col"></td>
                    <td class="assinatura-col"></td>
                </tr>
                """, i));
        }

        logger.debug("Geradas {} linhas na tabela", numeroLinhas);
        return linhas.toString();
    }

    // =================================================================================
    // MÉTODOS PRIVADOS - TEMPLATE LOADING
    // =================================================================================

    private String carregarTemplate(String templateNome) {
        if (!enableCustomTemplates) {
            logger.debug("Templates personalizados desabilitados, usando padrão");
            return null;
        }

        try {
            // Tentar carregar do cache primeiro
            String cacheKey = "custom_" + templateNome;
            if (templateCache.containsKey(cacheKey)) {
                logger.debug("Template {} carregado do cache", templateNome);
                return templateCache.get(cacheKey);
            }

            // Tentar carregar do classpath
            String resourcePath = templateNome + ".html";
            Resource resource = new ClassPathResource(templatesPath + "/" + resourcePath);

            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    String template = new String(inputStream.readAllBytes(), "UTF-8");
                    templateCache.put(cacheKey, template);
                    logger.info("Template personalizado carregado: {}", templateNome);
                    return template;
                }
            }

            // Tentar carregar do filesystem
            String filePath = templatesPath + "/" + resourcePath;
            if (Files.exists(Paths.get(filePath))) {
                String template = Files.readString(Paths.get(filePath));
                templateCache.put(cacheKey, template);
                logger.info("Template personalizado carregado do filesystem: {}", templateNome);
                return template;
            }

            logger.warn("Template personalizado não encontrado: {}", templateNome);
            return null;

        } catch (Exception e) {
            logger.error("Erro ao carregar template {}: {}", templateNome, e.getMessage());
            return null;
        }
    }

    // =================================================================================
    // MÉTODOS PRIVADOS - IMAGEM
    // =================================================================================

    private String obterLogoBase64() {
        try {
            String caminhoLogo = resolverCaminhoLogo();
            return imagemParaBase64(caminhoLogo);
        } catch (Exception e) {
            logger.warn("Erro ao obter logo, usando placeholder: {}", e.getMessage());
            return criarImagemPlaceholder();
        }
    }

    private String converterImagemParaBase64(String caminhoImagem) throws IOException {
        byte[] imageBytes;

        // Verificar se é recurso do classpath
        if (caminhoImagem.startsWith("classpath:")) {
            String resourcePath = caminhoImagem.substring(10);
            Resource resource = new ClassPathResource(resourcePath);

            if (!resource.exists()) {
                throw new IOException("Recurso não encontrado: " + resourcePath);
            }

            try (InputStream inputStream = resource.getInputStream()) {
                imageBytes = inputStream.readAllBytes();
            }
        } else {
            // Arquivo do filesystem
            if (!Files.exists(Paths.get(caminhoImagem))) {
                throw new IOException("Arquivo não encontrado: " + caminhoImagem);
            }
            imageBytes = Files.readAllBytes(Paths.get(caminhoImagem));
        }

        String encodedString = Base64.getEncoder().encodeToString(imageBytes);

        // Determinar o tipo da imagem pela extensão
        String tipoImagem = "jpeg";
        String caminhoLower = caminhoImagem.toLowerCase();
        if (caminhoLower.endsWith(".png")) {
            tipoImagem = "png";
        } else if (caminhoLower.endsWith(".gif")) {
            tipoImagem = "gif";
        } else if (caminhoLower.endsWith(".svg")) {
            tipoImagem = "svg+xml";
        }

        return String.format("data:image/%s;base64,%s", tipoImagem, encodedString);
    }

    private String criarImagemPlaceholder() {
        // Imagem placeholder transparente 1x1 pixel
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }

    private String resolverCaminhoLogo() {
        if (logoPath.startsWith("classpath:")) {
            return logoPath;
        } else {
            // Caminho absoluto ou relativo
            return logoPath;
        }
    }

    // =================================================================================
    // MÉTODOS PRIVADOS - UTILITÁRIOS
    // =================================================================================

    private String obterMesExtenso(Integer mes) {
        if (mes == null || mes < 1 || mes > 12) {
            return "Mês inválido";
        }

        try {
            return java.time.Month.of(mes)
                    .getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
        } catch (Exception e) {
            return "Mês " + mes;
        }
    }

    private String formatarUnidade(String unidade) {
        if (!StringUtils.hasText(unidade)) {
            return "Não informado";
        }

        return switch (unidade.toUpperCase()) {
            case "KIDS" -> "Kids (Infantil)";
            case "SENIOR" -> "Senior (Adulto)";
            default -> unidade;
        };
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS ADICIONAIS
    // =================================================================================

    /**
     * Limpa cache de templates (útil para reload em runtime)
     */
    public void limparCacheTemplates() {
        templateCache.clear();
        logoCache.clear();
        logger.info("Cache de templates limpo");
    }

    /**
     * Valida se um template HTML está bem formado
     */
    public boolean validarTemplate(String templateHtml) {
        if (!StringUtils.hasText(templateHtml)) {
            return false;
        }

        // Validações básicas
        boolean temHtml = templateHtml.contains("<html") && templateHtml.contains("</html>");
        boolean temBody = templateHtml.contains("<body") && templateHtml.contains("</body>");
        boolean temHead = templateHtml.contains("<head") && templateHtml.contains("</head>");

        // Verificar se contém os placeholders essenciais
        boolean temPlaceholders = templateHtml.contains("{PACIENTE_NOME}") &&
                templateHtml.contains("{ESPECIALIDADE}") &&
                templateHtml.contains("{LINHAS_TABELA}");

        return temHtml && temBody && temHead && temPlaceholders;
    }

    /**
     * Lista templates disponíveis
     */
    public java.util.List<String> listarTemplatesDisponiveis() {
        java.util.List<String> templates = new java.util.ArrayList<>();

        templates.add("default"); // Template padrão sempre disponível

        if (enableCustomTemplates) {
            try {
                // Listar templates do classpath
                // TODO: Implementar listagem de recursos do classpath se necessário

                // Listar templates do filesystem se configurado
                if (!logoPath.startsWith("classpath:")) {
                    java.nio.file.Path templateDir = Paths.get(templatesPath);
                    if (Files.exists(templateDir)) {
                        Files.list(templateDir)
                                .filter(path -> path.toString().endsWith(".html"))
                                .map(path -> path.getFileName().toString().replace(".html", ""))
                                .forEach(templates::add);
                    }
                }
            } catch (Exception e) {
                logger.warn("Erro ao listar templates disponíveis: {}", e.getMessage());
            }
        }

        return templates;
    }

    /**
     * Obtém informações sobre um template
     */
    public Map<String, Object> obterInfoTemplate(String templateNome) {
        Map<String, Object> info = new HashMap<>();

        try {
            if ("default".equals(templateNome)) {
                info.put("nome", "default");
                info.put("descricao", "Template padrão do sistema");
                info.put("disponivel", true);
                info.put("tamanho", getTemplatePadrao().length());
            } else {
                String template = carregarTemplate(templateNome);
                info.put("nome", templateNome);
                info.put("disponivel", template != null);
                if (template != null) {
                    info.put("tamanho", template.length());
                    info.put("valido", validarTemplate(template));
                }
            }
        } catch (Exception e) {
            info.put("erro", e.getMessage());
        }

        return info;
    }
}