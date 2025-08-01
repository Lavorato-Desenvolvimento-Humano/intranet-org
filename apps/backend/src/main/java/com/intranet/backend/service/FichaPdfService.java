package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.User;
import org.springframework.stereotype.Service;

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
     *  @deprecated Use gerarFichasConvenioComJobId em vez disso
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasConvenio(FichaPdfConvenioRequest request);

    /**
     * NOVO: Gera fichas PDF para um convênio específico com jobId fornecido (assíncrono)
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasConvenioComJobId(FichaPdfConvenioRequest request, String jobId);

    /*
     * Gera fichas PDF em lote para múltiplos convênios (batch assíncrono).
     * @deprecated Use gerarFichasLoteComJobId em vez disso
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasLote(FichaPdfLoteRequest request);

    /**
     * NOVO: Gera fichas PDF em lote com jobId fornecido (batch assíncrono).
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasLoteComJobId(FichaPdfLoteRequest request, String jobId);

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

    /**
     * Gera fichas PDF para um convênio específico com jobId e usuário fornecidos (assíncrono)
     * Esta versão recebe o usuário como parâmetro para evitar problemas com SecurityContext
     */
    CompletableFuture<FichaPdfResponseDto> gerarFichasConvenioComJobIdEUsuario(
            FichaPdfConvenioRequest request,
            String jobId,
            User usuario
    );

    /**
     * Obtém configuração de PDF de um convênio específico
     */
    ConvenioFichaPdfConfigDto getConvenioConfig(UUID convenioId);
}
