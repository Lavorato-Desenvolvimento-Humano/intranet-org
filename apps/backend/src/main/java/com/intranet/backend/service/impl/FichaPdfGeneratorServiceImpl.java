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
        logger.info("Gerando PDF completo com {} fichas", itens.size());

        try {
            if (itens.isEmpty()) {
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
        logger.info("Gerando PDF completo assíncrono com {} fichas", itens.size());

        try {
            List<byte[]> pdfsParciais = new ArrayList<>();
            int processados = 0;

            // Processar em lotes
            for (int i = 0; i < itens.size(); i += batchSize) {
                int fim = Math.min(i + batchSize, itens.size());
                List<FichaPdfItemDto> lote = itens.subList(i, fim);

                logger.debug("Processando lote {}-{} de {}", i + 1, fim, itens.size());

                byte[] pdfLote = gerarPdfDireto(lote);
                pdfsParciais.add(pdfLote);

                processados = fim;
                if (progressCallback != null) {
                    progressCallback.accept(processados);
                }
            }

            // Mesclar todos os PDFs
            return mesclarPdfs(pdfsParciais);

        } catch (Exception e) {
            logger.error("Erro ao gerar PDF assíncrono: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na geração assíncrona do PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] gerarPdfFichaUnica(FichaPdfItemDto item) {
        logger.debug("Gerando PDF para ficha única: {}", item.getNumeroIdentificacao());

        try {
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
            logger.debug("Lendo arquivo PDF: {}", caminhoArquivo);
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
            return templateHtml.contains("<html") &&
                    templateHtml.contains("<body") &&
                    templateHtml.contains("</html>");

        } catch (Exception e) {
            logger.warn("Erro na validação do template: {}", e.getMessage());
            return false;
        }
    }

    private byte[] gerarPdfDireto(List<FichaPdfItemDto> itens) throws Exception {
        logger.debug("Gerando PDF direto para {} itens", itens.size());

        List<byte[]> fichasPdf = new ArrayList<>();

        for (FichaPdfItemDto item : itens) {
            String html = templateService.gerarHtmlFicha(item);
            byte[] fichaPdf = converterHtmlParaPdf(html);
            fichasPdf.add(fichaPdf);
        }

        return mesclarPdfs(fichasPdf);
    }

    private byte[] gerarPdfEmLotes(List<FichaPdfItemDto> itens) throws Exception {
        logger.debug("Gerando PDF em lotes para {} itens", itens.size());

        List<byte[]> lotesPdf = new ArrayList<>();

        for (int i = 0; i < itens.size(); i += batchSize) {
            int fim = Math.min(i + batchSize, itens.size());
            List<FichaPdfItemDto> lote = itens.subList(i, fim);

            byte[] pdfLote = gerarPdfDireto(lote);
            lotesPdf.add(pdfLote);

            logger.debug("Lote processado: {}-{} de {}", i + 1, fim, itens.size());
        }

        return mesclarPdfs(lotesPdf);
    }

    private byte[] converterHtmlParaPdf(String html) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Configurar propriedades do conversor
        ConverterProperties properties = new ConverterProperties();
        properties.setBaseUri("");

        // Converter HTML para PDF
        HtmlConverter.convertToPdf(html, outputStream, properties);

        return outputStream.toByteArray();
    }

    private byte[] mesclarPdfs(List<byte[]> pdfBytes) throws Exception {
        if (pdfBytes.isEmpty()) {
            throw new IllegalArgumentException("Lista de PDFs para mesclar não pode estar vazia");
        }

        if (pdfBytes.size() == 1) {
            return pdfBytes.get(0);
        }

        logger.debug("Mesclando {} PDFs", pdfBytes.size());

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfDocument pdfDestino = new PdfDocument(new PdfWriter(outputStream));
        PdfMerger merger = new PdfMerger(pdfDestino);

        for (byte[] pdfData : pdfBytes) {
            ByteArrayInputStream inputStream = new ByteArrayInputStream(pdfData);
            PdfDocument pdfOrigem = new PdfDocument(new PdfReader(inputStream));

            merger.merge(pdfOrigem, 1, pdfOrigem.getNumberOfPages());
            pdfOrigem.close();
        }

        pdfDestino.close();
        return outputStream.toByteArray();
    }
}