package com.intranet.backend.service;

import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.EmailVerificationToken;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.EmailVerificationTokenRepository;
import com.intranet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Tentativa de reenvio de verificação para email inexistente: {}", email);
                    return new ResourceNotFoundException("Usuário não encontrado com o email: " + email);
                });

        // Verificar se o email já foi verificado
        if (user.isEmailVerified()) {
            logger.info("Email {} já está verificado. Ignorando solicitação de reenvio.", email);
            return;
        }

        // Verificar se já existe um token ativo
        Optional<EmailVerificationToken> existingToken = tokenRepository.findByUserAndUsedFalse(user);
        EmailVerificationToken verificationToken;

        if (existingToken.isPresent() && !existingToken.get().isExpired()) {
            // Reutiliza o token existente se ainda for válido
            verificationToken = existingToken.get();
            logger.info("Reutilizando token existente para: {}", email);
        } else {
            // Cria um novo token
            verificationToken = new EmailVerificationToken(user);
            tokenRepository.save(verificationToken);
            logger.info("Novo token de verificação criado para: {}", email);
        }

        // Enviar o email com o token
        emailService.sendEmailVerification(user.getEmail(), verificationToken.getToken(), user.getFullName());
    }

    @Transactional
    public void verifyEmail(String email, String code) {
        logger.info("Verificando email para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        // Verificar se o email já foi verificado
        if (user.isEmailVerified()) {
            logger.info("Email {} já está verificado.", email);
            return;
        }

        EmailVerificationToken verificationToken = tokenRepository.findByToken(code)
                .orElseThrow(() -> {
                    logger.warn("Código de verificação inválido para: {}", email);
                    return new RuntimeException("Código de verificação inválido");
                });

        if (!verificationToken.getUser().getId().equals(user.getId())) {
            logger.warn("Tentativa de usar token de outro usuário: {}", email);
            throw new RuntimeException("Código de verificação inválido");
        }

        if (verificationToken.isUsed()) {
            logger.warn("Tentativa de usar token já utilizado: {}", email);
            throw new RuntimeException("Este código já foi utilizado");
        }

        if (verificationToken.isExpired()) {
            logger.warn("Tentativa de usar token expirado: {}", email);
            throw new RuntimeException("O código de verificação expirou");
        }

        // Marcar o email como verificado
        user.setEmailVerified(true);
        userRepository.save(user);

        // Marcar o token como usado
        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);

        logger.info("Email verificado com sucesso para: {}", email);
    }
}
