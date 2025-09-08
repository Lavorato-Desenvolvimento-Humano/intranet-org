package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenValidationResponse {

    private boolean valid;
    private String message;
    private UserDto user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String username;
        private String email;
        private String fullName;
        private String profileImage;
        private List<String> roles;
        private List<String> teams;
        private boolean isActive;
        private boolean emailVerified;
        private boolean adminApproved;
    }
}
