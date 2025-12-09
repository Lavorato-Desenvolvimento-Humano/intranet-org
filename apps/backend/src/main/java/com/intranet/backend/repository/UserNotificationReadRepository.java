package com.intranet.backend.repository;

import com.intranet.backend.model.UserNotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserNotificationReadRepository extends JpaRepository<UserNotificationRead, UUID> {
    boolean existsByUserIdAndNotificationId(UUID userId, UUID notificationId);
}