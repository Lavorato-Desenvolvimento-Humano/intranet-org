package com.intranet.backend.controllers;

import com.intranet.backend.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/check/{filename}")
    public ResponseEntity<?> checkFileExists(@PathVariable String filename) {
        logger.info("Verificando existência do arquivo: {}", filename);

        boolean exists = fileStorageService.fileExists(filename);

        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("filename", filename);

        if (exists) {
            logger.info("Arquivo encontrado: {}", filename);
            return ResponseEntity.ok(response);
        } else {
            logger.warn("Arquivo não encontrado: {}", filename);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/diagnose")
    public ResponseEntity<?> diagnoseDiretorio() {
        logger.info("Executando diagnóstico do sistema de arquivos");

        Map<String, Object> diagnostico = new HashMap<>();

        try {
            // Verificar se o diretório de upload existe
            Path uploadsPath = Paths.get(uploadDir);
            boolean uploadsExiste = Files.exists(uploadsPath);

            diagnostico.put("diretorioUploadExiste", uploadsExiste);
            diagnostico.put("diretorioUploadCaminho", uploadsPath.toAbsolutePath().toString());

            if (uploadsExiste) {
                // Verificar permissões
                boolean isReadable = Files.isReadable(uploadsPath);
                boolean isWritable = Files.isWritable(uploadsPath);
                diagnostico.put("permissaoLeitura", isReadable);
                diagnostico.put("permissaoEscrita", isWritable);

                // Verificar subdiretórios específicos
                Path imagesDirPath = uploadsPath.resolve("images");
                Path filesDirPath = uploadsPath.resolve("files");

                boolean imagesDirExiste = Files.exists(imagesDirPath);
                boolean filesDirExiste = Files.exists(filesDirPath);

                diagnostico.put("subdiretorioImagensExiste", imagesDirExiste);
                diagnostico.put("subdiretorioArquivosExiste", filesDirExiste);

                // Contar arquivos em cada diretório
                if (imagesDirExiste) {
                    long numArquivosImagens = Files.list(imagesDirPath).count();
                    diagnostico.put("numeroArquivosImagens", numArquivosImagens);
                }

                if (filesDirExiste) {
                    long numArquivosFiles = Files.list(filesDirPath).count();
                    diagnostico.put("numeroArquivosDocumentos", numArquivosFiles);
                }

                // Verificar espaço em disco
                File upload = new File(uploadDir);
                long espacoLivre = upload.getFreeSpace();
                long espacoTotal = upload.getTotalSpace();

                diagnostico.put("espacoLivreMB", espacoLivre / (1024 * 1024));
                diagnostico.put("espacoTotalMB", espacoTotal / (1024 * 1024));
                diagnostico.put("porcentagemEspacoLivre", (double)espacoLivre / espacoTotal * 100);
            }

            // Status geral
            boolean systemOk = uploadsExiste &&
                    Files.isReadable(uploadsPath) &&
                    Files.isWritable(uploadsPath);

            diagnostico.put("statusGeral", systemOk ? "OK" : "PROBLEMA_DETECTADO");

            return ResponseEntity.ok(diagnostico);

        } catch (Exception e) {
            logger.error("Erro ao realizar diagnóstico: ", e);
            diagnostico.put("erro", e.getMessage());
            diagnostico.put("stackTrace", e.getStackTrace());
            diagnostico.put("statusGeral", "ERRO");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(diagnostico);
        }
    }
}