package com.intranet.drive.file.service;

import com.intranet.drive.common.dto.UserDto;
import com.intranet.drive.file.dto.PermissionRequestDto;
import com.intranet.drive.file.entity.FileEntity;
import com.intranet.drive.file.entity.FilePermissionEntity;
import com.intranet.drive.file.entity.PermissionTargetType;
import com.intranet.drive.file.entity.PermissionType;
import com.intranet.drive.file.repository.FilePermissionRepository;
import com.intranet.drive.file.repository.FileRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class DrivePermissionService {

    private final FilePermissionRepository permissionRepository;
    private final FileRepository fileRepository;

    public DrivePermissionService(FilePermissionRepository permissionRepository, FileRepository fileRepository) {
        this.permissionRepository = permissionRepository;
        this.fileRepository = fileRepository;
    }

    public void grantPermission(Long fileId, PermissionRequestDto request) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        permissionRepository.deleteByFileIdAndTargetTypeAndTargetId(
                fileId, request.targetType(), request.targetId()
        );

        FilePermissionEntity perm = new FilePermissionEntity(
                file, request.targetType(), request.targetId(), request.permissionType()
        );

        permissionRepository.save(perm);
    }

    public void revokePermission(Long fileId, PermissionTargetType targetType, String targetId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        UserDto currentUser = getCurrentUser();

        boolean isOwner = file.getOwnerId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().contains("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Permissão negada: Apenas o proprietário ou administrador pode revogar acessos.");
        }

        permissionRepository.deleteByFileIdAndTargetTypeAndTargetId(fileId, targetType,  targetId);
    }

    private boolean hasPermission(Long fileId, UserDto user, PermissionType required) {
        Optional<FileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) return false;
        FileEntity file = fileOpt.get();

        //Dono e admin tem acesso total
        if (file.getOwnerId().equals(user.getId())) return true;
        if (user.getRoles().contains("ADMIN")) return true;

        return checkRecursive(file, user, required);
    }

    private boolean checkRecursive(FileEntity file, UserDto user, PermissionType required) {
        List<FilePermissionEntity> perms = permissionRepository.findByFileId(file.getId());
        for (FilePermissionEntity p : perms) {
            if (isSufficient(p.getPermissionType(), required) && matchesUser(p, user)) {
                return true;
            }
        }

        //Sobe para a pasta pai
        if (file.getFolderId() != null) {
            Optional<FileEntity> parent = fileRepository.findById(file.getFolderId());
            if (parent.isPresent()) return checkRecursive(parent.get(), user, required);
        }
        return false;
    }

    private boolean matchesUser(FilePermissionEntity p, UserDto user) {
        if (p.getTargetType() == PermissionTargetType.USER)
            return p.getTargetId().equals(String.valueOf(user.getId()));
        if (p.getTargetType() == PermissionTargetType.ROLE)
            return user.getRoles().contains(p.getTargetId());
        // if (p.getTargetType() == PermissionTargetType.TEAM) ... (implementar lógica de time)
        return false;
    }

    private boolean isSufficient(PermissionType existing, PermissionType required) {
        if (existing == PermissionType.ADMIN) return true;
        if (required == PermissionType.READ) return true;
        return existing == required;
    }

    private UserDto getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.getDetails() instanceof Map) {
                return  (UserDto) ((Map<?, ?>) authentication.getDetails()).get("user");
            }

            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                Object userAttr = attrs.getAttribute("currentUser", RequestAttributes.SCOPE_REQUEST);
                if (userAttr instanceof UserDto) {
                    return (UserDto) userAttr;
                }
            }

            throw new RuntimeException("Usuário não identificado no contexto de segurança");
        } catch (Exception e) {
            throw new RuntimeException("Erro ao obter usuário atual: " + e.getMessage());
        }
    }
}
