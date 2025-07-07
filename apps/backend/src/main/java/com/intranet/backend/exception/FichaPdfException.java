package com.intranet.backend.exception;

public class FichaPdfException extends RuntimeException {

    public FichaPdfException(String message) {
        super(message);
    }

    public FichaPdfException(String message, Throwable cause) {
        super(message, cause);
    }
}