package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.events.StatusEventPublisher;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.FichaService;
import com.intranet.backend.service.StatusHistoryService;
import com.intranet.backend.util.CodigoGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementação refatorada do FichaService usando Event-Driven Architecture
 * Remove dependências circulares publicando eventos em vez de chamar diretamente o StatusHistoryService
 */
@Service
@RequiredArgsConstructor
public class FichaServiceImpl implements FichaService {

    private static final Logger logger = LoggerFactory.getLogger(FichaServiceImpl.class);

    private final FichaRepository fichaRepository;
    private final GuiaRepository guiaRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final PacienteRepository pacienteRepository;
    private final StatusHistoryService statusHistoryService;

    @Autowired
    private CodigoGenerator codigoGenerator;

    // Event Publisher para desacoplar mudanças de status
    private final StatusEventPublisher statusEventPublisher;

    @Override
    public Page<FichaSummaryDto> getAllFichas(Pageable pageable) {
        logger.info("Buscando todas as fichas - página: {}, tamanho: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<Ficha> fichas = fichaRepository.findAllWithRelations(pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public FichaDto getFichaById(UUID id) {
        logger.info("Buscando ficha com ID: {}", id);

        Ficha ficha = fichaRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha não encontrada com ID: " + id));

        return mapToFichaDto(ficha);
    }

    @Override
    @Transactional
    public FichaDto createFicha(FichaCreateRequest request) {
        logger.info("Criando nova ficha para guia: {}", request.getGuiaId());

        Guia guia = guiaRepository.findById(request.getGuiaId())
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + request.getGuiaId()));

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        if (fichaRepository.existsByGuiaIdAndEspecialidade(request.getGuiaId(), request.getEspecialidade())) {
            throw new IllegalArgumentException("Já existe uma ficha para esta guia com a especialidade: " + request.getEspecialidade());
        }

        if (!guia.getEspecialidades().contains(request.getEspecialidade())) {
            throw new IllegalArgumentException("A especialidade informada não está presente nas especialidades da guia");
        }

        String codigoFicha = generateUniqueCode();
        User currentUser = getCurrentUser();

        Ficha ficha = new Ficha();
        ficha.setCodigoFicha(codigoFicha);
        ficha.setGuia(guia);
        ficha.setEspecialidade(request.getEspecialidade());
        ficha.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        ficha.setConvenio(convenio);
        ficha.setMes(request.getMes());
        ficha.setAno(request.getAno());
        ficha.setUsuarioResponsavel(currentUser);
        ficha.setStatus(request.getStatus());

        Ficha savedFicha = fichaRepository.save(ficha);
        logger.info("Ficha criada com sucesso. ID: {}", savedFicha.getId());

        // Publicar evento de mudança de status (criação)
        try {
            statusEventPublisher.publishFichaStatusChange(
                    savedFicha.getId(),
                    null, // status anterior
                    request.getStatus(),
                    "Criação da ficha",
                    "Status inicial definido na criação",
                    currentUser.getId()
            );
        } catch (Exception e) {
            logger.error("Erro ao publicar evento de status inicial: {}", e.getMessage(), e);
        }

