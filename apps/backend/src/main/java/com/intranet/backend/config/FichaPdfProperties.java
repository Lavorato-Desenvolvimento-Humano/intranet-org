package com.intranet.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ficha-pdf")
public class FichaPdfProperties {

    private Processing processing = new Processing();
    private Storage storage = new Storage();
    private Pdf pdf = new Pdf();
    private Cleanup cleanup = new Cleanup();

    public static class Processing {
        private int batchSize = 50;
        private int maxConcurrentJobs = 3;
        private int timeoutMinutes = 30;
        private boolean enableProgressCallback = true;

        // Getters e Setters
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }

        public int getMaxConcurrentJobs() { return maxConcurrentJobs; }
        public void setMaxConcurrentJobs(int maxConcurrentJobs) { this.maxConcurrentJobs = maxConcurrentJobs; }

        public int getTimeoutMinutes() { return timeoutMinutes; }
        public void setTimeoutMinutes(int timeoutMinutes) { this.timeoutMinutes = timeoutMinutes; }

        public boolean isEnableProgressCallback() { return enableProgressCallback; }
        public void setEnableProgressCallback(boolean enableProgressCallback) { this.enableProgressCallback = enableProgressCallback; }
    }

    public static class Storage {
        private String path = "/app/storage/fichas-pdf";
        private String tempPath = "/app/storage/temp";
        private long maxFileSize = 52428800; // 50MB
        private int retentionDays = 30;

        // Getters e Setters
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }

        public String getTempPath() { return tempPath; }
        public void setTempPath(String tempPath) { this.tempPath = tempPath; }

        public long getMaxFileSize() { return maxFileSize; }
        public void setMaxFileSize(long maxFileSize) { this.maxFileSize = maxFileSize; }

        public int getRetentionDays() { return retentionDays; }
        public void setRetentionDays(int retentionDays) { this.retentionDays = retentionDays; }
    }

    public static class Pdf {
        private String formatoPadrao = "A4";
        private boolean compressao = true;
        private String qualidade = "ALTA";
        private int maxFichasPorJob = 1000;

        // Getters e Setters
        public String getFormatoPadrao() { return formatoPadrao; }
        public void setFormatoPadrao(String formatoPadrao) { this.formatoPadrao = formatoPadrao; }

        public boolean isCompressao() { return compressao; }
        public void setCompressao(boolean compressao) { this.compressao = compressao; }

        public String getQualidade() { return qualidade; }
        public void setQualidade(String qualidade) { this.qualidade = qualidade; }

        public int getMaxFichasPorJob() { return maxFichasPorJob; }
        public void setMaxFichasPorJob(int maxFichasPorJob) { this.maxFichasPorJob = maxFichasPorJob; }
    }

    public static class Cleanup {
        private boolean enabled = true;
        private int errorJobsRetentionDays = 7;
        private int completedJobsRetentionDays = 30;
        private int logsRetentionDays = 365;
        private String cronExpression = "0 0 2 * * ?";

        // Getters e Setters
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public int getErrorJobsRetentionDays() { return errorJobsRetentionDays; }
        public void setErrorJobsRetentionDays(int errorJobsRetentionDays) { this.errorJobsRetentionDays = errorJobsRetentionDays; }

        public int getCompletedJobsRetentionDays() { return completedJobsRetentionDays; }
        public void setCompletedJobsRetentionDays(int completedJobsRetentionDays) { this.completedJobsRetentionDays = completedJobsRetentionDays; }

        public int getLogsRetentionDays() { return logsRetentionDays; }
        public void setLogsRetentionDays(int logsRetentionDays) { this.logsRetentionDays = logsRetentionDays; }

        public String getCronExpression() { return cronExpression; }
        public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
    }

    // Getters principais
    public Processing getProcessing() { return processing; }
    public void setProcessing(Processing processing) { this.processing = processing; }

    public Storage getStorage() { return storage; }
    public void setStorage(Storage storage) { this.storage = storage; }

    public Pdf getPdf() { return pdf; }
    public void setPdf(Pdf pdf) { this.pdf = pdf; }

    public Cleanup getCleanup() { return cleanup; }
    public void setCleanup(Cleanup cleanup) { this.cleanup = cleanup; }
}