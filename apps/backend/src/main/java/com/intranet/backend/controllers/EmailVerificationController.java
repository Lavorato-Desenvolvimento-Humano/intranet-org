package com.intranet.backend.controllers;

import com.intranet.backend.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/verify-email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationController.class);
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/resend")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(@RequestParam("email") String email) {
        try {
            emailVerificationService.resendVerificationEmail(email);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Se o e-mail existir em nosso sistema, um código de verificação será enviado.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erro ao reenviar email de verificação: {}", e.getMessage(), e);

            // Mesmo com erro, retornamos resposta neutra para não expor detalhes sensíveis
            Map<String, String> response = new HashMap<>();
            response.put("message", "Se o e-mail existir em nosso sistema, um código de verificação será enviado.");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> verifyEmail(
            @RequestParam("email") String email,
            @RequestParam("code") String code) {
        try {
            emailVerificationService.verifyEmail(email, code);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Email verificado com sucesso.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erro ao verificar email: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
