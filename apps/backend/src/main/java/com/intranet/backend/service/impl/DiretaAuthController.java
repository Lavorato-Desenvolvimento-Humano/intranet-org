package com.intranet.backend.service.impl;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador para autenticação direta - endpoint alternativo para login
 */
@RestController
@RequestMapping("/auth/direta")
@RequiredArgsConstructor
class DiretaAuthController {

    private final DiretaAuthService diretaAuthService;

    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest loginRequest) {
        return diretaAuthService.autenticarDiretamente(loginRequest);
    }
}
