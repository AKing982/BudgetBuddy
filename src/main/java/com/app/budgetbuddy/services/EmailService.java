package com.app.budgetbuddy.services;

public interface EmailService
{
    void sendEmail(String fromEmail, String toEmail, String subject, String body);
    void sendEmailWithAttachment(String fromEmail, String toEmail, String subject, String templateName, String attachmentName);
    void sendEmailWithValidationCode(String fromEmail, String toEmail, String subject, String body, String template, String code);
}
