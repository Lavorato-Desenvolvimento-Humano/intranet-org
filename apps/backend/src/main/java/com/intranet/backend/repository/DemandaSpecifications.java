package com.intranet.backend.repository;

import com.intranet.backend.dto.DemandaFilterDto;
import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.UserEquipe;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class DemandaSpecifications {

    /**
     * Cria uma especificação a partir dos filtros fornecidos
     */
    public static Specification<Demanda> withFilters(DemandaFilterDto filtros) {
        return Specification
                .where(atribuidoParaEquals(filtros.getAtribuidoParaId()))
                .and(criadoPorEquals(filtros.getCriadoPorId()))
                .and(statusEquals(filtros.getStatus()))
                .and(prioridadeEquals(filtros.getPrioridade()))
                .and(dataInicioGreaterThanOrEqualTo(filtros.getDataInicio()))
                .and(dataFimLessThanOrEqualTo(filtros.getDataFim()))
                .and(criadaEmGreaterThanOrEqualTo(filtros.getCriadaApos()))
                .and(criadaEmLessThanOrEqualTo(filtros.getCriadaAntes()));
    }

    /**
     * Filtra demandas pelo usuário atribuído
     */
    public static Specification<Demanda> atribuidoParaEquals(UUID atribuidoParaId) {
        if (atribuidoParaId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("atribuidoPara").get("id"), atribuidoParaId);
    }

    /**
     * Filtra demandas pelo usuário criador
     */
    public static Specification<Demanda> criadoPorEquals(UUID criadoPorId) {
        if (criadoPorId == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("criadoPor").get("id"), criadoPorId);
    }

    /**
     * Filtra demandas pelo status
     */
    public static Specification<Demanda> statusEquals(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), status);
    }

    /**
     * Filtra demandas pela prioridade
     */
    public static Specification<Demanda> prioridadeEquals(String prioridade) {
        if (!StringUtils.hasText(prioridade)) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("prioridade"), prioridade);
    }

    /**
     * Filtra demandas pela data de início
     */
    public static Specification<Demanda> dataInicioGreaterThanOrEqualTo(LocalDateTime data) {
        if (data == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("dataInicio"), data);
    }

    /**
     * Filtra demandas pela data de fim
     */
    public static Specification<Demanda> dataFimLessThanOrEqualTo(LocalDateTime data) {
        if (data == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(root.get("dataFim"), data);
    }

    /**
     * Filtra demandas pela data de criação (após)
     */
    public static Specification<Demanda> criadaEmGreaterThanOrEqualTo(LocalDateTime data) {
        if (data == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("criadaEm"), data);
    }

    /**
     * Filtra demandas pela data de criação (antes)
     */
    public static Specification<Demanda> criadaEmLessThanOrEqualTo(LocalDateTime data) {
        if (data == null) {
            return null;
        }
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(root.get("criadaEm"), data);
    }

    /**
     * Filtra demandas visíveis para um usuário com base no papel
     */
    public static Specification<Demanda> visiveisPara(UUID userId, boolean isSupervisor, boolean isGerente, List<UUID> equipesIds) {
        if (isGerente) {
            // Gerentes podem ver todas as demandas
            return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        } else if (isSupervisor && !equipesIds.isEmpty()) {
            // Supervisores podem ver demandas da sua equipe
            return (root, query, criteriaBuilder) -> {
                return criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("criadoPor").get("id"), userId),
                        criteriaBuilder.equal(root.get("atribuidoPara").get("id"), userId),
                        criteriaBuilder.in(root.get("atribuidoPara").get("id")).value(equipesIds)
                );
            };
        } else {
            // Usuários comuns só podem ver suas próprias demandas
            return (root, query, criteriaBuilder) ->
                    criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("criadoPor").get("id"), userId),
                            criteriaBuilder.equal(root.get("atribuidoPara").get("id"), userId)
                    );
        }
    }
}