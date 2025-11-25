package com.intranet.drive.common.service;

import java.util.List;

public interface TeamIntegrationService {
    List<String> getUsersTeams(Long userId);
    boolean isUserInTeam(Long userId, Long teamId);
}
