package com.intranet.backend.dto;

import com.intranet.backend.model.User;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PostagemComentarioDto {
    private UUID id;
    private String text;
    private UUID userId;
    private String userName;
    private String userProfileImage;
    private LocalDateTime createdAt;
}