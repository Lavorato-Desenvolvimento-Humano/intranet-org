package com.intranet.drive.file.controller;

import com.intranet.drive.file.dto.FileDto;
import com.intranet.drive.file.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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
            @Parameter(description = "Arquivo a ser enviado")
            @RequestParam("file") @NotNull MultipartFile file,
            @Parameter(description = "ID da pasta de destino (opcional)")
            @RequestParam(required = false) Long folderId) {

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
            return createErrorResponse("Erro interno no upload do arquivo", HttpStatus.INTERNAL_SERVER_ERROR);

        } catch (IllegalArgumentException e) {
            logger.warn("Arquivo inválido no upload: {}", e.getMessage());
            return createErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);

        } catch (Exception e) {
            logger.error("Erro inesperado no upload: {}", e.getMessage(), e);
            return createErrorResponse("Erro interno do servidor", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download de arquivo", description = "Faz download de um arquivo específico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Download iniciado"),
            @ApiResponse(responseCode = "404", description = "Arquivo não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('drive:read', 'drive:download') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<InputStreamResource> downloadFile(
            @Parameter(description = "ID do arquivo")
            @PathVariable @NotNull Long id) {

        logger.info("Recebida requisição de download: arquivo ID={}", id);

        try {
            FileDto fileDto = fileService.getFileById(id);
            InputStream fileStream = fileService.downloadFile(id);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + URLEncoder.encode(fileDto.getOriginalName(), StandardCharsets.UTF_8) + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, fileDto.getMimeType());
            headers.add(HttpHeaders.CONTENT_LENGTH, fileDto.getFileSize().toString());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(fileStream));

        } catch (RuntimeException e) {
            logger.error("Erro no download do arquivo {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter informações do arquivo", description = "Retorna metadados de um arquivo")
    @PreAuthorize("hasAnyAuthority('drive:read') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<FileDto> getFile(@PathVariable @NotNull Long id) {
        try {
            FileDto file = fileService.getFileById(id);
            return ResponseEntity.ok(file);
        } catch (RuntimeException e) {
            logger.error("Arquivo {} não encontrado: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }


    @GetMapping
    @Operation(summary = "Listar arquivos", description = "Lista arquivos do usuário com paginação")
    @PreAuthorize("hasAnyAuthority('drive:read') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<FileDto>> listFiles(
            @Parameter(description = "ID da pasta (opcional - null para pasta raiz)")
            @RequestParam(required = false) Long folderId,
            @Parameter(description = "Número da página")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Campo de ordenação")
            @RequestParam(defaultValue = "name") String sort,
            @Parameter(description = "Direção da ordenação")
            @RequestParam(defaultValue = "asc") String direction) {

        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<FileDto> files = fileService.getFilesByFolder(folderId, pageable);

            return ResponseEntity.ok(files);

        } catch (Exception e) {
            logger.error("Erro ao listar arquivos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar arquivos", description = "Busca arquivos por nome")
    @PreAuthorize("hasAnyAuthority('drive:read') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<FileDto>> searchFiles(
            @Parameter(description = "Termo de busca")
            @RequestParam @NotBlank String query,
            @Parameter(description = "Número da página")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "20") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
            Page<FileDto> files = fileService.searchFiles(query.trim(), pageable);

            return ResponseEntity.ok(files);

        } catch (Exception e) {
            logger.error("Erro na busca de arquivos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar arquivo", description = "Atualiza informações de um arquivo")
    @PreAuthorize("hasAnyAuthority('drive:write') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<FileDto> updateFile(
            @Parameter(description = "ID do arquivo")
            @PathVariable @NotNull Long id,
            @Parameter(description = "Novo nome do arquivo")
            @RequestParam @NotBlank String name) {

        try {
            FileDto updatedFile = fileService.updateFile(id, name.trim());
            return ResponseEntity.ok(updatedFile);

        } catch (RuntimeException e) {
            logger.error("Erro ao atualizar arquivo {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        } catch (Exception e) {
            logger.error("Erro inesperado ao atualizar arquivo {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar arquivo", description = "Remove um arquivo (soft delete)")
    @PreAuthorize("hasAnyAuthority('drive:delete') or hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @Parameter(description = "ID do arquivo")
            @PathVariable @NotNull Long id) {

        try {
            fileService.deleteFile(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Arquivo deletado com sucesso");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erro ao deletar arquivo {}: {}", id, e.getMessage());
            return createErrorResponse("Arquivo não encontrado ou acesso negado", HttpStatus.NOT_FOUND);

        } catch (Exception e) {
            logger.error("Erro inesperado ao deletar arquivo {}: {}", id, e.getMessage(), e);
            return createErrorResponse("Erro interno do servidor", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ResponseEntity<Map<String, Object>> createErrorResponse(String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(status).body(errorResponse);
    }
}
