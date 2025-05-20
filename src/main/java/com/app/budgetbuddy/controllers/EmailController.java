package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value="/api/email")
@CrossOrigin(value="http://localhost:3000")
public class EmailController
{
    private final EmailService emailService;

    @Autowired
    public EmailController(EmailService emailService)
    {
        this.emailService = emailService;
    }


}
