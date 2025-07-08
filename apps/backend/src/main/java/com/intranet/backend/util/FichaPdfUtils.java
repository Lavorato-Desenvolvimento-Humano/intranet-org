package com.intranet.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Classe utilitária para operações relacionadas à geração de fichas PDF
 */
public class FichaPdfUtils {

    private static final Logger logger = LoggerFactory.getLogger(FichaPdfUtils.class);

    // Formatadores de data
    private static final DateTimeFormatter FORMATTER_TIMESTAMP = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter FORMATTER_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATTER_ARQUIVO = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    // Locale brasileiro
    private static final Locale LOCALE_BR = new Locale("pt", "BR");

    // Padrões regex
    private static final Pattern PATTERN_EMAIL = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PATTERN_ALFANUMERICO = Pattern.compile("^[a-zA-Z0-9\\s]+$");

    // Constantes
    public static final int MAX_FICHAS_POR_LOTE = 1000;
    public static final int TIMEOUT_DEFAULT_MINUTOS = 30;
    public static final long MAX_TAMANHO_ARQUIVO_MB = 50;

    private FichaPdfUtils() {
        // Construtor privado para classe utilitária
    }

    /**
     * Gera um Job ID único
     */
    public static String gerarJobId() {
        return "JOB_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Gera número de identificação único para ficha
     */
    public static String gerarNumeroIdentificacao(String prefixo) {
        String prefixoLimpo = limparPrefixo(prefixo);
        long timestamp = System.currentTimeMillis();
        int random = (int) (Math.random() * 1000);
        return String.format("%s%d%03d", prefixoLimpo, timestamp % 100000, random);
    }

    /**
     * Limpa e valida prefixo de identificação
     */
    public static String limparPrefixo(String prefixo) {
        if (prefixo == null || prefixo.trim().isEmpty()) {
            return "PNE";
        }

        String limpo = prefixo.trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "");

        return limpo.length() > 5 ? limpo.substring(0, 5) :
                limpo.isEmpty() ? "PNE" : limpo;
    }

