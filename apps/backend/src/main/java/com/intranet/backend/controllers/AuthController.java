package com.intranet.backend.controllers;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import com.intranet.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.login(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        JwtResponse jwtResponse = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(jwtResponse);
    }

    @PostMapping(value = "/register-with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<JwtResponse> registerWithImage(
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam(value = "githubId", required = false) String githubId,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {

        JwtResponse jwtResponse = authService.registerWithImage(fullName, email, password, githubId, profileImage);
        return ResponseEntity.status(HttpStatus.CREATED).body(jwtResponse);
    }

    @PostMapping("/reset-password/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestParam("email") String email) {
        authService.requestPasswordReset(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Se o e-mail existir em nosso sistema, um código de redefinição será enviado.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password/verify")
    public ResponseEntity<Map<String, String>> verifyResetCode(
            @RequestParam("email") String email,
            @RequestParam("code") String code) {

        authService.verifyResetCode(email, code);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Código verificado com sucesso.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password/complete")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        authService.resetPassword(resetPasswordRequest);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Senha redefinida com sucesso.");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/github/callback")
    public ResponseEntity<JwtResponse> githubCallback(@RequestParam("code") String code) {
        JwtResponse jwtResponse = authService.authenticateWithGithub(code);
        return ResponseEntity.ok(jwtResponse);
    }
}
