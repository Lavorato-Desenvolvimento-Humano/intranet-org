package com.intranet.drive.collaboration.controller;

import com.intranet.drive.collaboration.dto.CommentRequestDto;
import com.intranet.drive.collaboration.dto.CommentResponseDto;
import com.intranet.drive.collaboration.dto.ShareLinkRequestDto;
import com.intranet.drive.collaboration.dto.ShareLinkResponseDto;
import com.intranet.drive.collaboration.entity.FileCommentEntity;
import com.intranet.drive.collaboration.entity.ShareLinkEntity;
import com.intranet.drive.collaboration.service.CollaborationService;
import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.common.service.CoreIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/drive/files")
public class CollaborationController {

    private final CollaborationService collaborationService;;
    private final CoreIntegrationService coreIntegrationService;

    public CollaborationController(CollaborationService collaborationService, CoreIntegrationService coreIntegrationService) {
        this.collaborationService = collaborationService;
        this.coreIntegrationService = coreIntegrationService;
    }

    @Value("${app.drive.public-url:http://localhost:3000/drive/share/}")
    private String publicShareBaseUrl;

    @PostMapping("/{fileId}/comments")
    public ResponseEntity<CommentResponseDto> addComment(@PathVariable Long fileId,
                                                         @RequestBody CommentRequestDto request) {
        UserDto currentUser = getCurrentUser();
        FileCommentEntity comment = collaborationService.addComment(
                fileId,
                request.content(),
                request.parentCommentId(),
                currentUser
        );
        return ResponseEntity.ok(toCommentDto(comment));
    }

    @GetMapping("/{fileId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long fileId) {
        UserDto currentUser = getCurrentUser();
        List<FileCommentEntity> comments = collaborationService.getComments(fileId, currentUser);

        List<CommentResponseDto> dtos = comments.stream()
                .map(this::toCommentDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        UserDto currentUser = getCurrentUser();
        collaborationService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{fileId}/share")
    public ResponseEntity<ShareLinkResponseDto> createShareLink(@PathVariable Long fileId,
                                                                @RequestBody ShareLinkRequestDto request) {
        UserDto currentUser = getCurrentUser();
        ShareLinkEntity link = collaborationService.createShareLink(
                fileId,
                request.expiresAt(),
                request.password(),
                request.maxDownloads(),
                currentUser
        );

        String fullUrl = publicShareBaseUrl + link.getToken();

        ShareLinkResponseDto response = new ShareLinkResponseDto(
                link.getToken(),
                fullUrl,
                link.getExpiresAt(),
                link.getMaxDownloads(),
                link.getDownloadCount()
        );

        return ResponseEntity.ok(response);
    }

    private UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            String username = (String) authentication.getPrincipal();
            return coreIntegrationService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        }
        if (authentication != null && authentication.getDetails() instanceof UserDto) {
            return (UserDto) authentication.getDetails();
        }
        throw new RuntimeException("Usuário não autenticado");
    }

    private CommentResponseDto toCommentDto(FileCommentEntity entity) {
        return new CommentResponseDto(
                entity.getId(),
                entity.getFile().getId(),
                entity.getUserId(),
                entity.getUsername(),
                entity.getContent(),
                entity.getParentComment() != null ? entity.getParentComment().getId() : null,
                entity.getCreatedAt()
        );
    }


}
