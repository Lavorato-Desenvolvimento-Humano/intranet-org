package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Convenio;
import com.intranet.backend.model.Guia;
import com.intranet.backend.model.Paciente;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.ConvenioRepository;
import com.intranet.backend.repository.GuiaRepository;
import com.intranet.backend.repository.PacienteRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.PacienteService;
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
public class PacienteServiceImpl implements PacienteService {

    private static final Logger logger = LoggerFactory.getLogger(PacienteServiceImpl.class);

    private final PacienteRepository pacienteRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final GuiaRepository guiaRepository;

    @Override
    public Page<PacienteSummaryDto> getAllPacientes(Pageable pageable) {
        logger.info("Buscando todos os pacientes - página: {}, tamanho: {}", pageable.getPageNumber(), pageable.getPageSize());

        Page<Paciente> pacientes = pacienteRepository.findAllWithRelations(pageable);
        return pacientes.map(this::mapToPacienteSummaryDto);
    }

    @Override
    public PacienteDto getPacienteById(UUID id) {
        logger.info("Buscando paciente com ID: {}", id);

        Paciente paciente = pacienteRepository.findByIdWithConvenio(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não econtrado com ID: " + id));

        return mapToPacienteDto(paciente);
    }

    @Override
    @Transactional
    public PacienteDto createPaciente(PacienteCreateRequest request) {
        logger.info("Criando novo paciente: {}", request.getNome());

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        User currentUser = getCurrentUser();

        Paciente paciente = new Paciente();
        paciente.setNome(request.getNome());
        paciente.setDataNascimento(request.getDataNascimento());
        paciente.setResponsavel(request.getResponsavel());
        paciente.setConvenio(convenio);
        paciente.setUnidade(request.getUnidade());
        paciente.setCreatedBy(currentUser);

        Paciente savedPaciente = pacienteRepository.save(paciente);
        logger.info("Paciente criado com sucesso: {}", savedPaciente.getId());

        return mapToPacienteDto(savedPaciente);
    }

    @Override
    @Transactional
    public PacienteDto updatePaciente(UUID id, PacienteUpdateRequest request) {
        logger.info("Atualizando paciente com ID: {}", id);

       Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado com ID: " + id));

       if (request.getNome() != null) {
           paciente.setNome(request.getNome());
       }

       if (request.getDataNascimento() != null) {
              paciente.setDataNascimento(request.getDataNascimento());
       }

       if (request.getResponsavel() != null) {
           paciente.setResponsavel(request.getResponsavel());
       }

       if (request.getConvenioId() != null) {
           Convenio convenio = convenioRepository.findById(request.getConvenioId())
                   .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));
           paciente.setConvenio(convenio);;
       }

       if (request.getUnidade() != null) {
           paciente.setUnidade(request.getUnidade());
       }

       Paciente updatedPaciente = pacienteRepository.save(paciente);
       logger.info("Paciente atualizado com sucesso. ID: {}", updatedPaciente.getId());

