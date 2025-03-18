package com.intranet.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor 
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    public void sendPasswordResetEmail(String to, String token, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.addInline("logo", new ClassPathResource("static/images/logo.png"));

            helper.setFrom("desenvolvimento@lavorato.com.br");
            helper.setTo(to);
            helper.setSubject("Redefinição de Senha - Lavorato Saúde Integrada");

            Context context = new Context();
            context.setVariable("token", token);
            context.setVariable("name", name);

            String htmlContent = templateEngine.process("email/reset-password", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de redefinição de senha enviado para: {}", to);
        } catch (MessagingException e) {
            logger.error("Erro ao enviar email de redefinição de senha para: {}", to, e);
            throw new RuntimeException("Erro ao enviar email de redefinição de senha", e);
        }
    }

    @Async
    public void sendPasswordResetConfirmationEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.addInline("logo", new ClassPathResource("static/images/logo.png"));

            helper.setFrom("desenvolvimento@lavorato.com.br");
            helper.setTo(to);
            helper.setSubject("Senha Redefinida com Sucesso - Lavorato Saúde Integrada");

            Context context = new Context();
            context.setVariable("name", name);

            String htmlContent = templateEngine.process("email/reset-password-confirmation", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de confirmação de redefinição de senha enviado para: {}", to);
        } catch (MessagingException e) {
            logger.error("Erro ao enviar email de confirmação para: {}", to, e);
            throw new RuntimeException("Erro ao enviar email de confirmação", e);
        }
    }
}