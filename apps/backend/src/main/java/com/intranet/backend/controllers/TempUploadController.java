package com.intranet.backend.controllers;

import com.intranet.backend.dto.AnexoDto;
import com.intranet.backend.dto.ImagemDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Anexo;
import com.intranet.backend.model.Imagem;
import com.intranet.backend.repository.AnexoRepository;
import com.intranet.backend.repository.ImagemRepository;
import com.intranet.backend.service.FileStorageService;
import com.intranet.backend.util.FileHelper;
import com.intranet.backend.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/temp")
@RequiredArgsConstructor
public class TempUploadController {

    private static final Logger logger = LoggerFactory.getLogger(TempUploadController.class);
    private final FileStorageService fileStorageService;
    private final ImagemRepository imagemRepository;
    private final AnexoRepository anexoRepository;

    @PostMapping(value = "/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<ImagemDto> addTempImagem(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        logger.info("Requisição para adicionar imagem temporária");
        logger.debug("Criando nova imagem temporária sem ID...");

        try {
            // Validar o arquivo
            String errorMessage = FileHelper.validateFile(file, true);
            if (errorMessage != null) {
                return ResponseEntity.badRequest().build();
            }

            // Salvar arquivo no diretório temp/imagens
            String fileName = fileStorageService.storeFileInPath(file, "temp/imagens");
            String fileUrl = "/api/uploads/temp/imagens/" + FileHelper.extractFileNameFromUrl(fileName);

            // Criar uma nova instância de Imagem (sem usar um ID existente)
            Imagem imagem = new Imagem();
            // Não definir ID manualmente
            imagem.setUrl(fileUrl);
            imagem.setDescription(description);
            imagem.setPostagem(null); // Explicitamente definir postagem como null
            imagem.setCreatedAt(LocalDateTime.now());

            logger.debug("Objeto Imagem criado com URL: {}", imagem.getUrl());
            logger.debug("Salvando imagem no banco de dados...");

            // Salvar no banco de dados como uma nova entidade
            Imagem savedImagem = imagemRepository.save(imagem);
            logger.debug("Imagem salva com ID: {}", savedImagem.getId());
            logger.info("Imagem temporária salva com sucesso: {}", savedImagem.getId());

            // Criar DTO para retorno
            ImagemDto imagemDto = new ImagemDto();
            imagemDto.setId(savedImagem.getId());
            imagemDto.setUrl(savedImagem.getUrl());
            imagemDto.setDescription(savedImagem.getDescription());

            return ResponseUtil.created(imagemDto);
        } catch (Exception e) {
            logger.error("Erro ao adicionar imagem temporária: {}", e.getMessage(), e);

            // Fornecer mais detalhes para ajudar no diagnóstico
            String errorMessage = "Erro ao processar imagem temporária";
            if (e instanceof org.springframework.orm.ObjectOptimisticLockingFailureException ||
                    e.getCause() instanceof org.hibernate.StaleObjectStateException) {
                errorMessage = "Erro de concorrência ao salvar imagem. Por favor, tente novamente.";
            } else if (e instanceof org.springframework.dao.DataIntegrityViolationException) {
                errorMessage = "Erro de integridade de dados ao salvar imagem.";
            }

            return ResponseUtil.<ImagemDto>serverError(errorMessage);
        }
    }

    @PostMapping(value = "/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN', 'GERENTE', 'SUPERVISOR')")
    public ResponseEntity<AnexoDto> addTempAnexo(@RequestParam("file") MultipartFile file) {
        logger.info("Requisição para adicionar anexo temporário");

        try {
            // Validar o arquivo
            String errorMessage = FileHelper.validateFile(file, false);
            if (errorMessage != null) {
                return ResponseEntity.badRequest().build();
            }

            // Salvar arquivo no diretório temp/anexos
            String fileName = fileStorageService.storeFileInPath(file, "temp/anexos");
            String fileUrl = "/api/uploads/temp/anexos/" + FileHelper.extractFileNameFromUrl(fileName);

            // Criar entidade Anexo temporária (sem postagem)
            Anexo anexo = new Anexo();
            // Não definir ID manualmente
            anexo.setNameFile(file.getOriginalFilename());

            // Limitar o tamanho do tipo de arquivo para 50 caracteres
            String contentType = FileHelper.limitContentType(file.getContentType(), 50);
            anexo.setTypeFile(contentType);

            anexo.setUrl(fileUrl);
            anexo.setPostagem(null); // Explicitamente definir postagem como null

            // Salvar no banco de dados
            Anexo savedAnexo = anexoRepository.save(anexo);
            logger.info("Anexo temporário salvo com sucesso: {}", savedAnexo.getId());

            // Criar DTO para retorno
            AnexoDto anexoDto = new AnexoDto();
            anexoDto.setId(savedAnexo.getId());
            anexoDto.setNameFile(savedAnexo.getNameFile());
            anexoDto.setTypeFile(savedAnexo.getTypeFile());
            anexoDto.setUrl(savedAnexo.getUrl());

            return ResponseUtil.created(anexoDto);
        } catch (Exception e) {
            logger.error("Erro ao adicionar anexo temporário: {}", e.getMessage(), e);
            return ResponseUtil.<AnexoDto>serverError("Erro ao processar anexo temporário: " + e.getMessage());
        }
    }
}