    /**
     * Formata data e hora para exibição
     */
    public static String formatarTimestamp(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "Não informado";
        }
        return dateTime.format(FORMATTER_TIMESTAMP);
    }

    /**
     * Formata data para exibição
     */
    public static String formatarData(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "Não informado";
        }
        return dateTime.format(FORMATTER_DATA);
    }

    /**
     * Formata data para nome de arquivo
     */
    public static String formatarDataArquivo(LocalDateTime dateTime) {
        if (dateTime == null) {
            dateTime = LocalDateTime.now();
        }
        return dateTime.format(FORMATTER_ARQUIVO);
    }

    /**
     * Obtém mês por extenso em português
     */
    public static String getMesExtenso(Integer mes) {
        if (mes == null || mes < 1 || mes > 12) {
            return "Mês inválido";
        }

        try {
            return java.time.Month.of(mes).getDisplayName(TextStyle.FULL, LOCALE_BR);
        } catch (Exception e) {
            logger.warn("Erro ao obter mês por extenso para {}: {}", mes, e.getMessage());
            return "Mês " + mes;
        }
    }

    /**
     * Obtém mês abreviado em português
     */
    public static String getMesAbreviado(Integer mes) {
        if (mes == null || mes < 1 || mes > 12) {
            return "Inv";
        }

        try {
            return java.time.Month.of(mes).getDisplayName(TextStyle.SHORT, LOCALE_BR);
        } catch (Exception e) {
            return "M" + mes;
        }
    }

    /**
     * Converte texto para slug (nome de arquivo seguro)
     */
    public static String slugify(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "sem_nome";
        }

        return input.toLowerCase()
                .replaceAll("[àáâãäå]", "a")
                .replaceAll("[èéêë]", "e")
                .replaceAll("[ìíîï]", "i")
                .replaceAll("[òóôõö]", "o")
                .replaceAll("[ùúûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[ñ]", "n")
                .replaceAll("[^a-z0-9\\s-_]", "")
                .replaceAll("\\s+", "_")
                .replaceAll("-+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .trim();
    }

    /**
     * Formata unidade enum para exibição
     */
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

    /**
     * Trunca texto mantendo palavras inteiras
     */
    public static String truncar(String texto, int tamanhoMaximo) {
        if (texto == null || texto.length() <= tamanhoMaximo) {
            return texto;
        }

        if (tamanhoMaximo <= 3) {
            return texto.substring(0, tamanhoMaximo);
        }

        String truncado = texto.substring(0, tamanhoMaximo - 3);
        int ultimoEspaco = truncado.lastIndexOf(' ');

        if (ultimoEspaco > tamanhoMaximo / 2) {
            truncado = truncado.substring(0, ultimoEspaco);
        }

        return truncado + "...";
    }

    /**
     * Capitaliza primeira letra de cada palavra
     */
    public static String capitalizarPalavras(String texto) {
        if (texto == null || texto.trim().isEmpty()) {
            return texto;
        }

        String[] palavras = texto.toLowerCase().split("\\s+");
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

    /**
     * Valida se o ano é válido para geração de fichas
     */
    public static boolean isAnoValido(Integer ano) {
        if (ano == null) {
            return false;
        }

        int anoAtual = LocalDateTime.now().getYear();
        return ano >= (anoAtual - 5) && ano <= (anoAtual + 1);
    }

    /**
     * Valida se o mês é válido
     */
    public static boolean isMesValido(Integer mes) {
        return mes != null && mes >= 1 && mes <= 12;
    }

    /**
     * Valida quantidade de fichas para processamento
     */
    public static boolean isQuantidadeFichasValida(int quantidade) {
        return quantidade > 0 && quantidade <= MAX_FICHAS_POR_LOTE;
    }

    /**
     * Valida email básico
     */
    public static boolean isEmailValido(String email) {
        return email != null && PATTERN_EMAIL.matcher(email).matches();
    }

    /**
     * Valida se string contém apenas caracteres alfanuméricos e espaços
     */
    public static boolean isAlfanumerico(String texto) {
        return texto != null && PATTERN_ALFANUMERICO.matcher(texto).matches();
    }

    /**
     * Valida UUID
     */
    public static boolean isUuidValido(String uuid) {
        if (uuid == null || uuid.trim().isEmpty()) {
            return false;
        }

        try {
            UUID.fromString(uuid);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Formata tamanho em bytes para formato legível
     */
    public static String formatarTamanhoArquivo(Long tamanhoBytes) {
        if (tamanhoBytes == null || tamanhoBytes == 0) {
            return "0 B";
        }

        final String[] unidades = {"B", "KB", "MB", "GB", "TB"};
        double tamanho = tamanhoBytes.doubleValue();
        int unidadeIndex = 0;

        while (tamanho >= 1024 && unidadeIndex < unidades.length - 1) {
            tamanho /= 1024;
            unidadeIndex++;
        }

        if (unidadeIndex == 0) {
            return String.format("%d %s", tamanhoBytes, unidades[0]);
        } else {
            return String.format("%.1f %s", tamanho, unidades[unidadeIndex]);
        }
    }

    /**
     * Converte MB para bytes
     */
    public static long mbParaBytes(double mb) {
        return (long) (mb * 1024 * 1024);
    }

    /**
     * Converte bytes para MB
     */
    public static double bytesParaMb(long bytes) {
        return bytes / (1024.0 * 1024.0);
    }

    /**
     * Calcula percentual de progresso
     */
    public static double calcularProgresso(int processados, int total) {
        if (total <= 0) {
            return 0.0;
        }
        return Math.min(100.0, (double) processados / total * 100.0);
    }

    /**
     * Formata progresso como string
     */
    public static String formatarProgresso(int processados, int total) {
        double percentual = calcularProgresso(processados, total);
        return String.format("%d/%d (%.1f%%)", processados, total, percentual);
    }

    /**
     * Calcula tempo estimado restante em minutos
     */
    public static Long calcularTempoEstimado(int processados, int total, LocalDateTime inicio) {
        if (processados <= 0 || total <= processados || inicio == null) {
            return null;
        }

        long minutosDecorridos = java.time.Duration.between(inicio, LocalDateTime.now()).toMinutes();
        if (minutosDecorridos <= 0) {
            return null;
        }

        double velocidade = (double) processados / minutosDecorridos; // fichas por minuto
        int restantes = total - processados;

        return Math.round(restantes / velocidade);
    }

    /**
     * Gera nome de arquivo PDF
     */
    public static String gerarNomeArquivoPdf(String tipo, String identificador, Integer mes, Integer ano) {
        StringBuilder nome = new StringBuilder("fichas");

        if (tipo != null && !tipo.trim().isEmpty()) {
            nome.append("_").append(slugify(tipo));
        }

        if (identificador != null && !identificador.trim().isEmpty()) {
            nome.append("_").append(slugify(identificador));
        }

        if (mes != null && ano != null) {
            nome.append(String.format("_%02d_%d", mes, ano));
        }

        nome.append("_").append(formatarDataArquivo(LocalDateTime.now()));
        nome.append(".pdf");

        return nome.toString();
    }

    /**
     * Gera nome de arquivo temporário
     */
    public static String gerarNomeArquivoTemp(String prefixo) {
        String prefixoLimpo = prefixo != null ? slugify(prefixo) : "temp";
        return prefixoLimpo + "_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }

    /**
     * Remove caracteres especiais mantendo apenas alfanuméricos, espaços e alguns símbolos
     */
    public static String sanitizarTexto(String texto) {
        if (texto == null) {
            return "";
        }

        return texto.replaceAll("[^a-zA-Z0-9\\sáéíóúâêîôûàèìòùãõç.,-]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Limpa path de arquivo
     */
    public static String sanitizarPath(String path) {
        if (path == null) {
            return "";
        }

        return path.replaceAll("[<>:\"|?*]", "")
                .replaceAll("\\\\", "/")
                .replaceAll("/+", "/")
                .trim();
    }

    /**
     * Converte string para Integer com valor padrão
     */
    public static Integer parseIntegerSafe(String valor, Integer padrao) {
        try {
            return valor != null && !valor.trim().isEmpty() ? Integer.parseInt(valor.trim()) : padrao;
        } catch (NumberFormatException e) {
            return padrao;
        }
    }

    /**
     * Converte string para Boolean com valor padrão
     */
    public static Boolean parseBooleanSafe(String valor, Boolean padrao) {
        if (valor == null || valor.trim().isEmpty()) {
            return padrao;
        }

        String valorLimpo = valor.trim().toLowerCase();
        return "true".equals(valorLimpo) || "1".equals(valorLimpo) || "sim".equals(valorLimpo);
    }

    /**
     * Cria mensagem de log formatada para processamento
     */
    public static String criarMensagemLog(String acao, String entidade, String identificador, Object... parametros) {
        StringBuilder mensagem = new StringBuilder();
        mensagem.append(acao).append(" ").append(entidade);

        if (identificador != null) {
            mensagem.append(" [").append(identificador).append("]");
        }

        if (parametros.length > 0) {
            mensagem.append(" - ");
            for (int i = 0; i < parametros.length; i += 2) {
                if (i > 0) {
                    mensagem.append(", ");
                }
                if (i + 1 < parametros.length) {
                    mensagem.append(parametros[i]).append(": ").append(parametros[i + 1]);
                }
            }
        }

        return mensagem.toString();
    }

    /**
     * Extrai informações resumidas de uma exceção
     */
    public static String extrairResumoErro(Exception e) {
        if (e == null) {
            return "Erro desconhecido";
        }

        String classe = e.getClass().getSimpleName();
        String mensagem = e.getMessage();

        if (mensagem == null || mensagem.trim().isEmpty()) {
            mensagem = "Sem detalhes do erro";
        }

        return classe + ": " + truncar(mensagem, 200);
    }
}