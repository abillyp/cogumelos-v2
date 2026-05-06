/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.billy@organico4you.com.br
 */

package com.cogumelos.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String remetente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarRecuperacaoSenha(String email, String token) {
        String link = frontendUrl + "/redefinir-senha?token=" + token;

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            helper.setFrom(remetente);
            helper.setTo(email);
            helper.setSubject("Redefinição de senha — cogumelos.app");
            helper.setText("""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                  <h2 style="color: #2D6A4F;">🍄 cogumelos.app</h2>
                  <p>Olá!</p>
                  <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                  <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="%s"
                       style="background: #2D6A4F; color: #fff; padding: 14px 32px;
                              border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      Redefinir minha senha
                    </a>
                  </div>
                  <p style="color: #888; font-size: 13px;">
                    Se você não solicitou a redefinição, ignore este email.<br>
                    O link expirará automaticamente em 1 hora.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                  <p style="color: #bbb; font-size: 12px; text-align: center;">cogumelos.app</p>
                </div>
                """.formatted(link), true);

            mailSender.send(msg);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao enviar email: " + e.getMessage(), e);
        }
    }
}