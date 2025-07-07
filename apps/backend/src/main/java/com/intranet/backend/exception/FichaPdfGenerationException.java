package com.intranet.backend.exception;

public class FichaPdfGenerationException extends FichaPdfException {

    private final String jobId;

    public FichaPdfGenerationException(String jobId, String message) {
        super(message);
        this.jobId = jobId;
    }

    public FichaPdfGenerationException(String jobId, String message, Throwable cause) {
        super(message, cause);
        this.jobId = jobId;
    }

    public String getJobId() {
        return jobId;
    }
}