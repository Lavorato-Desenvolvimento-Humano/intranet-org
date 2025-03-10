package com.intranet.backend.service;

import com.intranet.backend.dto.JwtResponse;
import com.intranet.backend.dto.LoginRequest;
import com.intranet.backend.dto.RegisterRequest;
import com.intranet.backend.dto.ResetPasswordRequest;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

    JwtResponse login(LoginRequest loginRequest);

    JwtResponse register(RegisterRequest registerRequest);

    JwtResponse registerWithImage(String fullName, String email, String password, String githubId, MultipartFile profileImage);

    void requestPasswordReset(String email);

    void verifyResetCode(String email, String code);

    void resetPassword(ResetPasswordRequest resetPasswordRequest);

    JwtResponse authenticateWithGithub(String code);
}
