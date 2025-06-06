package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.FichaService;
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

@Service
@RequiredArgsConstructor
public class FichaServiceImpl implements FichaService {

    private static final Logger logger = LoggerFactory.getLogger(FichaServiceImpl.class);

    private final FichaRepository fichaRepository;
    private final GuiaRepository guiaRepository;
    private final ConvenioRepository convenioRepository;
    private final UserRepository userRepository;
    private final PacienteRepository pacienteRepository;

    @Autowired
    private CodigoGenerator codigoGenerator;

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

        String codigoFicha;
        int tentativas = 0;
        do {
            codigoFicha = codigoGenerator.gerarCodigo();
            tentativas++;

            if (tentativas > 10) {
                throw new IllegalStateException("Não foi possível gerar um código único para a ficha após várias tentativas");
            }
        } while (fichaRepository.existsByCodigoFicha(codigoFicha));

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

        Ficha savedFicha = fichaRepository.save(ficha);
        logger.info("Ficha criada com sucesso. ID: {}", savedFicha.getId());

        return mapToFichaDto(savedFicha);
    }

    @Transactional
    public FichaDto createFichaAssinatura(FichaAssinaturaCreateRequest request) {
        logger.info("Criando nova ficha com assinatura para paciente: {}", request.getPacienteId());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado com ID: " + request.getPacienteId()));

        Convenio convenio = convenioRepository.findById(request.getConvenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convênio não encontrado com ID: " + request.getConvenioId()));

        Ficha ficha = new Ficha();
        ficha.setPaciente(paciente);
        ficha.setGuia(null);
        ficha.setTipoFicha(Ficha.TipoFicha.ASSINATURA);
        ficha.setEspecialidade(request.getEspecialidade());
        ficha.setQuantidadeAutorizada(request.getQuantidadeAutorizada());
        ficha.setConvenio(convenio);
        ficha.setMes(request.getMes());
        ficha.setAno(request.getAno());
        ficha.setUsuarioResponsavel(getCurrentUser());

        Ficha saved = fichaRepository.save(ficha);
        return mapToFichaDto(saved);
    }

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

        // Atualizar campos se fornecidos
        if (request.getEspecialidade() != null) {
            // Verificar se a nova especialidade está disponível na guia
            if (!ficha.getGuia().getEspecialidades().contains(request.getEspecialidade())) {
                throw new IllegalArgumentException("A especialidade informada não está presente nas especialidades da guia");
            }

            // Verificar se não existe outra ficha com a mesma especialidade na mesma guia
            if (!ficha.getEspecialidade().equals(request.getEspecialidade()) &&
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

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));
    }

    private FichaDto mapToFichaDto(Ficha ficha) {
        UUID guiaId = ficha.getGuia() != null ? ficha.getGuia().getId() : null;

        return new FichaDto(
                ficha.getId(),
                guiaId,
                ficha.getCodigoFicha(),
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
                ficha.getUpdatedAt()
        );
    }

    private FichaSummaryDto mapToFichaSummaryDto(Ficha ficha) {
        return new FichaSummaryDto(
                ficha.getId(),
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