        return mapToFichaDto(savedFicha);
    }

    @Override
    @Transactional
    public FichaDto createFichaAssinatura(FichaAssinaturaCreateRequest request) {
        logger.info("Criando nova ficha com assinatura para paciente: {}", request.getPacienteId());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado com ID: " + request.getPacienteId()));

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        String codigoFicha = generateUniqueCode();
        User currentUser = getCurrentUser();

        Ficha ficha = new Ficha();
        ficha.setPaciente(paciente);
        ficha.setGuia(null);
        ficha.setCodigoFicha(codigoFicha);
        ficha.setTipoFicha(Ficha.TipoFicha.ASSINATURA);
        ficha.setEspecialidade(request.getEspecialidade());
        ficha.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        ficha.setConvenio(convenio);
        ficha.setMes(request.getMes());
        ficha.setAno(request.getAno());
        ficha.setUsuarioResponsavel(currentUser);
        ficha.setStatus(request.getStatus());

        Ficha saved = fichaRepository.save(ficha);

        // Publicar evento de mudança de status (criação)
        try {
            statusEventPublisher.publishFichaStatusChange(
                    saved.getId(),
                    null, // status anterior
                    request.getStatus(),
                    "Criação da ficha de assinatura",
                    "Status inicial definido na criação",
                    currentUser.getId()
            );
        } catch (Exception e) {
            logger.error("Erro ao publicar evento de status inicial: {}", e.getMessage(), e);
        }

        return mapToFichaDto(saved);
    }

    @Override
    @Transactional
    public FichaDto vincularFichaAGuia(UUID fichaId, UUID guiaId) {
        logger.info("Vinculando ficha ID: {} à guia ID: {}", fichaId, guiaId);

        Ficha ficha = fichaRepository.findById(fichaId)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha não encontrada com ID: " + fichaId));

        if (ficha.getGuia() != null) {
            throw new IllegalStateException("A ficha já está vinculada a uma guia");
        }

        Guia guia = guiaRepository.findById(guiaId)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + guiaId));

        if (!ficha.getPaciente().getId().equals(guia.getPaciente().getId())) {
            throw new IllegalArgumentException("A ficha não pertence ao paciente da guia");
        }

        ficha.setGuia(guia);
        ficha.setTipoFicha(Ficha.TipoFicha.COM_GUIA);

        return mapToFichaDto(fichaRepository.save(ficha));
    }

    @Override
    @Transactional
    public FichaDto updateFicha(UUID id, FichaUpdateRequest request) {
        logger.info("Atualizando ficha com ID: {}", id);

        Ficha ficha = fichaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha não encontrada com ID: " + id));

        User currentUser = getCurrentUser();
        String statusAnterior = ficha.getStatus();
        boolean statusChanged = false;

        if (request.getStatus() != null && !request.getStatus().equals(statusAnterior)) {
            if (!StatusEnum.isValid(request.getStatus())) {
                throw new IllegalArgumentException("Status inválido: " + request.getStatus());
            }
            ficha.setStatus(request.getStatus());
            statusChanged = true;
            logger.info("Status da ficha alterado de '{}' para '{}'", statusAnterior, request.getStatus());
        }

        // Atualizar campos se fornecidos
        if (request.getEspecialidade() != null) {
            // Verificar se a nova especialidade está disponível na guia (apenas se ficha tiver guia)
            if (ficha.getGuia() != null && !ficha.getGuia().getEspecialidades().contains(request.getEspecialidade())) {
                throw new IllegalArgumentException("A especialidade informada não está presente nas especialidades da guia");
            }

            // Verificar se não existe outra ficha com a mesma especialidade na mesma guia
            if (ficha.getGuia() != null && !ficha.getEspecialidade().equals(request.getEspecialidade()) &&
                    fichaRepository.existsByGuiaIdAndEspecialidade(ficha.getGuia().getId(), request.getEspecialidade())) {
                throw new IllegalArgumentException("Já existe uma ficha para esta guia com a especialidade: " + request.getEspecialidade());
            }

            ficha.setEspecialidade(request.getEspecialidade());
        }

        if (request.getQuantidadeAutorizada() != null) {
            ficha.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        }

        if (request.getConvenioId() != null) {
            Convenio convenio = convenioRepository.findById(request.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));
            ficha.setConvenio(convenio);
        }

        if (request.getMes() != null) {
            ficha.setMes(request.getMes());
        }

        if (request.getAno() != null) {
            ficha.setAno(request.getAno());
        }

        Ficha updatedFicha = fichaRepository.save(ficha);

        if (statusChanged) {
            try {
                statusEventPublisher.publishFichaStatusChange(
                        id,
                        statusAnterior,
                        ficha.getStatus(),
                        "Atualização via formulário de edição",
                        "Status alterado durante edição da ficha",
                        currentUser.getId()
                );
            } catch (Exception e) {
                logger.error("Erro ao publicar evento de mudança de status: {}", e.getMessage(), e);
            }
        }

        logger.info("Ficha atualizada com sucesso. ID: {}", updatedFicha.getId());
        return mapToFichaDto(updatedFicha);
    }

    @Override
    @Transactional
    public FichaDto updateFichaStatus(UUID id, String novoStatus, String motivo, String observacoes) {
        logger.info("Atualizando status da ficha com ID: {} para '{}'", id, novoStatus);

        Ficha ficha = fichaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha não encontrada com ID: " + id));

        User currentUser = getCurrentUser();
        String statusAnterior = ficha.getStatus();

        if (!StatusEnum.isValid(novoStatus)) {
            throw new IllegalArgumentException("Status inválido: " + novoStatus);
        }

        ficha.setStatus(novoStatus);
        Ficha updatedFicha = fichaRepository.save(ficha);

        // Publicar evento de mudança de status
        try {
            statusEventPublisher.publishFichaStatusChange(
                    id,
                    statusAnterior,
                    novoStatus,
                    motivo,
                    observacoes,
                    currentUser.getId()
            );
        } catch (Exception e) {
            logger.error("Erro ao publicar evento de mudança de status: {}", e.getMessage(), e);
        }

        logger.info("Ficha atualizada com sucesso. ID: {}", updatedFicha.getId());
        return mapToFichaDto(updatedFicha);
    }

    @Override
    @Transactional
    public void deleteFicha(UUID id) {
        logger.info("Excluindo ficha com ID: {}", id);

        if (!fichaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ficha não encontrada com ID: " + id);
        }

        fichaRepository.deleteById(id);
        logger.info("Ficha excluída com sucesso. ID: {}", id);
    }

    @Override
    public List<FichaDto> getFichasByGuiaId(UUID guiaId) {
        logger.info("Buscando fichas da guia: {}", guiaId);

        List<Ficha> fichas = fichaRepository.findByGuiaId(guiaId);
        return fichas.stream()
                .map(this::mapToFichaDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<FichaSummaryDto> getFichasByPacienteId(UUID pacienteId, Pageable pageable) {
        logger.info("Buscando fichas do paciente: {}", pacienteId);

        Page<Ficha> fichas = fichaRepository.findByPacienteId(pacienteId, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByConvenioId(UUID convenioId, Pageable pageable) {
        logger.info("Buscando fichas do convênio: {}", convenioId);

        Page<Ficha> fichas = fichaRepository.findByConvenioId(convenioId, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> searchFichasByEspecialidade(String especialidade, Pageable pageable) {
        logger.info("Buscando fichas por especialidade: {}", especialidade);

        Page<Ficha> fichas = fichaRepository.findByEspecialidadeContainingIgnoreCase(especialidade, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByMesEAno(Integer mes, Integer ano, Pageable pageable) {
        logger.info("Buscando fichas do mês {} de {}", mes, ano);

        Page<Ficha> fichas = fichaRepository.findByMesAndAno(mes, ano, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByUsuarioResponsavel(UUID userId, Pageable pageable) {
        logger.info("Buscando fichas do usuário responsável: {}", userId);

        Page<Ficha> fichas = fichaRepository.findByUsuarioResponsavelId(userId, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public long countTotalFichas() {
        return fichaRepository.count();
    }

    @Override
    public long countFichasByGuia(UUID guiaId) {
        return fichaRepository.findByGuiaId(guiaId).size();
    }

    @Override
    public long countFichasByConvenio(UUID convenioId) {
        return fichaRepository.findByConvenioId(convenioId, Pageable.unpaged()).getTotalElements();
    }

    @Override
    public FichaDto findByCodigoFicha(String codigoFicha) {
        Ficha ficha = fichaRepository.findByCodigoFicha(codigoFicha)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ficha não encontrada com código: " + codigoFicha
                ));
        return mapToFichaDto(ficha);
    }

    @Override
    public Page<FichaSummaryDto> searchByCodigoFicha(String termo, Pageable pageable) {
        logger.info("Buscando fichas por código: {}", termo);

        Page<Ficha> fichas = fichaRepository.searchByCodigoFicha(termo, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByStatus(String status, Pageable pageable) {
        logger.info("Buscando fichas pelo status: {}", status);

        Page<Ficha> fichas = fichaRepository.findByStatus(status, pageable);
        return fichas.map(this::mapToFichaSummaryDto);
    }

    @Override
    public List<StatusHistoryDto> getHistoricoStatusFicha(UUID fichaId) {
        logger.info("Buscando histórico de status para ficha ID: {}", fichaId);
        return statusHistoryService.getHistoricoEntidade(StatusHistory.EntityType.FICHA, fichaId);
    }

    // Métodos auxiliares privados

    private String generateUniqueCode() {
        String codigoFicha;
        int tentativas = 0;
        do {
            codigoFicha = codigoGenerator.gerarCodigo();
            tentativas++;

            if (tentativas > 10) {
                throw new IllegalStateException("Não foi possível gerar um código único para a ficha após várias tentativas");
            }
        } while (fichaRepository.existsByCodigoFicha(codigoFicha));

        return codigoFicha;
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));
    }

    private FichaDto mapToFichaDto(Ficha ficha) {
        UUID guiaId = ficha.getGuia() != null ? ficha.getGuia().getId() : null;

        UUID pacienteId = ficha.getPaciente() != null ? ficha.getPaciente().getId() :
                (ficha.getGuia() != null ? ficha.getGuia().getPaciente().getId() : null);

        return new FichaDto(
                ficha.getId(),
                guiaId,
                pacienteId,
                ficha.getCodigoFicha(),
                ficha.getStatus(),
                ficha.getPacienteNome(),
                ficha.getEspecialidade(),
                ficha.getQuantidadeAutorizada(),
                ficha.getConvenio().getId(),
                ficha.getConvenioNome(),
                ficha.getMes(),
                ficha.getAno(),
                ficha.getUsuarioResponsavel().getId(),
                ficha.getUsuarioResponsavel().getFullName(),
                ficha.getCreatedAt(),
                ficha.getUpdatedAt(),
                ficha.getTipoFicha()
        );
    }

    private FichaSummaryDto mapToFichaSummaryDto(Ficha ficha) {
        UUID guiaId = ficha.getGuia() != null ? ficha.getGuia().getId() : null;
        return new FichaSummaryDto(
                ficha.getId(),
                ficha.getCodigoFicha(),
                ficha.getStatus(),
                ficha.getPacienteNome(),
                ficha.getEspecialidade(),
                ficha.getQuantidadeAutorizada(),
                ficha.getConvenioNome(),
                ficha.getMes(),
                ficha.getAno(),
                ficha.getUsuarioResponsavel().getFullName(),
                ficha.getCreatedAt(),
                ficha.getTipoFicha(),
                guiaId
        );
    }
}