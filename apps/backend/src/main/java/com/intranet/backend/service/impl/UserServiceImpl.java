package com.intranet.backend.service.impl;

import com.intranet.backend.dto.UserDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.Role;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserRole;
import com.intranet.backend.repository.RoleRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.repository.UserRoleRepository;
import com.intranet.backend.service.FileStorageService;
import com.intranet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(UUID id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        return convertToDto(user);
    }

    @Override
    public UserDto getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmailWithRoles(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));

        return convertToDto(user);
    }

    @Override
    @Transactional
    public UserDto updateUser(UUID id, Map<String, String> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        // Atualiza o nome completo se fornecido
        if (updates.containsKey("fullName")) {
            user.setFullName(updates.get("fullName"));
        }

        // Atualiza o email se fornecido
        if (updates.containsKey("email")) {
            String newEmail = updates.get("email");
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email já está em uso");
            }
            user.setEmail(newEmail);
        }

        // Atualiza a senha se fornecida
        if (updates.containsKey("password")) {
            user.setPasswordHash(passwordEncoder.encode(updates.get("password")));
        }

        // Atualiza o ID do GitHub se fornecido
        if (updates.containsKey("githubId")) {
            String newGithubId = updates.get("githubId");
            if (newGithubId != null && !newGithubId.isEmpty() &&
                    !newGithubId.equals(user.getGithubId()) && userRepository.existsByGithubId(newGithubId)) {
                throw new RuntimeException("ID do GitHub já está em uso");
            }
            user.setGithubId(newGithubId);
        }

        User updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto updateProfileImage(UUID id, MultipartFile image) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        // Remove a imagem de perfil anterior se existir
        if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
            fileStorageService.deleteFile(user.getProfileImage());
        }

        // Armazena a nova imagem de perfil
        String newImagePath = fileStorageService.storeFile(image);
        user.setProfileImage(newImagePath);

        User updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        // Remove a imagem de perfil se existir
        if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
            fileStorageService.deleteFile(user.getProfileImage());
        }

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public UserDto addRole(UUID id, String roleName) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Papel não encontrado com o nome: " + roleName));

        // Verifica se o usuário já possui o papel
        boolean hasRole = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getName().equals(role.getName()));

        if (!hasRole) {
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);

            // Atualiza o usuário para a resposta
            user = userRepository.findByIdWithRoles(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));
        }

        return convertToDto(user);
    }

    @Override
    @Transactional
    public UserDto removeRole(UUID id, String roleName) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Papel não encontrado com o nome: " + roleName));

        // Encontra e remove o papel do usuário
        user.getUserRoles().removeIf(ur -> ur.getRole().getName().equals(role.getName()));

        // Salva o usuário atualizado
        User updatedUser = userRepository.save(user);

        return convertToDto(updatedUser);
    }

    // Método auxiliar para converter User para UserDto
    private UserDto convertToDto(User user) {
        List<String> roles = user.getUserRoles().stream()
                .map(ur -> "ROLE_" + ur.getRole().getName())
                .collect(Collectors.toList());

        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getProfileImage(),
                roles,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
