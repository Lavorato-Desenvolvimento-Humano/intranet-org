package com.intranet.backend.service.impl;

import com.intranet.backend.model.Demanda;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.DemandaRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.DemandaStatsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementação do serviço de estatísticas de demandas
 */
@Service
@RequiredArgsConstructor
public class DemandaStatsServiceImpl implements DemandaStatsService {

    private static final Logger logger = LoggerFactory.getLogger(DemandaStatsServiceImpl.class);

    private final DemandaRepository demandaRepository;
    private final UserRepository userRepository;

    @Override
    public Map<String, Object> getEstatisticasGerais() {
        logger.info("Obtendo estatísticas gerais de demandas");
        User currentUser = getCurrentUser();

        // Verificar se o usuário tem permissão para ver estatísticas gerais
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        if (!isGerente) {
            throw new AccessDeniedException("Apenas gerentes podem ver estatísticas gerais");
        }

        Map<String, Object> estatisticas = new HashMap<>();

        // Contagem de demandas por status
        Map<String, Long> contagemPorStatus = Arrays.stream(Demanda.Status.values())
                .collect(Collectors.toMap(
                        Demanda.Status::getValor,
                        status -> demandaRepository.countByStatus(status.getValor())
                ));
        estatisticas.put("contagemPorStatus", contagemPorStatus);

        // Contagem de demandas por prioridade
        Map<String, Long> contagemPorPrioridade = Arrays.stream(Demanda.Prioridade.values())
                .collect(Collectors.toMap(
                        Demanda.Prioridade::getValor,
                        prioridade -> demandaRepository.countByPrioridade(prioridade.getValor())
                ));
        estatisticas.put("contagemPorPrioridade", contagemPorPrioridade);

        // Demandas criadas na última semana
        LocalDateTime inicioSemana = LocalDate.now().with(TemporalAdjusters.previous(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime fimSemana = inicioSemana.plusDays(7);
        long demandasCriadasNaSemana = demandaRepository.countByCriadaEmBetween(inicioSemana, fimSemana);
        estatisticas.put("demandasCriadasNaSemana", demandasCriadasNaSemana);

        // Demandas concluídas na última semana
        long demandasConcluidasNaSemana = demandaRepository.countByStatusAndAtualizadaEmBetween(
                Demanda.Status.CONCLUIDA.getValor(), inicioSemana, fimSemana);
        estatisticas.put("demandasConcluidasNaSemana", demandasConcluidasNaSemana);

        // Top 5 usuários com mais demandas pendentes
        List<Map<String, Object>> usuariosComMaisDemandas = demandaRepository.findTop5UsuariosComMaisDemandas()
                .stream()
                .map(objeto -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("usuarioId", objeto[0]);
                    item.put("nome", objeto[1]);
                    item.put("quantidade", objeto[2]);
                    return item;
                })
                .collect(Collectors.toList());
        estatisticas.put("usuariosComMaisDemandas", usuariosComMaisDemandas);

        return estatisticas;
    }

    @Override
    public Map<String, Object> getEstatisticasUsuario(UUID userId) {
        logger.info("Obtendo estatísticas de demandas para o usuário: {}", userId);
        User currentUser = getCurrentUser();

        // Verificar se o usuário tem permissão para ver estatísticas de outros usuários
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");
        boolean isSelf = currentUser.getId().equals(userId);

        if (!isGerente && !isSupervisor && !isSelf) {
            throw new AccessDeniedException("Você não tem permissão para ver estatísticas deste usuário");
        }

        // Se for supervisor, verificar se o usuário faz parte da sua equipe
        if (isSupervisor && !isSelf && !isGerente) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());
            List<UUID> usuariosNaEquipe = equipesIds.stream()
                    .flatMap(equipeId -> userRepository.findUserIdsByEquipeId(equipeId).stream())
                    .collect(Collectors.toList());

            if (!usuariosNaEquipe.contains(userId)) {
                throw new AccessDeniedException("Este usuário não faz parte da sua equipe");
            }
        }

        Map<String, Object> estatisticas = new HashMap<>();

        // Demandas pendentes do usuário
        long demandasPendentes = demandaRepository.countDemandasPendentes(userId);
        estatisticas.put("demandasPendentes", demandasPendentes);

        // Contagem por status
        Map<String, Long> contagemPorStatus = Arrays.stream(Demanda.Status.values())
                .collect(Collectors.toMap(
                        Demanda.Status::getValor,
                        status -> demandaRepository.countByStatusAndAtribuidoParaId(status.getValor(), userId)
                ));
        estatisticas.put("contagemPorStatus", contagemPorStatus);

        // Contagem por prioridade
        Map<String, Long> contagemPorPrioridade = Arrays.stream(Demanda.Prioridade.values())
                .collect(Collectors.toMap(
                        Demanda.Prioridade::getValor,
                        prioridade -> demandaRepository.countByPrioridadeAndAtribuidoParaId(prioridade.getValor(), userId)
                ));
        estatisticas.put("contagemPorPrioridade", contagemPorPrioridade);

        // Demandas próximas do prazo (com data de fim nos próximos 3 dias)
        LocalDateTime hoje = LocalDate.now().atStartOfDay();
        LocalDateTime emTresDias = hoje.plusDays(3);
        long demandasProximasDoPrazo = demandaRepository.countByAtribuidoParaIdAndStatusNotAndDataFimBetween(
                userId, Demanda.Status.CONCLUIDA.getValor(), hoje, emTresDias);
        estatisticas.put("demandasProximasDoPrazo", demandasProximasDoPrazo);

