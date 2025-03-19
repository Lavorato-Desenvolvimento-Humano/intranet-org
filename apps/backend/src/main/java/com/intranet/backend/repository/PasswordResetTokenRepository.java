package com.intranet.backend.repository;

import com.intranet.backend.model.PasswordResetToken;
import com.intranet.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUserAndUsedFalse(User user);
    List<PasswordResetToken> findAllByUserId(User user);
}