       return mapToPacienteDto(updatedPaciente);
    }

    @Override
    public void deletePaciente(UUID id) {
        logger.info("Excluindo paciente com ID: {}", id);

        if (!pacienteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Paciente não encontrado com ID: " + id);
        }

        long totalGuias = pacienteRepository.countGuiasByPacienteId(id);
        if (totalGuias > 0) {
            throw new IllegalStateException("Não é possível excluir paciente com guias associadas. Total de guias: " + totalGuias);
        }

        pacienteRepository.deleteById(id);
        logger.info("Paciente deletado com sucesso. ID: {}", id);
    }

    @Override
    public Page<PacienteSummaryDto> searchPacientesByNome(String nome, Pageable pageable) {
        logger.info("Buscando pacientes por nome: ", nome);

        Page<Paciente> pacientes = pacienteRepository.findByNomeContainingIgnoreCase(nome, pageable);
        return pacientes.map(this::mapToPacienteSummaryDto);
    }

    @Override
    public Page<PacienteSummaryDto> getPacientesByConvenio(UUID convenioId, Pageable pageable) {
        logger.info("Buscando pacientes por convênio ID: {}", convenioId);

        Page<Paciente> pacientes = pacienteRepository.findByConvenioId(convenioId, pageable);
        return pacientes.map(this::mapToPacienteSummaryDto);
    }

    @Override
    public Page<PacienteSummaryDto> getPacientesByUnidade(Paciente.UnidadeEnum unidade, Pageable pageable) {
        logger.info("Buscando pacientes por unidade: {}", unidade);

        Page<Paciente> pacientes = pacienteRepository.findByUnidade(unidade, pageable);
        return pacientes.map(this::mapToPacienteSummaryDto);
    }

    @Override
    public Page<PacienteSummaryDto> getPacientesByDataNascimento(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        logger.info("Buscando pacientes por data de nascimento entre {} e {}", startDate, endDate);

        Page<Paciente> pacientes = pacienteRepository.findByDataNascimentoBetween(startDate, endDate, pageable);
        return pacientes.map(this::mapToPacienteSummaryDto);
    }

    @Override
    public Page<GuiaSummaryDto> getGuiasByPacienteId(UUID pacienteId, Pageable pageable) {
        logger.info("Buscando guias do paciente: {}", pacienteId);

        if (!pacienteRepository.existsById(pacienteId)) {
            throw new ResourceNotFoundException("Paciente não encontrado com ID: " + pacienteId);
        }

        return guiaRepository.findByPacienteId(pacienteId, pageable)
                .map(this::mapToGuiaSummaryDto);
    }

    @Override
    public long countTotalPacientes() {
        return pacienteRepository.count();
    }

    @Override
    public long countPacientesByConvenio(UUID convenioId) {
        return pacienteRepository.findByConvenioId(convenioId, Pageable.unpaged()).getTotalElements();
    }

    @Override
    public long countPacientesByUnidade(Paciente.UnidadeEnum unidade) {
        return pacienteRepository.findByUnidade(unidade, Pageable.unpaged()).getTotalElements();
    }

    // Métodos auxiliares de mapeamento
    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userDetails.getUsername()));
    }

    private PacienteDto mapToPacienteDto(Paciente paciente) {
        long totalGuias = pacienteRepository.countGuiasByPacienteId(paciente.getId());

        return new PacienteDto(
                paciente.getId(),
                paciente.getNome(),
                paciente.getDataNascimento(),
                paciente.getResponsavel(),
                paciente.getConvenio().getId(),
                paciente.getConvenio().getName(),
                paciente.getUnidade(),
                paciente.getCreatedBy().getId(),
                paciente.getCreatedBy().getFullName(),
                paciente.getCreatedAt(),
                paciente.getUpdatedAt(),
                totalGuias
        );
    }

    private PacienteSummaryDto mapToPacienteSummaryDto(Paciente paciente) {
        long totalGuias = pacienteRepository.countGuiasByPacienteId(paciente.getId());
        boolean hasGuiasVencidas = pacienteRepository.hasGuiasVencidas(paciente.getId());

        return new PacienteSummaryDto(
                paciente.getId(),
                paciente.getNome(),
                paciente.getResponsavel(),
                paciente.getDataNascimento(),
                paciente.getConvenio().getName(),
                paciente.getConvenio().getId(),
                paciente.getUnidade(),
                totalGuias,
                hasGuiasVencidas,
                paciente.getCreatedAt()
        );
    }

    private GuiaSummaryDto mapToGuiaSummaryDto(Guia guia) {
        long totalFichas = guiaRepository.countFichasByGuiaId(guia.getId());

        return new GuiaSummaryDto(
                guia.getId(),
                guia.getNumeroGuia(),
                guia.getStatus(),
                guia.getPaciente().getNome(),
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

}
