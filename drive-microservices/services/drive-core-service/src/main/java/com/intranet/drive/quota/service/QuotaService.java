package com.intranet.drive.quota.service;

import com.intranet.drive.quota.entity.UserQuotaEntity;
import com.intranet.drive.quota.repository.UserQuotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class QuotaService {

    private final UserQuotaRepository quotaRepository;
    // 1GB Default conforme RF03.1
    private static final Long DEFAULT_QUOTA = 1073741824L;

    public QuotaService(UserQuotaRepository quotaRepository) {
        this.quotaRepository = quotaRepository;
    }

    @Transactional
    public void verifyAndReserveSpace(Long userId, Long fileSize) {
        // Busca ou cria cota para o usuário se não existir
        UserQuotaEntity quota = quotaRepository.findById(userId)
                .orElseGet(() -> {
                    UserQuotaEntity newQuota = new UserQuotaEntity(userId, DEFAULT_QUOTA);
                    return quotaRepository.save(newQuota);
                });

        if (quota.getUsedSpaceBytes() + fileSize > quota.getTotalSpaceBytes()) {
            throw new IllegalArgumentException("Cota de armazenamento excedida. Espaço disponível insuficiente.");
        }

        quota.setUsedSpaceBytes(quota.getUsedSpaceBytes() + fileSize);
        quota.setUpdatedAt(LocalDateTime.now());
        quotaRepository.save(quota);
    }

    @Transactional
    public void releaseSpace(Long userId, Long fileSize) {
        quotaRepository.findById(userId).ifPresent(quota -> {
            long newUsage = Math.max(0, quota.getUsedSpaceBytes() - fileSize);
            quota.setUsedSpaceBytes(newUsage);
            quota.setUpdatedAt(LocalDateTime.now());
            quotaRepository.save(quota);
        });
    }

    public UserQuotaEntity getQuota(Long userId) {
        return quotaRepository.findById(userId)
                .orElse(new UserQuotaEntity(userId, DEFAULT_QUOTA));
    }
}
