package com.intranet.backend.controllers;

import com.intranet.backend.dto.UserDto;
import com.intranet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#id)")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        UserDto user = userService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#id)")
    public ResponseEntity<UserDto> updateUser(@PathVariable UUID id, @RequestBody Map<String, String> updates) {
        logger.info("Recebendo solicitação para atualizar usuário: {}", id);
        logger.debug("Atualizações solicitadas: {}", updates);

        UserDto updatedUser = userService.updateUser(id, updates);
        logger.info("Usuário atualizado com sucesso: {}", id);

        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#id)")
    public ResponseEntity<UserDto> updateProfileImage(
            @PathVariable UUID id,
            @RequestParam("image") MultipartFile image) {

        logger.info("Recebendo solicitação para atualizar imagem de perfil para usuário: {}", id);
        logger.debug("Tipo de arquivo recebido: {}, tamanho: {}",
                image.getContentType(),
                image.getSize());

        try {
            if (image.isEmpty()) {
                logger.warn("Arquivo de imagem vazio recebido para usuário: {}", id);
                return ResponseEntity.badRequest().build();
            }

            // Validar tipo de arquivo
            String contentType = image.getContentType();
            if (contentType == null || !(contentType.startsWith("image/jpeg") ||
                    contentType.startsWith("image/png") ||
                    contentType.startsWith("image/gif") ||
                    contentType.startsWith("image/webp"))) {
                logger.warn("Tipo de arquivo inválido: {} para usuário: {}", contentType, id);
                return ResponseEntity.badRequest().build();
            }

            // Validar tamanho do arquivo (5MB máximo)
            long maxSize = 5 * 1024 * 1024; // 5MB
            if (image.getSize() > maxSize) {
                logger.warn("Arquivo muito grande: {} bytes para usuário: {}", image.getSize(), id);
                return ResponseEntity.badRequest().build();
            }

            UserDto updatedUser = userService.updateProfileImage(id, image);
            logger.info("Imagem de perfil atualizada com sucesso para usuário: {}", id);

            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Erro ao processar upload de imagem para usuário: {}", id, e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#id)")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        logger.info("Recebendo solicitação para excluir usuário: {}", id);

        try {
            userService.deleteUser(id);
            logger.info("Usuário excluído com sucesso: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Erro ao excluir usuário: {}", id, e);
            throw e;
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable UUID id,
            @RequestParam boolean active) {

        logger.info("Recebendo solicitação para {} usuário: {}",
                active ? "ativar" : "desativar", id);

        UserDto updatedUser = userService.updateUserStatus(id, active);

        logger.info("Status do usuário atualizado com sucesso: {}", id);

        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> approveUser(@PathVariable UUID id, @RequestParam boolean approved) {
        logger.info("Recebendo solicitação para {} usuário: {}",
                approved ? "aprovar" : "reprovar", id);

        UserDto updatedUser = userService.updateUserApproval(id, approved);

        logger.info("Status de aprovação do usuário atualizado com sucesso: {}", id);

        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> addRole(@PathVariable UUID id, @RequestParam String roleName) {
        UserDto updatedUser = userService.addRole(id, roleName);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> removeRole(@PathVariable UUID id, @PathVariable String roleName) {
        UserDto updatedUser = userService.removeRole(id, roleName);
        return ResponseEntity.ok(updatedUser);
    }
}