package com.intranet.backend.service.impl;

import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.DemandaAudit;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.DemandaAuditRepository;
import com.intranet.backend.service.DemandaAuditService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implementação do serviço de auditoria de demandas
 */
@Service
@RequiredArgsConstructor
public class DemandaAuditServiceImpl implements DemandaAuditService {

    private static final Logger logger = LoggerFactory.getLogger(DemandaAuditServiceImpl.class);
    private final DemandaAuditRepository demandaAuditRepository;

    @Override
    @Transactional
    public void registrarCriacaoDemanda(Demanda demanda, User criadoPor) {
        logger.info("Registrando criação da demanda: {}", demanda.getId());

        DemandaAudit audit = new DemandaAudit();
        audit.setDemandaId(demanda.getId());
        audit.setCampoAlterado("demanda");
        audit.setValorAnterior(null);
        audit.setValorNovo("Demanda criada com título: " + demanda.getTitulo());
        audit.setAlteradoPor(criadoPor);
        audit.setOperacao(DemandaAudit.Operacao.CRIACAO.getValor());

        demandaAuditRepository.save(audit);
        logger.debug("Registro de criação salvo com sucesso para demanda: {}", demanda.getId());
    }

    @Override
    @Transactional
    public void registrarAtualizacaoDemanda(Demanda demandaAntiga, Demanda demandaNova, User atualizadoPor) {
        logger.info("Registrando atualização da demanda: {}", demandaNova.getId());

        // Verificar alterações no título
        if (!demandaAntiga.getTitulo().equals(demandaNova.getTitulo())) {
            registrarAlteracaoCampo(
                    demandaNova.getId(),
                    "titulo",
                    demandaAntiga.getTitulo(),
                    demandaNova.getTitulo(),
                    atualizadoPor,
                    DemandaAudit.Operacao.ATUALIZACAO.getValor()
            );
        }

        // Verificar alterações na descrição
        if ((demandaAntiga.getDescricao() == null && demandaNova.getDescricao() != null) ||
                (demandaAntiga.getDescricao() != null && !demandaAntiga.getDescricao().equals(demandaNova.getDescricao()))) {
            registrarAlteracaoCampo(
                    demandaNova.getId(),
                    "descricao",
                    demandaAntiga.getDescricao() != null ? demandaAntiga.getDescricao() : "Não definida",
                    demandaNova.getDescricao() != null ? demandaNova.getDescricao() : "Não definida",
                    atualizadoPor,
                    DemandaAudit.Operacao.ATUALIZACAO.getValor()
            );
        }

        // Verificar alterações nas datas
        if ((demandaAntiga.getDataInicio() == null && demandaNova.getDataInicio() != null) ||
                (demandaAntiga.getDataInicio() != null && !demandaAntiga.getDataInicio().equals(demandaNova.getDataInicio()))) {
            registrarAlteracaoCampo(
                    demandaNova.getId(),
                    "dataInicio",
                    demandaAntiga.getDataInicio() != null ? demandaAntiga.getDataInicio().toString() : "Não definida",
                    demandaNova.getDataInicio() != null ? demandaNova.getDataInicio().toString() : "Não definida",
                    atualizadoPor,
                    DemandaAudit.Operacao.ATUALIZACAO.getValor()
            );
        }

        if ((demandaAntiga.getDataFim() == null && demandaNova.getDataFim() != null) ||
                (demandaAntiga.getDataFim() != null && !demandaAntiga.getDataFim().equals(demandaNova.getDataFim()))) {
            registrarAlteracaoCampo(
                    demandaNova.getId(),
                    "dataFim",
                    demandaAntiga.getDataFim() != null ? demandaAntiga.getDataFim().toString() : "Não definida",
                    demandaNova.getDataFim() != null ? demandaNova.getDataFim().toString() : "Não definida",
                    atualizadoPor,
                    DemandaAudit.Operacao.ATUALIZACAO.getValor()
            );
        }

        // Verificar alterações na prioridade
        if (!demandaAntiga.getPrioridade().equals(demandaNova.getPrioridade())) {
            registrarAlteracaoCampo(
                    demandaNova.getId(),
                    "prioridade",
                    demandaAntiga.getPrioridade(),
                    demandaNova.getPrioridade(),
                    atualizadoPor,
                    DemandaAudit.Operacao.ATUALIZACAO.getValor()
            );
        }

        // Verificar alterações no status (registrado separadamente)
        if (!demandaAntiga.getStatus().equals(demandaNova.getStatus())) {
            registrarAlteracaoStatus(demandaNova, demandaAntiga.getStatus(), demandaNova.getStatus(), atualizadoPor);
        }

        // Verificar alterações na atribuição (registrado separadamente)
        if (!demandaAntiga.getAtribuidoPara().getId().equals(demandaNova.getAtribuidoPara().getId())) {
            registrarReatribuicao(demandaNova, demandaAntiga.getAtribuidoPara(), demandaNova.getAtribuidoPara(), atualizadoPor);
        }
    }

