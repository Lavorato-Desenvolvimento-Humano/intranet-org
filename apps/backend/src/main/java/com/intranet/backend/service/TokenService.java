package com.intranet.backend.service;

import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.EmailVerificationToken;
import com.intranet.backend.model.PasswordResetToken;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.EmailVerificationTokenRepository;
import com.intranet.backend.repository.PasswordResetTokenRepository;
import com.intranet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * Serviço para gerenciar tokens de verificação de email e redefinição de senha
 * Centraliza lógica comum para evitar duplicação de código
 */
@Service
@RequiredArgsConstructor
public class TokenService {

    private static final Logger logger = LoggerFactory.getLogger(TokenService.class);

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    private final Random random = new Random();

    /**
     * Gera um código de verificação numérico de 6 dígitos
     */
    private String generateVerificationCode() {
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * Cria ou recupera um token de verificação de email e envia o email
     */
    @Transactional
    public void createOrReuseEmailVerificationToken(User user) {
        // Verificar se já existe um token ativo
        Optional<EmailVerificationToken> existingToken = emailVerificationTokenRepository.findByUserAndUsedFalse(user);
        EmailVerificationToken verificationToken;

        if (existingToken.isPresent() && !existingToken.get().isExpired()) {
            // Reutiliza o token existente se ainda for válido
            verificationToken = existingToken.get();
            logger.info("Reutilizando token existente para: {}", user.getEmail());
        } else {
            // Cria um novo token
            verificationToken = new EmailVerificationToken();
            verificationToken.setUser(user);
            verificationToken.setToken(generateVerificationCode());
            verificationToken.setExpiryDate(LocalDateTime.now().plusHours(24)); // válido por 24 horas
            verificationToken.setUsed(false);

            emailVerificationTokenRepository.save(verificationToken);
            logger.info("Novo token de verificação criado para: {}", user.getEmail());
        }

        // Enviar o email com o token
        emailService.sendEmailVerification(user.getEmail(), verificationToken.getToken(), user.getFullName());
    }

    /**
     * Verifica um token de verificação de email
     * @return true se o token for válido e o email estiver verificado
     */
    @Transactional
    public boolean verifyEmailToken(String email, String code) {
        logger.info("Verificando email para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        // Verificar se o email já foi verificado
        if (user.isEmailVerified()) {
            logger.info("Email {} já está verificado.", email);
            return true;
        }

        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(code)
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
        emailVerificationTokenRepository.save(verificationToken);

        logger.info("Email verificado com sucesso para: {}", email);
        return true;
    }

    /**
     * Cria ou recupera um token de redefinição de senha e envia o email
     */
    @Transactional
    public void createOrReusePasswordResetToken(String email) {
        logger.info("Processando solicitação de redefinição de senha para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Tentativa de redefinição de senha para email inexistente: {}", email);
                    return new ResourceNotFoundException("Usuário não encontrado com o email: " + email);
                });

        // Verifica se já existe um token ativo
        Optional<PasswordResetToken> existingToken = passwordResetTokenRepository.findByUserAndUsedFalse(user);
        PasswordResetToken resetToken;

        if (existingToken.isPresent() && !existingToken.get().isExpired()) {
            // Reutiliza o token existente se ainda for válido
            resetToken = existingToken.get();
            logger.info("Reutilizando token existente para: {}", email);
        } else {
            // Cria um novo token
            resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(generateVerificationCode());
            resetToken.setExpiryDate(LocalDateTime.now().plusHours(1)); // válido por 1 hora
            resetToken.setUsed(false);

            passwordResetTokenRepository.save(resetToken);
            logger.info("Novo token de redefinição criado para: {}", email);
        }

        // Envia o email com o token
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken(), user.getFullName());
    }

    /**
     * Verifica um token de redefinição de senha
     * @return o usuário associado ao token se for válido
     */
    @Transactional(readOnly = true)
    public User verifyPasswordResetToken(String email, String code) {
        logger.info("Verificando código de redefinição para: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o email: " + email));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(code)
                .orElseThrow(() -> {
                    logger.warn("Código de verificação inválido para: {}", email);
                    return new RuntimeException("Código de verificação inválido");
                });

        if (!resetToken.getUser().getId().equals(user.getId())) {
            logger.warn("Tentativa de usar token de outro usuário: {}", email);
            throw new RuntimeException("Código de verificação inválido");
        }

        if (resetToken.isUsed()) {
            logger.warn("Tentativa de usar token já utilizado: {}", email);
            throw new RuntimeException("Este código já foi utilizado");
        }

        if (resetToken.isExpired()) {
            logger.warn("Tentativa de usar token expirado: {}", email);
            throw new RuntimeException("O código de verificação expirou");
        }

        logger.info("Código de redefinição verificado com sucesso para: {}", email);
        return user;
    }

    /**
     * Marca um token de redefinição de senha como usado
     */
    @Transactional
    public void markPasswordResetTokenAsUsed(String code) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(code)
                .orElseThrow(() -> new RuntimeException("Código de verificação inválido"));

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        logger.info("Token de redefinição marcado como usado: {}", code);
    }
}