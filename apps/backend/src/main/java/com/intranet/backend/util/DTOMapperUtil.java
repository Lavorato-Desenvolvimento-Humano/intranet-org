package com.intranet.backend.util;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Classe utilitária para mapear entidades para DTOs
 * Reduz a duplicação de código e centraliza a lógica de mapeamento
 */
public class DTOMapperUtil {

    /**
     * Mapeia um usuário para um DTO de usuário
     */
    public static UserDto mapToUserDto(User user, List<String> roles) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getProfileImage(),
                roles != null ? roles : List.of(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.isEmailVerified(),
                user.isActive(),
                user.isAdminApproved()
        );
    }

    /**
     * Mapeia um convênio para um DTO de convênio
     */
    public static ConvenioDto mapToConvenioDto(Convenio convenio, long postagemCount) {
        ConvenioDto dto = new ConvenioDto();
        dto.setId(convenio.getId());
        dto.setName(convenio.getName());
        dto.setDescription(convenio.getDescription());
        dto.setCreatedAt(convenio.getCreatedAt());
        dto.setUpdatedAt(convenio.getUpdatedAt());
        dto.setPostagemCount(postagemCount);
        return dto;
    }

    /**
     * Mapeia uma postagem para um DTO de resumo de postagem
     */
    public static PostagemSummaryDto mapToPostagemSummaryDto(Postagem postagem) {
        PostagemSummaryDto dto = new PostagemSummaryDto();
        dto.setId(postagem.getId());
        dto.setTitle(postagem.getTitle());
        dto.setTipoDestino(postagem.getTipoDestino());

        // Definir IDs e nomes baseados no tipo de destino
        if ("convenio".equals(postagem.getTipoDestino()) && postagem.getConvenio() != null) {
            dto.setConvenioId(postagem.getConvenio().getId());
            dto.setConvenioName(postagem.getConvenio().getName());
        } else if ("equipe".equals(postagem.getTipoDestino()) && postagem.getEquipe() != null) {
            dto.setEquipeId(postagem.getEquipe().getId());
            dto.setEquipeName(postagem.getEquipe().getNome());
        }

        dto.setCreatedById(postagem.getCreatedBy().getId());
        dto.setCreatedByName(postagem.getCreatedBy().getFullName());
        dto.setCreatedByProfileImage(postagem.getCreatedBy().getProfileImage());
        dto.setCreatedAt(postagem.getCreatedAt());
        dto.setHasImagens(!postagem.getImagens().isEmpty());
        dto.setHasAnexos(!postagem.getAnexos().isEmpty());
        dto.setHasTabelas(!postagem.getTabelas().isEmpty());
        return dto;
    }

    /**
     * Mapeia uma página de postagens para uma página de DTOs de resumo de postagem
     */
    public static Page<PostagemSummaryDto> mapToPostagemSummaryDtoPage(Page<Postagem> page) {
        return page.map(DTOMapperUtil::mapToPostagemSummaryDto);
    }

    /**
     * Mapeia uma postagem para um DTO de postagem completo
     */
    public static PostagemDto mapToPostagemDto(Postagem postagem) {
        PostagemDto dto = new PostagemDto();
        dto.setId(postagem.getId());
        dto.setTitle(postagem.getTitle());
        dto.setText(postagem.getText());
        dto.setTipoDestino(postagem.getTipoDestino());

        // Definir IDs e nomes baseados no tipo de destino
        if ("convenio".equals(postagem.getTipoDestino()) && postagem.getConvenio() != null) {
            dto.setConvenioId(postagem.getConvenio().getId());
            dto.setConvenioName(postagem.getConvenio().getName());
        } else if ("equipe".equals(postagem.getTipoDestino()) && postagem.getEquipe() != null) {
            dto.setEquipeId(postagem.getEquipe().getId());
            dto.setEquipeName(postagem.getEquipe().getNome());
        }

        dto.setCreatedById(postagem.getCreatedBy().getId());
        dto.setCreatedByName(postagem.getCreatedBy().getFullName());
        dto.setCreatedByProfileImage(postagem.getCreatedBy().getProfileImage());
        dto.setCreatedAt(postagem.getCreatedAt());
        dto.setUpdatedAt(postagem.getUpdatedAt());

        // Mapear imagens, anexos e tabelas como antes
        List<ImagemDto> imagemDtos = postagem.getImagens().stream()
                .map(DTOMapperUtil::mapToImagemDto)
                .collect(Collectors.toList());
        dto.setImagens(imagemDtos);

        List<AnexoDto> anexoDtos = postagem.getAnexos().stream()
                .map(DTOMapperUtil::mapToAnexoDto)
                .collect(Collectors.toList());
        dto.setAnexos(anexoDtos);

        List<TabelaPostagemDto> tabelaDtos = postagem.getTabelas().stream()
                .map(DTOMapperUtil::mapToTabelaDto)
                .collect(Collectors.toList());
        dto.setTabelas(tabelaDtos);

        return dto;
    }


    /**
     * Mapeia uma imagem para um DTO de imagem
     */
    public static ImagemDto mapToImagemDto(Imagem imagem) {
        ImagemDto dto = new ImagemDto();
        dto.setId(imagem.getId());
        if (imagem.getPostagem() != null) {
            dto.setPostagemId(imagem.getPostagem().getId());
        }
        dto.setUrl(imagem.getUrl());
        dto.setDescription(imagem.getDescription());
        return dto;
    }

    /**
     * Mapeia um anexo para um DTO de anexo
     */
    public static AnexoDto mapToAnexoDto(Anexo anexo) {
        AnexoDto dto = new AnexoDto();
        dto.setId(anexo.getId());
        if (anexo.getPostagem() != null) {
            dto.setPostagemId(anexo.getPostagem().getId());
        }
        dto.setNameFile(anexo.getNameFile());
        dto.setTypeFile(anexo.getTypeFile());
        dto.setUrl(anexo.getUrl());
        return dto;
    }

    /**
     * Mapeia uma tabela de postagem para um DTO de tabela de postagem
     */
    public static TabelaPostagemDto mapToTabelaDto(TabelaPostagem tabela) {
        TabelaPostagemDto dto = new TabelaPostagemDto();
        dto.setId(tabela.getId());
        if (tabela.getPostagem() != null) {
            dto.setPostagemId(tabela.getPostagem().getId());
        }
        dto.setConteudo(tabela.getConteudo());
        return dto;
    }

    /**
     * Mapeia uma equipe para um DTO de equipe
     */
    public static EquipeDto mapToEquipeDto(Equipe equipe, int membroCount) {
        EquipeDto dto = new EquipeDto();
        dto.setId(equipe.getId());
        dto.setNome(equipe.getNome());
        dto.setDescricao(equipe.getDescricao());
        dto.setCreatedAt(equipe.getCreatedAt());
        dto.setUpdatedAt(equipe.getUpdatedAt());
        dto.setMembroCount(membroCount);
        return dto;
    }

    /**
     * Mapeia um paciente para um DTO de paciente
     */
    public static PacienteDto mapToPacienteDto(Paciente paciente, long totalGuias) {
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

    /**
     * Mapeia um paciente para um DTO de resumo de paciente
     */
    public static PacienteSummaryDto mapToPacienteSummaryDto(Paciente paciente, long totalGuias, boolean hasGuiasVencidas) {
        return new PacienteSummaryDto(
                paciente.getId(),
                paciente.getNome(),
                paciente.getDataNascimento(),
                paciente.getConvenio().getName(),
                paciente.getUnidade(),
                totalGuias,
                hasGuiasVencidas
        );
    }

    /**
     * Mapeia uma guia para um DTO de guia
     */
    public static GuiaDto mapToGuiaDto(Guia guia, long totalFichas) {
        return new GuiaDto(
                guia.getId(),
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

    /**
     * Mapeia uma guia para um DTO de resumo de guia
     */
    public static GuiaSummaryDto mapToGuiaSummaryDto(Guia guia, long totalFichas) {
        return new GuiaSummaryDto(
                guia.getId(),
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

    /**
     * Mapeia uma ficha para um DTO de ficha
     */
    public static FichaDto mapToFichaDto(Ficha ficha) {
        return new FichaDto(
                ficha.getId(),
                ficha.getGuia().getId(),
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

    /**
     * Mapeia uma ficha para um DTO de resumo de ficha
     */
    public static FichaSummaryDto mapToFichaSummaryDto(Ficha ficha) {
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

    /**
     * Mapeia uma página de pacientes para uma página de DTOs de resumo
     */
    public static Page<PacienteSummaryDto> mapToPacienteSummaryDtoPage(Page<Paciente> page) {
        return page.map(paciente -> {
            return new PacienteSummaryDto(
                    paciente.getId(),
                    paciente.getNome(),
                    paciente.getDataNascimento(),
                    paciente.getConvenio().getName(),
                    paciente.getUnidade(),
                    0L, // totalGuias - deve ser calculado no serviço
                    false // hasGuiasVencidas - deve ser calculado no serviço
            );
        });
    }

    /**
     * Mapeia uma página de guias para uma página de DTOs de resumo
     */
    public static Page<GuiaSummaryDto> mapToGuiaSummaryDtoPage(Page<Guia> page) {
        return page.map(guia -> new GuiaSummaryDto(
                guia.getId(),
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
                0L, // totalFichas - deve ser calculado no serviço
                guia.isVencida(),
                guia.isQuantidadeExcedida()
        ));
    }

    /**
     * Mapeia uma página de fichas para uma página de DTOs de resumo
     */
    public static Page<FichaSummaryDto> mapToFichaSummaryDtoPage(Page<Ficha> page) {
        return page.map(DTOMapperUtil::mapToFichaSummaryDto);
    }

    /**
     * Extrai o nome do arquivo de uma URL
     */
    public static String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }

        int lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < url.length() - 1) {
            return url.substring(lastSlashIndex + 1);
        }

        return url;
    }
}