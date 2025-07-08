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
            if (item == null) {
                throw new IllegalArgumentException("Item não pode ser nulo");
            }

            String html = templateService.gerarHtmlFicha(item);
            return converterHtmlParaPdf(html);

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF da ficha única: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na geração da ficha: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] lerArquivoPdf(String caminhoArquivo) {
        try {
            if (caminhoArquivo == null || caminhoArquivo.trim().isEmpty()) {
                throw new IllegalArgumentException("Caminho do arquivo não pode estar vazio");
            }

            logger.debug("Lendo arquivo PDF: {}", caminhoArquivo);

            if (!Files.exists(Paths.get(caminhoArquivo))) {
                throw new RuntimeException("Arquivo PDF não encontrado: " + caminhoArquivo);
            }

            return Files.readAllBytes(Paths.get(caminhoArquivo));

        } catch (Exception e) {
            logger.error("Erro ao ler arquivo PDF {}: {}", caminhoArquivo, e.getMessage());
            throw new RuntimeException("Erro ao ler arquivo PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean validarTemplate(String templateHtml) {
        try {
            // Validação básica do HTML
            if (templateHtml == null || templateHtml.trim().isEmpty()) {
                return false;
            }

            // Verificar se contém tags básicas necessárias
            boolean temHtml = templateHtml.contains("<html") || templateHtml.contains("<HTML");
            boolean temBody = templateHtml.contains("<body") || templateHtml.contains("<BODY");
            boolean temFechamento = templateHtml.contains("</html>") || templateHtml.contains("</HTML>");

            if (!temHtml || !temBody || !temFechamento) {
                logger.warn("Template HTML não possui estrutura básica necessária");
                return false;
            }

            // Validar se consegue converter para PDF (teste básico)
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

    private byte[] converterHtmlParaPdf(String html) throws Exception {
        if (html == null || html.trim().isEmpty()) {
            throw new IllegalArgumentException("HTML não pode estar vazio");
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            // Configurar propriedades do conversor
            ConverterProperties properties = new ConverterProperties();
            properties.setBaseUri(""); // URI base vazia para recursos locais

            // Configurações para melhor renderização
            properties.setCharset("UTF-8");

            // Converter HTML para PDF
            HtmlConverter.convertToPdf(html, outputStream, properties);

            byte[] pdfBytes = outputStream.toByteArray();

            if (pdfBytes.length == 0) {
                throw new RuntimeException("PDF gerado está vazio");
            }

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erro na conversão HTML para PDF: {}", e.getMessage());
            throw new RuntimeException("Erro na conversão HTML para PDF", e);
        } finally {
            try {
                outputStream.close();
            } catch (Exception e) {
                logger.warn("Erro ao fechar OutputStream: {}", e.getMessage());
            }
        }
    }

    private byte[] mesclarPdfs(List<byte[]> pdfBytes) throws Exception {
        if (pdfBytes == null || pdfBytes.isEmpty()) {
            throw new IllegalArgumentException("Lista de PDFs para mesclar não pode estar vazia");
        }

        if (pdfBytes.size() == 1) {
            return pdfBytes.get(0);
        }

        logger.debug("Mesclando {} PDFs", pdfBytes.size());

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfDocument pdfDestino = null;
        PdfMerger merger = null;

        List<PdfDocument> pdfsAbertos = new ArrayList<>();

        try {
            pdfDestino = new PdfDocument(new PdfWriter(outputStream));
            merger = new PdfMerger(pdfDestino);

            for (int i = 0; i < pdfBytes.size(); i++) {
                byte[] pdfData = pdfBytes.get(i);

                if (pdfData == null || pdfData.length == 0) {
                    logger.warn("PDF {} está vazio, pulando...", i + 1);
                    continue;
                }

                try {
                    ByteArrayInputStream inputStream = new ByteArrayInputStream(pdfData);
                    PdfDocument pdfOrigem = new PdfDocument(new PdfReader(inputStream));
                    pdfsAbertos.add(pdfOrigem);

                    // Verificar se o PDF tem páginas
                    int numeroPaginas = pdfOrigem.getNumberOfPages();
                    if (numeroPaginas > 0) {
                        merger.merge(pdfOrigem, 1, numeroPaginas);
                        logger.debug("PDF {} mesclado: {} páginas", i + 1, numeroPaginas);
                    } else {
                        logger.warn("PDF {} não possui páginas, pulando...", i + 1);
                    }

                } catch (Exception e) {
                    logger.error("Erro ao mesclar PDF {}: {}", i + 1, e.getMessage());
                    // Continuar com próximo PDF
                }
            }

            return outputStream.toByteArray();

        } catch (Exception e) {
            logger.error("Erro na mesclagem de PDFs: {}", e.getMessage());
            throw new RuntimeException("Erro na mesclagem de PDFs", e);
        } finally {
            // Fechar todos os PDFs abertos
            for (PdfDocument pdf : pdfsAbertos) {
                try {
                    if (pdf != null) {
                        pdf.close();
                    }
                } catch (Exception e) {
                    logger.warn("Erro ao fechar PDF: {}", e.getMessage());
                }
            }

            // Fechar documento destino
            try {
                if (pdfDestino != null) {
                    pdfDestino.close();
                }
            } catch (Exception e) {
                logger.warn("Erro ao fechar PDF destino: {}", e.getMessage());
            }

            // Fechar output stream
            try {
                outputStream.close();
            } catch (Exception e) {
                logger.warn("Erro ao fechar OutputStream: {}", e.getMessage());
            }
        }
    }

    private void criarDiretorioTemp() {
        try {
            java.nio.file.Path tempDir = Paths.get(tempPath);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
                logger.debug("Diretório temporário criado: {}", tempPath);
            }
        } catch (Exception e) {
            logger.warn("Erro ao criar diretório temporário: {}", e.getMessage());
        }
    }

    private void limparArquivosTemporarios() {
        try {
            java.nio.file.Path tempDir = Paths.get(tempPath);
            if (Files.exists(tempDir)) {
                Files.walk(tempDir)
                        .filter(Files::isRegularFile)
                        .filter(path -> {
                            try {
                                // Remover arquivos mais antigos que 1 hora
                                long ageCutoff = System.currentTimeMillis() - (60 * 60 * 1000);
                                return Files.getLastModifiedTime(path).toMillis() < ageCutoff;
                            } catch (Exception e) {
                                return false;
                            }
                        })
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (Exception e) {
                                logger.debug("Erro ao remover arquivo temporário: {}", e.getMessage());
                            }
                        });
            }
        } catch (Exception e) {
            logger.debug("Erro na limpeza de arquivos temporários: {}", e.getMessage());
        }
    }
}