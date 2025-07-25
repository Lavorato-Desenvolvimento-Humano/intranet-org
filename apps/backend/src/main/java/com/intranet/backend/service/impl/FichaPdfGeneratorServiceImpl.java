package com.intranet.backend.service.impl;

import com.intranet.backend.dto.FichaPdfItemDto;
import com.intranet.backend.service.FichaPdfGeneratorService;
import com.intranet.backend.service.FichaPdfTemplateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Imports para iText PDF
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.utils.PdfMerger;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class FichaPdfGeneratorServiceImpl implements FichaPdfGeneratorService {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfGeneratorServiceImpl.class);

    private final FichaPdfTemplateService templateService;

    @Value("${app.ficha-pdf.processing.batch-size:50}")
    private int batchSize;

    @Value("${app.ficha-pdf.storage.temp-path:/tmp/fichas-temp}")
    private String tempPath;

    @Override
    public byte[] gerarPdfCompleto(List<FichaPdfItemDto> itens, Integer mes, Integer ano) {
        logger.info("Gerando PDF completo com {} fichas para {}/{}", itens.size(), mes, ano);

        try {
            if (itens == null || itens.isEmpty()) {
                throw new IllegalArgumentException("Lista de itens não pode estar vazia");
            }

            // Para poucos itens, gerar direto
            if (itens.size() <= batchSize) {
                return gerarPdfDireto(itens);
            }

            // Para muitos itens, gerar em lotes e mesclar
            return gerarPdfEmLotes(itens);

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF completo: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na geração do PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] gerarPdfCompletoAsync(List<FichaPdfItemDto> itens, Integer mes, Integer ano,
                                        Consumer<Integer> progressCallback) {
        logger.info("Gerando PDF completo assíncrono com {} fichas para {}/{}", itens.size(), mes, ano);

        try {
            if (itens == null || itens.isEmpty()) {
                throw new IllegalArgumentException("Lista de itens não pode estar vazia");
            }

            List<byte[]> pdfsParciais = new ArrayList<>();
            int processados = 0;

            // Processar em lotes
            for (int i = 0; i < itens.size(); i += batchSize) {
                int fim = Math.min(i + batchSize, itens.size());
                List<FichaPdfItemDto> lote = itens.subList(i, fim);

                logger.debug("Processando lote {}-{} de {} itens", i + 1, fim, itens.size());

                byte[] pdfLote = gerarPdfDireto(lote);
                pdfsParciais.add(pdfLote);

                processados = fim;
                if (progressCallback != null) {
                    progressCallback.accept(processados);
                }

                // Log de progresso
                if (itens.size() > batchSize) {
                    double percentual = (double) processados / itens.size() * 100;
                    logger.info("Progresso: {}/{} fichas processadas ({:.1f}%)",
                            processados, itens.size(), percentual);
                }
            }

            // Mesclar todos os PDFs
            logger.debug("Mesclando {} PDFs parciais", pdfsParciais.size());
            return mesclarPdfs(pdfsParciais);

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF assíncrono: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na geração assíncrona do PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] gerarPdfFichaUnica(FichaPdfItemDto item) {
        logger.debug("Gerando PDF para ficha única: {} - {}",
                item.getNumeroIdentificacao(), item.getPacienteNome());

        try {
            String templateHtml = templateService.gerarHtmlFicha(item);
            return converterHtmlParaPdf(templateHtml);

        } catch (Exception e) {
            logger.error("Erro ao gerar ficha única para {}: {}",
                    item.getNumeroIdentificacao(), e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar ficha única: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] lerArquivoPdf(String caminhoArquivo) {
        logger.debug("Lendo arquivo PDF: {}", caminhoArquivo);

        try {
            if (caminhoArquivo == null || caminhoArquivo.trim().isEmpty()) {
                throw new IllegalArgumentException("Caminho do arquivo não pode estar vazio");
            }

            java.nio.file.Path path = Paths.get(caminhoArquivo);

            if (!Files.exists(path)) {
                throw new RuntimeException("Arquivo não encontrado: " + caminhoArquivo);
            }

            byte[] pdfBytes = Files.readAllBytes(path);
            logger.debug("Arquivo PDF lido: {} bytes", pdfBytes.length);

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erro ao ler arquivo PDF {}: {}", caminhoArquivo, e.getMessage(), e);
            throw new RuntimeException("Erro ao ler arquivo PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean validarTemplate(String templateHtml) {
        logger.debug("Validando template HTML");

        try {
            if (templateHtml == null || templateHtml.trim().isEmpty()) {
                logger.warn("Template HTML está vazio");
                return false;
            }

            // Tentar converter o template para PDF como teste
            try {
                byte[] testePdf = converterHtmlParaPdf(templateHtml);
                return testePdf != null && testePdf.length > 0;
            } catch (Exception e) {
                logger.warn("Template HTML não pode ser convertido para PDF: {}", e.getMessage());
                return false;
            }

        } catch (Exception e) {
            logger.warn("Erro na validação do template: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Gera PDF diretamente sem lotes
     */
    private byte[] gerarPdfDireto(List<FichaPdfItemDto> itens) throws Exception {
        logger.debug("Gerando PDF direto para {} itens", itens.size());

        if (itens.size() == 1) {
            // Otimização para ficha única
            return gerarPdfFichaUnica(itens.get(0));
        }

        List<byte[]> fichasPdf = new ArrayList<>();

        for (FichaPdfItemDto item : itens) {
            try {
                String html = templateService.gerarHtmlFicha(item);
                byte[] fichaPdf = converterHtmlParaPdf(html);
                fichasPdf.add(fichaPdf);
            } catch (Exception e) {
                logger.error("Erro ao processar ficha {}: {}", item.getNumeroIdentificacao(), e.getMessage());
                // Continuar processamento das outras fichas
            }
        }

        if (fichasPdf.isEmpty()) {
            throw new RuntimeException("Nenhuma ficha foi processada com sucesso");
        }

        return mesclarPdfs(fichasPdf);
    }

    /**
     * Gera PDF em lotes menores
     */
    private byte[] gerarPdfEmLotes(List<FichaPdfItemDto> itens) throws Exception {
        logger.debug("Gerando PDF em lotes para {} itens", itens.size());

        List<byte[]> lotesPdf = new ArrayList<>();
        int lotesProcessados = 0;

        for (int i = 0; i < itens.size(); i += batchSize) {
            int fim = Math.min(i + batchSize, itens.size());
            List<FichaPdfItemDto> lote = itens.subList(i, fim);

            try {
                byte[] pdfLote = gerarPdfDireto(lote);
                lotesPdf.add(pdfLote);
                lotesProcessados++;

                logger.debug("Lote {}/{} processado: {}-{} de {} itens",
                        lotesProcessados,
                        (int) Math.ceil((double) itens.size() / batchSize),
                        i + 1, fim, itens.size());

            } catch (Exception e) {
                logger.error("Erro ao processar lote {}-{}: {}", i + 1, fim, e.getMessage());
                // Continuar com próximo lote
            }
        }

        if (lotesPdf.isEmpty()) {
            throw new RuntimeException("Nenhum lote foi processado com sucesso");
        }

        return mesclarPdfs(lotesPdf);
    }

    /**
     * Converte HTML para PDF usando iText
     */
    private byte[] converterHtmlParaPdf(String html) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Configurar propriedades do conversor
            ConverterProperties converterProperties = new ConverterProperties();
            converterProperties.setCharset("UTF-8");

            // Configurar base URI se necessário (para recursos como imagens)
            // converterProperties.setBaseUri(baseUri);

            // Converter HTML para PDF
            HtmlConverter.convertToPdf(html, outputStream, converterProperties);

            byte[] pdfBytes = outputStream.toByteArray();

            if (pdfBytes.length == 0) {
                throw new RuntimeException("PDF gerado está vazio");
            }

            logger.debug("HTML convertido para PDF: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erro na conversão HTML para PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na conversão HTML para PDF", e);
        }
    }

    /**
     * Mescla múltiplos PDFs em um único arquivo
     */
    private byte[] mesclarPdfs(List<byte[]> pdfsList) throws Exception {
        if (pdfsList == null || pdfsList.isEmpty()) {
            throw new IllegalArgumentException("Lista de PDFs não pode estar vazia");
        }

        if (pdfsList.size() == 1) {
            return pdfsList.get(0);
        }

        logger.debug("Mesclando {} PDFs", pdfsList.size());

        try (ByteArrayOutputStream mergedOutputStream = new ByteArrayOutputStream()) {

            // Criar documento PDF de destino
            PdfWriter writer = new PdfWriter(mergedOutputStream);
            PdfDocument mergedDoc = new PdfDocument(writer);
            PdfMerger merger = new PdfMerger(mergedDoc);

            // Mesclar cada PDF
            for (int i = 0; i < pdfsList.size(); i++) {
                byte[] pdfBytes = pdfsList.get(i);

                try (ByteArrayInputStream inputStream = new ByteArrayInputStream(pdfBytes)) {
                    PdfReader reader = new PdfReader(inputStream);
                    PdfDocument sourceDoc = new PdfDocument(reader);

                    // Mesclar todas as páginas do documento
                    merger.merge(sourceDoc, 1, sourceDoc.getNumberOfPages());

                    sourceDoc.close();

                    logger.debug("PDF {} de {} mesclado", i + 1, pdfsList.size());
                }
            }

            mergedDoc.close();

            byte[] mergedBytes = mergedOutputStream.toByteArray();
            logger.debug("Mesclagem concluída: {} bytes", mergedBytes.length);

            return mergedBytes;

        } catch (Exception e) {
            logger.error("Erro ao mesclar PDFs: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na mesclagem de PDFs", e);
        }
    }

    /**
     * Inicializa diretórios temporários se necessário
     */
    private void inicializarDiretoriosTemp() {
        try {
            java.nio.file.Path tempDir = Paths.get(tempPath);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
                logger.debug("Diretório temporário criado: {}", tempPath);
            }
        } catch (Exception e) {
            logger.warn("Erro ao criar diretório temporário {}: {}", tempPath, e.getMessage());
        }
    }

    /**
     * Limpa arquivos temporários antigos (se necessário)
     */
    private void limparArquivosTemporarios() {
        try {
            java.nio.file.Path tempDir = Paths.get(tempPath);
            if (Files.exists(tempDir)) {
                Files.walk(tempDir)
                        .filter(Files::isRegularFile)
                        .filter(path -> {
                            try {
                                // Arquivos mais antigos que 1 hora
                                long idade = System.currentTimeMillis() - Files.getLastModifiedTime(path).toMillis();
                                return idade > (60 * 60 * 1000); // 1 hora
                            } catch (Exception e) {
                                return false;
                            }
                        })
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                                logger.debug("Arquivo temporário removido: {}", path);
                            } catch (Exception e) {
                                logger.warn("Erro ao remover arquivo temporário {}: {}", path, e.getMessage());
                            }
                        });
            }
        } catch (Exception e) {
            logger.warn("Erro na limpeza de arquivos temporários: {}", e.getMessage());
        }
    }
}