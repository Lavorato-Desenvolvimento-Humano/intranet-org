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

import java.io.UnsupportedEncodingException;

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
            // Use o charset UTF-8 e especifique que é multipart
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Adicionar logo como uma imagem embutida
            helper.addInline("logo", new ClassPathResource("static/images/logo.png"));

            // Definir os cabeçalhos corretos para HTML
            helper.setFrom("desenvolvimento@lavorato.com.br", "Lavorato Saúde Integrada");
            helper.setTo(to);
            helper.setSubject("Redefinição de Senha - Lavorato Saúde Integrada");

            // Preparar o contexto do template
            Context context = new Context();
            context.setVariable("token", token);
            context.setVariable("name", name);
            context.setVariable("loginUrl", "https://lavorato.app.br/auth/login");

            // Processar o template
            String htmlContent = templateEngine.process("email/reset-password", context);

            // Definir o conteúdo como HTML
            helper.setText(htmlContent, true);

            // Adicionar cabeçalho Content-Type explícito
            message.setHeader("Content-Type", "text/html; charset=UTF-8");

            // Enviar o email
            mailSender.send(message);
            logger.info("Email de redefinição de senha enviado para: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
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
            helper.setFrom("desenvolvimento@lavorato.com.br", "Lavorato Saúde Integrada");
            helper.setTo(to);
            helper.setSubject("Senha Redefinida com Sucesso - Lavorato Saúde Integrada");

            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("loginUrl", "https://lavorato.app.br/auth/login");

            String htmlContent = templateEngine.process("email/reset-password-confirmation", context);
            helper.setText(htmlContent, true);

            message.setHeader("Content-Type", "text/html; charset=UTF-8");

            mailSender.send(message);
            logger.info("Email de confirmação de redefinição de senha enviado para: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            logger.error("Erro ao enviar email de confirmação para: {}", to, e);
            throw new RuntimeException("Erro ao enviar email de confirmação", e);
        }
    }

    @Async
    public void sendEmailVerification(String to, String token, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.addInline("logo", new ClassPathResource("static/images/logo.png"));
            helper.setFrom("desenvolvimento@lavorato.com.br", "Lavorato Saúde Integrada");
            helper.setTo(to);
            helper.setSubject("Verifique seu Email - Lavorato Saúde Integrada");

            Context context = new Context();
            context.setVariable("token", token);
            context.setVariable("name", name);
            context.setVariable("loginUrl", "https://lavorato.app.br/auth/login");

            String htmlContent = templateEngine.process("email/email-verification", context);
            helper.setText(htmlContent, true);

            message.setHeader("Content-Type", "text/html; charset=UTF-8");

            mailSender.send(message);
            logger.info("Email de verificação enviado para: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            logger.error("Erro ao enviar email de verificação para: {}", to, e);
            throw new RuntimeException("Erro ao enviar email de verificação", e);
        }
    }

    @Async
    public void sendAccountApprovalEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.addInline("logo", new ClassPathResource("static/images/logo.png"));
            helper.setFrom("desenvolvimento@lavorato.com.br", "Lavorato Saúde Integrada");
            helper.setTo(to);
            helper.setSubject("Conta Aprovada - Lavorato Saúde Integrada");

            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("loginUrl", "https://lavorato.app.br/auth/login");

            String htmlContent = templateEngine.process("email/account-approval", context);
            helper.setText(htmlContent, true);

            message.setHeader("Content-Type", "text/html; charset=UTF-8");

            mailSender.send(message);
            logger.info("Email de aprovação de conta enviado para: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            logger.error("Erro ao enviar email de aprovação de conta para: {}", to, e);
            throw new RuntimeException("Erro ao enviar email de aprovação de conta", e);
        }
    }
}