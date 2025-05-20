package com.app.budgetbuddy.services;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
class EmailServiceImplTest
{
    @MockBean
    private SpringTemplateEngine templateEngine;

    @MockBean
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    // Test constants
    private static final String FROM_EMAIL = "test@example.com";
    private static final String TO_EMAIL = "recipient@example.com";
    private static final String SUBJECT = "Test Subject";
    private static final String BODY = "Test email body";
    private static final String TEMPLATE_NAME = "test-template";

    private static final String ATTACHMENT_PATH = "src/test/resources/test-attachment.txt";
    private static final String ATTACHMENT_NAME = "test-attachment.txt";


    // Mock objects
    private jakarta.mail.internet.MimeMessage mimeMessage;
    private Map<String, Object> templateModel;

    @BeforeEach
    void setUp() {
        // Create a mock MimeMessage
        mimeMessage = mock(jakarta.mail.internet.MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Setup template engine mock to return test HTML content
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Test HTML content</body></html>");

        // Prepare test template model
        templateModel = new HashMap<>();
        templateModel.put("testKey", "testValue");
        templateModel.put("userName", "John Doe");

        // Create test attachment file if it doesn't exist
        File attachmentFile = new File(ATTACHMENT_PATH);
        if (!attachmentFile.exists()) {
            try {
                attachmentFile.getParentFile().mkdirs();
                Files.write(attachmentFile.toPath(), "Test attachment content".getBytes());
            } catch (IOException e) {
                fail("Failed to create test attachment file: " + e.getMessage());
            }
        }
    }

    @Test
    @DisplayName("Test sending a simple email")
    void testSendEmail() throws Exception {
        // Call the method to test
        emailService.sendEmail(FROM_EMAIL, TO_EMAIL, SUBJECT, BODY);

        // Verify interactions
        verify(mailSender).createMimeMessage();
        verify(templateEngine).process(eq("email-template"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }


    @AfterEach
    void tearDown() {
    }
}