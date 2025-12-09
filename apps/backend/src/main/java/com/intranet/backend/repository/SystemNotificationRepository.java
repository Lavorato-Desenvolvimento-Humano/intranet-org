package com.intranet.backend.repository;

import com.intranet.backend.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, UUID> {

    // Busca notificações ativas que NÃO estão na tabela de lidos para este usuário
    @Query("SELECT n FROM SystemNotification n " +
            "WHERE n.active = true " +
            "AND n.id NOT IN (SELECT r.notification.id FROM UserNotificationRead r WHERE r.user.id = :userId) " +
            "ORDER BY n.createdAt DESC")
    List<SystemNotification> findUnreadActiveNotifications(@Param("userId") UUID userId);
}
