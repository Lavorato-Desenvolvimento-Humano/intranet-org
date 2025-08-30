package com.intranet.drive.file.controller;

import com.intranet.drive.file.dto.FileDto;
import com.intranet.drive.file.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drive/files")
@Tag(name = "Files", description = "Operações de gerenciamento de arquivos")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload de arquivo", description = "Faz upload de um arquivo para o drive")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo inválido"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "413", description = "Arquivo muito grande")
    })
    @PreAuthorize("hasAnyAuthority('drive:write', 'drive:upload') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @Parameter(description = "Arquivo a ser enviado") @RequestParam("file") MultipartFile file,
            @Parameter(description = "ID da pasta de destino (opcional)") @RequestParam(required = false) Long folderId) {

        logger.info("Recebida requisição de upload: arquivo={}, pasta={}", file.getOriginalFilename(), folderId);

        try {
            FileDto uploadedFile = fileService.uploadFile(file, folderId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Arquivo enviado com sucesso");
            response.put("file", uploadedFile);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            logger.error("Erro de I/O no upload: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro interno no upload do arquivo");
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (IllegalArgumentException e) {
            logger.warn("Arquivo inválido no upload: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
