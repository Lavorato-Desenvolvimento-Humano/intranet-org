package com.intranet.backend.service;

import com.intranet.backend.dto.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;


public interface FichaPdfService {

    /*
     * Gera fichas PDF para um paciente específico, agrupando por mês e ano.
     */
    FichaPdfResponseDto gerarFichasPaciente(FichaPdfPacienteRequest request);

    /*
     *  Gera fichas PDF para um convênio específico, agrupando por mês e ano. (assíncrono)
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasConvenio(FichaPdfConvenioRequest request);

    /*
     * Gera fichas PDF em lote para múltiplos convênios (batch assíncrono).
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasLote(FichaPdfLoteRequest request);

    /*
     * Busca status de uma geração assíncrona
     */
    FichaPdfStatusDto getStatusGeracao(String jobId);

    /*
     * Lista os convênios habilitados para geração de fichas PDF.
     */
    List<ConvenioDto> getConveniosHabilitados();

    /**
     * Habilita/desabilita convênio para geração de PDF
     */
    void toggleConvenioHabilitado(UUID convenioId, boolean habilitado);

    /**
     * Baixa PDF gerado
     */
    byte[] baixarPdfGerado(String jobId);

    /**
     * Lista jobs de geração do usuário
     */
    List<FichaPdfJobDto> getJobsUsuario();
}
