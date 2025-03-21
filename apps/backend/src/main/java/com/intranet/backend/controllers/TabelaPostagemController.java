package com.intranet.backend.controllers;

import com.intranet.backend.repository.PostagemRepository;
import com.intranet.backend.repository.TabelaPostagemRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tabelas")
@RequiredArgsConstructor
public class TabelaPostagemController {

    private static final Logger logger = LoggerFactory.getLogger(TabelaPostagemController.class);
    private final TabelaPostagemRepository tabelaPostagemRepository;
    private final PostagemRepository postagemRepository;

    @PostMapping("/debug")
    public ResponseEntity<?> debugTabelaFormat(@RequestBody Map<String, Object> payload) {
        try {
            String conteudo = payload.containsKey("conteudo") ?
                    payload.get("conteudo").toString() : "{}";

            String formatado = tabelaPostagemRepository.formatJsonbContent(conteudo);

            Map<String, Object> response = new HashMap<>();
            response.put("original", conteudo);
            response.put("formatted", formatado);
            response.put("isValid", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erro ao processar formato de tabela: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            response.put("isValid", false);

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
