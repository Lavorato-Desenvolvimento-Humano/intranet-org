package com.intranet.backend.controllers;

import com.intranet.backend.dto.AnexoDto;
import com.intranet.backend.dto.ImagemDto;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
    public ResponseEntity<ImagemDto> addTempImagem(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        logger.info("Requisição para adicionar imagem temporária");

        try {
            // Validar o arquivo
            String errorMessage = FileHelper.validateFile(file, true);
            if (errorMessage != null) {
                return ResponseEntity.badRequest().build();
            }

            // Salvar arquivo no diretório temp/imagens
            String fileName = fileStorageService.storeFileInPath(file, "temp/imagens");
            String fileUrl = "/api/uploads/temp/imagens/" + FileHelper.extractFileNameFromUrl(fileName);

            // Criar entidade Imagem temporária (sem postagem)
            Imagem imagem = new Imagem();
            imagem.setId(UUID.randomUUID());
            imagem.setUrl(fileUrl);
            imagem.setDescription(description);

            // Salvar no banco de dados
            Imagem savedImagem = imagemRepository.save(imagem);
            logger.info("Imagem temporária salva com sucesso: {}", savedImagem.getId());

            // Criar DTO para retorno
            ImagemDto imagemDto = new ImagemDto();
            imagemDto.setId(savedImagem.getId());
            imagemDto.setUrl(savedImagem.getUrl());
            imagemDto.setDescription(savedImagem.getDescription());

            return ResponseUtil.created(imagemDto);
        } catch (Exception e) {
            logger.error("Erro ao adicionar imagem temporária: {}", e.getMessage(), e);
            return ResponseUtil.<ImagemDto>serverError("Erro ao processar imagem temporária");
        }
    }

    @PostMapping(value = "/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR') or hasRole('USER')")
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
            anexo.setId(UUID.randomUUID());
            anexo.setNameFile(file.getOriginalFilename());
            anexo.setTypeFile(file.getContentType());
            anexo.setUrl(fileUrl);

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
            return ResponseUtil.<AnexoDto>serverError("Erro ao processar anexo temporário");
        }
    }
}
