package com.intranet.drive.collaboration.service;

import com.intranet.drive.collaboration.entity.FileCommentEntity;
import com.intranet.drive.collaboration.entity.ShareLinkEntity;
import com.intranet.drive.collaboration.repository.FileCommentRepository;
import com.intranet.drive.collaboration.repository.ShareLinkRepository;
import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.repository.FileRepository;
import com.intranet.drive.permission.service.DrivePermissionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CollaborationService {

    private final FileCommentRepository commentRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final FileRepository fileRepository;
    private final DrivePermissionService permissionService;

    public CollaborationService(FileCommentRepository commentRepository,
                                ShareLinkRepository shareLinkRepository,
                                FileRepository fileRepository,
                                DrivePermissionService permissionService) {
        this.commentRepository = commentRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.fileRepository = fileRepository;
        this.permissionService = permissionService;
    }

    public FileCommentEntity addComment(Long fileId, String content, Long parentId, UserDto user) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        // Verifica se o usuário tem acesso de LEITURA para comentar
        if (!permissionService.hasReadAccess(fileId, user)) {
            throw new SecurityException("Sem permissão para comentar neste arquivo");
        }

        FileCommentEntity comment = new FileCommentEntity();
        comment.setFile(file);
        comment.setContent(content);
        comment.setUserId(user.getId());
        comment.setUsername(user.getUsername());

        if (parentId != null) {
            FileCommentEntity parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Comentário pai não encontrado"));
            comment.setParentComment(parent);
        }

        FileCommentEntity savedComment = commentRepository.save(comment);

        // TODO: Enviar notificação para o dono do arquivo ou participantes da thread
        // notificationService.notifyNewComment(file, user, content);

        return savedComment;
    }

    @Transactional(readOnly = true)
    public List<FileCommentEntity> getComments(Long fileId, UserDto user) {
        // Verifica permissão de leitura
        if (!permissionService.hasReadAccess(fileId, user)) {
            throw new SecurityException("Sem permissão para visualizar comentários");
        }
        return commentRepository.findByFileIdAndIsDeletedFalseOrderByCreatedAtDesc(fileId);
    }

    public void deleteComment(Long commentId, UserDto user) {
        FileCommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comentário não encontrado"));

        // Apenas o autor ou ADMIN pode deletar
        boolean isAuthor = comment.getUserId().equals(user.getId());
        boolean isAdmin = user.getRoles().contains("ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new SecurityException("Você não tem permissão para excluir este comentário");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);
    }

    public ShareLinkEntity createShareLink(Long fileId, LocalDateTime expiresAt, String password, Integer maxDownloads, UserDto user) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        // Apenas quem tem permissão de ESCRITA ou é ADMIN pode gerar links externos
        if (!permissionService.hasWriteAccess(fileId, user)) {
            throw new SecurityException("Sem permissão para compartilhar este arquivo externamente");
        }

        ShareLinkEntity link = new ShareLinkEntity();
        link.setFile(file);
        link.setToken(UUID.randomUUID().toString()); // Gera um token único
        link.setExpiresAt(expiresAt);
        link.setMaxDownloads(maxDownloads);
        link.setCreatedByUserId(user.getId());

        if (password != null && !password.isEmpty()) {
            // Em produção, use BCrypt para hashear a senha!
            // link.setPasswordHash(passwordEncoder.encode(password));
            link.setPasswordHash(password);
        }

        return shareLinkRepository.save(link);
    }

    @Transactional(readOnly = true)
    public FileEntity accessViaLink(String token) {
        ShareLinkEntity link = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link inválido"));

        if (!link.isValid()) {
            throw new RuntimeException("Link expirado ou inativo");
        }

        return link.getFile();
    }

    public void registerDownloadViaLink(String token) {
        ShareLinkEntity link = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Link inválido"));

        link.setDownloadCount(link.getDownloadCount() + 1);
        shareLinkRepository.save(link);
    }
}