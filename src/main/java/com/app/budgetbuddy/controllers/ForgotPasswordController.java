package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.EmailService;
import com.app.budgetbuddy.services.UserService;
import com.app.budgetbuddy.workbench.PasswordValidationServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping(value="/api/forgot-password")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class ForgotPasswordController
{
    private final EmailService emailService;
    private final UserService userService;
    private final PasswordValidationServiceImpl passwordValidationService;

    @Autowired
    public ForgotPasswordController(EmailService emailService,
                                    UserService userService) {
        this.emailService = emailService;
        this.userService = userService;
        this.passwordValidationService = new PasswordValidationServiceImpl();
    }

    @PostMapping("/password")
    public ResponseEntity<String> resetPassword(@RequestParam String newPassword,
                                                @RequestParam String email)
    {
        Optional<UserEntity> user = userService.findByEmail(email);
        if(user.isEmpty())
        {
            log.info("User Not found with email {}", email);
            return ResponseEntity.notFound().build();
        }
        userService.resetPassword(email, newPassword);
        log.info("Password reset successful");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate-code")
    public ResponseEntity<String> generateValidationCode(@RequestParam String email)
    {
        // Generate a 6 digit code
        String validationCode = passwordValidationService.generateValidationCode();

        // 3. Send an email to the user with the provided password
        String fromEmail = "noreply@gmail.com";
        emailService.sendEmailWithValidationCode(
                fromEmail,
                email,
                "Password Reset Code",
                "",
                "forgotPasswordTemplate",  // this should match the name of your template file without extension
                validationCode
        );

        return ResponseEntity.ok(validationCode);
    }


}