    @Override
    @Transactional
    public void registrarAlteracaoStatus(Demanda demanda, String statusAntigo, String statusNovo, User alteradoPor) {
        logger.info("Registrando alteração de status da demanda {} de '{}' para '{}'",
                demanda.getId(), statusAntigo, statusNovo);

        DemandaAudit audit = new DemandaAudit();
        audit.setDemandaId(demanda.getId());
        audit.setCampoAlterado("status");
        audit.setValorAnterior(statusAntigo);
        audit.setValorNovo(statusNovo);
        audit.setAlteradoPor(alteradoPor);
        audit.setOperacao(DemandaAudit.Operacao.MUDANCA_STATUS.getValor());

        demandaAuditRepository.save(audit);
        logger.debug("Registro de alteração de status salvo com sucesso para demanda: {}", demanda.getId());
    }

    @Override
    @Transactional
    public void registrarReatribuicao(Demanda demanda, User usuarioAntigo, User usuarioNovo, User alteradoPor) {
        logger.info("Registrando reatribuição da demanda {} de '{}' para '{}'",
                demanda.getId(), usuarioAntigo.getFullName(), usuarioNovo.getFullName());

        DemandaAudit audit = new DemandaAudit();
        audit.setDemandaId(demanda.getId());
        audit.setCampoAlterado("atribuidoPara");
        audit.setValorAnterior(usuarioAntigo.getFullName() + " (" + usuarioAntigo.getId() + ")");
        audit.setValorNovo(usuarioNovo.getFullName() + " (" + usuarioNovo.getId() + ")");
        audit.setAlteradoPor(alteradoPor);
        audit.setOperacao(DemandaAudit.Operacao.ATRIBUICAO.getValor());

        demandaAuditRepository.save(audit);
        logger.debug("Registro de reatribuição salvo com sucesso para demanda: {}", demanda.getId());
    }

    @Override
    public List<DemandaAudit> getHistoricoAlteracoes(UUID demandaId) {
        logger.info("Buscando histórico de alterações para demanda: {}", demandaId);
        return demandaAuditRepository.findByDemandaIdOrderByDataAlteracaoDesc(demandaId);
    }

    @Override
    public Page<DemandaAudit> getHistoricoAlteracoesPaginado(UUID demandaId, Pageable pageable) {
        logger.info("Buscando histórico de alterações paginado para demanda: {}", demandaId);
        return demandaAuditRepository.findByDemandaIdOrderByDataAlteracaoDesc(demandaId, pageable);
    }

    @Override
    public List<DemandaAudit> getHistoricoAlteracoesPorUsuario(UUID usuarioId) {
        logger.info("Buscando histórico de alterações feitas pelo usuário: {}", usuarioId);
        return demandaAuditRepository.findByAlteradoPorIdOrderByDataAlteracaoDesc(usuarioId);
    }

    @Override
    public List<DemandaAudit> getHistoricoAlteracoesStatus(UUID demandaId) {
        logger.info("Buscando histórico de alterações de status para demanda: {}", demandaId);
        return demandaAuditRepository.findByDemandaIdAndOperacaoOrderByDataAlteracaoDesc(
                demandaId, DemandaAudit.Operacao.MUDANCA_STATUS.getValor());
    }

    @Override
    public List<DemandaAudit> getHistoricoReatribuicoes(UUID demandaId) {
        logger.info("Buscando histórico de reatribuições para demanda: {}", demandaId);
        return demandaAuditRepository.findByDemandaIdAndOperacaoOrderByDataAlteracaoDesc(
                demandaId, DemandaAudit.Operacao.ATRIBUICAO.getValor());
    }

    /**
     * Método auxiliar para registrar alteração em um campo específico
     */
    private void registrarAlteracaoCampo(UUID demandaId, String campo, String valorAntigo, String valorNovo,
                                         User alteradoPor, String operacao) {
        DemandaAudit audit = new DemandaAudit();
        audit.setDemandaId(demandaId);
        audit.setCampoAlterado(campo);
        audit.setValorAnterior(valorAntigo);
        audit.setValorNovo(valorNovo);
        audit.setAlteradoPor(alteradoPor);
        audit.setOperacao(operacao);

        demandaAuditRepository.save(audit);
    }
}