package com.intranet.backend.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import java.util.regex.Pattern;

@Component
public class FichaPdfUtils {

    private static final Random random = new Random();
    private static final Pattern SLUG_PATTERN = Pattern.compile("[^a-z0-9\\s-]");
    private static final DateTimeFormatter FILENAME_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * Gera número de identificação único para ficha
     */
    public static String gerarNumeroIdentificacao(String prefixo) {
        if (prefixo == null || prefixo.trim().isEmpty()) {
            prefixo = "PNE";
        }

        // Formato: PREFIXO + timestamp + número aleatório
        long timestamp = System.currentTimeMillis() % 100000; // Últimos 5 dígitos
        int numeroAleatorio = random.nextInt(9000) + 1000; // 1000-9999

        return String.format("%s%05d%04d", prefixo, timestamp, numeroAleatorio);
    }

    /**
     * Cria slug a partir de string (para nomes de arquivos)
     */
    public static String criarSlug(String input) {
        if (input == null) return "arquivo";

        return SLUG_PATTERN.matcher(input.toLowerCase())
                .replaceAll("")
                .replaceAll("\\s+", "_")
                .replaceAll("-+", "_")
                .replaceAll("_{2,}", "_")
                .replaceAll("^_|_$", "");
    }

    /**
     * Gera nome de arquivo único para PDF
     */
    public static String gerarNomeArquivo(String baseNome, String jobId) {
        String timestamp = LocalDateTime.now().format(FILENAME_DATE_FORMAT);
        String slug = criarSlug(baseNome);
        String jobIdSuffix = jobId.substring(0, Math.min(8, jobId.length()));

        return String.format("%s_%s_%s.pdf", slug, timestamp, jobIdSuffix);
    }

    /**
     * Formata tamanho de arquivo para exibição
     */
    public static String formatarTamanhoArquivo(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    /**
     * Valida parâmetros de geração
     */
    public static void validarParametrosGeracao(Integer mes, Integer ano) {
        if (mes == null || mes < 1 || mes > 12) {
            throw new IllegalArgumentException("Mês deve estar entre 1 e 12");
        }

        if (ano == null || ano < 2020 || ano > LocalDateTime.now().getYear() + 1) {
            throw new IllegalArgumentException("Ano inválido");
        }
    }

    /**
     * Calcula tempo estimado de processamento
     */
    public static long estimarTempoProcessamento(int numeroFichas) {
        // Estimativa baseada em: 100ms por ficha + overhead
        long tempoBase = numeroFichas * 100L; // ms
        long overhead = Math.min(numeroFichas / 10 * 1000L, 30000L); // Max 30s de overhead

        return tempoBase + overhead;
    }

    /**
     * Verifica se job deve ser cancelado por timeout
     */
    public static boolean isJobComTimeout(LocalDateTime iniciado, int timeoutMinutos) {
        if (iniciado == null) return false;

        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime limiteTimeout = iniciado.plusMinutes(timeoutMinutos);

        return agora.isAfter(limiteTimeout);
    }
}