        // Tempo médio de conclusão em dias
        Double tempoMedioConclusao = demandaRepository.calcularTempoMedioConclusaoPorUsuario(userId);
        estatisticas.put("tempoMedioConclusao", tempoMedioConclusao != null ? tempoMedioConclusao : 0);

        return estatisticas;
    }

    @Override
    public Map<String, Object> getEstatisticasUsuarioAtual() {
        User currentUser = getCurrentUser();
        logger.info("Obtendo estatísticas para o usuário atual: {}", currentUser.getId());
        return getEstatisticasUsuario(currentUser.getId());
    }

    @Override
    public Map<String, Object> getEstatisticasEquipe(UUID equipeId) {
        logger.info("Obtendo estatísticas para a equipe: {}", equipeId);
        User currentUser = getCurrentUser();

        // Verificar se o usuário tem permissão para ver estatísticas da equipe
        boolean isGerente = temPapel("GERENTE") || temPapel("ADMIN");
        boolean isSupervisor = temPapel("SUPERVISOR");

        if (!isGerente && !isSupervisor) {
            throw new AccessDeniedException("Você não tem permissão para ver estatísticas de equipe");
        }

        // Se for supervisor, verificar se a equipe é de sua responsabilidade
        if (isSupervisor && !isGerente) {
            List<UUID> equipesIds = demandaRepository.findEquipeIdsByUserId(currentUser.getId());
            if (!equipesIds.contains(equipeId)) {
                throw new AccessDeniedException("Esta equipe não está sob sua responsabilidade");
            }
        }

        Map<String, Object> estatisticas = new HashMap<>();

        // Obter os membros da equipe
        List<UUID> membrosIds = userRepository.findUserIdsByEquipeId(equipeId);
        estatisticas.put("quantidadeMembros", membrosIds.size());

        // Contagem total de demandas da equipe
        long totalDemandas = membrosIds.stream()
                .mapToLong(userId -> demandaRepository.countByAtribuidoParaId(userId))
                .sum();
        estatisticas.put("totalDemandas", totalDemandas);

        // Contagem por status
        Map<String, Long> contagemPorStatus = new HashMap<>();
        Arrays.stream(Demanda.Status.values()).forEach(status -> {
            long count = membrosIds.stream()
                    .mapToLong(userId -> demandaRepository.countByStatusAndAtribuidoParaId(status.getValor(), userId))
                    .sum();
            contagemPorStatus.put(status.getValor(), count);
        });
        estatisticas.put("contagemPorStatus", contagemPorStatus);

        // Contagem por prioridade
        Map<String, Long> contagemPorPrioridade = new HashMap<>();
        Arrays.stream(Demanda.Prioridade.values()).forEach(prioridade -> {
            long count = membrosIds.stream()
                    .mapToLong(userId -> demandaRepository.countByPrioridadeAndAtribuidoParaId(prioridade.getValor(), userId))
                    .sum();
            contagemPorPrioridade.put(prioridade.getValor(), count);
        });
        estatisticas.put("contagemPorPrioridade", contagemPorPrioridade);

        // Taxa de conclusão (demandas concluídas / total de demandas)
        long demandasConcluidas = contagemPorStatus.getOrDefault(Demanda.Status.CONCLUIDA.getValor(), 0L);
        double taxaConclusao = totalDemandas > 0 ? (double) demandasConcluidas / totalDemandas : 0;
        estatisticas.put("taxaConclusao", taxaConclusao);

        // Ranking de membros da equipe por produtividade
        List<Map<String, Object>> rankingMembros = userRepository.findByIdIn(membrosIds).stream()
                .map(user -> {
                    long demandasAtribuidas = demandaRepository.countByAtribuidoParaId(user.getId());
                    long demandasConcluidasMembro = demandaRepository.countByStatusAndAtribuidoParaId(
                            Demanda.Status.CONCLUIDA.getValor(), user.getId());
                    double taxaConclusaoMembro = demandasAtribuidas > 0 ? (double) demandasConcluidasMembro / demandasAtribuidas : 0;

                    Map<String, Object> membroStat = new HashMap<>();
                    membroStat.put("id", user.getId());
                    membroStat.put("nome", user.getFullName());
                    membroStat.put("demandasAtribuidas", demandasAtribuidas);
                    membroStat.put("demandasConcluidas", demandasConcluidasMembro);
                    membroStat.put("taxaConclusao", taxaConclusaoMembro);

                    return membroStat;
                })
                .sorted((m1, m2) -> {
                    Double taxa1 = (Double) m1.get("taxaConclusao");
                    Double taxa2 = (Double) m2.get("taxaConclusao");
                    return taxa2.compareTo(taxa1); // Ordenação decrescente
                })
                .collect(Collectors.toList());

        estatisticas.put("rankingMembros", rankingMembros);

        return estatisticas;
    }

    /**
     * Obtém o usuário atual autenticado
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado no sistema"));
    }

    /**
     * Verifica se o usuário atual tem um determinado papel
     */
    private boolean temPapel(String papel) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_" + papel));
    }
}