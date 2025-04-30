package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private UUID id;
    private String fullName;
    private String email;
    private String profileImage;
    private List<String> roles;
    private boolean emailVerified;
    private boolean adminApproved;

    public JwtResponse(String token, UUID id, String fullName, String email, String profileImage, List<String> roles) {
        this.token = token;
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.profileImage = profileImage;
        this.roles = roles;
    }
}
