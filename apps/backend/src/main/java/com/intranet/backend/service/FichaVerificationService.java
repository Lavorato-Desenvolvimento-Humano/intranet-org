package com.intranet.backend.service;

import com.intranet.backend.dto.FichaPdfItemDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Convenio;
import com.intranet.backend.model.Ficha;
import com.intranet.backend.repository.ConvenioRepository;
import com.intranet.backend.repository.FichaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FichaVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(FichaVerificationService.class);

    private final FichaRepository fichaRepository;
    private final ConvenioRepository convenioRepository;

    // Cache local para otimizar verificações repetidas na mesma sessão
    private final Map<String, Boolean> verificacaoCache = new ConcurrentHashMap<>();

    public List<FichaPdfItemDto> verificarECorrigirDuplicatas(List<FichaPdfItemDto> itensOriginais) {
        if (itensOriginais == null || itensOriginais.isEmpty()) {
            logger.warn("Lista de itens vazia ou nula para verificação de duplicatas");
            return new ArrayList<>();
        }

        logger.info("Iniciando verificação de duplicatas para {} itens", itensOriginais.size());
        long startTime = System.currentTimeMillis();

        List<FichaPdfItemDto> itensCorrigidos = new ArrayList<>();
        Map<String, Integer> estatisticas = new HashMap<>();
        estatisticas.put("reutilizados", 0);
        estatisticas.put("novos", 0);
        estatisticas.put("erros", 0);

        // Buscar todas as fichas existentes em uma única query para otimização
        Map<String, Ficha> fichasExistentesMap = buscarFichasExistentesEmLote(itensOriginais);

        for (FichaPdfItemDto item : itensOriginais) {
            try {
                FichaPdfItemDto itemCorrigido = verificarECorrigirItem(item, fichasExistentesMap, estatisticas);
                itensCorrigidos.add(itemCorrigido);
            } catch (Exception e) {
                logger.error("Erro ao processar item para paciente {}: {}",
                        item.getPacienteNome(), e.getMessage(), e);
                estatisticas.put("erros", estatisticas.get("erros") + 1);

                // Incluir item com erro marcado para auditoria
                item.setNumeroIdentificacao("ERRO-" + System.currentTimeMillis());
                itensCorrigidos.add(item);
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        logger.info("Verificação concluída em {}ms - Processados: {}, Reutilizados: {}, Novos: {}, Erros: {}",
                duration, itensCorrigidos.size(),
                estatisticas.get("reutilizados"),
                estatisticas.get("novos"),
                estatisticas.get("erros"));

        return itensCorrigidos;
    }

    public List<UUID> filtrarPacientesSemFichas(UUID convenioId, Integer mes, Integer ano, List<UUID> pacienteIds) {
        if (pacienteIds == null || pacienteIds.isEmpty()) {
            logger.warn("Lista de pacientes vazia para filtro de fichas - convênio: {}", convenioId);
            return new ArrayList<>();
        }

        logger.info("Filtrando pacientes sem fichas - convênio: {}, período: {}/{}, pacientes: {}",
                convenioId, mes, ano, pacienteIds.size());

        try {
            // Buscar pacientes que JÁ possuem fichas no período
            List<UUID> pacientesComFichas = fichaRepository.findPacientesComFichasNoMes(convenioId, mes, ano);

            // Filtrar apenas pacientes que NÃO estão na lista de quem já possui fichas
            List<UUID> pacientesSemFichas = pacienteIds.stream()
                    .filter(pacienteId -> !pacientesComFichas.contains(pacienteId))
                    .collect(Collectors.toList());

            logger.info("Filtro aplicado - Total: {}, Com fichas: {}, Sem fichas: {}",
                    pacienteIds.size(), pacientesComFichas.size(), pacientesSemFichas.size());

            return pacientesSemFichas;

        } catch (Exception e) {
            logger.error("Erro ao filtrar pacientes sem fichas: {}", e.getMessage(), e);
            // Em caso de erro, retornar lista original para não bloquear o processo
            logger.warn("Retornando lista original de pacientes devido ao erro");
            return new ArrayList<>(pacienteIds);
        }
    }

    @Cacheable(value = "estatisticasConvenio", key = "#convenioId + '-' + #mes + '-' + #ano")
    public Map<String, Object> getEstatisticasFichasConvenio(UUID convenioId, Integer mes, Integer ano) {
        logger.info("Gerando estatísticas de fichas - convênio: {}, período: {}/{}", convenioId, mes, ano);

        try {
            Convenio convenio = convenioRepository.findById(convenioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado: " + convenioId));

            List<Ficha> fichasExistentes = fichaRepository.findFichasExistentesPorConvenioMesAno(convenioId, mes, ano);

            // Estatísticas por especialidade
            Map<String, Long> fichasPorEspecialidade = fichasExistentes.stream()
                    .collect(Collectors.groupingBy(
                            Ficha::getEspecialidade,
                            Collectors.counting()
                    ));

            // Estatísticas por status
            Map<String, Long> fichasPorStatus = fichasExistentes.stream()
                    .collect(Collectors.groupingBy(
                            Ficha::getStatus,
                            Collectors.counting()
                    ));

            // Pacientes únicos
            Set<UUID> pacientesUnicos = fichasExistentes.stream()
                    .map(f -> f.getPaciente() != null ? f.getPaciente().getId() :
                            (f.getGuia() != null ? f.getGuia().getPaciente().getId() : null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // Período de atividade
            LocalDateTime primeiraFicha = fichasExistentes.stream()
                    .map(Ficha::getCreatedAt)
                    .min(LocalDateTime::compareTo)
                    .orElse(null);

            LocalDateTime ultimaFicha = fichasExistentes.stream()
                    .map(Ficha::getCreatedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            // Especialidades cobertas (lista de strings)
            List<String> especialidadesCobertas = fichasPorEspecialidade.keySet()
                    .stream()
                    .filter(Objects::nonNull)
                    .sorted()
                    .collect(Collectors.toList());

            Map<String, Object> estatisticas = new HashMap<>();

            estatisticas.put("convenioId", convenioId.toString());
            estatisticas.put("convenioNome", convenio.getName() != null ? convenio.getName() : "Nome não disponível");

            // Estatísticas das fichas
            estatisticas.put("totalFichas", fichasExistentes.size());
            estatisticas.put("totalPacientes", pacientesUnicos.size());
            estatisticas.put("fichasGeradasMes", fichasExistentes.size()); // Para compatibilidade com frontend
            estatisticas.put("fichasGeradasAno", fichasExistentes.size()); // Para compatibilidade com frontend
            estatisticas.put("pacientesAtivos", pacientesUnicos.size());
            estatisticas.put("especialidadesCobertas", especialidadesCobertas);
            estatisticas.put("fichasPorEspecialidade", fichasPorEspecialidade);
            estatisticas.put("fichasPorStatus", fichasPorStatus);
            estatisticas.put("primeiraFicha", primeiraFicha);
            estatisticas.put("ultimaFicha", ultimaFicha);
            estatisticas.put("mes", mes);
            estatisticas.put("ano", ano);
            estatisticas.put("geradoEm", LocalDateTime.now());

            // Métricas adicionais
            double mediaFichasPorPaciente = pacientesUnicos.isEmpty() ?
                    0.0 : (double) fichasExistentes.size() / pacientesUnicos.size();
            estatisticas.put("mediaFichasPorPaciente", Math.round(mediaFichasPorPaciente * 100.0) / 100.0);

            logger.info("Estatísticas geradas - convênio: {} ({}), fichas: {}, pacientes: {}",
                    convenioId, convenio.getName(), fichasExistentes.size(), pacientesUnicos.size());

            return estatisticas;

        } catch (Exception e) {
            logger.error("Erro ao gerar estatísticas para convênio {}: {}", convenioId, e.getMessage(), e);

            String convenioNome = "Nome não disponível";
            try {
                Convenio convenio = convenioRepository.findById(convenioId).orElse(null);
                if (convenio != null && convenio.getName() != null) {
                    convenioNome = convenio.getName();
                }
            } catch (Exception ex) {
                logger.warn("Erro ao buscar nome do convênio para resposta de erro: {}", ex.getMessage());
            }

            Map<String, Object> estatisticasErro = new HashMap<>();
            estatisticasErro.put("erro", "Erro ao calcular estatísticas: " + e.getMessage());
            estatisticasErro.put("convenioId", convenioId.toString());
            estatisticasErro.put("convenioNome", convenioNome);
            estatisticasErro.put("totalFichas", 0);
            estatisticasErro.put("totalPacientes", 0);
            estatisticasErro.put("fichasGeradasMes", 0);
            estatisticasErro.put("fichasGeradasAno", 0);
            estatisticasErro.put("pacientesAtivos", 0);
            estatisticasErro.put("especialidadesCobertas", new ArrayList<String>());
            estatisticasErro.put("mediaFichasPorPaciente", 0.0);
            estatisticasErro.put("mes", mes);
            estatisticasErro.put("ano", ano);
            estatisticasErro.put("geradoEm", LocalDateTime.now());

            return estatisticasErro;
        }
    }

    public boolean jaExisteFicha(UUID pacienteId, String especialidade, Integer mes, Integer ano) {
        if (pacienteId == null || especialidade == null || mes == null || ano == null) {
            logger.warn("Parâmetros inválidos para verificação de ficha existente");
            return false;
        }

        String cacheKey = String.format("%s-%s-%d-%d", pacienteId, especialidade, mes, ano);

        // Verificar cache local primeiro
        Boolean cachedResult = verificacaoCache.get(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }

        try {
            boolean existe = fichaRepository.existsFichaByPacienteEspecialidadeMesAno(pacienteId, especialidade, mes, ano);

            // Armazenar no cache para evitar consultas repetidas
            verificacaoCache.put(cacheKey, existe);

            // Limpar cache se ficar muito grande (proteção de memória)
            if (verificacaoCache.size() > 10000) {
                verificacaoCache.clear();
                logger.info("Cache de verificação limpo devido ao tamanho");
            }

            return existe;

        } catch (Exception e) {
            logger.error("Erro ao verificar existência de ficha - paciente: {}, especialidade: {}: {}",
                    pacienteId, especialidade, e.getMessage());
            return false; // Em caso de erro, assumir que não existe para não bloquear o processo
        }
    }

    /**
     * Busca fichas existentes em lote para otimização de performance
     */
    private Map<String, Ficha> buscarFichasExistentesEmLote(List<FichaPdfItemDto> itens) {
        Map<String, Ficha> fichasMap = new HashMap<>();

        try {
            // Extrair combinações únicas de paciente/especialidade/mês/ano
            Set<String> combinacoes = itens.stream()
                    .map(item -> String.format("%s-%s-%d-%d",
                            item.getPacienteId(), item.getEspecialidade(), item.getMes(), item.getAno()))
                    .collect(Collectors.toSet());

            logger.debug("Buscando fichas existentes para {} combinações únicas", combinacoes.size());

            // Buscar fichas por período para reduzir número de queries
            Map<String, List<Ficha>> fichasPorPeriodo = new HashMap<>();

            Set<String> periodosUnicos = itens.stream()
                    .map(item -> item.getMes() + "-" + item.getAno())
                    .collect(Collectors.toSet());

            for (String periodo : periodosUnicos) {
                String[] parts = periodo.split("-");
                Integer mes = Integer.parseInt(parts[0]);
                Integer ano = Integer.parseInt(parts[1]);

                List<Ficha> fichasPeriodo = fichaRepository.findByMesAndAno(mes, ano, org.springframework.data.domain.Pageable.unpaged()).getContent();
                fichasPorPeriodo.put(periodo, fichasPeriodo);
            }

            // Mapear fichas por chave
            for (FichaPdfItemDto item : itens) {
                String chave = String.format("%s-%s-%d-%d",
                        item.getPacienteId(), item.getEspecialidade(), item.getMes(), item.getAno());

                String periodo = item.getMes() + "-" + item.getAno();
                List<Ficha> fichasPeriodo = fichasPorPeriodo.get(periodo);

                if (fichasPeriodo != null) {
                    Optional<Ficha> fichaExistente = fichasPeriodo.stream()
                            .filter(f -> {
                                UUID pacienteIdFicha = f.getPaciente() != null ? f.getPaciente().getId() :
                                        (f.getGuia() != null ? f.getGuia().getPaciente().getId() : null);
                                return Objects.equals(pacienteIdFicha, item.getPacienteId()) &&
                                        Objects.equals(f.getEspecialidade(), item.getEspecialidade());
                            })
                            .findFirst();

                    if (fichaExistente.isPresent()) {
                        fichasMap.put(chave, fichaExistente.get());
                    }
                }
            }

            logger.debug("Encontradas {} fichas existentes no lote", fichasMap.size());

        } catch (Exception e) {
            logger.error("Erro ao buscar fichas existentes em lote: {}", e.getMessage(), e);
            // Retornar mapa vazio em caso de erro para não bloquear o processo
        }

        return fichasMap;
    }

    /**
     * Verifica e corrige um item individual
     */
    private FichaPdfItemDto verificarECorrigirItem(FichaPdfItemDto item,
                                                   Map<String, Ficha> fichasExistentesMap,
                                                   Map<String, Integer> estatisticas) {

        String chave = String.format("%s-%s-%d-%d",
                item.getPacienteId(), item.getEspecialidade(), item.getMes(), item.getAno());

        Ficha fichaExistente = fichasExistentesMap.get(chave);

        if (fichaExistente != null) {
            logger.debug("Ficha existente encontrada para paciente {} - especialidade {}: {}",
                    item.getPacienteNome(), item.getEspecialidade(), fichaExistente.getCodigoFicha());

            // Reutilizar código da ficha existente
            item.setNumeroIdentificacao(fichaExistente.getCodigoFicha());

            // Atualizar dados se necessário
            atualizarDadosDoItem(item, fichaExistente);

            estatisticas.put("reutilizados", estatisticas.get("reutilizados") + 1);

        } else {
            logger.debug("Nenhuma ficha existente para paciente {} - especialidade {}",
                    item.getPacienteNome(), item.getEspecialidade());

            // Manter número gerado originalmente para fichas novas
            if (item.getNumeroIdentificacao() == null || item.getNumeroIdentificacao().isEmpty()) {
                item.setNumeroIdentificacao("NOVO-" + System.currentTimeMillis());
            }

            estatisticas.put("novos", estatisticas.get("novos") + 1);
        }

        return item;
    }

    /**
     * Atualiza dados do item com base na ficha existente
     */
    private void atualizarDadosDoItem(FichaPdfItemDto item, Ficha fichaExistente) {
        try {
            // Atualizar quantidade autorizada se disponível
            if (fichaExistente.getQuantidadeAutorizada() != null) {
                item.setQuantidadeAutorizada(fichaExistente.getQuantidadeAutorizada());
            }

            // Manter consistência de dados
            if (fichaExistente.getConvenio() != null) {
                item.setConvenioId(fichaExistente.getConvenio().getId());
                item.setConvenioNome(fichaExistente.getConvenio().getName());
            }

            // Atualizar timestamp da última atividade
            if (fichaExistente.getUpdatedAt() != null) {
                item.setUltimaAtividade(fichaExistente.getUpdatedAt());
            }

        } catch (Exception e) {
            logger.warn("Erro ao atualizar dados do item com ficha existente {}: {}",
                    fichaExistente.getId(), e.getMessage());
            // Continuar sem atualizar em caso de erro
        }
    }

    /**
     * Limpa cache de verificação (método utilitário para manutenção)
     */
    public void limparCache() {
        verificacaoCache.clear();
        logger.info("Cache de verificação de fichas limpo manualmente");
    }

    /**
     * Obtém estatísticas do cache (método para monitoramento)
     */
    public Map<String, Object> getEstatisticasCache() {
        return Map.of(
                "tamanho", verificacaoCache.size(),
                "limiteMaximo", 10000,
                "utilizacao", String.format("%.2f%%", (double) verificacaoCache.size() / 10000 * 100)
        );
    }
}