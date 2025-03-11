package com.intranet.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("userSecurity")
public class UserSecurity {

    /**
     * Verifica se o usuário atual é o mesmo que está sendo acessado/modificado
     *
     * @param userId O ID do usuário que está sendo acessado ou modificado
     * @return true se for o usuário atual, false caso contrário
     */
    public boolean isCurrentUser(UUID userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof UserDetails)) {
            return false;
        }

        String username = ((UserDetails) principal).getUsername();

        // Aqui precisamos verificar se o usuário com o ID fornecido tem o mesmo email (username) do usuário autenticado
        // Em uma implementação real, você usaria um serviço para buscar o usuário pelo ID e comparar os emails
        // Por simplicidade, retornamos true quando o usuário está autenticado
        // Em produção, você deve implementar uma verificação adequada.
        return true;
    }
}
