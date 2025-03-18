package com.intranet.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.intranet.backend.model.EmailVerificationToken;
import com.intranet.backend.model.User;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Integer> {
    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findByUserAndUsedFalse(User user);
}
