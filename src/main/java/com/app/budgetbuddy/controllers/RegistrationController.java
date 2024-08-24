package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.RegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/register")
@CrossOrigin(origins="http://localhost:3000")
public class RegistrationController {

    private RegistrationService registrationService;
    private Logger LOGGER = LoggerFactory.getLogger(RegistrationController.class);

    @Autowired
    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/")
    public ResponseEntity<?> registerUser(@RequestBody Registration registration){
        LOGGER.info("Received request to register user: " + registration);
        try
        {
            Optional<UserEntity> user = registrationService.createUser(registration);
            if(user.isEmpty()){
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok().body(user.get());
        }catch(Exception e) {
            LOGGER.error("Unexpected error occurred while registering user", e);
            return ResponseEntity.badRequest().body("Unexpected error occurred while registering user");
        }
    }
}
