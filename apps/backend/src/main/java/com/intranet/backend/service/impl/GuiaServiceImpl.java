package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.GuiaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GuiaServiceImpl implements GuiaService {

    private static final Logger logger = LoggerFactory.getLogger(GuiaServiceImpl.class);

    private final GuiaRepository guiaRepository;
    private final PacienteRepository pacienteRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final FichaRepository fichaRepository;

    @Override
    public Page<GuiaSummaryDto> getAllGuias(Pageable pageable) {
        logger.info("Buscando todas as guias - página: {}, tamanho: {}", pageable.getPageNumber(), pageable.getPageSize());

        Page<Guia> guias = guiaRepository.findAll(pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public GuiaDto getGuiaById(UUID id) {
        logger.info("Buscando guia com ID: {}", id);

        Guia guia = guiaRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guia com ID: " + id));

        return mapToGuiaDto(guia);
    }

    @Override
    @Transactional
    public GuiaDto createGuia(GuiaCreateRequest request) {
        logger.info("Criando nova guia para paciente ID: {}", request.getPacienteId());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente com ID: " + request.getPacienteId()));

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio com ID: " + request.getConvenioId()));

        if (guiaRepository.existsByNumeroGuia(request.getNumeroGuia())) {
            throw new IllegalArgumentException("Já existe uma guia com o número: " + request.getNumeroGuia());
        }

        Guia guia = new Guia();
        guia.setNumeroGuia(request.getNumeroGuia());
        guia.setPaciente(paciente);
        guia.setConvenio(convenio);
        guia.setEspecialidades(request.getEspecialidades());
        guia.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        guia.setMes(request.getMes());
        guia.setAno(request.getAno());
        guia.setValidade(request.getValidade());
        guia.setLote(request.getLote());
        guia.setQuantidadeFaturada(request.getQuantidadeFaturada());
        guia.setValorReais(request.getValorReais());
        guia.setUsuarioResponsavel(getCurrentUser());

        Guia savedGuia = guiaRepository.save(guia);
        logger.info("Guia criada com sucesso. ID: {}", savedGuia.getId());

        return mapToGuiaDto(savedGuia);
    }

    @Override
    @Transactional
    public GuiaDto updateGuia(UUID id, GuiaUpdateRequest request) {
        logger.info("Atualizando guia com ID: {}", id);

        Guia guia = guiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guia não encontrada com ID: " + id));

        if (request.getNumeroGuia() != null) {
            guia.setNumeroGuia(request.getNumeroGuia());
        }

        if (request.getEspecialidades() != null) {
            guia.setEspecialidades(request.getEspecialidades());
        }

        if (request.getQuantidadeAutorizada() != null) {
            guia.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        }

        if (request.getConvenioId() != null) {
            Convenio convenio = convenioRepository.findById(request.getConvenioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));
            guia.setConvenio(convenio);
        }

        if (request.getMes() != null) {
            guia.setMes(request.getMes());
        }

        if (request.getAno() != null) {
            guia.setAno(request.getAno());
        }

        if (request.getValidade() != null) {
            guia.setValidade(request.getValidade());
        }

        if (request.getLote() != null) {
            guia.setLote(request.getLote());
        }

        if (request.getQuantidadeFaturada() != null) {
            guia.setQuantidadeFaturada(request.getQuantidadeFaturada());
        }

        if (request.getValorReais() != null) {
            guia.setValorReais(request.getValorReais());
        }

        Guia updatedGuia = guiaRepository.save(guia);
        logger.info("Guia atualizada com sucesso. ID: {}", updatedGuia.getId());

        return mapToGuiaDto(updatedGuia);
    }

    @Override
    @Transactional
    public void deleteGuia(UUID id) {
        logger.info("Excluindo guia com ID: {}", id);

        if (!guiaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Guia não encontrada com ID: " + id);
        }

        // Verificar se há fichas associadas
        long totalFichas = guiaRepository.countFichasByGuiaId(id);
        if (totalFichas > 0) {
            throw new IllegalStateException("Não é possível excluir guia que possui fichas associadas");
        }

        guiaRepository.deleteById(id);
        logger.info("Guia excluída com sucesso. ID: {}", id);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByPaciente(UUID pacienteId, Pageable pageable) {
        logger.info("Buscando guias do paciente: {}", pacienteId);

        Page<Guia> guias = guiaRepository.findByPacienteId(pacienteId, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByConvenio(UUID convenioId, Pageable pageable) {
        logger.info("Buscando guias do convênio: {}", convenioId);

        Page<Guia> guias = guiaRepository.findByConvenioId(convenioId, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByMesEAno(Integer mes, Integer ano, Pageable pageable) {
        logger.info("Buscando guias do mês {} de {}", mes, ano);

        Page<Guia> guias = guiaRepository.findByMesAndAno(mes, ano, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasVencidas(Pageable pageable) {
        logger.info("Buscando guias vencidas");

        Page<Guia> guias = guiaRepository.findGuiasVencidas(pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasComQuantidadeExcedida(Pageable pageable) {
        logger.info("Buscando guias com quantidade excedida");

        Page<Guia> guias = guiaRepository.findGuiasComQuantidadeExcedida(pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByValidade(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        logger.info("Buscando guias com validade entre {} e {}", startDate, endDate);

        Page<Guia> guias = guiaRepository.findByValidadeBetween(startDate, endDate, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByUsuarioResponsavel(UUID userId, Pageable pageable) {
        logger.info("Buscando guias do usuário responsável: {}", userId);

        Page<Guia> guias = guiaRepository.findByUsuarioResponsavelId(userId, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByEspecialidade(String especialidade, Pageable pageable) {
        logger.info("Buscando guias da especialidade: {}", especialidade);

        Page<Guia> guias = guiaRepository.findByEspecialidadesContaining(especialidade, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public Page<FichaSummaryDto> getFichasByGuiaId(UUID guiaId, Pageable pageable) {
        logger.info("Buscando fichas da guia: {}", guiaId);

        if (!guiaRepository.existsById(guiaId)) {
            throw new ResourceNotFoundException("Guia não encontrada com ID: " + guiaId);
        }

        return fichaRepository.findAllWithRelations(pageable)
                .map(this::mapToFichaSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByStatus(String status, Pageable pageable) {
        logger.info("Buscando guias com status: {}", status);

        Page<Guia> guias = guiaRepository.findGuiaByStatus(status, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    @Override
    public long countTotalGuias() {
        return guiaRepository.count();
    }

    @Override
    public long countGuiasVencidas() {
        return guiaRepository.findGuiasVencidas(Pageable.unpaged()).getTotalElements();
    }

    @Override
    public long countGuiasComQuantidadeExcedida() {
        return guiaRepository.findGuiasComQuantidadeExcedida(Pageable.unpaged()).getTotalElements();
    }

    @Override
    public GuiaDto findByNumeroGuia(String numeroGuia) {
        Guia guia = guiaRepository.findByNumeroGuia(numeroGuia)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Guia não encontrada com número: " + numeroGuia
                ));
        return mapToGuiaDto(guia);
    }

    @Override
    public Page<GuiaSummaryDto> searchByNumeroGuia(String termo, Pageable pageable) {
        logger.info("Buscando guias pelo termo: {}", termo);

        Page<Guia> guias = guiaRepository.searchByNumeroGuia(termo, pageable);
        return guias.map(this::mapToGuiaSummaryDto);
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Não foi possível encontrar o usuário atual"));
    }

    private GuiaDto mapToGuiaDto(Guia guia) {
        long totalFichas = guiaRepository.countFichasByGuiaId(guia.getId());

        return new GuiaDto(
                guia.getId(),
                guia.getNumeroGuia(),
                guia.getStatus(),
                guia.getPaciente().getId(),
                guia.getPaciente().getNome(),
                guia.getEspecialidades(),
                guia.getQuantidadeAutorizada(),
                guia.getConvenio().getId(),
                guia.getConvenio().getName(),
                guia.getMes(),
                guia.getAno(),
                guia.getValidade(),
                guia.getLote(),
                guia.getQuantidadeFaturada(),
                guia.getValorReais(),
                guia.getUsuarioResponsavel().getId(),
                guia.getUsuarioResponsavel().getFullName(),
                guia.getCreatedAt(),
                guia.getUpdatedAt(),
                totalFichas,
                guia.isVencida(),
                guia.isQuantidadeExcedida(),
                guia.getQuantidadeRestante()
        );
    }

    private GuiaSummaryDto mapToGuiaSummaryDto(Guia guia) {
        long totalFichas = guiaRepository.countFichasByGuiaId(guia.getId());

        return new GuiaSummaryDto(
                guia.getId(),
                guia.getPaciente().getNome(),
                guia.getNumeroGuia(),
                guia.getStatus(),
                guia.getEspecialidades(),
                guia.getQuantidadeAutorizada(),
                guia.getConvenio().getName(),
                guia.getMes(),
                guia.getAno(),
                guia.getValidade(),
                guia.getQuantidadeFaturada(),
                guia.getValorReais(),
                guia.getUsuarioResponsavel().getFullName(),
                totalFichas,
                guia.isVencida(),
                guia.isQuantidadeExcedida()
        );
    }

    private FichaSummaryDto mapToFichaSummaryDto(Ficha ficha) {
        return new FichaSummaryDto(
                ficha.getId(),
                ficha.getCodigoFicha(),
                ficha.getPacienteNome(),
                ficha.getEspecialidade(),
                ficha.getQuantidadeAutorizada(),
                ficha.getConvenioNome(),
                ficha.getMes(),
                ficha.getAno(),
                ficha.getUsuarioResponsavel().getFullName(),
                ficha.getCreatedAt()
        );
    }
}
