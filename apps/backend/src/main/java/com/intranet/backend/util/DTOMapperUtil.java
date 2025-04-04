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
                user.isActive()
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
     * Mapeia uma demanda para um DTO de demanda
     */
    public static DemandaDto mapToDemandaDto(Demanda demanda, User currentUser, boolean avaliarPermissoes) {
        DemandaDto dto = new DemandaDto();
        dto.setId(demanda.getId());
        dto.setTitulo(demanda.getTitulo());
        dto.setDescricao(demanda.getDescricao());
        dto.setDataInicio(demanda.getDataInicio());
        dto.setDataFim(demanda.getDataFim());
        dto.setStatus(demanda.getStatus());
        dto.setPrioridade(demanda.getPrioridade());
        dto.setCriadaEm(demanda.getCriadaEm());
        dto.setAtualizadaEm(demanda.getAtualizadaEm());

        // Informações do criador
        if (demanda.getCriadoPor() != null) {
            dto.setCriadoPorId(demanda.getCriadoPor().getId());
            dto.setCriadoPorNome(demanda.getCriadoPor().getFullName());
        }

        // Informações do atribuído
        if (demanda.getAtribuidoPara() != null) {
            dto.setAtribuidoParaId(demanda.getAtribuidoPara().getId());
            dto.setAtribuidoParaNome(demanda.getAtribuidoPara().getFullName());
        }

        // Verificar se o usuário atual pode editar esta demanda
        if (avaliarPermissoes) {
            dto.setPodeEditar(podeEditarDemanda(demanda, currentUser));
        } else {
            dto.setPodeEditar(true);
        }

        return dto;
    }

    /**
     * Verifica se o usuário pode editar a demanda
     */
    private static boolean podeEditarDemanda(Demanda demanda, User user) {
        // Para implementação completa, mova esta lógica para um serviço específico
        // Esta é uma versão simplificada

        if (demanda == null || user == null) {
            return false;
        }

        // O criador da demanda sempre pode editá-la
        if (demanda.getCriadoPor() != null && demanda.getCriadoPor().getId().equals(user.getId())) {
            return true;
        }

        // O usuário atribuído pode editar a demanda
        if (demanda.getAtribuidoPara() != null && demanda.getAtribuidoPara().getId().equals(user.getId())) {
            return true;
        }

        return false;
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