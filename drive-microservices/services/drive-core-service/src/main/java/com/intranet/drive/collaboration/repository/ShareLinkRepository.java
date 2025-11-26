package com.intranet.drive.collaboration.repository;

import com.intranet.drive.collaboration.entity.ShareLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLinkEntity,Long> {

    Optional<ShareLinkEntity> findByToken(String token);
}
