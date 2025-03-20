package com.intranet.backend.service;

import com.intranet.backend.dto.UserDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface UserService {

    List<UserDto> getAllUsers();

    UserDto getUserById(UUID id);

    UserDto getCurrentUser();

    UserDto updateUser(UUID id, Map<String, String> updates);

    UserDto updateProfileImage(UUID id, MultipartFile image);

    void deleteUser(UUID id);

    UserDto addRole(UUID id, String roleName);

    UserDto removeRole(UUID id, String roleName);

    UserDto updateUserStatus(UUID id, boolean active);
}
