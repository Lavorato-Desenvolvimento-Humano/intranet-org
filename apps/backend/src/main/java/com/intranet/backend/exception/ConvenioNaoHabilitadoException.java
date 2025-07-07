package com.intranet.backend.exception;

public class ConvenioNaoHabilitadoException extends FichaPdfException {

    private final java.util.UUID convenioId;

    public ConvenioNaoHabilitadoException(java.util.UUID convenioId) {
        super("Convênio não habilitado para geração de fichas PDF: " + convenioId);
        this.convenioId = convenioId;
    }

    public java.util.UUID getConvenioId() {
        return convenioId;
    }
}