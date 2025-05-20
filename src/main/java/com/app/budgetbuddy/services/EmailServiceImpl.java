package com.app.budgetbuddy.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService
{
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender,
                            SpringTemplateEngine templateEngine)
    {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    public void sendEmail(String fromEmail, String toEmail, String subject, String body)
    {
        log.info("Preparing to send email from {} to {}", fromEmail, toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        log.info("Email successfully sent to {}", toEmail);
    }

    @Override
    public void sendEmailWithAttachment(String fromEmail, String toEmail, String subject, String templateName, String attachmentName)
    {

    }

    @Override
    public void sendEmailWithValidationCode(String fromEmail, String toEmail, String subject, String body, String template, String code)
    {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set basic email properties
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);

            // Prepare the evaluation context
            Context context = new Context();
            context.setVariable("validationCode", code);

            // Process the template with the context and set it as email content
            String htmlContent = templateEngine.process(template, context);
            helper.setText(htmlContent, true); // true indicates this is HTML

            // Send the email
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("There was an error sending a validation code to email {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send templated email: " + e.getMessage());
        }
    }
}
