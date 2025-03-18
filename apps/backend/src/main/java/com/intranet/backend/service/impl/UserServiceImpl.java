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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> userDtos = new ArrayList<>();

        for (User user : users) {
            List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
            userDtos.add(new UserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            ));
        }

        return userDtos;
    }

    @Override
    public UserDto getUserById(UUID id) {
        try {
            // Obtenha o usuário sem carregar as coleções relacionadas
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

            // Buscar papéis do usuário de forma segura usando consulta direta
            List<String> roles = userRepository.findRoleNamesByUserId(id);

            // Converter para DTO sem acessar coleções LazyLoaded
            return new UserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        } catch (Exception e) {
            logger.error("Erro ao buscar usuário por ID: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public UserDto getCurrentUser() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String email = userDetails.getUsername();

            // Obtenha o usuário sem carregar as coleções relacionadas
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));

            // Buscar papéis do usuário de forma segura usando consulta direta
            List<String> roles = userRepository.findRoleNamesByUserId(user.getId());

            // Converter para DTO sem acessar coleções LazyLoaded
            return new UserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getProfileImage(),
                    roles,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        } catch (Exception e) {
            logger.error("Erro ao buscar usuário atual: {}", e.getMessage(), e);
            throw e;
        }
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

        // Buscar papéis do usuário de forma segura
        List<String> roles = userRepository.findRoleNamesByUserId(updatedUser.getId());

        return new UserDto(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getProfileImage(),
                roles,
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt()
        );
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

        // Buscar papéis do usuário de forma segura
        List<String> roles = userRepository.findRoleNamesByUserId(updatedUser.getId());

        return new UserDto(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getProfileImage(),
                roles,
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt()
        );
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
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Papel não encontrado com o nome: " + roleName));

        // Verifica se o usuário já possui o papel usando o repositório
        boolean hasRole = userRoleRepository.existsByUserIdAndRoleId(id, role.getId());

        if (!hasRole) {
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }

        // Buscar papéis atualizados usando consulta direta
        List<String> roles = userRepository.findRoleNamesByUserId(id);

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

    @Override
    @Transactional
    public UserDto removeRole(UUID id, String roleName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Papel não encontrado com o nome: " + roleName));

        // Remover papel diretamente usando o repositório
        userRoleRepository.deleteByUserIdAndRoleId(id, role.getId());

        // Buscar papéis atualizados usando consulta direta
        List<String> roles = userRepository.findRoleNamesByUserId(id);

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