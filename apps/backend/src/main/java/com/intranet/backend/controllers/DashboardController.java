package com.intranet.backend.controllers;

import com.intranet.backend.dto.ConvenioDto;
import com.intranet.backend.dto.ConvenioSimpleDto;
import com.intranet.backend.dto.PostagemSimpleDto;
import com.intranet.backend.service.ConvenioService;
import com.intranet.backend.service.PostagemService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);
    private final ConvenioService convenioService;
    private final PostagemService postagemService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData(
            @RequestParam(defaultValue = "5") int postLimit,
            @RequestParam(defaultValue = "5") int convenioLimit) {

        logger.info("Requisição para obter dados da dashboard");

        // Obter as postagens mais recentes
        List<PostagemSimpleDto> recentPostagens = postagemService.getRecentPostagens(postLimit);

        // Obter os convênios com postagens
        List<ConvenioDto> conveniosWithPostagens = convenioService.getConveniosWithPostagens();

        // Limitar o número de convênios se necessário
        if (conveniosWithPostagens.size() > convenioLimit) {
            conveniosWithPostagens = conveniosWithPostagens.subList(0, convenioLimit);
        }

        // Obter todos os convênios simplificados para exibir na sidebar
        List<ConvenioSimpleDto> allConvenios = convenioService.getAllConvenios();

        // Construir o objeto de resposta
        Map<String, Object> response = new HashMap<>();
        response.put("recentPostagens", recentPostagens);
        response.put("conveniosWithPostagens", conveniosWithPostagens);
        response.put("allConvenios", allConvenios);
        response.put("totalConvenios", allConvenios.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/convenio/{convenioId}")
    public ResponseEntity<Map<String, Object>> getDashboardDataForConvenio(
            @PathVariable UUID convenioId,
            @RequestParam(defaultValue = "10") int postLimit) {

        logger.info("Requisição para obter dados da dashboard para o convênio ID: {}", convenioId);

        // Obter detalhes do convênio
        ConvenioDto convenio = convenioService.getConvenioById(convenioId);

        // Obter as postagens mais recentes deste convênio
        List<PostagemSimpleDto> postagensByConvenio = postagemService.getPostagensByConvenioId(convenioId);

        // Limitar o número de postagens se necessário
        if (postagensByConvenio.size() > postLimit) {
            postagensByConvenio = postagensByConvenio.subList(0, postLimit);
        }

        // Obter todos os convênios simplificados para exibir na sidebar
        List<ConvenioSimpleDto> allConvenios = convenioService.getAllConvenios();

        // Construir o objeto de resposta
        Map<String, Object> response = new HashMap<>();
        response.put("convenio", convenio);
        response.put("postagens", postagensByConvenio);
        response.put("allConvenios", allConvenios);
        response.put("totalPostagens", convenio.getPostagemCount());

        return ResponseEntity.ok(response);
    }
}